const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export function validate(spec) {
  const required = [
    'position', 'height', 'weight', 'wingspan', 'playstyle',
    'attributes', 'badges', 'takeovers', 'targetAudience',
  ];
  for (const field of required) {
    if (!(field in spec)) {
      throw new Error(`nba2k27 build spec is missing required field "${field}"`);
    }
  }

  if (!POSITIONS.includes(spec.position)) {
    throw new Error(`nba2k27 build spec "position" must be one of: ${POSITIONS.join(', ')}`);
  }
  for (const field of ['height', 'weight', 'wingspan', 'playstyle', 'targetAudience']) {
    if (typeof spec[field] !== 'string' || spec[field].trim() === '') {
      throw new Error(`nba2k27 build spec "${field}" must be a non-empty string`);
    }
  }

  if (typeof spec.attributes !== 'object' || spec.attributes === null || Array.isArray(spec.attributes)) {
    throw new Error('nba2k27 build spec "attributes" must be an object mapping attribute name to value');
  }
  if (Object.keys(spec.attributes).length === 0) {
    throw new Error('nba2k27 build spec "attributes" must have at least one entry');
  }

  if (!Array.isArray(spec.badges) || spec.badges.length === 0) {
    throw new Error('nba2k27 build spec "badges" must be a non-empty array');
  }
  spec.badges.forEach((badge, i) => {
    if (typeof badge !== 'object' || badge === null || typeof badge.name !== 'string' || typeof badge.tier !== 'string') {
      throw new Error(`nba2k27 build spec badges[${i}] must be an object with "name" and "tier" strings`);
    }
  });

  if (!Array.isArray(spec.takeovers)) {
    throw new Error('nba2k27 build spec "takeovers" must be an array of strings');
  }

  if (spec.visualIdentity !== undefined) {
    if (typeof spec.visualIdentity !== 'object' || spec.visualIdentity === null) {
      throw new Error('nba2k27 build spec "visualIdentity", if present, must be an object');
    }
  }
}

export const promptPack = {
  gameLabel: 'NBA 2K27',
  terminology: [
    'MyPlayer builder', 'attribute pie chart', 'Park', 'Rec', 'The City',
    'badges', 'Cap Breakers', 'takeover', 'archetype', 'wingspan', 'contact dunk',
  ],
  factGuardrails:
    'Only state NBA 2K27 mechanics, numbers, or features that are explicitly given in the build spec below. ' +
    'Do not invent specific attribute caps, badge counts, patch notes, or release-date claims that were not ' +
    "provided — if the build spec doesn't specify something, speak in general terms (\"the builder\", \"badges\") " +
    'rather than making up a number or citing a mechanic as confirmed when it is not in the input.',
};
