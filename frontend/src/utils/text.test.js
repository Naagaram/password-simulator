import test from 'node:test';
import assert from 'node:assert/strict';
import { getCheckExplanation, toPlainText } from './text.js';

test('toPlainText strips tags in non-DOM environments', () => {
  const input = '<p>Hello <strong>World</strong></p>';
  assert.equal(toPlainText(input), 'Hello World');
});

test('getCheckExplanation returns key-specific guidance', () => {
  const fail = getCheckExplanation({ key: 'length', pass: false });
  const pass = getCheckExplanation({ key: 'length', pass: true });

  assert.match(fail, /at least 12 characters/i);
  assert.match(pass, /at least 12 characters/i);
});

test('getCheckExplanation falls back for unknown keys', () => {
  assert.equal(getCheckExplanation({ key: 'custom', pass: true }), 'Check passed.');
  assert.equal(getCheckExplanation({ key: 'custom', pass: false }), 'Check failed.');
});
