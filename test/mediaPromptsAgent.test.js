import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/agents/mediaPromptsAgent.js';

const BUILD_SPEC = {
  buildName: 'Test Build',
  position: 'PG',
  height: '6\'6"',
  weight: '195 lbs',
  wingspan: '6\'9"',
  playstyle: 'Slasher',
  attributes: { finishing: 88 },
  badges: [{ name: 'Downhill', tier: 'Hall of Fame' }],
  takeovers: ['Slasher'],
  targetAudience: 'Park players',
};
const PROMPT_PACK = { gameLabel: 'NBA 2K27', factGuardrails: 'stay grounded' };

function shot(scores = {}, overrides = {}) {
  return {
    shotName: 'Shot', prompt: 'p', camera: 'c', lens: 'l', lighting: 'li',
    environment: 'e', clothing: 'cl', emotion: 'em', motion: 'm', color: 'co',
    composition: 'comp', aspectRatio: '16:9', exclusions: ['x'],
    expectedResult: 'A confident portrait shot.',
    creativityScore: 9.7, clarityScore: 9.7, clickabilityScore: 9.7,
    ...scores,
    ...overrides,
  };
}

function clip(scores = {}, overrides = {}) {
  const { shotName, ...rest } = shot(scores);
  return { ...rest, sceneName: 'Scene', cameraMovement: 'pan', durationSec: 10, audioNotes: 'ambient', ...overrides };
}

function fakeClient({ imageShots, clipShots = [{}] }) {
  let imageCalls = 0;
  return {
    generateStructured: async (system, prompt, schema) => {
      if (schema.properties.shots) {
        const shots = imageShots[Math.min(imageCalls, imageShots.length - 1)];
        imageCalls++;
        return { characterIdentity: 'id', conceptsConsidered: ['a', 'b', 'c'], shots };
      }
      return { conceptsConsidered: ['a', 'b', 'c'], clips: clipShots.map((s) => clip(s)) };
    },
    callCount: () => imageCalls,
  };
}

test('run does not retry when every shot already clears 9.5 on all three dimensions', async () => {
  const llmClient = fakeClient({ imageShots: [[shot()]] });
  const result = await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });
  assert.equal(llmClient.callCount(), 1, 'no retry needed');
  assert.equal(result['image-prompts.json'].readyForHiggsfield, true);
  assert.equal(result['image-prompts.json'].passCount, 1);
});

test('run retries once when any single dimension is below 9.5, and keeps the improved attempt', async () => {
  const llmClient = fakeClient({
    imageShots: [
      [shot({ clickabilityScore: 8.0 })],
      [shot()],
    ],
  });
  const result = await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });
  assert.equal(llmClient.callCount(), 2, 'expected exactly one retry');
  assert.equal(result['image-prompts.json'].readyForHiggsfield, true);
});

test('run keeps the first attempt if a retry does not actually improve on it', async () => {
  const llmClient = fakeClient({
    imageShots: [
      [shot({ clarityScore: 9.0 })],
      [shot({ clarityScore: 8.5 })],
    ],
  });
  const result = await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });
  assert.equal(llmClient.callCount(), 2);
  assert.equal(result['image-prompts.json'].readyForHiggsfield, false);
  assert.equal(result['image-prompts.json'].reviewNote.includes('1 of 1'), true);
});

test('run only retries once even if the second attempt is still below the bar', async () => {
  const llmClient = fakeClient({
    imageShots: [
      [shot({ creativityScore: 7.0 })],
      [shot({ creativityScore: 7.5 })],
    ],
  });
  await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });
  assert.equal(llmClient.callCount(), 2, 'must not loop beyond one bounded retry');
});

test('a shot only passes when ALL THREE dimensions clear 9.5, not just the average', async () => {
  // average of (10, 10, 8) is 9.33 but the weak clickabilityScore must fail it
  const llmClient = fakeClient({ imageShots: [[shot({ creativityScore: 10, clarityScore: 10, clickabilityScore: 8 })]] });
  const result = await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });
  assert.equal(result['image-prompts.json'].readyForHiggsfield, false);
});

test('withReviewSummary reports readyForHiggsfield and an explicit quality-gate description', async () => {
  const llmClient = fakeClient({ imageShots: [[shot()]] });
  const result = await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });
  assert.equal(result['image-prompts.json'].qualityGate, '9.5/10 on creativity, clarity, and clickability');
  assert.match(result['image-prompts.json'].reviewNote, /ready to send to Higgsfield/);
});

test('run produces image and video prompts with every required technical + scoring field', async () => {
  const llmClient = fakeClient({ imageShots: [[shot()]] });
  const result = await run(BUILD_SPEC, { llmClient, promptPack: PROMPT_PACK });

  const s = result['image-prompts.json'].shots[0];
  for (const field of [
    'camera', 'lens', 'lighting', 'environment', 'clothing', 'emotion', 'motion', 'color', 'composition',
    'aspectRatio', 'exclusions', 'expectedResult', 'creativityScore', 'clarityScore', 'clickabilityScore',
  ]) {
    assert.ok(field in s, `expected shot to include "${field}"`);
  }
  assert.ok(Array.isArray(result['image-prompts.json'].conceptsConsidered));

  const c = result['video-prompts.json'].clips[0];
  for (const field of [
    'camera', 'lens', 'lighting', 'environment', 'clothing', 'emotion', 'motion', 'color', 'composition',
    'exclusions', 'expectedResult', 'creativityScore', 'clarityScore', 'clickabilityScore',
    'cameraMovement', 'durationSec', 'audioNotes',
  ]) {
    assert.ok(field in c, `expected clip to include "${field}"`);
  }
});
