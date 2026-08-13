import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/agents/publishingAgent.js';

const BUILD_SPEC = { buildName: 'Test Build' };

const FULL_ARTIFACTS = {
  'seo.json': { titles: ['Best Build'], description: 'desc', tags: ['a', 'b'] },
  'captions.json': { youtubeCommunity: 'yt post', instagram: 'ig caption', tiktok: 'tt caption', x: 'x post' },
  'scripts-shorts.json': {
    clips: [
      { platform: 'YouTube Shorts', hook: 'shorts hook', script: 'shorts script', durationSec: 45 },
      { platform: 'TikTok', hook: 'tiktok hook', script: 'tiktok script', durationSec: 30 },
    ],
  },
  'script-longform.md': '# Script',
};

test('run marks every platform ready when all upstream artifacts are present', async () => {
  const result = await run(BUILD_SPEC, FULL_ARTIFACTS);
  const plan = result['publish-plan.json'];
  assert.equal(plan.buildName, 'Test Build');
  assert.ok(Array.isArray(plan.suggestedPostingOrder) && plan.suggestedPostingOrder.length > 0);

  const byPlatform = Object.fromEntries(plan.platforms.map((p) => [p.platform, p]));
  assert.equal(byPlatform['YouTube (long-form)'].ready, true);
  assert.equal(byPlatform['YouTube (long-form)'].title, 'Best Build');
  assert.equal(byPlatform['YouTube Shorts'].ready, true);
  assert.equal(byPlatform['YouTube Shorts'].hook, 'shorts hook');
  assert.equal(byPlatform['TikTok'].ready, true);
  assert.equal(byPlatform['TikTok'].caption, 'tt caption');
  assert.equal(byPlatform['Instagram Reels'].ready, true);
  assert.equal(byPlatform['X'].ready, true);
});

test('run degrades gracefully when scripts failed upstream (no shorts clips, no long-form)', async () => {
  const partial = {
    'seo.json': FULL_ARTIFACTS['seo.json'],
    'captions.json': FULL_ARTIFACTS['captions.json'],
  };
  const result = await run(BUILD_SPEC, partial);
  const byPlatform = Object.fromEntries(result['publish-plan.json'].platforms.map((p) => [p.platform, p]));

  assert.equal(byPlatform['YouTube (long-form)'].ready, false, 'no script-longform.md means not ready');
  assert.equal(byPlatform['YouTube Shorts'].ready, false);
  assert.equal(byPlatform['YouTube Shorts'].hook, null);
  assert.equal(byPlatform['X'].ready, true, 'caption still present even though scripts failed');
});

test('run handles completely empty artifacts without throwing', async () => {
  const result = await run(BUILD_SPEC, {});
  const plan = result['publish-plan.json'];
  assert.ok(plan.platforms.every((p) => p.ready === false));
});
