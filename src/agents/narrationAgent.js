// Opt-in — only runs when a voiceClient is passed in (generate --narrate).
// Narration costs real, recurring provider credit on every run, unlike the
// other deterministic post-processing agents, so it's never on by default.
const MAX_CHARS = 4500; // conservative per-request length a free/starter TTS tier reliably accepts

function stripMarkdown(md) {
  return md
    .replace(/^#+\s*/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
}

export async function run(buildSpec, artifacts = {}, { voiceClient } = {}) {
  if (!voiceClient) return {};

  const script = artifacts['script-longform.md'];
  if (!script) {
    throw new Error('No script-longform.md available to narrate (the scripts agent must have failed upstream)');
  }

  const text = stripMarkdown(script);
  const truncated = text.length > MAX_CHARS;
  const toNarrate = truncated ? text.slice(0, MAX_CHARS) : text;

  const audio = await voiceClient.synthesize(toNarrate);

  return {
    'narration.mp3': audio,
    ...(truncated
      ? {
          'narration-note.txt':
            `Narrated the first ${MAX_CHARS} of ${text.length} characters — most TTS providers cap request length ` +
            'on free/starter tiers. Full script: script-longform.md.',
        }
      : {}),
  };
}
