import { mkdirSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export function nextVersion(buildDir) {
  if (!existsSync(buildDir)) return 1;
  const versions = readdirSync(buildDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name))
    .map((entry) => Number(entry.name.slice(1)));
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

// Atomically reserves a version directory. Plain `mkdirSync` (no `recursive`)
// fails with EEXIST if the directory already exists, so whichever concurrent
// generate() call wins the mkdir keeps that version number and the loser
// retries the next one — this is what actually guarantees "nothing is ever
// overwritten" under concurrent runs, unlike a separate check-then-act step.
// `startAt` (from nextVersion) is just an optimistic guess to avoid retrying
// from v1 every time; it doesn't need to be correct.
export function claimVersionDir(outputRoot, game, slug, startAt) {
  const buildDir = path.join(outputRoot, game, slug);
  mkdirSync(buildDir, { recursive: true });
  for (let version = startAt; ; version++) {
    const versionDir = path.join(buildDir, `v${version}`);
    try {
      mkdirSync(versionDir);
      return { version, versionDir };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
}

export function writeVersion(versionDir, artifacts) {
  for (const [filename, content] of Object.entries(artifacts)) {
    const filePath = path.join(versionDir, filename);
    if (Buffer.isBuffer(content)) {
      writeFileSync(filePath, content);
    } else {
      const body = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      writeFileSync(filePath, body, 'utf8');
    }
  }
  return versionDir;
}
