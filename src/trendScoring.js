// Deterministic text-pattern heuristic — NOT a real virality/ML model. It
// exists so every build gets *some* signal on hook/title strength today,
// with zero cost and zero external dependency. A real predictor (e.g.
// Higgsfield's virality_predictor) is a v2 upgrade gated behind a real API
// key/cost decision — see ROADMAP.md. Keep this pluggable: scoreBuildContent
// is the only thing trendScoringAgent.js depends on, so v2 can swap the
// implementation without touching the agent's interface.

const HOOK_SIGNALS = [
  /\byou\b/i, /\byour\b/i, /\?/, /\bif you\b/i, /\bstop\b/i, /\bnobody\b/i,
  /\bsecret\b/i, /\bbefore you\b/i, /\bwatch\b/i, /\bthis is\b/i, /\bdon't\b/i,
];

function firstNonHeadingLine(text) {
  if (!text) return null;
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#')) || null;
}

function scoreOpeningLine(opening, { idealMinChars = 60, idealMaxChars = 220 } = {}) {
  if (!opening) return { score: 0, reasons: ['missing'] };
  const reasons = [];
  let score = 40;

  const hits = HOOK_SIGNALS.filter((re) => re.test(opening)).length;
  if (hits > 0) {
    score += Math.min(hits, 4) * 10;
    reasons.push(`${hits} hook signal(s) in the opening line`);
  }

  if (/\d/.test(opening)) {
    score += 10;
    reasons.push('opens with a concrete number');
  }

  const len = opening.length;
  if (len >= idealMinChars && len <= idealMaxChars) {
    score += 10;
    reasons.push('opening line length is in the ideal hook range');
  } else {
    reasons.push(len < idealMinChars ? 'opening line may be too thin to hook fast' : 'opening line may run long for a fast hook');
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function scoreTitle(title) {
  const reasons = [];
  let score = 50;
  if (title.length <= 70) {
    score += 15;
    reasons.push('under the ~70-char point where YouTube/search titles truncate');
  } else {
    reasons.push('may truncate in search/recommended feeds');
  }
  if (/\d/.test(title)) {
    score += 10;
    reasons.push('contains a concrete number');
  }
  if (/build/i.test(title)) {
    score += 10;
    reasons.push('contains the high-intent keyword "build"');
  }
  return { title, score: Math.max(0, Math.min(100, score)), reasons };
}

export function scoreBuildContent({ longFormScript, shortsClips = [], titles = [] } = {}) {
  const longForm = scoreOpeningLine(firstNonHeadingLine(longFormScript));
  const shorts = shortsClips.map((c) => ({ platform: c.platform, ...scoreOpeningLine(c.hook) }));
  const titleScores = titles.map(scoreTitle);

  // Only average in a component that was actually provided — a script that
  // was never passed in isn't the same as a script that scored 0.
  const allScores = [
    ...(longFormScript ? [longForm.score] : []),
    ...shorts.map((s) => s.score),
    ...titleScores.map((t) => t.score),
  ];
  const overall = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  return { overall, longForm, shorts, titles: titleScores };
}
