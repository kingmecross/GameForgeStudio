import { describeBuild, PLAYBOOK_VOICE } from '../buildContext.js';
import { describeBrandKit } from '../brandKit.js';

const SEO_SCHEMA = {
  type: 'object',
  properties: {
    titles: { type: 'array', items: { type: 'string' } },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['titles', 'description', 'tags'],
  additionalProperties: false,
};

const THUMBNAIL_SCHEMA = {
  type: 'object',
  properties: {
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          textOverlay: { type: 'string' },
          composition: { type: 'string' },
          colorNotes: { type: 'string' },
        },
        required: ['textOverlay', 'composition', 'colorNotes'],
        additionalProperties: false,
      },
    },
  },
  required: ['concepts'],
  additionalProperties: false,
};

const CAPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    youtubeCommunity: { type: 'string' },
    instagram: { type: 'string' },
    tiktok: { type: 'string' },
    x: { type: 'string' },
  },
  required: ['youtubeCommunity', 'instagram', 'tiktok', 'x'],
  additionalProperties: false,
};

function renderThumbnailsMarkdown(thumbnails) {
  return thumbnails.concepts
    .map(
      (c, i) =>
        `## Concept ${i + 1}\n\n**Text overlay:** ${c.textOverlay}\n\n**Composition:** ${c.composition}\n\n` +
        `**Color notes:** ${c.colorNotes}`
    )
    .join('\n\n---\n\n');
}

function renderCaptionsMarkdown(captions) {
  return [
    `## YouTube Community Post\n\n${captions.youtubeCommunity}`,
    `## Instagram\n\n${captions.instagram}`,
    `## TikTok\n\n${captions.tiktok}`,
    `## X\n\n${captions.x}`,
  ].join('\n\n---\n\n');
}

export async function run(buildSpec, { llmClient, promptPack, brandKit }) {
  const context = describeBuild(buildSpec, promptPack);
  const brandContext = describeBrandKit(brandKit);
  const system =
    `You handle discoverability and branding for a ${promptPack.gameLabel} MyPlayer build content creator. ` +
    `${promptPack.factGuardrails} Optimize for people searching for a specific build to copy, not generic game hype. ` +
    PLAYBOOK_VOICE;

  const [seo, thumbnails, captions] = await Promise.all([
    llmClient.generateStructured(
      system,
      `${context}\n\nGenerate 5 candidate YouTube titles (under 100 characters each, no clickbait that isn't backed ` +
        'by the actual build), one YouTube description (2-3 short paragraphs including the build specs and a ' +
        'timestamped-style summary), and 15-20 SEO tags.',
      SEO_SCHEMA
    ),
    llmClient.generateStructured(
      system,
      `${context}${brandContext}\n\nPropose 3 distinct thumbnail concepts. For each: the short text overlay (max 5 ` +
        'words), the visual composition (what is shown and where), and color notes (palette that will stand out in ' +
        'a feed). Thumbnail psychology: one dominant subject filling ~40-60% of the frame, never small or lost in ' +
        'the lower third; create an information gap that makes someone need to click, don\'t answer every question ' +
        'before the click; an action beat (mid-highlight) outperforms a static crossed-arms portrait; high-contrast ' +
        'saturated grade that still reads at ~120px wide in a sidebar.' +
        (brandKit
          ? ' Apply the channel brand kit above consistently across all 3 concepts — same color palette and logo ' +
            'placement in every one, varying only the composition and text overlay for this specific build.'
          : ''),
      THUMBNAIL_SCHEMA
    ),
    llmClient.generateStructured(
      system,
      `${context}\n\nWrite social captions announcing this build video for: a YouTube Community post, an Instagram ` +
        'caption, a TikTok caption, and an X (Twitter) post. Include relevant hashtags in each. Keep each platform\'s ' +
        'voice appropriate to that platform.',
      CAPTIONS_SCHEMA
    ),
  ]);

  return {
    'seo.json': seo,
    'thumbnails.json': thumbnails,
    'thumbnails.md': renderThumbnailsMarkdown(thumbnails),
    'captions.json': captions,
    'captions.md': renderCaptionsMarkdown(captions),
  };
}
