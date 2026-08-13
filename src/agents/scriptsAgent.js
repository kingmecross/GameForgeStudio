import { describeBuild, PLAYBOOK_VOICE } from '../buildContext.js';

const SHORTS_SCHEMA = {
  type: 'object',
  properties: {
    clips: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['YouTube Shorts', 'TikTok'] },
          hook: { type: 'string' },
          script: { type: 'string' },
          durationSec: { type: 'integer' },
        },
        required: ['platform', 'hook', 'script', 'durationSec'],
        additionalProperties: false,
      },
    },
  },
  required: ['clips'],
  additionalProperties: false,
};

function renderShortsMarkdown(shorts) {
  return shorts.clips
    .map((c, i) => `## Clip ${i + 1} — ${c.platform} (${c.durationSec}s)\n\n**Hook:** ${c.hook}\n\n${c.script}`)
    .join('\n\n---\n\n');
}

export async function run(buildSpec, { llmClient, promptPack }) {
  const context = describeBuild(buildSpec, promptPack);
  const system =
    `You write YouTube content scripts for a gaming creator focused on ${promptPack.gameLabel} MyPlayer builds. ` +
    `${promptPack.factGuardrails} Write for creators, not marketers — concrete and specific, no generic hype filler ` +
    `like "this build is insane" without backing it up with the actual attributes/badges. The audience cares about ` +
    `the build itself, not the game in general. ${PLAYBOOK_VOICE} Open with one of: a contradiction/tension hook ` +
    '("everybody\'s building X, and then Y happens"), a direct capability claim anchored to a real number, or a ' +
    'second-person stakes question naming the actual tradeoff — never open with the game name, a greeting, or ' +
    '"in this video." Pace for retention: every ~30-45 seconds needs a new concrete fact (a number, a badge name, ' +
    'a specific interaction) in the first sentence — never restate the previous beat in different words. Follow ' +
    'the emotional arc confidence (hook) -> tension (the real tradeoff named) -> resolution (why this build ' +
    'solves it) -> payoff (the highlight moment) -> invitation (go build it), not just facts in spec order.';

  const [longForm, shorts] = await Promise.all([
    llmClient.generateText(
      system,
      `${context}\n\nWrite a long-form YouTube video script (spoken, aim for 3-5 minutes of runtime) that showcases ` +
        'this build. Structure: a hook in the first 10 seconds, a full build breakdown (position/height/weight/wingspan/' +
        'attributes/badges/takeover and WHY each choice matters for this playstyle, leading with whichever attribute ' +
        'carries the build), a section discussing the game mechanics this build depends on (using only what\'s in the ' +
        'build spec), one sentence that ties attributes+badges+takeovers into a single repeatable in-game loop (the ' +
        'thing a viewer remembers after the video ends), and a closing call-to-action inviting viewers to try the ' +
        'build themselves. Output as clean markdown with section headers. No stage directions or production notes — ' +
        'just the words the creator will say.'
    ),
    llmClient.generateStructured(
      system,
      `${context}\n\nWrite 3 short-form video scripts (YouTube Shorts / TikTok, 30-60 seconds each) that each pitch a ` +
        'different angle on this same build: one built around the strongest hook/attention-grabber, one around "why ' +
        'this build" reasoning, and one around a mechanics/tips angle relevant to this build.',
      SHORTS_SCHEMA
    ),
  ]);

  return {
    'script-longform.md': longForm,
    'scripts-shorts.json': shorts,
    'scripts-shorts.md': renderShortsMarkdown(shorts),
  };
}
