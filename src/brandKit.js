import { readFileSync, existsSync } from 'node:fs';

const DEFAULT_PATH = 'brand-kit.json';

// Optional: a channel-level (not per-build) visual identity applied to every
// thumbnail concept so builds share one look. Absent by default — copy
// brand-kit.example.json to brand-kit.json to opt in. See README.md.
export function loadBrandKit(filePath = DEFAULT_PATH) {
  if (!existsSync(filePath)) return null;

  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read brand kit at ${filePath}: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }

  validateBrandKit(parsed, filePath);
  return parsed;
}

function validateBrandKit(kit, filePath) {
  if (typeof kit !== 'object' || kit === null || Array.isArray(kit)) {
    throw new Error(`${filePath} must contain a JSON object`);
  }
  const required = ['channelName', 'colorPalette', 'logoPlacement', 'titleTextStyle'];
  for (const field of required) {
    if (typeof kit[field] !== 'string' || kit[field].trim() === '') {
      throw new Error(`${filePath} is missing a non-empty "${field}"`);
    }
  }
}

export function describeBrandKit(kit) {
  if (!kit) return '';
  return `\n\nChannel brand kit — apply consistently across every thumbnail concept so builds share one visual identity:\nChannel: ${kit.channelName}\nColor palette: ${kit.colorPalette}\nLogo/watermark placement: ${kit.logoPlacement}\nTitle text style: ${kit.titleTextStyle}`;
}
