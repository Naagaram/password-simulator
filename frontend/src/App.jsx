import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { analyzePasswordRequest, getAnalyzeEndpointLabel } from './utils/api';
import { buildPassword } from './utils/passwordGenerator';
import { getCheckExplanation, toPlainText } from './utils/text';

const CARD_CONFIG = [
  { key: 'length', label: 'Length', icon: '🔐' },
  { key: 'upperlower', label: 'Upper/Lower', icon: '🔠' },
  { key: 'number', label: 'Numbers', icon: '🔢' },
  { key: 'symbol', label: 'Symbols', icon: '🔣' },
  { key: 'dictionary', label: 'Dictionary', icon: '📚' },
  { key: 'keyboard', label: 'Keyboard Pattern', icon: '🎹' },
  { key: 'entropy', label: 'Entropy', icon: '🧠' },
  { key: 'breach', label: 'Breach Check', icon: '☠️' },
];

const STRENGTH_COLORS = {
  red: 'meter-fill--red',
  orange: 'meter-fill--orange',
  yellow: 'meter-fill--yellow',
  green: 'meter-fill--green',
  gray: 'meter-fill--gray',
};

function StrengthMeter({ level, color, value }) {
  return (
    <div className="w-full mt-6" role="status" aria-live="polite">
      <div className="meter-track">
        <div
          className={`meter-fill ${STRENGTH_COLORS[color] || STRENGTH_COLORS.gray}`}
          style={{ width: `${Math.min(100, value * 1.2)}%` }}
        />
      </div>
      <div className="strength-meta">
        <span className="capitalize">{level.replace(/_/g, ' ')}</span>
        <span>{value} bits entropy</span>
      </div>
    </div>
  );
}

function AnalysisCard({ icon, label, pass, explanation }) {
  return (
    <div
      className={`analysis-card ${pass ? 'analysis-card--pass' : 'analysis-card--fail'}`}
      role="status"
      aria-atomic="true"
      tabIndex={0}
      aria-label={`${label}: ${pass ? 'pass' : 'fail'}`}
    >
      <span className="analysis-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="analysis-card__label">{label}</span>
      <span className={`analysis-card__status ${pass ? 'text-emerald-300' : 'text-rose-300'}`} aria-hidden>
        {pass ? 'Pass' : 'Fail'}
      </span>
      <p className="analysis-card__explanation">{explanation}</p>
    </div>
  );
}

function SuggestionsPanel({ suggestions, onApply }) {
  return (
    <div className="suggestions-panel">
      {suggestions.map((s, i) => (
        <button
          key={i}
          className="suggestion-pill"
          onClick={() => onApply && onApply(s)}
          tabIndex={0}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function BreachTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="surface-panel mt-6 p-6">
      <h3 className="panel-title text-rose-300">
        <span>📅</span> Breach Timeline
      </h3>
      <div className="space-y-3">
        {timeline.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 border-l-2 border-rose-500/30 pl-4">
            <div className="min-w-[100px] text-sm text-slate-400">
              {new Date(item.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
              })}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">{item.name}</div>
              <div className="text-xs text-slate-400">{item.pwnCount} accounts affected</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreachDetails({ breachDetails }) {
  const [expanded, setExpanded] = useState(null);

  if (!breachDetails || !breachDetails.likelyBreaches || breachDetails.likelyBreaches.length === 0) {
    return null;
  }

  function toggleExpanded(idx) {
    setExpanded((current) => (current === idx ? null : idx));
  }

  function handleCardKeyDown(event, idx) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded(idx);
    }
  }

  return (
    <div className="surface-panel mt-6 p-6">
      <h3 className="panel-title text-orange-300">
        <span>🔍</span> Likely Breaches ({breachDetails.totalBreachesFound})
      </h3>

      {breachDetails.dataClasses && breachDetails.dataClasses.length > 0 && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-900/20 p-3">
          <div className="mb-2 text-sm font-semibold text-rose-200">Exposed Data Types:</div>
          <div className="flex flex-wrap gap-2">
            {breachDetails.dataClasses.map((dc, idx) => (
              <span key={idx} className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-200">
                {dc}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {breachDetails.likelyBreaches.slice(0, 6).map((breach, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 transition hover:border-orange-500/50"
            onClick={() => toggleExpanded(idx)}
            onKeyDown={(event) => handleCardKeyDown(event, idx)}
            role="button"
            tabIndex={0}
            aria-expanded={expanded === idx}
            aria-label={`Toggle details for breach ${breach.title}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  {breach.title}
                  {breach.isVerified && <span className="text-xs text-emerald-300">✓</span>}
                </div>
                <div className="mt-1 text-xs text-slate-400">{breach.domain}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(breach.breachDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-rose-300">
                  {breach.pwnCount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">accounts</div>
              </div>
            </div>

            {expanded === idx && (
              <div className="mt-3 border-t border-slate-600 pt-3">
                <div className="text-sm leading-relaxed text-slate-300">
                  {toPlainText(breach.description)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {breach.dataClasses.slice(0, 5).map((dc, i) => (
                    <span key={i} className="rounded bg-slate-600 px-2 py-1 text-xs text-slate-200">
                      {dc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BreachWarning({ breachCount, riskLevel, breachDetails }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-0">
      <div className="warning-shell">
        <span className="text-4xl">⚠️</span>
        <h2 className="mt-2 text-2xl font-bold text-white">This password has appeared in data breaches</h2>
        <div className="mt-2 text-lg text-white">
          Seen in <span className="font-bold">{breachCount.toLocaleString()}</span> breaches
        </div>
        <span className="warning-risk-chip">
          {riskLevel} Risk
        </span>

        {breachDetails && breachDetails.likelyBreaches && breachDetails.likelyBreaches.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="button button--secondary mt-4"
          >
            {showDetails ? 'Hide' : 'Show'} Breach Details
          </button>
        )}
      </div>

      {showDetails && breachDetails && (
        <div className="mt-6 space-y-4">
          <BreachTimeline timeline={breachDetails.timeline} />
          <BreachDetails breachDetails={breachDetails} />
        </div>
      )}
    </div>
  );
}

function ErrorMessage({ message, onDismiss }) {
  return (
    <div className="mx-auto mt-4 flex max-w-xl items-center justify-between rounded-lg border-2 border-rose-500 bg-rose-900/90 p-4" role="alert">
      <div className="flex items-center gap-3">
        <span className="text-2xl">❌</span>
        <span className="text-white">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-white hover:text-rose-200">
          ✕
        </button>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="mt-4 flex items-center justify-center" aria-hidden>
      <div className="loading-spinner" />
    </div>
  );
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGen, setShowGen] = useState(false);
  const [genPassword, setGenPassword] = useState('');
  const [genLength, setGenLength] = useState(16);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genCopied, setGenCopied] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const modalRef = useRef(null);
  const openGeneratorButtonRef = useRef(null);
  const lastFocusedBeforeModalRef = useRef(null);

  const endpointLabel = useMemo(() => getAnalyzeEndpointLabel(), []);

  useEffect(() => {
    function setOnline() {
      setIsOnline(true);
      setLiveMessage('Connection restored.');
    }

    function setOffline() {
      setIsOnline(false);
      setError('Network appears offline. Analysis requests are paused until connection is restored.');
      setLiveMessage('Connection lost.');
    }

    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  useEffect(() => {
    if (!showGen) return;

    lastFocusedBeforeModalRef.current = document.activeElement;

    const focusable = modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    function onModalKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowGen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const items = modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!items || items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onModalKeyDown);

    return () => {
      document.removeEventListener('keydown', onModalKeyDown);
    };
  }, [showGen]);

  useEffect(() => {
    if (showGen) return;

    const restoreTarget =
      openGeneratorButtonRef.current ||
      lastFocusedBeforeModalRef.current ||
      inputRef.current;

    if (restoreTarget && typeof restoreTarget.focus === 'function') {
      restoreTarget.focus();
    }
  }, [showGen]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!password) {
      return;
    }

    if (!isOnline) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timeout = setTimeout(() => {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      analyzePasswordRequest(password, {
        signal: abortControllerRef.current.signal,
        retries: 1,
      })
        .then((data) => {
          setAnalysis(data);
          setError(null);
          setLiveMessage(`Analysis updated. Strength: ${data.strengthLevel}.`);
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            return;
          }
          console.error('Analysis error:', err);
          setError(err.message || 'Failed to analyze password. Please check if the backend is running.');
          setAnalysis(null);
          setLiveMessage('Analysis failed.');
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [password, isOnline]);

  function handleGen() {
    try {
      const generated = buildPassword({
        length: genLength,
        includeNumbers: genNumbers,
        includeSymbols: genSymbols,
      });
      setGenPassword(generated);
      setLiveMessage('Secure password generated.');
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to generate password securely.');
    }
  }

  function handleCopyGen() {
    navigator.clipboard.writeText(genPassword).then(() => {
      setGenCopied(true);
      setLiveMessage('Generated password copied to clipboard.');
      setTimeout(() => setGenCopied(false), 1200);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      setError('Failed to copy password to clipboard');
    });
  }

  function handleUseGenerated() {
    setPassword(genPassword);
    setShowGen(false);
    setLiveMessage('Generated password applied for analysis.');
  }

  function handleClear() {
    setPassword('');
    setAnalysis(null);
    setError(null);
    setShowGen(false);
    setGenPassword('');
    setShowPassword(false);
    setLiveMessage('Cleared password and results.');
    if (inputRef.current && typeof inputRef.current.focus === 'function') inputRef.current.focus();
  }

  function handlePasswordInput(value) {
    setPassword(value);
    if (!value) {
      setAnalysis(null);
      setError(null);
      setLoading(false);
      setLiveMessage('Input cleared.');
    }
  }

  function applySuggestion(suggestion) {
    if (suggestion.toLowerCase().includes('generate')) {
      setShowGen(true);
      return;
    }

    if (suggestion.toLowerCase().includes('uppercase') && password) {
      setPassword(`${password}A`);
      return;
    }

    if (suggestion.toLowerCase().includes('lowercase') && password) {
      setPassword(`${password}a`);
      return;
    }

    if (suggestion.toLowerCase().includes('numbers') && password) {
      setPassword(`${password}7`);
      return;
    }

    if (suggestion.toLowerCase().includes('symbols') && password) {
      setPassword(`${password}!`);
    }
  }

  return (
    <div className="app-screen app-root">
      <div className="app-ambient app-ambient--one" aria-hidden />
      <div className="app-ambient app-ambient--two" aria-hidden />

      <div className="sr-only" aria-live="polite">{liveMessage}</div>

      <main className="app-main">
        {!isOnline && (
          <div className="offline-banner" role="status" aria-live="polite">
            You are offline. Reconnect to resume real-time analysis.
          </div>
        )}

        <section className="hero-panel">
          <p className="hero-kicker">Security workbench</p>
          <h1 className="hero-title">Password Analyzer</h1>
          <p className="hero-subtitle">Stress-test any password against structure checks, entropy, and known breach signals in real time.</p>

          <div className="trust-note">
            Privacy note: input is sent only to the configured analyzer endpoint: <code>{endpointLabel}</code>
          </div>

          <div className="input-row">
            <input
              type={showPassword ? 'text' : 'password'}
              className="password-input"
              ref={inputRef}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => handlePasswordInput(e.target.value)}
              autoFocus
              aria-label="Password"
              style={{ minWidth: 0 }}
            />
            <button
              className="reveal-button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              style={{ minWidth: 0 }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="action-row">
            <button
              className="button button--primary"
              onClick={() => setShowGen(true)}
              ref={openGeneratorButtonRef}
            >
              Generate Password
            </button>
            <button className="button button--ghost" onClick={handleClear} aria-label="Clear password and analysis">
              Clear
            </button>
          </div>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {analysis && !loading && (
            <>
              <StrengthMeter level={analysis.strengthLevel} color={analysis.strengthColor} value={analysis.entropy} />
              <div className="status-strip">
                <span>Crack Time</span>
                <strong>{analysis.crackTime}</strong>
              </div>
            </>
          )}
        </section>

        {analysis && analysis.breached && !loading && (
          <BreachWarning
            breachCount={analysis.breachCount}
            riskLevel={analysis.riskLevel}
            breachDetails={analysis.breachDetails}
          />
        )}

        {analysis && !loading && (
          <section className="results-panel" role="region" aria-label="Security analysis results">
            <div className="panel-heading">
              <h2>Quick Security Checks</h2>
            </div>
            <div className="results-grid">
              {CARD_CONFIG.map((card) => {
                const check = analysis.checks.find((entry) => entry.key === card.key) || {
                  key: card.key,
                  pass: false,
                };
                return (
                  <AnalysisCard
                    key={card.key}
                    icon={card.icon}
                    label={card.label}
                    pass={check.pass}
                    explanation={getCheckExplanation(check)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {analysis && !loading && analysis.suggestions && analysis.suggestions.length > 0 && (
          <section className="suggestions-wrap">
            <h2 className="panel-heading__inline">How to improve this password</h2>
            <SuggestionsPanel suggestions={analysis.suggestions} onApply={applySuggestion} />
          </section>
        )}
      </main>

      {showGen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowGen(false)}>
          <div
            className="generator-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="generator-title"
          >
            <button className="modal-close" onClick={() => setShowGen(false)} aria-label="Close">×</button>
            <h2 id="generator-title" className="panel-heading__inline mb-4">Generate Strong Password</h2>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-slate-300 min-w-[60px]" htmlFor="length-range">Length</label>
              <input id="length-range" type="range" min={8} max={32} value={genLength} onChange={(e) => setGenLength(Number(e.target.value))} className="flex-1 accent-emerald-300" />
              <span className="font-mono text-emerald-300 min-w-[30px] text-right">{genLength}</span>
            </div>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} className="accent-emerald-300" /> Symbols
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={genNumbers} onChange={(e) => setGenNumbers(e.target.checked)} className="accent-emerald-300" /> Numbers
              </label>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input value={genPassword} readOnly className="generated-output" aria-label="Generated password" placeholder="Click Generate" />
              <button onClick={handleCopyGen} disabled={!genPassword} className="button button--secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">Copy</button>
            </div>
            <div className="flex gap-2">
              <button className="button button--primary flex-1" onClick={handleGen}>
                Generate
              </button>
              {genPassword && (
                <button className="button button--positive flex-1" onClick={handleUseGenerated}>
                  Use This
                </button>
              )}
            </div>
            {genCopied && <div className="mt-2 text-center text-emerald-300" role="status" aria-live="polite">Copied to clipboard.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
