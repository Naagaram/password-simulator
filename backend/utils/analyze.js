const { calculateEntropy } = require('./entropy');
const { detectPatterns } = require('./patterns');
const { checkHIBP } = require('./hibp');

function estimateCrackTime(entropy) {
  // Assume 1e10 guesses/sec (modern GPU cluster)
  const guesses = Math.pow(2, entropy);
  const seconds = guesses / 1e10;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds/60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds/3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds/86400)} days`;
  if (seconds < 315360000) return `${Math.round(seconds/31536000)} years`;
  return `${Math.round(seconds/31536000)}+ years`;
}

function getStrengthLevel(entropy, breached) {
  if (breached) return 'breached';
  if (entropy < 30) return 'weak';
  if (entropy < 45) return 'medium';
  if (entropy < 60) return 'strong';
  return 'very strong';
}

function getStrengthColor(level) {
  if (level === 'breached') return 'red';
  if (level === 'weak') return 'red';
  if (level === 'medium') return 'orange';
  if (level === 'strong') return 'yellow';
  if (level === 'very strong') return 'green';
  return 'gray';
}

function getRiskLevel(breachCount) {
  if (breachCount > 1000000) return 'Critical';
  if (breachCount > 10000) return 'High';
  if (breachCount > 1000) return 'Medium';
  if (breachCount > 0) return 'Low';
  return 'None';
}

function getChecks(password, patterns, entropy, hibp) {
  return [
    { key: 'length', label: 'Length', icon: '🔐', pass: password.length >= 12 },
    { key: 'upperlower', label: 'Upper/Lower', icon: '🔠', pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { key: 'number', label: 'Numbers', icon: '🔢', pass: /[0-9]/.test(password) },
    { key: 'symbol', label: 'Symbols', icon: '🔣', pass: /[^a-zA-Z0-9]/.test(password) },
    { key: 'dictionary', label: 'Dictionary', icon: '📚', pass: !patterns.includes('dictionary') },
    { key: 'keyboard', label: 'Keyboard Pattern', icon: '🎹', pass: !patterns.includes('keyboard') },
    { key: 'entropy', label: 'Entropy', icon: '🧠', pass: entropy >= 45 },
    { key: 'breach', label: 'Breach Check', icon: '☠️', pass: !hibp.breached }
  ];
}

function getSuggestions(password, patterns, entropy, hibp) {
  const suggestions = [];
  if (password.length < 16) suggestions.push('Increase length to 16+ characters');
  if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters');
  if (!/[a-z]/.test(password)) suggestions.push('Add lowercase letters');
  if (!/[0-9]/.test(password)) suggestions.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add symbols');
  if (patterns.includes('dictionary')) suggestions.push('Avoid dictionary words');
  if (patterns.includes('keyboard')) suggestions.push('Avoid keyboard patterns');
  if (patterns.includes('leetspeak')) suggestions.push('Leetspeak is easily guessed by attackers');
  if (entropy < 45) suggestions.push('Add 2 random words → 10,000x stronger');
  if (hibp.breached) suggestions.push('Generate a new, unique password immediately');
  return suggestions;
}

async function analyzePassword(password, opts = {}) {
  const entropy = calculateEntropy(password);
  const patterns = detectPatterns(password);
  const hibp = await checkHIBP(password);
  const crackTime = estimateCrackTime(entropy);
  const strengthLevel = getStrengthLevel(entropy, hibp.breached);
  const strengthColor = getStrengthColor(strengthLevel);
  const riskLevel = getRiskLevel(hibp.count);
  const checks = getChecks(password, patterns, entropy, hibp);
  const suggestions = getSuggestions(password, patterns, entropy, hibp);

  if (opts.detailed) {
    return {
      entropy,
      crackTime,
      strengthLevel,
      strengthColor,
      breached: hibp.breached,
      breachCount: hibp.count,
      breachDetails: hibp.breachDetails, // NEW: Detailed breach information
      riskLevel,
      checks,
      patterns,
      suggestions
    };
  }

  // fallback: legacy
  return {
    entropy,
    breached: hibp.breached,
    breachCount: hibp.count,
    breachDetails: hibp.breachDetails,
    patterns,
    advice: suggestions
  };
}

module.exports = { analyzePassword };