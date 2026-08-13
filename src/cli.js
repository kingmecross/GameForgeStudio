import { readdirSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { generate } from './orchestrator.js';
import { loadBuildSpecFile, validateBuildSpec, slugify } from './buildSpec.js';
import { createLLMClient } from './llmClient.js';
import { createVoiceClient } from './voiceClient.js';
import { createRunLogger } from './logger.js';
import { createReadlinePrompter, runIntake } from './intake.js';

function usage() {
  console.log(`Usage:
  node src/cli.js create
  node src/cli.js generate --spec <path-to-build-spec.json> [--out <output-dir>] [--narrate]
  node src/cli.js generate --batch <dir-of-build-specs> [--out <output-dir>] [--narrate]
  node src/cli.js validate --spec <path-to-build-spec.json>
  node src/cli.js narrate --text "<text>" --out <path.mp3>
  node src/cli.js narrate --file <path-to-script.md> --out <path.mp3>
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      const hasValue = next !== undefined && !next.startsWith('--');
      args[key] = hasValue ? argv[++i] : true;
    }
  }
  return args;
}

function consoleLogger() {
  return createRunLogger({
    onEvent: (e) => {
      const line = `[+${e.elapsedMs}ms] ${e.message}`;
      if (e.level === 'warn' || e.level === 'error') console.warn(line, e.meta ?? '');
      else console.log(line);
    },
  });
}

async function runOne(specPath, { llmClient, outputRoot, voiceClient }) {
  const raw = loadBuildSpecFile(specPath);
  const { versionDir, version, errors } = await generate(raw, { llmClient, outputRoot, voiceClient, logger: consoleLogger() });
  console.log(`Generated version ${version} -> ${versionDir}`);
  if (Object.keys(errors).length) console.warn('Some generators failed:', errors);
  return { versionDir, version, errors };
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  if (command === 'narrate') {
    if (!args.text && !args.file) {
      usage();
      process.exitCode = 1;
      return;
    }
    if (!args.out) {
      console.error('Missing --out <path.mp3>');
      process.exitCode = 1;
      return;
    }
    const text = args.file ? readFileSync(args.file, 'utf8') : args.text;
    const voiceClient = createVoiceClient();
    console.log(`Synthesizing ${text.length} characters via ${voiceClient.provider}...`);
    const audio = await voiceClient.synthesize(text);
    mkdirSync(path.dirname(args.out) || '.', { recursive: true });
    writeFileSync(args.out, audio);
    console.log(`Saved narration -> ${args.out} (${audio.length} bytes)`);
    return;
  }

  if (command === 'create') {
    const prompter = createReadlinePrompter();
    let spec;
    try {
      spec = await runIntake(prompter);
    } finally {
      prompter.close();
    }

    mkdirSync('build-specs', { recursive: true });
    const specPath = path.join('build-specs', `${slugify(spec.buildName)}.json`);
    writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
    console.log(`\nSaved your build spec -> ${specPath}`);
    console.log('Generating your content package now — this uses your Claude API key and costs a few cents...\n');

    const llmClient = createLLMClient();
    const voiceClient = args.narrate ? createVoiceClient() : undefined;
    const { errors } = await runOne(specPath, { llmClient, outputRoot: args.out || 'output', voiceClient });
    if (Object.keys(errors).length) process.exitCode = 1;
    return;
  }

  if (command === 'validate') {
    if (!args.spec) {
      usage();
      process.exitCode = 1;
      return;
    }
    const raw = loadBuildSpecFile(args.spec);
    try {
      const { spec } = await validateBuildSpec(raw);
      console.log(`Valid ${spec.game} build spec: "${spec.buildName}"`);
    } catch (err) {
      console.error(`Invalid build spec: ${err.message}`);
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'generate') {
    const outputRoot = args.out || 'output';
    const voiceClient = args.narrate ? createVoiceClient() : undefined;

    if (args.batch) {
      const dir = args.batch;
      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => path.join(dir, f));
      if (!files.length) {
        console.error(`No .json build specs found in ${dir}`);
        process.exitCode = 1;
        return;
      }
      const llmClient = createLLMClient();
      let failureCount = 0;
      for (const file of files) {
        console.log(`\n=== ${path.basename(file)} ===`);
        try {
          const { errors } = await runOne(file, { llmClient, outputRoot, voiceClient });
          if (Object.keys(errors).length) failureCount++;
        } catch (err) {
          console.error(`Failed: ${err.message}`);
          failureCount++;
        }
      }
      process.exitCode = failureCount ? 1 : 0;
      return;
    }

    if (!args.spec) {
      usage();
      process.exitCode = 1;
      return;
    }
    const llmClient = createLLMClient();
    const { errors } = await runOne(args.spec, { llmClient, outputRoot, voiceClient });
    if (Object.keys(errors).length) process.exitCode = 1;
    return;
  }

  usage();
  process.exitCode = command ? 1 : 0;
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
