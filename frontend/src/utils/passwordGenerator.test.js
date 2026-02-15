import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPassword, passwordHasRequiredCategories } from './passwordGenerator.js';

function createDeterministicCrypto() {
  let counter = 1;
  return {
    getRandomValues(array) {
      for (let i = 0; i < array.length; i += 1) {
        array[i] = counter;
        counter += 17;
      }
      return array;
    },
  };
}

test('buildPassword enforces selected categories', () => {
  const password = buildPassword({
    length: 20,
    includeNumbers: true,
    includeSymbols: true,
    cryptoObj: createDeterministicCrypto(),
  });

  assert.equal(password.length, 20);
  assert.equal(passwordHasRequiredCategories(password, { includeNumbers: true, includeSymbols: true }), true);
});

test('buildPassword handles no-number no-symbol variant', () => {
  const password = buildPassword({
    length: 10,
    includeNumbers: false,
    includeSymbols: false,
    cryptoObj: createDeterministicCrypto(),
  });

  assert.equal(password.length, 10);
  assert.equal(/[0-9]/.test(password), false);
  assert.equal(/[^a-zA-Z0-9]/.test(password), false);
  assert.equal(/[a-z]/.test(password), true);
  assert.equal(/[A-Z]/.test(password), true);
});

test('buildPassword throws when secure crypto is unavailable', () => {
  assert.throws(() => buildPassword({ cryptoObj: null }), /Secure random generator unavailable/);
});
