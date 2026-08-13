import { readFileSync } from 'node:fs';

const GAME_MODULES = {
  nba2k27: () => import('./games/nba2k27/schema.js'),
};

export function availableGames() {
  return Object.keys(GAME_MODULES);
}

export function loadBuildSpecFile(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read build spec at ${filePath}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

export async function validateBuildSpec(spec) {
  if (typeof spec !== 'object' || spec === null || Array.isArray(spec)) {
    throw new Error('Build spec must be a JSON object');
  }
  const { game, buildName } = spec;
  if (typeof game !== 'string' || !(game in GAME_MODULES)) {
    throw new Error(`Build spec "game" must be one of: ${availableGames().join(', ')}`);
  }
  if (typeof buildName !== 'string' || buildName.trim() === '') {
    throw new Error('Build spec is missing a non-empty "buildName"');
  }
  const gameModule = await GAME_MODULES[game]();
  gameModule.validate(spec);
  return { spec, gameModule };
}

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
