# MyUni AI — Ranked Content Queue

Ranked by **expected click-through**, based on general/historical NBA 2K
creator-content patterns (audience size by position, what thumbnails/hooks
have reliably performed across past 2K titles). **Not** based on any
NBA 2K27-specific meta claim — the real MyPLAYER pie-chart/attribute system
and archetype popularity data don't exist publicly until the August 18,
2026 reveal, so nothing below states or implies confirmed 2K27 mechanics.
This is a content-strategy ranking, not a game-mechanics claim.

| Rank | Build | Position | Why |
|---|---|---|---|
| 1 | 6'6 Slashing Playmaker | PG | Largest addressable audience (guards are the most-played position in Park/Rec) + "does everything" pitch, which historically outperforms hyper-specialized builds in search/CTR + strongest visual hook of any generated shot so far (Aerial Lob Poster clip scored 9.8/10 clickability). |
| 2 | 6'5 Three-Level Scorer | SG | Guard-position reach, classic "best scoring build" search intent — high, proven search volume every 2K cycle. |
| 3 | 6'2 Pass-First Floor General | PG | Guard-position reach, but a pass-first pitch has historically thinner thumbnail/highlight material than a scorer or slasher — dimes photograph less explosively than dunks. |
| 4 | 6'8 Two-Way Wing | SF | Solid mid-tier: "lock up the best scorer" has a real, if narrower, fanbase; still has real poster-dunk potential as a payoff visual. |
| 5 | 6'10 Stretch Playmaking Forward | PF | Big-man builds are the smallest-audience category historically; "stretch" framing helps somewhat (novelty) but doesn't offset the position gap. |
| 6 | 7'2 Rim-Protecting Anchor | C | Traditional/defense-only center is historically the lowest-CTR archetype in this content category — smallest addressable audience, least flashy thumbnail material (no shooting/highlight variety), though it can still land with a dedicated niche audience. |

## Status per item

| Rank | Build | Preview packet | Quality-gate status |
|---|---|---|---|
| 1 | 6'6 Slashing Playmaker | ✅ `review/6-6-slashing-playmaker/preview-packet.md` | ✅ Real — 9/9 prompts cleared 9.5/10 on creativity/clarity/clickability |
| 2-6 | (all 5 others) | Not yet built | ⚠️ **Their existing content predates the quality-gate system** — see note below |

## A cost decision, not a routine one

Builds #2-6 were generated in this session *before* the creativity/clarity/
clickability quality gate existed — their `image-prompts.json` /
`video-prompts.json` have no scores to check at all, gated or not. I can't
honestly write "ran a strict quality check" into their preview packets
without that data existing.

Getting it requires actually re-running `generate` on those 5 build specs
(same pipeline, no new code — this isn't infrastructure) — which spends
real Claude API credit again, roughly the same "a few cents each" as every
run this session. That's a real cost, not a judgment call I should make
for you unilaterally per your own standing rule.

**Your call:** regenerate all 5 (~5 × a few cents) so every packet in the
queue has real, current quality-gate data, or proceed with packets built
from their existing (un-gated) content, clearly labeled as such? I'd lean
regenerate, given "focus on viral content creation" — the quality gate is
the whole point of what a preview packet is supposed to prove — but it's
your spend to authorize.
