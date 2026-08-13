import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runIntake } from '../src/intake.js';
import { validate } from '../src/games/nba2k27/schema.js';

function queuePrompter(answers) {
  const queue = [...answers];
  return {
    ask: async () => {
      if (queue.length === 0) throw new Error('prompter ran out of scripted answers');
      return queue.shift();
    },
  };
}

test('runIntake builds a valid nba2k27 build spec from a full set of answers', async () => {
  const prompter = queuePrompter([
    'Test Build',                             // buildName
    '1',                                      // position -> Point Guard
    '6\'6"',                                  // height
    '195 lbs',                                // weight
    '6\'9"',                                  // wingspan
    'Downhill slasher who can also shoot',    // playstyle
    '88', '84', '90', '68', '55', '85',       // finishing/shooting/playmaking/defense/rebounding/physicals
    'Downhill', '4',                          // badge 1 name, tier -> Hall of Fame
    '',                                       // finish badges
    'Slasher, Shot Creator',                  // takeovers
    'Park and Rec players',                   // targetAudience
    'n',                                      // skip visual identity
  ]);

  const spec = await runIntake(prompter);

  assert.equal(spec.game, 'nba2k27');
  assert.equal(spec.buildName, 'Test Build');
  assert.equal(spec.position, 'PG');
  assert.equal(spec.height, '6\'6"');
  assert.deepEqual(spec.attributes, {
    finishing: 88, shooting: 84, playmaking: 90, defense: 68, rebounding: 55, physicals: 85,
  });
  assert.deepEqual(spec.badges, [{ name: 'Downhill', tier: 'Hall of Fame' }]);
  assert.deepEqual(spec.takeovers, ['Slasher', 'Shot Creator']);
  assert.equal(spec.targetAudience, 'Park and Rec players');
  assert.equal(spec.visualIdentity, undefined);

  assert.doesNotThrow(() => validate(spec), 'wizard output must pass real schema validation');
});

test('runIntake supports multiple badges and an empty takeovers list', async () => {
  const prompter = queuePrompter([
    'Multi Badge Build', '5', '7\'0"', '250 lbs', '7\'6"', 'Rim protector',
    '88', '45', '40', '92', '94', '90',
    'Rim Protector', '4',
    'Boxout Beast', '3',
    '',
    '',                       // blank takeovers
    'Interior defenders',
    'n',
  ]);

  const spec = await runIntake(prompter);
  assert.equal(spec.position, 'C');
  assert.equal(spec.badges.length, 2);
  assert.equal(spec.badges[1].tier, 'Gold');
  assert.deepEqual(spec.takeovers, []);
});

test('runIntake re-prompts on an out-of-range attribute and an invalid menu choice', async () => {
  const prompter = queuePrompter([
    'Retry Build', '9', '1',              // invalid position choice, then valid (PG)
    '6\'2"', '175 lbs', '6\'4"', 'Playmaker',
    '150', '80',                          // finishing invalid, then valid
    '75', '80', '60', '70', '78',         // shooting/playmaking/defense/rebounding/physicals
    'Dimer', '1',
    '',
    '',
    'Playmakers',
    'n',
  ]);

  const spec = await runIntake(prompter);
  assert.equal(spec.position, 'PG');
  assert.equal(spec.attributes.finishing, 80);
});

test('runIntake requires at least one badge before letting the loop finish', async () => {
  const prompter = queuePrompter([
    'No Badge Skip Build', '2', '6\'5"', '200 lbs', '6\'8"', 'Scorer',
    '80', '92', '70', '65', '55', '82',
    '',                 // blank on badge #1 -> must be rejected
    'Deadeye', '2',     // now provide one
    '',                 // finish
    '',
    'Scorers',
    'n',
  ]);

  const spec = await runIntake(prompter);
  assert.equal(spec.badges.length, 1);
  assert.equal(spec.badges[0].tier, 'Silver');
});

test('runIntake collects an optional visual identity when opted in', async () => {
  const prompter = queuePrompter([
    'Styled Build', '3', '6\'8"', '215 lbs', '7\'0"', 'Two-way wing',
    '84', '78', '62', '88', '72', '87',
    'Clamps', '4',
    '',
    'Lockdown Defender',
    'Rec players',
    'y',
    'black and neon green',
    '5',
    'muscular build, short taper',
  ]);

  const spec = await runIntake(prompter);
  assert.deepEqual(spec.visualIdentity, {
    jerseyColorway: 'black and neon green',
    number: '5',
    appearanceNotes: 'muscular build, short taper',
  });
});
