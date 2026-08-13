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

test('slugify produces a filesystem-safe slug', () => {
  assert.equal(slugify("6'6 Slashing Playmaker"), '6-6-slashing-playmaker');
  assert.equal(slugify('  Weird   Spacing  '), 'weird-spacing');
});
