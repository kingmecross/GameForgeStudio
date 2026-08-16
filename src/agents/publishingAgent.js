// v1: no platform APIs are called — this consolidates everything the other
// agents already generated into one real, per-platform plan so the output
// folder is drop-in ready for manual posting. v2 (see ROADMAP.md) replaces
// individual `ready`/content fields with actual post calls without changing
// this interface — orchestrator.js only depends on the shape returned here.

function findClip(shorts, platform) {
  return shorts?.clips?.find((c) => c.platform === platform) || null;
}

export async function run(buildSpec, artifacts = {}) {
  const seo = artifacts['seo.json'];
  const captions = artifacts['captions.json'];
  const shorts = artifacts['scripts-shorts.json'];
  const hasLongForm = Boolean(artifacts['script-longform.md']);

  const shortsClip = findClip(shorts, 'YouTube Shorts');
  const tiktokClip = findClip(shorts, 'TikTok');

  const platforms = [
    {
      platform: 'YouTube (long-form)',
      ready: Boolean(seo && hasLongForm),
      scriptFile: 'script-longform.md',
      title: seo?.titles?.[0] ?? null,
      description: seo?.description ?? null,
      tags: seo?.tags ?? null,
      thumbnailFile: 'thumbnails.md — pick a concept and render it before uploading (see ROADMAP.md v2)',
      communityPostCaption: captions?.youtubeCommunity ?? null,
    },
    {
      platform: 'YouTube Shorts',
      ready: Boolean(shortsClip),
      hook: shortsClip?.hook ?? null,
      script: shortsClip?.script ?? null,
      durationSec: shortsClip?.durationSec ?? null,
    },
    {
      platform: 'TikTok',
      ready: Boolean(tiktokClip),
      hook: tiktokClip?.hook ?? null,
      script: tiktokClip?.script ?? null,
      durationSec: tiktokClip?.durationSec ?? null,
      caption: captions?.tiktok ?? null,
    },
    {
      platform: 'Instagram Reels',
      ready: Boolean(shortsClip || tiktokClip),
      note: 'Reuse the YouTube Shorts or TikTok clip — no Instagram-specific script is generated separately.',
      caption: captions?.instagram ?? null,
    },
    {
      platform: 'X',
      ready: Boolean(captions?.x),
      caption: captions?.x ?? null,
    },
  ];

  return {
    'publish-plan.json': {
      buildName: buildSpec.buildName,
      status: 'v1: manual posting — MyUni AI does not call any platform API itself; see ROADMAP.md v2',
      suggestedPostingOrder: [
        'YouTube (long-form) — anchor upload, drives search traffic for the build name',
        'YouTube Shorts + TikTok — same day or next day, cross-promote the long-form video',
        'Instagram Reels + X — same window as Shorts/TikTok, link back to the YouTube upload',
      ],
      platforms,
    },
  };
}
