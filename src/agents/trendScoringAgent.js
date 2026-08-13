import { scoreBuildContent } from '../trendScoring.js';

// Deterministic — no LLM call. Runs after the LLM agents so it can score
// what they actually produced; tolerates any of them having failed (fields
// just come through undefined and scoreBuildContent treats that as "missing").
export async function run(buildSpec, artifacts = {}) {
  const seo = artifacts['seo.json'];
  const shorts = artifacts['scripts-shorts.json'];
  const longForm = artifacts['script-longform.md'];

  const scores = scoreBuildContent({
    longFormScript: longForm,
    shortsClips: shorts?.clips || [],
    titles: seo?.titles || [],
  });

  return {
    'trend-scores.json': {
      method: 'heuristic-v1',
      note:
        'Deterministic text-pattern heuristic (hook language, opening-line length, title truncation/keyword ' +
        'checks) — not a real virality model. A Higgsfield-backed predictor is a v2 upgrade gated behind a real ' +
        'API key/cost decision; see ROADMAP.md.',
      ...scores,
    },
  };
}
