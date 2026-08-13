import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreBuildContent } from '../src/trendScoring.js';

test('scoreBuildContent returns 0/missing for completely empty input', () => {
  const result = scoreBuildContent({});
  assert.equal(result.overall, 0);
  assert.equal(result.longForm.score, 0);
  assert.deepEqual(result.longForm.reasons, ['missing']);
  assert.deepEqual(result.shorts, []);
  assert.deepEqual(result.titles, []);
});

test('a hook-heavy opening line scores higher than a flat one', () => {
  const hooky = scoreBuildContent({
    longFormScript: '# Heading\nIf you want one build that does everything, stop scrolling — this is the one.',
  });
  const flat = scoreBuildContent({
    longFormScript: '# Heading\nToday we are going to look at a basketball build.',
  });
  assert.ok(hooky.longForm.score > flat.longForm.score, `expected ${hooky.longForm.score} > ${flat.longForm.score}`);
});

test('heading lines are skipped when finding the opening hook line', () => {
  const result = scoreBuildContent({ longFormScript: '# Title\n## Subheading\nYour build starts here.' });
  assert.ok(result.longForm.score > 0);
});

test('shorts clips are scored per-platform by their hook field', () => {
  const result = scoreBuildContent({
    shortsClips: [
      { platform: 'YouTube Shorts', hook: 'Nobody is talking about this build yet.' },
      { platform: 'TikTok', hook: 'basketball video' },
    ],
  });
  assert.equal(result.shorts.length, 2);
  assert.equal(result.shorts[0].platform, 'YouTube Shorts');
  assert.ok(result.shorts[0].score > result.shorts[1].score);
});

test('titles under the truncation length and containing a number score higher', () => {
  const result = scoreBuildContent({
    titles: ['This 6\'6 Build Does Everything In NBA 2K27', 'x'.repeat(120)],
  });
  assert.equal(result.titles.length, 2);
  assert.ok(result.titles[0].score > result.titles[1].score);
});

test('overall is the average of every sub-score present', () => {
  const result = scoreBuildContent({ titles: ['Short Title'] });
  assert.equal(result.overall, result.titles[0].score);
});
