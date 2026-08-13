import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRunLogger } from '../src/logger.js';

test('createRunLogger records events in order with level and message', () => {
  const logger = createRunLogger();
  logger.info('step one');
  logger.warn('step two', { detail: 'x' });
  logger.error('step three');

  const events = logger.events();
  assert.equal(events.length, 3);
  assert.deepEqual(events.map((e) => e.level), ['info', 'warn', 'error']);
  assert.equal(events[0].message, 'step one');
  assert.deepEqual(events[1].meta, { detail: 'x' });
  assert.ok(!('meta' in events[0]), 'no meta key when none was passed');
});

test('createRunLogger forwards each event to onEvent as it happens', () => {
  const seen = [];
  const logger = createRunLogger({ onEvent: (e) => seen.push(e.message) });
  logger.info('a');
  logger.info('b');
  assert.deepEqual(seen, ['a', 'b']);
});

test('toText renders one line per event including meta as JSON', () => {
  const logger = createRunLogger();
  logger.info('did a thing', { count: 3 });
  const text = logger.toText();
  assert.match(text, /\[INFO\]/);
  assert.match(text, /did a thing/);
  assert.match(text, /\{"count":3\}/);
  assert.ok(text.endsWith('\n'));
});

test('toText on an empty logger returns an empty string', () => {
  assert.equal(createRunLogger().toText(), '');
});
