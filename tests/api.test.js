import test from 'node:test';
import assert from 'node:assert';
import { apiClient, roomsAPI, documentAPI, messagesAPI, healthAPI } from '../lib/api.js';

test('API Client configuration', (t) => {
  assert.ok(apiClient, 'apiClient should be defined');
  assert.ok(apiClient.defaults.baseURL, 'baseURL should be configured');
  assert.strictEqual(apiClient.defaults.headers['Content-Type'], 'application/json');
});

test('roomsAPI module structure', (t) => {
  assert.strictEqual(typeof roomsAPI.getAll, 'function');
  assert.strictEqual(typeof roomsAPI.getById, 'function');
  assert.strictEqual(typeof roomsAPI.create, 'function');
  assert.strictEqual(typeof roomsAPI.delete, 'function');
  assert.strictEqual(typeof roomsAPI.getStats, 'function');
  assert.strictEqual(typeof roomsAPI.getPresence, 'function');
});

test('documentAPI module structure', (t) => {
  assert.strictEqual(typeof documentAPI.get, 'function');
  assert.strictEqual(typeof documentAPI.update, 'function');
  assert.strictEqual(typeof documentAPI.getHistory, 'function');
});

test('messagesAPI module structure', (t) => {
  assert.strictEqual(typeof messagesAPI.get, 'function');
  assert.strictEqual(typeof messagesAPI.send, 'function');
});

test('healthAPI module structure', (t) => {
  assert.strictEqual(typeof healthAPI.check, 'function');
});
