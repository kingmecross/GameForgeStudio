import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generate } from '../src/orchestrator.js';

const BUILD_SPEC = {
  game: 'nba2k27',
  buildName: 'Test Build',
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

// Recursively produces the minimal valid instance for a JSON Schema — lets
// one mock satisfy every agent's schema without hardcoding per-agent shape.
function fakeFromSchema(schema) {
  if (schema.type === 'object') {
    const obj = {};
    for (const key of schema.required || []) {
      obj[key] = fakeFromSchema(schema.properties[key]);
    }
    return obj;
  }
  if (schema.type === 'array') return [fakeFromSchema(schema.items)];
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'integer' || schema.type === 'number') return 42;
  return 'stub text';
}

function tempDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'gameforge-orch-test-'));
}

test('generate runs all sub-agents and writes a complete versioned output', async () => {
  const root = tempDir();
  try {
    const llmClient = {
      generateText: async () => '# Stub Script',
      generateStructured: async (system, prompt, schema) => fakeFromSchema(schema),
    };

    const { versionDir, version, errors } = await generate(BUILD_SPEC, { llmClient, outputRoot: root });

    assert.equal(version, 1);
    assert.deepEqual(errors, {});
    for (const file of [
      'script-longform.md', 'scripts-shorts.json', 'scripts-shorts.md',
      'seo.json', 'thumbnails.json', 'thumbnails.md', 'captions.json', 'captions.md',
      'image-prompts.json', 'video-prompts.json', 'trend-scores.json', 'publish-plan.json',
      'build-spec.json', 'manifest.json', 'generation.log',
    ]) {
      assert.ok(existsSync(path.join(versionDir, file)), `expected ${file} to exist`);
    }

    const manifest = JSON.parse(readFileSync(path.join(versionDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest.game, 'nba2k27');
    assert.equal(manifest.slug, 'test-build');
    assert.equal(manifest.version, 1);
    assert.equal(manifest.errors, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('generate increments the version on a second run for the same build', async () => {
  const root = tempDir();
  try {
    const llmClient = {
      generateText: async () => 'stub',
      generateStructured: async (s, p, schema) => fakeFromSchema(schema),
    };
    const first = await generate(BUILD_SPEC, { llmClient, outputRoot: root });
    const second = await generate(BUILD_SPEC, { llmClient, outputRoot: root });
    assert.equal(first.version, 1);
    assert.equal(second.version, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('generate survives a single sub-agent failure and records it, without losing other artifacts', async () => {
  const root = tempDir();
  try {
    const llmClient = {
      generateText: async () => {
        throw new Error('simulated LLM failure');
      },
      generateStructured: async (s, p, schema) => fakeFromSchema(schema),
    };

    const { versionDir, errors } = await generate(BUILD_SPEC, { llmClient, outputRoot: root });

    // scriptsAgent calls generateText first, so it fails; branding/mediaPrompts only
    // use generateStructured and should still succeed.
    assert.ok(errors.scripts, 'expected the scripts agent to have failed');
    assert.ok(!errors.branding);
    assert.ok(!errors.mediaPrompts);
    assert.ok(existsSync(path.join(versionDir, 'seo.json')));
    assert.ok(!existsSync(path.join(versionDir, 'script-longform.md')));

    // Deterministic post-processing agents must still run and produce output
    // even though one upstream LLM agent failed.
    assert.ok(existsSync(path.join(versionDir, 'trend-scores.json')));
    assert.ok(existsSync(path.join(versionDir, 'publish-plan.json')));
    assert.ok(!errors.trendScoring);
    assert.ok(!errors.publishing);

    const manifest = JSON.parse(readFileSync(path.join(versionDir, 'manifest.json'), 'utf8'));
    assert.ok(manifest.errors.scripts.includes('simulated LLM failure'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
