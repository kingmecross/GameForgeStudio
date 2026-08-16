import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// Black-box tests that actually spawn the CLI — none of these paths reach
// createLLMClient(), so no ANTHROPIC_API_KEY / network access is needed.
const CLI_PATH = fileURLToPath(new URL('../src/cli.js', import.meta.url));

function tempDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'myuni-cli-test-'));
}

const VALID_SPEC = {
  game: 'nba2k27',
  buildName: 'CLI Test Build',
  position: 'PG',
  height: '6\'6"',
  weight: '195 lbs',
  wingspan: '6\'9"',
  playstyle: 'Slashing playmaker',
  attributes: { finishing: 88 },
  badges: [{ name: 'Downhill', tier: 'Hall of Fame' }],
  takeovers: ['Slasher'],
  targetAudience: 'Park and Rec players',
};

test('validate accepts a well-formed build spec with exit code 0', () => {
  const root = tempDir();
  try {
    const specPath = path.join(root, 'spec.json');
    writeFileSync(specPath, JSON.stringify(VALID_SPEC));
    const stdout = execFileSync(process.execPath, [CLI_PATH, 'validate', '--spec', specPath], { encoding: 'utf8' });
    assert.match(stdout, /Valid nba2k27 build spec: "CLI Test Build"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('validate rejects a malformed build spec with a non-zero exit code', () => {
  const root = tempDir();
  try {
    const specPath = path.join(root, 'spec.json');
    const { badges, ...rest } = VALID_SPEC;
    writeFileSync(specPath, JSON.stringify(rest));
    assert.throws(() => execFileSync(process.execPath, [CLI_PATH, 'validate', '--spec', specPath], { encoding: 'utf8' }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('generate without --spec or --batch prints usage and exits non-zero', () => {
  try {
    execFileSync(process.execPath, [CLI_PATH, 'generate'], { encoding: 'utf8' });
    assert.fail('expected a non-zero exit code');
  } catch (err) {
    assert.equal(err.status, 1);
    assert.match(err.stdout, /Usage:/);
  }
});

test('generate --batch on a directory with no .json files fails fast without needing an API key', () => {
  const root = tempDir();
  try {
    mkdirSync(path.join(root, 'empty-specs'));
    try {
      execFileSync(process.execPath, [CLI_PATH, 'generate', '--batch', path.join(root, 'empty-specs')], { encoding: 'utf8' });
      assert.fail('expected a non-zero exit code');
    } catch (err) {
      assert.equal(err.status, 1);
      assert.match(err.stderr, /No \.json build specs found/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('narrate without --text or --file prints usage and exits non-zero, no API key needed', () => {
  try {
    execFileSync(process.execPath, [CLI_PATH, 'narrate'], { encoding: 'utf8' });
    assert.fail('expected a non-zero exit code');
  } catch (err) {
    assert.equal(err.status, 1);
    assert.match(err.stdout, /Usage:/);
  }
});

test('narrate with --text but no --out fails fast without needing an API key', () => {
  try {
    execFileSync(process.execPath, [CLI_PATH, 'narrate', '--text', 'hello'], { encoding: 'utf8' });
    assert.fail('expected a non-zero exit code');
  } catch (err) {
    assert.equal(err.status, 1);
    assert.match(err.stderr, /Missing --out/);
  }
});

test('an unknown command prints usage and exits non-zero', () => {
  try {
    execFileSync(process.execPath, [CLI_PATH, 'bogus-command'], { encoding: 'utf8' });
    assert.fail('expected a non-zero exit code');
  } catch (err) {
    assert.equal(err.status, 1);
    assert.match(err.stdout, /Usage:/);
  }
});
