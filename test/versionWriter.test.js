import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { nextVersion, claimVersionDir, writeVersion } from '../src/versionWriter.js';

function tempDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'gameforge-versionwriter-test-'));
}

test('nextVersion returns 1 when the build directory does not exist', () => {
  const root = tempDir();
  try {
    assert.equal(nextVersion(path.join(root, 'nba2k27', 'some-build')), 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('nextVersion increments past the highest existing vN directory', () => {
  const root = tempDir();
  try {
    const buildDir = path.join(root, 'build');
    mkdirSync(path.join(buildDir, 'v1'), { recursive: true });
    mkdirSync(path.join(buildDir, 'v2'), { recursive: true });
    mkdirSync(path.join(buildDir, 'not-a-version'), { recursive: true });
    assert.equal(nextVersion(buildDir), 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('claimVersionDir reserves startAt when nothing else exists', () => {
  const root = tempDir();
  try {
    const { version, versionDir } = claimVersionDir(root, 'nba2k27', 'my-build', 1);
    assert.equal(version, 1);
    assert.equal(versionDir, path.join(root, 'nba2k27', 'my-build', 'v1'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('claimVersionDir skips past a version directory that already exists (the race-safety guarantee)', () => {
  const root = tempDir();
  try {
    const buildDir = path.join(root, 'nba2k27', 'my-build');
    // Simulates a concurrent generate() call that already claimed v1 before
    // this one calls claimVersionDir with the same optimistic startAt.
    mkdirSync(buildDir, { recursive: true });
    mkdirSync(path.join(buildDir, 'v1'));

    const { version, versionDir } = claimVersionDir(root, 'nba2k27', 'my-build', 1);
    assert.equal(version, 2);
    assert.equal(versionDir, path.join(buildDir, 'v2'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('writeVersion writes string and object artifacts to the versioned folder', () => {
  const root = tempDir();
  try {
    const { versionDir } = claimVersionDir(root, 'nba2k27', 'my-build', 1);
    writeVersion(versionDir, {
      'script.md': '# Hello',
      'seo.json': { titles: ['A', 'B'] },
    });
    assert.equal(versionDir, path.join(root, 'nba2k27', 'my-build', 'v1'));
    assert.equal(readFileSync(path.join(versionDir, 'script.md'), 'utf8'), '# Hello');
    assert.deepEqual(JSON.parse(readFileSync(path.join(versionDir, 'seo.json'), 'utf8')), { titles: ['A', 'B'] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('writeVersion writes Buffer artifacts (e.g. narration.mp3) as raw binary, not JSON/utf8-mangled', () => {
  const root = tempDir();
  try {
    const { versionDir } = claimVersionDir(root, 'nba2k27', 'my-build', 1);
    const audio = Buffer.from([0, 1, 2, 255, 254, 253]);
    writeVersion(versionDir, { 'narration.mp3': audio });
    const written = readFileSync(path.join(versionDir, 'narration.mp3'));
    assert.deepEqual([...written], [0, 1, 2, 255, 254, 253]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
