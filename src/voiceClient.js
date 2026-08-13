import * as elevenLabsProvider from './voice/elevenLabsProvider.js';

// Modular by design: PROVIDERS maps a name to a module exposing
// synthesize(text, { apiKey, voiceId, modelId, fetchImpl }) -> Promise<Buffer>.
// Adding a second provider (e.g. openai-tts) is adding one more module here —
// nothing else in the pipeline needs to change since callers only see
// voiceClient's synthesize(text, opts).
const PROVIDERS = {
  elevenlabs: elevenLabsProvider,
};

export function availableProviders() {
  return Object.keys(PROVIDERS);
}

export function createVoiceClient({
  provider = 'elevenlabs',
  apiKey = process.env.ELEVENLABS_API_KEY,
  providerModule,
  voiceId,
  modelId,
  fetchImpl,
} = {}) {
  const mod = providerModule || PROVIDERS[provider];
  if (!mod) {
    throw new Error(`Unknown voice provider "${provider}". Available: ${availableProviders().join(', ')}`);
  }

  async function synthesize(text, opts = {}) {
    return mod.synthesize(text, { apiKey, voiceId, modelId, fetchImpl, ...opts });
  }

  return { synthesize, provider };
}
