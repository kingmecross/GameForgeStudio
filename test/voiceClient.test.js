import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceClient, availableProviders } from '../src/voiceClient.js';

test('availableProviders lists elevenlabs', () => {
  assert.deepEqual(availableProviders(), ['elevenlabs']);
});

test('createVoiceClient throws for an unknown provider', () => {
  assert.throws(() => createVoiceClient({ provider: 'nonexistent' }), /Unknown voice provider "nonexistent"/);
});

test('createVoiceClient delegates to an injected providerModule (no real API call)', async () => {
  const calls = [];
  const providerModule = {
    synthesize: async (text, opts) => {
      calls.push({ text, opts });
      return Buffer.from('fake audio');
    },
  };
  const client = createVoiceClient({ providerModule, apiKey: 'k', voiceId: 'v1', modelId: 'm1' });
  const result = await client.synthesize('narrate this');
  assert.ok(Buffer.isBuffer(result));
  assert.equal(result.toString(), 'fake audio');
  assert.equal(calls[0].text, 'narrate this');
  assert.equal(calls[0].opts.apiKey, 'k');
  assert.equal(calls[0].opts.voiceId, 'v1');
  assert.equal(calls[0].opts.modelId, 'm1');
});

test('per-call opts override the client defaults', async () => {
  const calls = [];
  const providerModule = { synthesize: async (text, opts) => { calls.push(opts); return Buffer.from(''); } };
  const client = createVoiceClient({ providerModule, apiKey: 'k', voiceId: 'default-voice' });
  await client.synthesize('hi', { voiceId: 'override-voice' });
  assert.equal(calls[0].voiceId, 'override-voice');
});

test('client.provider reports which provider name was selected', () => {
  const client = createVoiceClient({ providerModule: { synthesize: async () => Buffer.from('') }, provider: 'elevenlabs' });
  assert.equal(client.provider, 'elevenlabs');
});
