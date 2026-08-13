import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/agents/narrationAgent.js';

const BUILD_SPEC = { buildName: 'Test Build' };

function fakeVoiceClient(impl) {
  return { synthesize: impl || (async (text) => Buffer.from(`AUDIO:${text}`)) };
}

test('run returns nothing when no voiceClient is provided (opt-in, default off)', async () => {
  const result = await run(BUILD_SPEC, { 'script-longform.md': '# Hook\nSome script text.' }, {});
  assert.deepEqual(result, {});
});

test('run throws when the script is missing (upstream scripts agent failed)', async () => {
  await assert.rejects(
    () => run(BUILD_SPEC, {}, { voiceClient: fakeVoiceClient() }),
    /No script-longform.md available to narrate/
  );
});

test('run strips markdown headers/bold before narrating', async () => {
  let narrated;
  const voiceClient = fakeVoiceClient(async (text) => { narrated = text; return Buffer.from('audio'); });
  await run(BUILD_SPEC, { 'script-longform.md': '# Hook\nThis is **bold** and *italic*.' }, { voiceClient });
  assert.equal(narrated, 'Hook\nThis is bold and italic.');
});

test('run returns narration.mp3 as a Buffer for a normal-length script', async () => {
  const voiceClient = fakeVoiceClient();
  const result = await run(BUILD_SPEC, { 'script-longform.md': 'Short script.' }, { voiceClient });
  assert.ok(Buffer.isBuffer(result['narration.mp3']));
  assert.equal(result['narration-note.txt'], undefined);
});

test('run truncates an overlong script and adds an explanatory note', async () => {
  const longScript = 'x'.repeat(6000);
  let narratedLength;
  const voiceClient = fakeVoiceClient(async (text) => { narratedLength = text.length; return Buffer.from('audio'); });
  const result = await run(BUILD_SPEC, { 'script-longform.md': longScript }, { voiceClient });
  assert.equal(narratedLength, 4500);
  assert.match(result['narration-note.txt'], /Narrated the first 4500 of 6000 characters/);
});
