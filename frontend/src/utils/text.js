export function toPlainText(input) {
  if (!input) return '';
  if (typeof DOMParser === 'undefined') {
    return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const parser = new DOMParser();
  const parsed = parser.parseFromString(input, 'text/html');
  return parsed.body.textContent || '';
}

export function getCheckExplanation(check) {
  const map = {
    length: {
      pass: 'Length is at least 12 characters.',
      fail: 'Use at least 12 characters; 16 or more is better.',
    },
    upperlower: {
      pass: 'Contains both uppercase and lowercase letters.',
      fail: 'Mix uppercase and lowercase letters.',
    },
    number: {
      pass: 'Contains numeric characters.',
      fail: 'Add at least one number.',
    },
    symbol: {
      pass: 'Contains symbol characters.',
      fail: 'Add at least one symbol.',
    },
    dictionary: {
      pass: 'No obvious dictionary word pattern detected.',
      fail: 'Avoid dictionary words or common substitutions.',
    },
    keyboard: {
      pass: 'No simple keyboard sequence detected.',
      fail: 'Avoid keyboard runs like qwerty or 123.',
    },
    entropy: {
      pass: 'Entropy threshold is in the strong range.',
      fail: 'Add random words or extra length to increase entropy.',
    },
    breach: {
      pass: 'Not found in known breach datasets.',
      fail: 'This password has breach exposure and should be replaced.',
    },
  };

  const entry = map[check?.key];
  if (!entry) {
    return check?.pass ? 'Check passed.' : 'Check failed.';
  }
  return check.pass ? entry.pass : entry.fail;
}
