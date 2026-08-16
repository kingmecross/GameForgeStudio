# MyUni AI — How To Use It (No Coding Required)

This is the plain-English guide. If you just want to make a build video
package, this is the only doc you need. (`README.md` and `ARCHITECTURE.md`
are for the technical side — you can ignore them.)

## What this does

You describe an NBA 2K27 MyPlayer build in your own words — position,
height, attributes, badges, who it's for — and it hands back a complete
content package: a full YouTube script, three short-form scripts for
Shorts/TikTok, thumbnail ideas, SEO titles/descriptions/tags, captions for
every platform, image and video prompts, a hook/title strength score, and a
checklist-style plan for what to post where. All saved to a folder on your
computer, ready to use.

## Before you start (one-time, probably already done)

- Your Claude API key is already set up on this computer — you don't need
  to do this again unless you're on a new machine. If you ever do: get a
  key at console.anthropic.com and save it as a system environment variable
  named `ANTHROPIC_API_KEY`.
- Every time you generate a build, it costs a small amount — a few cents.
  That's Anthropic charging for the AI work, not a subscription or anything
  recurring on its own.

## Making a build (the whole thing, one command)

1. Open a terminal in the MyUni AI folder. (If you're not sure how:
   open the folder in File Explorer, click the address bar, type `cmd`,
   press Enter — a black window opens already pointed at the right place.)
2. Type this and press Enter:
   ```
   npm run create
   ```
3. Answer the questions as they come up. Plain language is fine — for
   example, for playstyle you can just type "downhill slasher who can also
   shoot." For the attribute ratings (Finishing, Shooting, etc.) it wants a
   number 0-99 — your best guess for how good that part of the build is.
4. For badges, type one badge name, pick its tier from the list (Bronze,
   Silver, Gold, Hall of Fame), then either add another or leave the next
   one blank to move on.
5. Once you answer the last question, it starts generating automatically —
   no extra button to press. This takes somewhere around 30-60 seconds.
6. When it's done, it prints the folder where everything landed.

That's the whole thing — one command, a handful of plain questions, and a
finished content package.

## Where your files land

Everything goes in a folder shaped like:

```
output/nba2k27/<your build name>/v1/
```

If you make the same build again later, it creates a new `v2` folder next
to `v1` instead of overwriting it — your old version is always still there.

## What each file actually is

- **`script-longform.md`** — the full script to read on camera for your
  main YouTube video.
- **`scripts-shorts.md`** — three shorter scripts, ready for YouTube Shorts
  or TikTok.
- **`thumbnails.md`** — three thumbnail ideas (what text to put on it, what
  the image should show, what colors to use). You still need to make the
  actual image yourself.
- **`seo.json`** — five title options, a description, and a list of tags to
  paste into YouTube when you upload.
- **`captions.md`** — ready-to-paste captions for YouTube Community,
  Instagram, TikTok, and X, each with hashtags already in your channel's
  voice.
- **`image-prompts.json`** / **`video-prompts.json`** — text prompts you
  feed into an AI image/video tool (like Higgsfield) to actually generate
  the visuals. These aren't pictures themselves, just the instructions for
  making them. Each shot already got graded before you saw it — look for
  `"readyForHiggsfield": true` near the top of the file; that means every
  shot scored 9.5+ out of 10 on how creative it is, how clear/unambiguous
  the instructions are, and how likely it is to actually grab a click (that
  matters most for whichever shot becomes your thumbnail). If it says
  `false`, open `passCount`/`totalCount` and skim the flagged shot before
  spending Higgsfield credits on it — it means something came back a little
  weak even after one automatic retry.
- **`trend-scores.json`** — a rough score of how strong your hooks and
  titles are, based on pattern-matching (things like "does the opening line
  grab attention," "is the title too long"). Treat it as a gut-check
  against your other builds, not a guarantee anything will actually trend.
- **`publish-plan.json`** — a checklist pulling everything above into one
  place: what to post on each platform, in what order, with the actual
  title/caption/script already filled in for that platform.
- **`generation.log`** — a record of what happened during that run. You
  usually won't need this; it's mainly useful if something goes wrong and
  you want to see what failed.
- **`build-spec.json`** — a copy of exactly what you entered, saved for the
  record.

## Making your channel's thumbnails look consistent (optional)

If you want every thumbnail to share the same colors/logo/text style
instead of a different look each time, copy `brand-kit.example.json` to
`brand-kit.json` and fill in your channel's colors, logo placement, and
title-text style. Skip this entirely if you don't care yet — nothing breaks
either way, thumbnails just won't match each other build to build.

## Doing several at once

If you've got a handful of build ideas queued up as files in
`build-specs/` (or ask for help creating them), you can generate all of
them in one go:
```
node src/cli.js generate --batch build-specs/
```
It runs them one at a time (not all at once), so the cost stays predictable
and nothing gets missed.

## FAQ

**Did I mess up an answer during the questions?** Just run `npm run create`
again — nothing you already made gets overwritten.

**Does it cost money every time?** Yes, a few cents per build, charged to
whatever's on your Anthropic account. There's no way to "preview for free"
except the build-spec questions themselves, which don't cost anything until
generation actually starts.

**Can I edit the generated script?** Yes — every file is a plain text file.
Open it, change what you want, done.

**Is the 2K27 information in these scripts real?** Only what you told it in
your answers. It's specifically instructed not to invent real NBA 2K27
numbers, badge counts, or mechanics that haven't actually been announced —
2K's full MyPLAYER builder reveal isn't out until August 18, 2026. Anything
about attributes/badges in your script is exactly what you entered, framed
as your build, not a claim about the official game.

**What are the 5 example builds already in the output folder?** Those are
placeholders I generated to prove the whole flow works — one build per
position (point guard through center). They're real generated content, but
the attribute numbers in them are illustrative, not pulled from any
official 2K27 source. Once the real August 18 reveal drops, new builds
should be based on that.

## What's next

Once you've reviewed this, the next planned piece is a real trend engine —
using actual data (once it exists, after the 2K27 reveal) to say which
builds are likely to take off, instead of today's heuristic hook/title
score. That's not built yet — it's next on the list after your review.
