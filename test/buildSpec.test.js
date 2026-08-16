import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBuildSpec, slugify } from '../src/buildSpec.js';

const VALID_SPEC = {
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

test('validateBuildSpec accepts a well-formed spec', async () => {
  const { spec, gameModule } = await validateBuildSpec(VALID_SPEC);
  assert.equal(spec.buildName, 'Test Build');
  assert.equal(gameModule.promptPack.gameLabel, 'NBA 2K27');
});

test('validateBuildSpec rejects an unknown game', async () => {
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, game: 'madden27' }),
    /game.*must be one of/
  );
});

test('validateBuildSpec rejects a missing buildName', async () => {
  const { buildName, ...rest } = VALID_SPEC;
  await assert.rejects(() => validateBuildSpec(rest), /buildName/);
});

test('validateBuildSpec rejects a non-object spec', async () => {
  await assert.rejects(() => validateBuildSpec(null), /must be a JSON object/);
  await assert.rejects(() => validateBuildSpec([1, 2, 3]), /must be a JSON object/);
});

test('validateBuildSpec surfaces game-specific validation errors', async () => {
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, position: 'GOAT' }),
    /position.*must be one of/
  );
});

test('validateBuildSpec rejects an out-of-range attribute', async () => {
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, attributes: { finishing: 150 } }),
    /attribute "finishing" must be a whole number between 0 and 99/
  );
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, attributes: { finishing: -1 } }),
    /attribute "finishing" must be a whole number between 0 and 99/
  );
});

test('validateBuildSpec rejects a non-integer or non-numeric attribute', async () => {
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, attributes: { finishing: 92.5 } }),
    /attribute "finishing" must be a whole number/
  );
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, attributes: { finishing: '92' } }),
    /attribute "finishing" must be a whole number/
  );
});

test('validateBuildSpec rejects an invalid badge tier', async () => {
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, badges: [{ name: 'Downhill', tier: 'Diamond' }] }),
    /badges\[0\] must have a non-empty "name" and "tier" one of/
  );
});

test('validateBuildSpec rejects a takeovers array with a non-string element', async () => {
  await assert.rejects(
    () => validateBuildSpec({ ...VALID_SPEC, takeovers: ['Slasher', 42] }),
    /takeovers.*must be an array of non-empty strings/
  );
});

test('validateBuildSpec accepts an empty takeovers array', async () => {
  const { spec } = await validateBuildSpec({ ...VALID_SPEC, takeovers: [] });
  assert.deepEqual(spec.takeovers, []);
});

test('slugify produces a filesystem-safe slug', () => {
  assert.equal(slugify("6'6 Slashing Playmaker"), '6-6-slashing-playmaker');
  assert.equal(slugify('  Weird   Spacing  '), 'weird-spacing');
});

test('slugify falls back to a generated id for a name with no latin/digit characters', () => {
  assert.match(slugify('日本語ビルド'), /^build-\d+$/);
});

test('slugify truncates a very long name so the filename stays well under OS path limits', () => {
  const slug = slugify('a'.repeat(500));
  assert.ok(slug.length <= 80);
});
