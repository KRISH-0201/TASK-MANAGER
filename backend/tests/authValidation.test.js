const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeEmail, isValidEmail, isGmailAddress, generatePasswordResetToken, isStrongPassword } = require('../utils/validation');

test('normalizeEmail lowercases and trims Gmail addresses', () => {
  assert.equal(normalizeEmail('  User.Name+Tag@GMAIL.com  '), 'user.name+tag@gmail.com');
});

test('accepts a valid Gmail email address', () => {
  assert.equal(isValidEmail('demo@gmail.com'), true);
  assert.equal(isGmailAddress('demo@gmail.com'), true);
});

test('rejects invalid email addresses', () => {
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('demo@'), false);
});

test('creates a usable reset token and enforces password strength', () => {
  const token = generatePasswordResetToken();
  assert.equal(typeof token, 'string');
  assert.ok(token.length >= 10);
  assert.equal(isStrongPassword('abc123'), true);
  assert.equal(isStrongPassword('abc'), false);
});
