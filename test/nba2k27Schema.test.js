import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/games/nba2k27/schema.js';

const BASE = {
  position: 'C',
  height: '7\'0"',
  weight: '250 lbs',
  wingspan: '7\'6"',
  playstyle: 'Two-way rim protector',
  attributes: { defense: 92 },
  badges: [{ name: 'Rim Protector', tier: 'Hall of Fame' }],
  takeovers: ['Anchor'],
  targetAudience: 'Rim-running centers',
};

test('validate passes a complete nba2k27 spec', () => {
  assert.doesNotThrow(() => validate(BASE));
});

test('validate rejects a missing required field', () => {
  const { playstyle, ...rest } = BASE;
  assert.throws(() => validate(rest), /missing required field "playstyle"/);
});

test('validate rejects an invalid position', () => {
  assert.throws(() => validate({ ...BASE, position: 'SG/SF' }), /position.*must be one of/);
});

test('validate rejects empty badges', () => {
  assert.throws(() => validate({ ...BASE, badges: [] }), /badges.*non-empty array/);
});

test('validate rejects a malformed badge entry', () => {
  assert.throws(() => validate({ ...BASE, badges: [{ name: 'Rim Protector' }] }), /badges\[0\]/);
});

test('validate rejects non-array takeovers', () => {
  assert.throws(() => validate({ ...BASE, takeovers: 'Anchor' }), /takeovers.*array/);
});

test('validate accepts an optional visualIdentity object', () => {
  assert.doesNotThrow(() => validate({ ...BASE, visualIdentity: { number: '4' } }));
});

test('validate rejects a non-object visualIdentity', () => {
  assert.throws(() => validate({ ...BASE, visualIdentity: 'four' }), /visualIdentity/);
});
