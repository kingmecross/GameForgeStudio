# GameForge Studio

Turns a structured game-build spec into a full YouTube/Shorts/TikTok content
package: scripts, thumbnail concepts, SEO metadata, social captions,
photo-realistic image/video generation prompts, a heuristic trend score, and
a consolidated per-platform publish plan — versioned and saved to disk.

First game supported: **NBA 2K27 MyPlayer builds**. The orchestrator core has
no game-specific logic, so adding a second game later is a matter of adding a
new `src/games/<game>/` module — see `ARCHITECTURE.md`.

Not a developer? Use **`USER-GUIDE.md`** instead — plain-language, no code,
no JSON editing, one command.

## One-time setup

1. `npm install`
2. Get a Claude API key from https://console.anthropic.com/ (Settings → API Keys).
3. Set it as a persistent environment variable named `ANTHROPIC_API_KEY`
   (Windows: System Properties → Environment Variables, so it's available
   outside just the current terminal). This is the only thing that costs
   money — a few cents per full generation run.
4. Optional: copy `brand-kit.example.json` to `brand-kit.json` and fill in
   your channel's colors/logo placement/title style so every build's
   thumbnail concepts share one visual identity. Skip this and thumbnails
   just get a per-build invented style instead — no error either way.
5. Optional: for AI voice narration, get a key from https://elevenlabs.io/
   (profile icon top-right → API keys) and set it as `ELEVENLABS_API_KEY`
   the same way as step 3. Only needed if you use `--narrate` or
   `node src/cli.js narrate` — everything else works without it.

## Quick start

The fastest path — an interactive wizard that asks plain-language questions
and generates the full package when you're done, no JSON editing required:

```
npm run create
```

For the scripted/developer path — validate a build spec for free before
spending anything on it:

```
node src/cli.js validate --spec build-specs/example-nba2k27.json
```

Then generate the real content package:

```
node src/cli.js generate --spec build-specs/example-nba2k27.json
```

This validates the build spec, runs the script/branding/media-prompt
generators, scores the result with the heuristic trend scorer, builds a
publish plan, and writes everything to `output/nba2k27/<build-slug>/v1/`
(`v2`, `v3`, ... on re-runs — nothing is ever overwritten, even if two
generations for the same build happen to run at the same time). Progress
prints live to the console as each step completes, and the same log is saved
as `generation.log` in the version folder. Check `manifest.json` for what
model generated it, when, and whether any individual generator failed (a
partial failure still writes everything that succeeded).

## Batch generation

Generate every build spec in a directory in one command:

```
node src/cli.js generate --batch build-specs/
```

Runs sequentially (not concurrently) so cost and API rate limits stay
predictable — each spec's success/failure is reported as it finishes, and
the command exits non-zero if any of them had a failed generator.

## Voice narration (optional)

Requires `ELEVENLABS_API_KEY` (see setup step 5). Test the connection on its own:

```
node src/cli.js narrate --text "Hello, this is a test." --out output/test-narration.mp3
node src/cli.js narrate --file output/nba2k27/<slug>/v1/script-longform.md --out output/test-narration.mp3
```

Or generate narration as part of a build (writes `narration.mp3` into the
version folder alongside everything else):

```
node src/cli.js generate --spec build-specs/example-nba2k27.json --narrate
```

Narration is **opt-in**, not on by default — unlike the Claude-side
generators, every narration costs real ElevenLabs credit on every run, so it
only happens when you explicitly pass `--narrate`. It narrates
`script-longform.md` (Markdown stripped), truncated to the first ~4500
characters if longer, since most ElevenLabs tiers cap request length — a
`narration-note.txt` gets added alongside it when that happens. Built with a
provider-swappable design (`src/voiceClient.js` + `src/voice/`) — ElevenLabs
is the first provider, adding another is one more module, not a rewrite.

## Writing your own build spec

Either run `npm run create` (see Quick start above) and let the wizard build
the file for you, or copy `build-specs/example-nba2k27.json` and edit the
fields by hand. Required for
`nba2k27`: `position`, `height`, `weight`, `wingspan`, `playstyle`,
`attributes`, `badges` (name + tier), `takeovers`, `targetAudience`. Optional:
`visualIdentity` (jersey colorway, number, appearance notes) to pin down the
player's look in the image/video prompts — if omitted, the model invents one
consistent look and reuses it across every prompt in that run.

**Accuracy note:** GameForge Studio only writes what you put in the build spec —
it does not know NBA 2K27's real mechanics and is explicitly instructed not
to invent attribute caps, badge counts, or patch details that aren't in your
spec. Feed it a build spec grounded in whatever's actually confirmed about
the game (official reveal materials, patch notes, etc.) rather than guesses.

## Day to day

- Re-run `generate` on the same `buildName` to produce a new version without
  touching the old one.
- `output/<game>/<slug>/vN/` always contains: `script-longform.md`,
  `scripts-shorts.{md,json}`, `seo.json`, `thumbnails.{md,json}`,
  `captions.{md,json}`, `image-prompts.json`, `video-prompts.json`,
  `trend-scores.json`, `publish-plan.json`, `build-spec.json` (input
  snapshot), `manifest.json`, `generation.log`.
- `image-prompts.json` / `video-prompts.json` go through creator-optimization
  preflight review before you ever see them: the model internally drafts
  three creative concepts per shot, merges the best of each, and every
  prompt must specify camera/lens/lighting/environment/clothing/emotion/
  motion/color/composition/aspect ratio/exclusions plus a simulated
  `expectedResult` (what you should actually see if it renders correctly).
  Each shot is then scored 0-10 on **creativityScore** (does it stand out),
  **clarityScore** (is it unambiguous enough to render correctly), and
  **clickabilityScore** (would it stop a scroll) — all three must hit 9.5+
  or it gets one automatic retry. Check `readyForHiggsfield` at the top of
  either file before spending Higgsfield credits on it.
- `publish-plan.json` consolidates everything already generated into one
  per-platform plan (title/description/tags/captions/hooks mapped to
  YouTube, Shorts, TikTok, Reels, X, plus a suggested posting order) — it's
  drop-in ready to post from manually. It does not call any platform API
  itself and doesn't render actual thumbnail/video files; see `ROADMAP.md`.
- `trend-scores.json` is a **heuristic** hook/title score (pattern-matching,
  not a real virality model) — useful as a relative signal across your own
  builds, not an absolute prediction. A real Higgsfield-backed predictor is
  a v2 upgrade; see `ROADMAP.md`.
- Transient API failures (rate limits, 5xx) are retried automatically with
  backoff; anything else fails fast and is recorded per-agent in
  `manifest.json` rather than aborting the whole run.

## Tests

`npm test` runs the full suite (84 tests) with `node --test` against a mocked
LLM client and an injectable Anthropic client — no API key, network access,
or spend required for any of it, including the CLI's `validate`/`generate
--batch` black-box tests. See `ARCHITECTURE.md` and `ROADMAP.md` for the
module map and what's next.
