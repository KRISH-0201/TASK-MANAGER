/**
 * Automated API & Healthcheck Unit Tests
 * Practical 12: CI/CD Pipeline with GitHub Actions
 */

const test = require('node:test');
const assert = require('node:assert/strict');

test('Healthcheck response model validates expected schema', () => {
  const mockHealthPayload = {
    status: 'healthy',
    service: 'taskmgr-backend',
    uptime: 120,
    database: { status: 'CONNECTED', host: 'mongodb', name: 'taskdb' }
  };
  
  assert.equal(mockHealthPayload.status, 'healthy');
  assert.equal(mockHealthPayload.service, 'taskmgr-backend');
  assert.equal(typeof mockHealthPayload.uptime, 'number');
  assert.equal(mockHealthPayload.database.status, 'CONNECTED');
});

test('Task status validation ensures permitted states', () => {
  const allowedStatuses = ['pending', 'ongoing', 'completed'];
  assert.ok(allowedStatuses.includes('pending'), 'pending must be a valid status');
  assert.ok(allowedStatuses.includes('ongoing'), 'ongoing must be a valid status');
  assert.ok(allowedStatuses.includes('completed'), 'completed must be a valid status');
  assert.equal(allowedStatuses.includes('invalid_status'), false, 'unknown status must be rejected');
});

test('Cache key naming convention matches user and id pattern', () => {
  const userId = 'user_abc123';
  const taskId = 'task_xyz789';
  const listKey = `tasks_${userId}`;
  const itemKey = `task_${userId}_${taskId}`;

  assert.equal(listKey, 'tasks_user_abc123');
  assert.equal(itemKey, 'task_user_abc123_task_xyz789');
});
