import path from 'node:path';
import { validateBuildSpec, slugify } from './buildSpec.js';
import { nextVersion, claimVersionDir, writeVersion } from './versionWriter.js';
import { MODEL } from './llmClient.js';
import { loadBrandKit } from './brandKit.js';
import { createRunLogger } from './logger.js';
import * as scriptsAgent from './agents/scriptsAgent.js';
import * as brandingAgent from './agents/brandingAgent.js';
import * as mediaPromptsAgent from './agents/mediaPromptsAgent.js';
import * as trendScoringAgent from './agents/trendScoringAgent.js';
import * as publishingAgent from './agents/publishingAgent.js';
import * as narrationAgent from './agents/narrationAgent.js';

// Sub-agents that need the LLM run concurrently; a failure in one does not
// abort the others (Promise.allSettled) or the run — it's recorded in the
// manifest so a partial generation still produces every artifact it could.
const LLM_AGENTS = [
  ['scripts', scriptsAgent],
  ['branding', brandingAgent],
  ['mediaPrompts', mediaPromptsAgent],
];

function reasonMessage(reason) {
  return reason instanceof Error ? reason.message : String(reason);
}

export async function generate(rawSpec, { llmClient, outputRoot = 'output', logger = createRunLogger(), brandKitPath, voiceClient } = {}) {
  const { spec, gameModule } = await validateBuildSpec(rawSpec);
  logger.info('build spec validated', { game: spec.game, buildName: spec.buildName });

  const promptPack = gameModule.promptPack;
  const slug = slugify(spec.buildName);
  const buildDir = path.join(outputRoot, spec.game, slug);

  const brandKit = loadBrandKit(brandKitPath);
  logger.info(brandKit ? 'brand kit loaded' : 'no brand kit found — thumbnails will use a per-build invented style', {
    ...(brandKit ? { channelName: brandKit.channelName } : {}),
  });

  const settled = await Promise.allSettled(
    LLM_AGENTS.map(([name, agent]) => {
      logger.info(`agent:${name} started`);
      const startedAt = Date.now();
      return agent.run(spec, { llmClient, promptPack, brandKit }).then(
        (result) => {
          logger.info(`agent:${name} succeeded`, { durationMs: Date.now() - startedAt });
          return result;
        },
        (err) => {
          logger.warn(`agent:${name} failed`, { durationMs: Date.now() - startedAt, error: reasonMessage(err) });
          throw err;
        }
      );
    })
  );

  const artifacts = {};
  const errors = {};
  settled.forEach((result, i) => {
    const [name] = LLM_AGENTS[i];
    if (result.status === 'fulfilled') {
      Object.assign(artifacts, result.value);
    } else {
      errors[name] = reasonMessage(result.reason);
    }
  });

  // Deterministic post-processing — no LLM calls, always attempted, consumes
  // whatever the LLM agents above produced (each tolerates missing fields
  // from a partial failure). Wrapped individually so a bug in one doesn't
  // lose artifacts the LLM agents already produced successfully.
  for (const [name, agent] of [['trendScoring', trendScoringAgent], ['publishing', publishingAgent]]) {
    try {
      Object.assign(artifacts, await agent.run(spec, artifacts));
      logger.info(`agent:${name} succeeded`);
    } catch (err) {
      errors[name] = reasonMessage(err);
      logger.warn(`agent:${name} failed`, { error: errors[name] });
    }
  }

  // Opt-in — only runs when a voiceClient was passed (generate --narrate),
  // since unlike the agents above it spends real, recurring provider credit.
  if (voiceClient) {
    try {
      Object.assign(artifacts, await narrationAgent.run(spec, artifacts, { voiceClient }));
      logger.info('agent:narration succeeded');
    } catch (err) {
      errors.narration = reasonMessage(err);
      logger.warn('agent:narration failed', { error: errors.narration });
    }
  }

  artifacts['build-spec.json'] = spec;

  // Claimed right before writing, not up front, so the version number is
  // only ever handed to the run that actually secures the directory — see
  // versionWriter.js#claimVersionDir.
  const { version, versionDir } = claimVersionDir(outputRoot, spec.game, slug, nextVersion(buildDir));
  logger.info('version claimed', { version, versionDir });

  artifacts['manifest.json'] = {
    game: spec.game,
    buildName: spec.buildName,
    slug,
    version,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    errors: Object.keys(errors).length ? errors : undefined,
  };

  artifacts['generation.log'] = logger.toText();

  writeVersion(versionDir, artifacts);
  logger.info('artifacts written', { versionDir, fileCount: Object.keys(artifacts).length });

  return { versionDir, version, errors, artifacts };
}
