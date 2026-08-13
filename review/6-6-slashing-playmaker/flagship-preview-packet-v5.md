# Flagship Preview Packet — 6'6 Slashing Playmaker (v5, playbook-applied)

**PREVIEW ONLY.** Text/scripts/metadata below are real (generated via
`v5`, already quality-gated). Images are not — those still route through
`asset-contact-sheet.md`'s approval-first process. Full files:
`output/nba2k27/6-6-slashing-playmaker/v5/`.

## What this video will be

A 3-5 minute build breakdown that opens on a tension hook ("everybody's
building a shooter or a lockdown big, and then they get switched onto a
downhill guard and just melt"), walks the attribute/badge/takeover
reasoning in order of what actually carries the build, states the
defense/rebounding tradeoff plainly instead of hiding it, ties everything
into one memorable in-game "loop" line before the CTA, and closes with an
invitation to replicate it — not just to subscribe.

## Why it should perform (playbook alignment, not guesswork)

- **Hook pattern**: contradiction/tension ("everybody's doing X, then Y
  happens") — the strongest of the 3 patterns in `PLAYBOOK.md`, and named
  in the hook itself is the exact frustration (getting switch-hunted) this
  build solves.
- **Retention beat discipline**: every section opens on a new number or
  badge name, never a restatement — verified by reading the actual v5
  script (see excerpt below).
- **The "loop" line** (new in this version): *"Break your man down with
  the 90 Playmaking and Quick First Step, get downhill into Slasher
  takeover where 88 Finishing and Hall of Fame Downhill finish through the
  contact — and when the help rotates, you either lob it up for the Aerial
  Wizard oop or kick it out and knock down the Deadeye three."* This is the
  single sentence a viewer should remember after the video ends — didn't
  exist in the pre-playbook version.
- **Brand voice check**: no forced slang, no "urban" costume — reads like
  a confident creator who knows the numbers, not a performed persona.
- **Thumbnail psychology applied**: all 3 concepts below now explicitly
  reason about frame-fill percentage, information gap, and 120px
  readability (they didn't before this update) — see `thumbnails.json`.

## Honest caveat — the heuristic scorer disagrees with me here, and that's worth showing

`trend-scores.json` gives the long-form opening line only 60/100, flagged
"opening line may run long for a fast hook." That's a real limitation of
the heuristic (`trendScoring.js` measures character length and pattern
hits, it doesn't understand that a longer sentence can still be a strong
hook when the tension is genuinely compelling). I'm not hiding a low
number to make this look better than it is — flagging the disagreement
explicitly, per the deliverable self-review standard.

## Top thumbnail concept

**"6'6 PG DOES EVERYTHING"** — mid-poster-dunk, player fills ~50% of frame
right side, low upward camera angle, crimson rim-light separation,
left-third open for bold overlay text, blurred defender/rim implies the
highlight without showing the finish (the information-gap principle in
practice). Two more concepts in `thumbnails.json`.

## Top title (heuristic: 85/100, tied for highest)

"This 6'6 PG Build Does It All in NBA 2K27 (Slashing Playmaker)" — under
the 70-char truncation point, concrete number, high-intent keyword.

## Shorts hooks (all 3, all tension/stakes-pattern)

1. "Everybody's building a 6'6 shooter, and then they get switched onto a
   downhill guard and just melt."
2. "You want one build for day one, not five specialists you keep
   re-making."
3. "Downhill on Hall of Fame is wasted if you drive into a set defense —
   here's how to actually use it."

## Status

Text pack: done, real, quality-gated (`v5/manifest.json` — zero agent
failures). Images: still pending your approval on `asset-contact-sheet.md`
before anything renders. Voice narration: available via `--narrate` once a
real ElevenLabs key is in place (see next message).
