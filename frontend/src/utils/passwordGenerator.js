const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function randomIndex(max, cryptoObj = globalThis.crypto) {
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('Secure random generator unavailable in this environment.');
  }
  const array = new Uint32Array(1);
  cryptoObj.getRandomValues(array);
  return array[0] % max;
}

function shuffleSecure(items, cryptoObj = globalThis.crypto) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1, cryptoObj);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildPassword({
  length = 16,
  includeNumbers = true,
  includeSymbols = true,
  cryptoObj = globalThis.crypto,
} = {}) {
  const requiredSets = [LOWER, UPPER];
  if (includeNumbers) requiredSets.push(NUMBERS);
  if (includeSymbols) requiredSets.push(SYMBOLS);

  const targetLength = Math.max(length, requiredSets.length);
  const pool = requiredSets.join('');
  const chars = [];

  // Ensure at least one char from every selected category.
  for (const set of requiredSets) {
    chars.push(set[randomIndex(set.length, cryptoObj)]);
  }

  while (chars.length < targetLength) {
    chars.push(pool[randomIndex(pool.length, cryptoObj)]);
  }

  return shuffleSecure(chars, cryptoObj).join('');
}

export function passwordHasRequiredCategories(password, { includeNumbers = true, includeSymbols = true } = {}) {
  const tests = [/[a-z]/, /[A-Z]/];
  if (includeNumbers) tests.push(/[0-9]/);
  if (includeSymbols) tests.push(/[^a-zA-Z0-9]/);
  return tests.every((pattern) => pattern.test(password));
}
