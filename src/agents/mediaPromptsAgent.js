import { describeBuild } from '../buildContext.js';

const QUALITY_BAR = 9.5;

const SHOT_FIELDS = {
  shotName: { type: 'string' },
  prompt: { type: 'string' },
  camera: { type: 'string' },
  lens: { type: 'string' },
  lighting: { type: 'string' },
  environment: { type: 'string' },
  clothing: { type: 'string' },
  emotion: { type: 'string' },
  motion: { type: 'string' },
  color: { type: 'string' },
  composition: { type: 'string' },
  aspectRatio: { type: 'string' },
  exclusions: { type: 'array', items: { type: 'string' } },
  expectedResult: { type: 'string' },
  creativityScore: { type: 'number' },
  clarityScore: { type: 'number' },
  clickabilityScore: { type: 'number' },
};

const IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    characterIdentity: { type: 'string' },
    conceptsConsidered: { type: 'array', items: { type: 'string' } },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: SHOT_FIELDS,
        required: Object.keys(SHOT_FIELDS),
        additionalProperties: false,
      },
    },
  },
  required: ['characterIdentity', 'conceptsConsidered', 'shots'],
  additionalProperties: false,
};

const CLIP_FIELDS = {
  ...SHOT_FIELDS,
  sceneName: SHOT_FIELDS.shotName,
  cameraMovement: { type: 'string' },
  durationSec: { type: 'integer' },
  audioNotes: { type: 'string' },
};
delete CLIP_FIELDS.shotName;

const VIDEO_SCHEMA = {
  type: 'object',
  properties: {
    conceptsConsidered: { type: 'array', items: { type: 'string' } },
    clips: {
      type: 'array',
      items: {
        type: 'object',
        properties: CLIP_FIELDS,
        required: Object.keys(CLIP_FIELDS),
        additionalProperties: false,
      },
    },
  },
  required: ['conceptsConsidered', 'clips'],
  additionalProperties: false,
};

// Creator-optimization mode: every prompt is scored on the three levers that
// actually drive YouTube views / Shorts retention / thumbnail click-through,
// not just technical correctness. Cheap Claude reasoning spent here saves
// expensive Higgsfield re-renders on a shot that wouldn't have performed.
const PREFLIGHT_INSTRUCTION =
  'You are acting as both a senior AI image/video generation engineer and an award-winning creative director ' +
  'running a preflight review before anything is sent to a generation tool — this is creator-optimization mode, ' +
  'focused on YouTube views, Shorts retention, and thumbnail click-through, not just technical correctness. Work ' +
  'slowly: before finalizing, internally draft three distinct creative concepts per shot list (vary lighting ' +
  'mood, compositional approach, or environment framing) — never settle for the first idea. Weigh each concept\'s ' +
  'strengths and weaknesses against this build\'s playstyle and target audience, then merge the strongest ' +
  'elements into ONE final, unambiguous prompt per shot. List short labels for the three directions you ' +
  'considered in "conceptsConsidered" so the process stays auditable. Every final prompt must explicitly specify ' +
  'camera, lens, lighting, environment, clothing, emotion, motion, color, composition, aspect ratio, and ' +
  'exclusions (things to avoid — artifacts, wrong colors, extra limbs, text/watermarks, etc.) — leaving any of ' +
  'these vague wastes real generation credits on a re-render. Before scoring, write "expectedResult": one or two ' +
  'sentences simulating exactly what a human should see if this prompt were rendered right now. Then score this ' +
  `shot 0-10 (one decimal place is fine, e.g. 9.5) on three creator-outcome dimensions: "creativityScore" (does ` +
  'this stand out and feel fresh instead of generic — the polish that earns a click), "clarityScore" (is every ' +
  'field unambiguous enough that a generation model could not misinterpret it — ambiguity is what breaks ' +
  'retention when the render comes out wrong), and "clickabilityScore" (if this shot ends up as or feeds a ' +
  `thumbnail, would it actually stop a scroll). Only a ${QUALITY_BAR}+ score on ALL THREE means this shot is ` +
  'ready to send to Higgsfield.';

function scoreShot(item) {
  const { creativityScore, clarityScore, clickabilityScore } = item;
  const weakest = Math.min(creativityScore, clarityScore, clickabilityScore);
  return { passes: weakest >= QUALITY_BAR, weakest };
}

function summarize(items) {
  const scored = items.map(scoreShot);
  const passCount = scored.filter((s) => s.passes).length;
  const avgWeakest = scored.reduce((sum, s) => sum + s.weakest, 0) / scored.length;
  return { passCount, avgWeakest, allPass: passCount === items.length };
}

// Bounded (at most one retry) — "iterate until it clears the bar" without an
// open-ended loop burning Claude calls for diminishing returns. Keeps
// whichever attempt actually did better, not just whichever ran last.
async function generateWithQualityGate(llmClient, system, prompt, schema, key) {
  const first = await llmClient.generateStructured(system, prompt, schema);
  const firstSummary = summarize(first[key]);
  if (firstSummary.allPass) return first;

  const retryPrompt =
    `${prompt}\n\nYour previous attempt didn't clear ${QUALITY_BAR}/10 on creativity, clarity, and clickability ` +
    'for every shot. Sharpen whichever dimension was weak on each one — vague technical fields hurt clarity, a ' +
    'generic composition hurts creativity and clickability — then try again.';
  const retry = await llmClient.generateStructured(system, retryPrompt, schema);
  const retrySummary = summarize(retry[key]);

  const retryIsBetter =
    retrySummary.passCount > firstSummary.passCount ||
    (retrySummary.passCount === firstSummary.passCount && retrySummary.avgWeakest > firstSummary.avgWeakest);
  return retryIsBetter ? retry : first;
}

function withReviewSummary(result, key) {
  const items = result[key];
  const passCount = items.filter((item) => scoreShot(item).passes).length;
  const readyForHiggsfield = passCount === items.length;
  return {
    ...result,
    qualityGate: `${QUALITY_BAR}/10 on creativity, clarity, and clickability`,
    passCount,
    totalCount: items.length,
    readyForHiggsfield,
    reviewNote: readyForHiggsfield
      ? `All ${items.length} prompt(s) cleared ${QUALITY_BAR}/10 on creativity, clarity, and clickability — ready to send to Higgsfield.`
      : `${items.length - passCount} of ${items.length} prompt(s) fell short of the ${QUALITY_BAR}/10 bar even after one retry — review before sending to Higgsfield.`,
  };
}

export async function run(buildSpec, { llmClient, promptPack }) {
  const context = describeBuild(buildSpec, promptPack);
  const identityInstruction = buildSpec.visualIdentity
    ? 'Use the visual identity notes above for the player\'s appearance in every prompt.'
    : 'Invent one consistent player appearance (build/height-appropriate physique, skin tone, hairstyle, jersey ' +
      'colorway, number) and reuse the EXACT same description in every single prompt below — the character must ' +
      'look identical across all shots and clips. State that description once as "characterIdentity" and repeat it ' +
      'verbatim inside each prompt.';

  const system =
    `You write image and video generation prompts for a ${promptPack.gameLabel} MyPlayer build showcase video. ` +
    `${promptPack.factGuardrails} All prompts must specify a photo-realistic, next-gen basketball video-game visual ` +
    `style (not cartoon/anime) — think in-game cutscene or builder-screen render quality. ${identityInstruction} ` +
    PREFLIGHT_INSTRUCTION;

  const [images, video] = await Promise.all([
    generateWithQualityGate(
      llmClient,
      system,
      `${context}\n\nGenerate 4 photo-realistic still image prompts for this build: a MyPlayer builder-screen style ` +
        'portrait, a locker-room/gear-check shot, an action pose showcasing the playstyle, and a Park/Rec crowd shot.',
      IMAGE_SCHEMA,
      'shots'
    ),
    generateWithQualityGate(
      llmClient,
      system,
      `${context}\n\nGenerate 4-6 short video clip prompts (8-12 seconds each) with scene instructions for a build ` +
        'showcase video: cover the builder/customization screen, a gameplay highlight that demonstrates this exact ' +
        'playstyle, and a Park/Rec moment. Audio notes should call for ambient crowd/game sound only — no music, no ' +
        'dialogue, since the creator adds their own voiceover afterward.',
      VIDEO_SCHEMA,
      'clips'
    ),
  ]);

  return {
    'image-prompts.json': withReviewSummary(images, 'shots'),
    'video-prompts.json': withReviewSummary(video, 'clips'),
  };
}
