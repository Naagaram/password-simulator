const fs = require('fs');
const path = require('path');

// Load dictionary and keyboard patterns
const dictionary = fs.readFileSync(path.join(__dirname, 'dictionary.txt'), 'utf-8').split(/\r?\n/);
const keyboards = require('./keyboards.json');

// Leetspeak map
const leetMap = { '4': 'a', '@': 'a', '3': 'e', '1': 'l', '0': 'o', '$': 's', '5': 's', '7': 't', '!': 'i' };

function normalizeLeet(password) {
  return password.toLowerCase().split('').map(c => leetMap[c] || c).join('');
}

function detectPatterns(password) {
  const patterns = [];
  const lower = password.toLowerCase();
  // Dictionary word
  for (const word of dictionary) {
    if (word && lower.includes(word)) {
      patterns.push('dictionary');
      break;
    }
  }
  // Leetspeak
  const norm = normalizeLeet(password);
  if (norm !== lower) {
    for (const word of dictionary) {
      if (word && norm.includes(word)) {
        patterns.push('leetspeak');
        break;
      }
    }
  }
  // Keyboard patterns
  for (const row of keyboards) {
    for (let i = 0; i < row.length - 2; i++) {
      const pat = row.slice(i, i + 3);
      if (lower.includes(pat)) {
        patterns.push('keyboard');
        break;
      }
    }
  }
  return [...new Set(patterns)];
}

module.exports = { detectPatterns };

