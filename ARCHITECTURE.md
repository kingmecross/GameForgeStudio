# Architecture

## Data flow

```
cli.js create                                     cli.js validate --spec <path>
  |                                                  |
  v                                                  v
intake.js#runIntake(prompter)                     buildSpec.js#validateBuildSpec
  |  plain-language Q&A -> build spec object          (same validation, zero cost —
  v                                                     no llmClient, no orchestrator)
writes build-specs/<slug>.json, then falls
straight into the same path as generate -->
                                                   |
cli.js generate --spec <path> | --batch <dir>     |
  |                                                |
  v                                                |
buildSpec.js#loadBuildSpecFile                     |
  |                                                |
  v                                                |
orchestrator.js#generate
  |
  |-- buildSpec.js#validateBuildSpec(spec)
  |     |-- checks spec.game / spec.buildName
  |     |-- dynamically imports src/games/<game>/schema.js
  |     |-- gameModule.validate(spec)          (game-specific field checks)
  |     +-- returns { spec, gameModule }        (gameModule.promptPack used below)
  |
  |-- brandKit.js#loadBrandKit()                 (optional; null if brand-kit.json absent)
  |
  |-- Promise.allSettled over LLM_AGENTS (run concurrently, independent failures,
  |   each wrapped so the logger records start/success/duration/failure):
  |     |-- agents/scriptsAgent.js       -> script-longform.md, scripts-shorts.{md,json}
  |     |-- agents/brandingAgent.js      -> seo.json, thumbnails.{md,json}, captions.{md,json}
  |     |                                    (thumbnails prompt gets the brand kit appended
  |     |                                     when one is loaded)
  |     +-- agents/mediaPromptsAgent.js  -> image-prompts.json, video-prompts.json
  |
  |-- deterministic post-processing (no LLM calls, each independently try/caught so a
  |   bug in one can't lose artifacts the LLM agents already produced):
  |     |-- agents/trendScoringAgent.js#run(spec, artifacts) -> trend-scores.json
  |     |     (heuristic hook/title scoring — see trendScoring.js)
  |     +-- agents/publishingAgent.js#run(spec, artifacts)   -> publish-plan.json
  |           (consolidates seo/captions/shorts already generated into one
  |            per-platform plan; tolerates any of them being missing)
  |
  |-- agents/narrationAgent.js#run(spec, artifacts, { voiceClient }) -> narration.mp3
  |     (OPT-IN — only runs when generate() is called with a voiceClient,
  |      i.e. `generate --narrate`; skipped entirely otherwise since it
  |      spends real ElevenLabs credit on every run, unlike the agents above)
  |
  |-- adds build-spec.json (input snapshot)
  |
  |-- versionWriter.js#claimVersionDir(outputRoot, game, slug, nextVersion(buildDir))
  |     +-- atomically reserves v<N> via a plain (non-recursive) mkdirSync,
  |         retrying N+1 on EEXIST — this, not the nextVersion() guess alone,
  |         is what makes "nothing is ever overwritten" hold under two
  |         concurrent generate() calls for the same build
  |
  |-- adds manifest.json (model, timestamp, per-agent errors, the claimed version)
  |-- adds generation.log (logger.js#toText() — every step above, timestamped)
  |
  v
versionWriter.js#writeVersion(versionDir, artifacts) -> output/<game>/<build-slug>/v<N>/*
```

Version claiming happens right before the write, not up front — the version
number is only ever handed to the run that actually secured the directory.

Every LLM sub-agent receives the same shape: the raw `buildSpec` and
`{ llmClient, promptPack, brandKit }`. `promptPack` (exported by the game
module) carries the game label, terminology list, and fact-guardrail
instructions — this is what stops the LLM from inventing game mechanics that
weren't in the spec. `buildContext.js#describeBuild` renders `buildSpec` +
`promptPack` into the one shared context string every agent's prompt is
built on top of. The two deterministic post-processing agents instead
receive `(buildSpec, artifacts)` — the accumulated output of everything that
ran before them — since they consume generated content rather than
generating their own.

## Module map

| Module | Responsibility |
|---|---|
| `src/cli.js` | Arg parsing (`create`/`generate`/`validate`/`--batch`), wires a real `llmClient` + console logger, calls `orchestrator.generate` |
| `src/intake.js` | `runIntake(prompter)` — plain-language Q&A wizard producing a valid build spec; `createReadlinePrompter()` wraps real stdin/stdout, tests inject a scripted fake |
| `src/orchestrator.js` | Game-agnostic pipeline: validate -> brand kit -> run agents -> merge -> version -> write |
| `src/buildSpec.js` | Loads/parses spec files, dispatches to the right game module, `slugify()` |
| `src/buildContext.js` | Renders `(buildSpec, promptPack)` into one shared prompt-context string |
| `src/brandKit.js` | Optional channel brand-kit loader/validator + `describeBrandKit()` for prompts |
| `src/trendScoring.js` | Pure heuristic hook/title scoring function — no I/O, no LLM |
| `src/logger.js` | `createRunLogger()` — in-memory event log, optional live `onEvent` forwarding |
| `src/llmClient.js` | `@anthropic-ai/sdk` wrapper: `generateText`, `generateStructured`, retry-with-backoff on 429/5xx, injectable underlying client |
| `src/versionWriter.js` | `nextVersion` / `claimVersionDir` (atomic) / `writeVersion` — the only code that touches `output/` |
| `src/games/nba2k27/schema.js` | `validate(spec)` + `promptPack` (gameLabel, terminology, factGuardrails) |
| `src/agents/scriptsAgent.js` | Long-form + Shorts/TikTok scripts (2 LLM calls, run in parallel) |
| `src/agents/brandingAgent.js` | SEO metadata, thumbnail concepts (brand-kit aware), social captions (3 LLM calls in parallel) |
| `src/agents/mediaPromptsAgent.js` | Photo-real image/video prompts via a creator-optimization preflight process (internal 3-concept compare-and-merge, forced technical fields, 9.5/10 creativity+clarity+clickability gate, one bounded retry) — see below |
| `src/agents/trendScoringAgent.js` | Wraps `trendScoring.js` around whatever artifacts exist -> `trend-scores.json` |
| `src/agents/publishingAgent.js` | Consolidates artifacts into a real per-platform `publish-plan.json`, no external API calls |
| `src/agents/narrationAgent.js` | Opt-in — narrates `script-longform.md` via `voiceClient` -> `narration.mp3`; no-op if no voiceClient passed |
| `src/voiceClient.js` | `createVoiceClient({ provider, apiKey, providerModule })` — provider-swappable, same DI shape as `llmClient.js` |
| `src/voice/elevenLabsProvider.js` | ElevenLabs REST call (`text-to-speech/{voiceId}`), injectable `fetchImpl` for tests |

The orchestrator core (`orchestrator.js`, `buildSpec.js`, `buildContext.js`,
`versionWriter.js`, `llmClient.js`, `logger.js`, `brandKit.js`,
`trendScoring.js`) has **zero** game-specific logic. Every NBA 2K27 detail
lives in `src/games/nba2k27/`.

## Media prompt preflight review

`mediaPromptsAgent.js` is the only agent whose output (`image-prompts.json`,
`video-prompts.json`) is meant to be pasted straight into a real generation
tool (Higgsfield), so it runs a heavier process than the other agents:

1. **Internal 3-concept compare-and-merge**: the system prompt instructs the
   model to draft three distinct creative directions per shot (e.g.
   different lighting moods or compositions), weigh them, and merge the
   strongest elements into one final prompt — done via reasoning inside a
   single `generateStructured` call (`thinking: adaptive`), not three
   separate API calls. `conceptsConsidered` in the output is the audit trail
   of what was weighed.
2. **Forced technical completeness**: every shot/clip's schema requires
   `camera`, `lens`, `lighting`, `environment`, `clothing`, `emotion`,
   `motion`, `color`, `composition`, `aspectRatio`, and `exclusions` — the
   model cannot omit a field the way it could with a single freeform prompt
   string.
3. **Simulated result + creator-outcome quality gate + one bounded retry**:
   before scoring, each shot must state `expectedResult` — one or two
   sentences of what a human should actually see if the prompt rendered
   correctly. This is the sanity check that catches a prompt that reads
   fine but describes the wrong outcome. Each shot then self-scores 0-10 on
   three named dimensions tied directly to creator outcomes:
   `creativityScore` (stands out vs. generic), `clarityScore` (unambiguous
   enough to render correctly — this is what protects retention), and
   `clickabilityScore` (would this stop a scroll, especially as a
   thumbnail). A shot only "passes" if **all three** clear 9.5 — the
   weakest dimension decides, not the average (see `scoreShot()`). If any
   shot in the batch doesn't pass, `generateWithQualityGate()` makes exactly
   one more attempt with explicit feedback on which dimension was weak, and
   keeps whichever attempt actually passed more shots (or scored higher on
   its weakest dimension as a tiebreak) — it does not loop further.
   `withReviewSummary()` surfaces `passCount`/`totalCount`/
   `readyForHiggsfield` at the top of the file; a human still reviews
   `readyForHiggsfield: false` output before spending Higgsfield credits on
   it, since no code path here actually calls Higgsfield yet (see
   ROADMAP.md).

This trades a modestly heavier/slower Claude call (plain text, cheap) for
fewer wasted Higgsfield renders (expensive) — the same "verify before
spending generation credits" reasoning applied specifically to this agent.

## Extension points

**Add a new game** (e.g. `madden27`):
1. Create `src/games/madden27/schema.js` exporting `validate(spec)` and a
   `promptPack` (`gameLabel`, `terminology`, `factGuardrails`) — copy the
   nba2k27 module as a template.
2. Register it in `GAME_MODULES` in `buildSpec.js`.
3. Nothing else changes — orchestrator, agents, and versionWriter already
   consume `spec.game` / `promptPack` generically.

**Add a new LLM sub-agent** (e.g. a `thumbnailImageAgent` that also renders
actual thumbnail images, not just concepts):
1. Create `src/agents/<name>.js` exporting `async run(buildSpec, { llmClient, promptPack, brandKit })`
   returning a flat `{ filename: content }` map (string content is written
   as-is; anything else is `JSON.stringify`'d).
2. Add it to `LLM_AGENTS` in `orchestrator.js` — it runs concurrently with
   the others, with failures isolated via `Promise.allSettled`.

**Add a new deterministic post-processing agent** (no LLM call, consumes
what already ran): export `async run(buildSpec, artifacts)`, add it to the
`['name', agentModule]` list alongside `trendScoring`/`publishing` in
`orchestrator.js`. Each is independently try/caught, so write it to tolerate
any referenced artifact being `undefined` (an upstream LLM agent may have
failed).

**Swap the LLM client**: anything satisfying `{ generateText(system, prompt, opts),
generateStructured(system, prompt, schema, opts) }` works — agents never
import `@anthropic-ai/sdk` directly, only `llmClient.js` does. `createLLMClient`
also accepts an injected `client` (anything with `.messages.create`), which
is what `test/llmClient.test.js` uses to test retry behavior without a real
API key.

**Swap the trend scorer**: `trendScoringAgent.js` depends only on
`trendScoring.js#scoreBuildContent`. A real model-backed scorer (e.g.
Higgsfield's virality predictor) can replace that one function without
touching the agent's interface or `orchestrator.js` — see `ROADMAP.md`.

**Add a new voice provider** (e.g. OpenAI TTS): create `src/voice/<name>Provider.js`
exporting `async synthesize(text, { apiKey, voiceId, modelId, fetchImpl }) -> Promise<Buffer>`,
add it to `PROVIDERS` in `voiceClient.js`. `createVoiceClient` also accepts
an injected `providerModule` directly (bypassing the registry), which is
what `test/voiceClient.test.js` uses to test the wiring without a real key.

## Testing

`node --test` (no framework), 84 tests, no network calls, no API key, no
cost:
- `elevenLabsProvider.test.js` injects a fake `fetchImpl` to test the real
  HTTP call shape (headers, body, endpoint URL) without hitting ElevenLabs.
  `voiceClient.test.js` and `narrationAgent.test.js` inject fakes one level
  up (`providerModule` / `voiceClient`) — no test in the suite makes a real
  network call to any provider, Anthropic or ElevenLabs.
- Pure-logic modules (`buildSpec`, schema, `versionWriter`, `brandKit`,
  `trendScoring`, `logger`) are tested directly.
- `intake.test.js` drives `runIntake` with a fake prompter that returns a
  scripted queue of answers — no real stdin/readline stream involved, so
  the wizard's branching (invalid input reprompts, badge loop, optional
  visual identity) is tested deterministically.
- `mediaPromptsAgent.test.js` verifies the quality-gate logic directly (no
  retry when every shot already clears 9.5 on all three dimensions, exactly
  one retry when any dimension is below, keeps whichever attempt actually
  did better, never loops past one retry, and that the weakest dimension —
  not the average — decides pass/fail) plus that every required technical
  and scoring field is present on every shot/clip.
- `llmClient.test.js` injects a fake Anthropic client to test retry/backoff
  behavior (transient vs. non-transient errors, exhausted retries).
- `orchestrator.test.js` mocks `llmClient` and derives a minimal valid fake
  response from each agent's JSON schema (`fakeFromSchema`) so one mock
  satisfies every LLM agent without hand-writing per-agent fixtures.
- `cli.test.js` spawns the real CLI as a child process (`validate`,
  `generate --batch` on an empty dir, usage errors) — these paths never
  reach `createLLMClient()`, so no API key is needed.

Real API verification is a manual `node src/cli.js generate --spec ...` run
with `ANTHROPIC_API_KEY` set.
