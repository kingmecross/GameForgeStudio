import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadBrandKit, describeBrandKit } from '../src/brandKit.js';

function tempDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'gameforge-brandkit-test-'));
}

const VALID_KIT = {
  channelName: 'Day One Builds',
  colorPalette: 'black and crimson with gold accents',
  logoPlacement: 'bottom-right corner watermark',
  titleTextStyle: 'bold condensed white sans-serif',
};

test('loadBrandKit returns null when the file does not exist', () => {
  const root = tempDir();
  try {
    assert.equal(loadBrandKit(path.join(root, 'missing.json')), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('loadBrandKit parses and returns a valid brand kit', () => {
  const root = tempDir();
  try {
    const filePath = path.join(root, 'brand-kit.json');
    writeFileSync(filePath, JSON.stringify(VALID_KIT));
    assert.deepEqual(loadBrandKit(filePath), VALID_KIT);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('loadBrandKit rejects invalid JSON', () => {
  const root = tempDir();
  try {
    const filePath = path.join(root, 'brand-kit.json');
    writeFileSync(filePath, '{ not json');
    assert.throws(() => loadBrandKit(filePath), /Invalid JSON/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('loadBrandKit rejects a kit missing a required field', () => {
  const root = tempDir();
  try {
    const filePath = path.join(root, 'brand-kit.json');
    const { channelName, ...rest } = VALID_KIT;
    writeFileSync(filePath, JSON.stringify(rest));
    assert.throws(() => loadBrandKit(filePath), /missing a non-empty "channelName"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('describeBrandKit returns an empty string for a null kit', () => {
  assert.equal(describeBrandKit(null), '');
});

test('describeBrandKit includes every field for a real kit', () => {
  const text = describeBrandKit(VALID_KIT);
  assert.match(text, /Day One Builds/);
  assert.match(text, /black and crimson with gold accents/);
  assert.match(text, /bottom-right corner watermark/);
  assert.match(text, /bold condensed white sans-serif/);
});
