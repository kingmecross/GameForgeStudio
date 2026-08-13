const API_BASE = 'https://api.elevenlabs.io/v1';

// "Rachel" — ElevenLabs' standard public demo voice ID, available on every
// account without any per-voice setup. Fine as a default; swap via voiceId.
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
export const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

export async function synthesize(text, { apiKey, voiceId = DEFAULT_VOICE_ID, modelId = DEFAULT_MODEL_ID, fetchImpl = fetch } = {}) {
  if (!apiKey) {
    throw new Error(
      'No ELEVENLABS_API_KEY configured. Get a key from https://elevenlabs.io/ (profile icon top-right > API keys) ' +
      'and set it as a persistent environment variable named ELEVENLABS_API_KEY.'
    );
  }

  const response = await fetchImpl(`${API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({ text, model_id: modelId }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`ElevenLabs API error ${response.status} ${response.statusText}: ${detail}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
