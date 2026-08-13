import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/agents/trendScoringAgent.js';

const BUILD_SPEC = { buildName: 'Test Build' };

test('run scores whatever artifacts are present and labels the method', async () => {
  const artifacts = {
    'seo.json': { titles: ['This 6\'6 Build Does Everything'] },
    'scripts-shorts.json': { clips: [{ platform: 'YouTube Shorts', hook: 'Stop scrolling, this build hits different.' }] },
    'script-longform.md': '# Hook\nIf you want one build that does it all, this is it.',
  };
  const result = await run(BUILD_SPEC, artifacts);
  const scores = result['trend-scores.json'];
  assert.equal(scores.method, 'heuristic-v1');
  assert.match(scores.note, /not a real virality model/);
  assert.equal(scores.titles.length, 1);
  assert.equal(scores.shorts.length, 1);
  assert.ok(scores.overall > 0);
});

test('run tolerates completely missing artifacts (e.g. every upstream agent failed)', async () => {
  const result = await run(BUILD_SPEC, {});
  const scores = result['trend-scores.json'];
  assert.equal(scores.overall, 0);
  assert.deepEqual(scores.titles, []);
  assert.deepEqual(scores.shorts, []);
});

test('run defaults artifacts to {} when called with none', async () => {
  const result = await run(BUILD_SPEC);
  assert.ok(result['trend-scores.json']);
});
