// Shannon entropy calculation
function calculateEntropy(password) {
  if (!password) return 0;
  const freq = {};
  for (const char of password) freq[char] = (freq[char] || 0) + 1;
  let entropy = 0;
  for (const char in freq) {
    const p = freq[char] / password.length;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * password.length * 100) / 100;
}

module.exports = { calculateEntropy };

