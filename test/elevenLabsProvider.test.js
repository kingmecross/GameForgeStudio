import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthesize, DEFAULT_VOICE_ID } from '../src/voice/elevenLabsProvider.js';

function fakeFetch({ ok = true, status = 200, statusText = 'OK', body = new Uint8Array([1, 2, 3]).buffer, errorText = '' } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok,
      status,
      statusText,
      arrayBuffer: async () => body,
      text: async () => errorText,
    };
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

test('synthesize throws without an apiKey', async () => {
  await assert.rejects(() => synthesize('hello', {}), /No ELEVENLABS_API_KEY configured/);
});

test('synthesize returns a Buffer on success and hits the default voice endpoint', async () => {
  const fetchImpl = fakeFetch();
  const result = await synthesize('hello world', { apiKey: 'test-key', fetchImpl });
  assert.ok(Buffer.isBuffer(result));
  assert.deepEqual([...result], [1, 2, 3]);
  assert.equal(fetchImpl.calls.length, 1);
  assert.match(fetchImpl.calls[0].url, new RegExp(DEFAULT_VOICE_ID));
  assert.equal(fetchImpl.calls[0].init.headers['xi-api-key'], 'test-key');
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), { text: 'hello world', model_id: 'eleven_multilingual_v2' });
});

test('synthesize uses a custom voiceId and modelId when given', async () => {
  const fetchImpl = fakeFetch();
  await synthesize('hi', { apiKey: 'k', voiceId: 'custom-voice', modelId: 'custom-model', fetchImpl });
  assert.match(fetchImpl.calls[0].url, /custom-voice/);
  assert.equal(JSON.parse(fetchImpl.calls[0].init.body).model_id, 'custom-model');
});

test('synthesize throws with response detail on a non-ok response', async () => {
  const fetchImpl = fakeFetch({ ok: false, status: 401, statusText: 'Unauthorized', errorText: 'invalid_api_key' });
  await assert.rejects(
    () => synthesize('hi', { apiKey: 'bad-key', fetchImpl }),
    /ElevenLabs API error 401 Unauthorized: invalid_api_key/
  );
});
