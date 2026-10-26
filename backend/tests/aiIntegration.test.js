const { test } = require('node:test');
const assert = require('node:assert');
const { sanitizePrompt, generateFallbackSuggestion, checkRateLimit } = require('../aiService');

test('Responsible AI: sanitizePrompt redacts PII before sending to external API', () => {
  const sensitiveInput = 'Contact user at john.doe@company.com with card 4111 2222 3333 4444 or call +1 555-123-4567, password: supersecretpassword!';
  const sanitized = sanitizePrompt(sensitiveInput);

  assert.strictEqual(sanitized.includes('john.doe@company.com'), false, 'Email should be redacted');
  assert.strictEqual(sanitized.includes('[REDACTED_EMAIL]'), true, 'Should insert [REDACTED_EMAIL]');
  assert.strictEqual(sanitized.includes('4111 2222 3333 4444'), false, 'Card should be redacted');
  assert.strictEqual(sanitized.includes('[REDACTED_CARD]'), true, 'Should insert [REDACTED_CARD]');
  assert.strictEqual(sanitized.includes('555-123-4567'), false, 'Phone should be redacted');
  assert.strictEqual(sanitized.includes('[REDACTED_SECRET]'), true, 'Password should be redacted');
});

test('Graceful Degradation: generateFallbackSuggestion provides structured fallback for critical tasks', () => {
  const bugTask = generateFallbackSuggestion('Fix critical security vulnerability in authentication token');
  assert.strictEqual(bugTask.fallback, true);
  assert.strictEqual(bugTask.suggestedPriority, 'high');
  assert.strictEqual(bugTask.suggestedDeadlineDays, 1);
  assert.ok(bugTask.description.length > 20);
  assert.ok(bugTask.disclaimer.includes('fallback'));
});

test('Graceful Degradation: generateFallbackSuggestion handles low priority review tasks', () => {
  const reviewTask = generateFallbackSuggestion('Research and clean documentation for API endpoints');
  assert.strictEqual(reviewTask.fallback, true);
  assert.strictEqual(reviewTask.suggestedPriority, 'low');
  assert.strictEqual(reviewTask.suggestedDeadlineDays, 5);
});

test('Rate Limiting: checkRateLimit blocks rapid subsequent requests', () => {
  const testId = 'test-user-' + Date.now();
  const firstAttempt = checkRateLimit(testId);
  assert.strictEqual(firstAttempt.allowed, true, 'First request should be allowed');

  const secondAttempt = checkRateLimit(testId);
  assert.strictEqual(secondAttempt.allowed, false, 'Immediate second request should be blocked');
  assert.ok(secondAttempt.remainingSeconds > 0, 'Should return remaining cooldown seconds');
});
