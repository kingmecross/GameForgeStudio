// The MyUni AI Playbook's brand voice — shared verbatim across every
// agent that writes copy, so builds read as one channel, not one-off styles.
// See PLAYBOOK.md for the full framework this is drawn from.
export const PLAYBOOK_VOICE =
  'Brand voice: confident, clear, high-energy, authentic. Explicitly NOT a generic "urban" aesthetic chased ' +
  'just because the genre is basketball — that reads as a costume, not a voice. Confidence and energy come from ' +
  'substance (real numbers, real tradeoffs stated plainly) and delivery (short sentences, direct address, zero ' +
  'hedging), never from borrowed slang or a performed persona. Talk to the viewer like a peer who already plays ' +
  'the game, not down to them and not at them with marketing copy.';

export function describeBuild(buildSpec, promptPack) {
  return `Game: ${promptPack.gameLabel}
Build name: ${buildSpec.buildName}
Position: ${buildSpec.position}
Height: ${buildSpec.height} | Weight: ${buildSpec.weight} | Wingspan: ${buildSpec.wingspan}
Playstyle: ${buildSpec.playstyle}
Attributes: ${JSON.stringify(buildSpec.attributes)}
Badges: ${buildSpec.badges.map((b) => `${b.name} (${b.tier})`).join(', ')}
Takeovers: ${buildSpec.takeovers.length ? buildSpec.takeovers.join(', ') : 'none specified'}
Target audience: ${buildSpec.targetAudience}${
    buildSpec.visualIdentity ? `\nVisual identity notes: ${JSON.stringify(buildSpec.visualIdentity)}` : ''
  }`;
}
