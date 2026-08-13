# Roadmap

## v1 — shipped (current, hardened, first creator workflow live)

Single-game (NBA 2K27) content generator, hardened for production use after
a full code review + gap audit, now with a real non-technical entry point.

**Voice narration (opt-in):**
- `node src/cli.js narrate` (standalone) or `generate --narrate` (pipeline) —
  ElevenLabs text-to-speech narrates `script-longform.md` into
  `narration.mp3`. Provider-swappable design (`src/voiceClient.js` +
  `src/voice/`) — ElevenLabs is the first provider, not the only one by
  design. Opt-in, not default-on: unlike the Claude-side generators this
  spends real, recurring provider credit on every run.

**Creator workflow:**
- `npm run create` — a plain-language intake wizard (`src/intake.js`) walks
  through position, height/weight/wingspan, playstyle, attribute ratings,
  badges, takeovers, and target audience with no JSON editing, saves the
  spec to `build-specs/`, and immediately generates the full content
  package — one command, end to end. See `USER-GUIDE.md`.
- 5 example builds (`build-specs/examples/`, one per position) generated
  through the real pipeline to prove the flow — clearly illustrative, not
  claimed as official 2K27 data.

**Core pipeline:**
- Build spec in, full content package out: long-form script, Shorts/TikTok
  scripts, SEO metadata, thumbnail concepts, social captions, image prompts,
  video-clip prompts (Higgsfield-ready, with scene/camera/audio notes).
- Versioned output (`output/<game>/<slug>/v1`, `v2`, ...) — version
  directories are claimed atomically (`claimVersionDir`), so nothing is ever
  overwritten even if two `generate()` calls for the same build happen to
  race each other.
- Orchestrator delegates to 3 concurrent LLM sub-agents (scripts, branding,
  media prompts) plus 2 deterministic post-processing agents (trend scoring,
  publishing); any single agent failing doesn't lose the rest of the run
  (`manifest.json` records which ones failed and why, with the actual error
  message preserved even when it's an empty string).
- Fact guardrails: the LLM is instructed to only state build details that
  are actually in the build spec, not invent 2K27 mechanics.
- Transient API failures (429 rate limits, 5xx) are retried automatically
  with exponential backoff; non-transient failures fail fast.

**Production hardening additions:**
- `generation.log` — a timestamped log of every step in a run, saved
  alongside the other artifacts and streamed live to the console.
- `node src/cli.js validate --spec <path>` — checks a build spec with zero
  API cost, for fast iteration before spending anything.
- `node src/cli.js generate --batch <dir>` — sequentially generates every
  build spec in a directory in one command (predictable cost/rate, not
  parallel spend).
- **Brand kit** (`brand-kit.json`, optional) — a channel-level visual
  identity (colors, logo placement, title-text style) that every build's
  thumbnail concepts apply consistently, so builds look like one channel
  instead of independently-styled one-offs. Prompt-level only — no image
  rendering, no added cost.
- **Trend scoring** (`trend-scores.json`) — a heuristic (pattern-matching,
  not ML) score of hook strength and title clickability, applied to every
  generated script/title. Zero cost, zero external dependency, clearly
  labeled as heuristic so it isn't mistaken for a real prediction.
- **Full publish pack** — `publishingAgent` now actually consolidates
  everything already generated (titles, description, tags, captions, shorts
  hooks/scripts) into one real per-platform `publish-plan.json` with a
  suggested posting order, instead of a bare "not implemented" stub.
- Full `node --test` coverage (55 tests) against a mocked/injectable LLM
  client — no API key or spend required, including black-box CLI tests.

**Known v1 limitations:**
- No image/video rendering itself — only the *prompts* for it, and the
  brand kit only shapes prompts, it doesn't render a thumbnail. You still
  run those prompts through Higgsfield (or whatever generator) by hand.
- No actual publishing — `publish-plan.json` is drop-in ready to post from
  manually, but nothing in GameForge Studio calls a platform API.
- Trend scoring is a deterministic heuristic, not a real virality model —
  useful as a relative signal across your own builds, not an absolute
  prediction.
- One game (nba2k27) — a second game module hasn't been built yet to prove
  the "just add a schema file" claim in practice.
- NBA 2K27's real MyPLAYER pie-chart/attribute system isn't public yet as
  of this writing (full reveal expected August 18, 2026) — build specs are
  only as accurate as what you feed them; see README's accuracy note.

## v2 — next

Goal: close the loop from "prompts" to "posted", upgrade the heuristic
trend scorer to a real model, and prove the module boundary holds for a
second game. Every item here needs a credential and/or spends real money —
none of it ships without that explicit decision.

- **Real publishing integration**: replace `publishingAgent`'s
  content-consolidation with actual posting calls — reuse ClipBot's
  existing YouTube OAuth (`googleapis`) pattern for YouTube/Shorts, add
  TikTok posting. Interface stays close to today's (`run(spec, artifacts) ->
  { filename: content }`), so `orchestrator.js` barely changes.
- **Real trend/virality scoring**: swap `trendScoring.js#scoreBuildContent`
  for a call to Higgsfield's virality predictor (or similar) — requires a
  Higgsfield API credential and spends real credits per run. The heuristic
  stays as a free fallback when that credential isn't configured.
- **Thumbnail/video rendering**: optionally pipe `image-prompts.json` /
  `video-prompts.json` straight into Higgsfield's generators instead of
  leaving that as a manual step, saving the resulting asset paths (or files)
  into the version folder — spends real image/video-gen credits per run, so
  this stays opt-in (e.g. a `--render` flag), never the default.
- **Second game module** (e.g. Madden or College Football) purely to
  pressure-test that "add a game" really only means adding
  `src/games/<game>/schema.js` — no orchestrator/agent changes. If it
  requires touching core files, that's a v1 architecture bug to fix.
- **Re-run against the real August 18, 2026 MyPLAYER reveal**: once the
  actual pie-chart/archetype/cap system is public, refresh
  `build-specs/example-nba2k27.json` and the nba2k27 `promptPack`
  terminology with confirmed details.

## v3 — later

Goal: go from "one creator runs one command" to a system that helps pick
*what* to build, not just how to describe it.

- **Meta-build research agent**: a research step (reusing the deep-research
  pattern already used to scope this project) that proposes candidate build
  specs from confirmed patch notes / community data, instead of the creator
  hand-writing every attribute.
- **Analytics feedback loop**: once v2 publishing is live, pull back
  view/engagement data per build and feed it into future SEO/hook
  generation *and* into calibrating the trend scorer against what actually
  performed — favor angles that actually worked, not just heuristically
  hooky ones.
- **Multi-version diffing**: a `compare` CLI command that diffs two versions
  of the same build's generated content side by side.
- **Concurrent batch mode**: once real posting (v2) exists, revisit whether
  `--batch` should run with bounded concurrency instead of strictly
  sequential — only worth it once there's a real cost/rate-limit model to
  tune against.
