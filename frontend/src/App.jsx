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

function BreachWarning({ breachCount, riskLevel }) {
  return (
    <div className="bg-red-700/90 border-4 border-red-500 rounded-xl p-6 mt-6 flex flex-col items-center animate-pulse shadow-lg">
      <span className="text-4xl">⚠️</span>
      <h2 className="text-2xl font-bold text-white mt-2">This password has appeared in data breaches</h2>
      <div className="mt-2 text-lg text-white">Seen in <span className="font-bold">{breachCount.toLocaleString()}</span> breaches</div>
      <span className="mt-2 px-4 py-1 rounded-full bg-black/60 text-red-300 font-bold uppercase tracking-wide">{riskLevel}</span>
    </div>
  );
}

export default function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [genPassword, setGenPassword] = useState('');
  const [genLength, setGenLength] = useState(16);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genCopied, setGenCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && showGen) setShowGen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showGen]);

  useEffect(() => {
    if (!password) {
      setAnalysis(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
        .then(res => res.json())
        .then(setAnalysis)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timeout);
  }, [password]);

  function handleGen() {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) chars += '0123456789';
    if (genSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let out = '';
    for (let i = 0; i < genLength; ++i) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setGenPassword(out);
  }

  function handleCopyGen() {
    navigator.clipboard.writeText(genPassword);
    setGenCopied(true);
    setTimeout(() => setGenCopied(false), 1200);
  }

  function handleClear() {
    setPassword('');
    setAnalysis(null);
    setShowGen(false);
    setGenPassword('');
    setShowPassword(false);
    if (inputRef.current && typeof inputRef.current.focus === 'function') inputRef.current.focus();
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 font-sans app-root">
      {/* Hero/Input Section */}
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
              className="text-sky-300 text-2xl ml-2 focus:outline-none"
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
          {analysis && (
            <StrengthMeter level={analysis.strengthLevel} color={analysis.strengthColor} value={analysis.entropy} />
          )}
          {analysis && (
            <div className="flex justify-between w-full mt-2 text-sm text-slate-300">
              <span>Crack time: <span className="text-sky-300 font-mono">{analysis.crackTime}</span></span>
            </div>
          )}
        </div>
      </div>
      {/* Breach Warning */}
      {analysis && analysis.breached && (
        <BreachWarning breachCount={analysis.breachCount} riskLevel={analysis.riskLevel} />
      )}
      {/* Live Security Analysis Dashboard */}
      {analysis && (
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
      {/* Suggestions Panel */}
      {analysis && (
        <div className="max-w-2xl mx-auto mt-10">
          <h2 className="text-xl font-bold text-[#00E5FF] mb-2">How to improve your password</h2>
          <SuggestionsPanel suggestions={analysis.suggestions} />
        </div>
      )}
      {/* Password Generator Modal */}
      {showGen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800/95 backdrop-blur p-8 rounded-xl shadow-xl w-full max-w-md mx-auto relative">
            <button className="absolute top-2 right-2 text-2xl text-sky-300" onClick={() => setShowGen(false)} aria-label="Close">×</button>
            <h2 className="text-xl font-bold text-[#00E5FF] mb-4">Generate Strong Password</h2>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-gray-300">Length</label>
              <input type="range" min={8} max={32} value={genLength} onChange={e => setGenLength(Number(e.target.value))} className="accent-[#39FF14]" />
              <span className="font-mono text-[#39FF14]">{genLength}</span>
            </div>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={genSymbols} onChange={e => setGenSymbols(e.target.checked)} /> Symbols
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={genNumbers} onChange={e => setGenNumbers(e.target.checked)} /> Numbers
              </label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input value={genPassword} readOnly className="w-full bg-slate-700 text-sky-300 font-mono p-2 rounded" aria-label="Generated password" />
              <button onClick={handleCopyGen} className="bg-amber-400 text-slate-900 px-3 py-1 rounded shadow">Copy</button>
            </div>
            <button className="w-full mt-2 bg-sky-500 text-white font-bold px-6 py-2 rounded-full shadow hover:bg-sky-600 transition" onClick={handleGen}>
              Generate
            </button>
            {genCopied && <div className="text-[#39FF14] mt-2 opacity-95 transition-opacity duration-300">Copied!</div>}
          </div>
        </div>
      )}
    </div>
  );
}
