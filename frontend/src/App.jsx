import { useState, useEffect, useRef } from 'react';
import './App.css';

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
  red: 'bg-red-500',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-300',
  green: 'bg-green-400',
  gray: 'bg-gray-500',
};

function StrengthMeter({ level, color, value }) {
  return (
    <div className="w-full mt-4">
      <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${STRENGTH_COLORS[color]}`}
          style={{ width: `${Math.min(100, value * 1.2)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-400">
        <span className="capitalize">{level.replace(/_/g, ' ')}</span>
        <span>{value} bits entropy</span>
      </div>
    </div>
  );
}

function AnalysisCard({ icon, label, pass }) {
  return (
    <div
      className={`bg-[rgba(24,26,32,0.85)] backdrop-blur rounded-xl p-4 flex flex-col items-center shadow-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${pass ? 'border-green-400' : 'border-red-500'}`}
      role="status"
      aria-atomic="true"
      tabIndex={0}
      aria-label={`${label}: ${pass ? 'pass' : 'fail'}`}
    >
      <span className="text-3xl mb-2" aria-hidden>
        {icon}
      </span>
      <span className="font-semibold text-lg text-gray-100">{label}</span>
      <span className={`mt-2 text-2xl ${pass ? 'text-green-400' : 'text-red-500'} transition`} aria-hidden>
        {pass ? '✔️' : '❌'}
      </span>
    </div>
  );
}

function SuggestionsPanel({ suggestions, onApply }) {
  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {suggestions.map((s, i) => (
        <button
          key={i}
          className="bg-[#00E5FF]/20 hover:bg-[#39FF14]/30 text-[#39FF14] px-4 py-2 rounded-full font-semibold shadow transition"
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
    <div className="mt-6 bg-slate-800/80 rounded-lg p-6">
      <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
        <span>📅</span> Breach Timeline
      </h3>
      <div className="space-y-3">
        {timeline.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 border-l-2 border-red-500/30 pl-4">
            <div className="min-w-[100px] text-sm text-gray-400">
              {new Date(item.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
              })}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">{item.name}</div>
              <div className="text-xs text-gray-400">{item.pwnCount} accounts affected</div>
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
  
  return (
    <div className="mt-6 bg-slate-800/80 rounded-lg p-6">
      <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
        <span>🔍</span> Likely Breaches ({breachDetails.totalBreachesFound})
      </h3>
      
      {/* Data Classes */}
      {breachDetails.dataClasses && breachDetails.dataClasses.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/20 rounded border border-red-500/30">
          <div className="text-sm font-semibold text-red-300 mb-2">Exposed Data Types:</div>
          <div className="flex flex-wrap gap-2">
            {breachDetails.dataClasses.map((dc, idx) => (
              <span key={idx} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                {dc}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Breach Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breachDetails.likelyBreaches.slice(0, 6).map((breach, idx) => (
          <div 
            key={idx} 
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-orange-500/50 transition cursor-pointer"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold text-white flex items-center gap-2">
                  {breach.title}
                  {breach.isVerified && <span className="text-green-400 text-xs">✓</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1">{breach.domain}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(breach.breachDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-400">
                  {breach.pwnCount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">accounts</div>
              </div>
            </div>
            
            {expanded === idx && (
              <div className="mt-3 pt-3 border-t border-slate-600">
                <div 
                  className="text-sm text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: breach.description }}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {breach.dataClasses.slice(0, 5).map((dc, i) => (
                    <span key={i} className="text-xs bg-slate-600 text-gray-300 px-2 py-1 rounded">
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-red-700/90 border-4 border-red-500 rounded-xl p-6 mt-6 flex flex-col items-center animate-pulse shadow-lg">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-2xl font-bold text-white mt-2">This password has appeared in data breaches</h2>
        <div className="mt-2 text-lg text-white">
          Seen in <span className="font-bold">{breachCount.toLocaleString()}</span> breaches
        </div>
        <span className="mt-2 px-4 py-1 rounded-full bg-black/60 text-red-300 font-bold uppercase tracking-wide">
          {riskLevel} Risk
        </span>
        
        {breachDetails && breachDetails.likelyBreaches && breachDetails.likelyBreaches.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition"
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
    <div className="bg-red-900/90 border-2 border-red-500 rounded-lg p-4 mt-4 flex items-center justify-between max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">❌</span>
        <span className="text-white">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-white hover:text-red-200 ml-4">
          ✕
        </button>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center mt-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
    </div>
  );
}

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
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && showGen) setShowGen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
      setAnalysis(null);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    
    const timeout = setTimeout(() => {
      abortControllerRef.current = new AbortController();
      
      fetch('http://localhost:4000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        signal: abortControllerRef.current.signal
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.error || 'Analysis failed');
            });
          }
          return res.json();
        })
        .then(data => {
          setAnalysis(data);
          setError(null);
        })
        .catch(err => {
          if (err.name === 'AbortError') {
            return;
          }
          console.error('Analysis error:', err);
          setError(err.message || 'Failed to analyze password. Please check if the backend is running.');
          setAnalysis(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [password]);

  function handleGen() {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) chars += '0123456789';
    if (genSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let out = '';
    const categories = [];
    categories.push('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (genNumbers) categories.push('0123456789');
    if (genSymbols) categories.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
    
    categories.forEach(category => {
      out += category[Math.floor(Math.random() * category.length)];
    });
    
    for (let i = out.length; i < genLength; ++i) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    
    out = out.split('').sort(() => Math.random() - 0.5).join('');
    setGenPassword(out);
  }

  function handleCopyGen() {
    navigator.clipboard.writeText(genPassword).then(() => {
      setGenCopied(true);
      setTimeout(() => setGenCopied(false), 1200);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy password to clipboard');
    });
  }

  function handleUseGenerated() {
    setPassword(genPassword);
    setShowGen(false);
  }

  function handleClear() {
    setPassword('');
    setAnalysis(null);
    setError(null);
    setShowGen(false);
    setGenPassword('');
    setShowPassword(false);
    if (inputRef.current && typeof inputRef.current.focus === 'function') inputRef.current.focus();
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 font-sans app-root">
      <div className="flex flex-col items-center pt-12 pb-6">
        <div className="bg-slate-800/80 backdrop-blur shadow-xl border border-slate-700/50 rounded-xl p-8 w-full max-w-xl flex flex-col items-center">
          <h1 className="text-3xl font-bold text-slate-50 mb-4 tracking-tight">Password Analyzer</h1>
          <div className="w-full flex items-center gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-slate-700 text-lg p-4 rounded-lg border border-slate-600 focus:ring-4 focus:ring-sky-400 transition"
              ref={inputRef}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              aria-label="Password"
              style={{ minWidth: 0 }}
            />
            <button
              className="text-sky-300 text-2xl ml-2 focus:outline-none hover:text-sky-200 transition"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(v => !v)}
              style={{ minWidth: 0 }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="bg-sky-500 text-white font-bold px-6 py-2 rounded-full shadow hover:bg-sky-600 transition" onClick={() => setShowGen(true)}>
              Generate
            </button>
            <button className="bg-slate-600 text-slate-100 font-medium px-4 py-2 rounded-full shadow hover:bg-slate-500 transition" onClick={handleClear} aria-label="Clear password and analysis">
              Clear
            </button>
          </div>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          
          {analysis && !loading && (
            <StrengthMeter level={analysis.strengthLevel} color={analysis.strengthColor} value={analysis.entropy} />
          )}
          {analysis && !loading && (
            <div className="flex justify-between w-full mt-2 text-sm text-slate-300">
              <span>Crack time: <span className="text-sky-300 font-mono">{analysis.crackTime}</span></span>
            </div>
          )}
        </div>
      </div>
      
      {analysis && analysis.breached && !loading && (
        <BreachWarning 
          breachCount={analysis.breachCount} 
          riskLevel={analysis.riskLevel}
          breachDetails={analysis.breachDetails}
        />
      )}
      
      {analysis && !loading && (
        <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" role="region" aria-label="Security analysis results">
          {CARD_CONFIG.map(card => {
            const check = analysis.checks.find(c => c.key === card.key);
            return (
              <AnalysisCard
                key={card.key}
                icon={card.icon}
                label={card.label}
                pass={check ? check.pass : false}
              />
            );
          })}
        </div>
      )}
      
      {analysis && !loading && analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="max-w-2xl mx-auto mt-10">
          <h2 className="text-xl font-bold text-[#00E5FF] mb-2">How to improve your password</h2>
          <SuggestionsPanel suggestions={analysis.suggestions} />
        </div>
      )}
      
      {showGen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowGen(false)}>
          <div className="bg-slate-800/95 backdrop-blur p-8 rounded-xl shadow-xl w-full max-w-md mx-auto relative">
            <button className="absolute top-2 right-2 text-2xl text-sky-300 hover:text-sky-200" onClick={() => setShowGen(false)} aria-label="Close">×</button>
            <h2 className="text-xl font-bold text-[#00E5FF] mb-4">Generate Strong Password</h2>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-gray-300 min-w-[60px]">Length</label>
              <input type="range" min={8} max={32} value={genLength} onChange={e => setGenLength(Number(e.target.value))} className="flex-1 accent-[#39FF14]" />
              <span className="font-mono text-[#39FF14] min-w-[30px] text-right">{genLength}</span>
            </div>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={genSymbols} onChange={e => setGenSymbols(e.target.checked)} className="accent-[#39FF14]" /> Symbols
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={genNumbers} onChange={e => setGenNumbers(e.target.checked)} className="accent-[#39FF14]" /> Numbers
              </label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input value={genPassword} readOnly className="w-full bg-slate-700 text-sky-300 font-mono p-2 rounded" aria-label="Generated password" placeholder="Click Generate" />
              <button onClick={handleCopyGen} disabled={!genPassword} className="bg-amber-400 text-slate-900 px-3 py-2 rounded shadow hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed">Copy</button>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-sky-500 text-white font-bold px-6 py-2 rounded-full shadow hover:bg-sky-600 transition" onClick={handleGen}>
                Generate
              </button>
              {genPassword && (
                <button className="flex-1 bg-green-500 text-white font-bold px-6 py-2 rounded-full shadow hover:bg-green-600 transition" onClick={handleUseGenerated}>
                  Use This
                </button>
              )}
            </div>
            {genCopied && <div className="text-[#39FF14] mt-2 opacity-95 transition-opacity duration-300 text-center">✓ Copied to clipboard!</div>}
          </div>
        </div>
      )}
    </div>
  );
}