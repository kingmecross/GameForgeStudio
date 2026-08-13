# Asset Contact Sheet — 6'6 Slashing Playmaker

**NOTHING BELOW HAS BEEN RENDERED. No credits spent on this sheet.** This is
prompt-only review — approve before anything goes to Higgsfield.

## Standing rules applied to every variant (root cause fix)

Last round's failures, and the fix baked into every prompt below:

| Failure observed | Fix applied here |
|---|---|
| Real NBA logo + Nike swoosh appeared despite "no logos" | Every prompt now explicitly frames the scene as an **original fictional streetball universe, not NBA, not any real league** — and *describes* the jersey's only mark (a plain gold number) instead of only prohibiting others. Absence-only instructions ("no logo") proved weaker than presence-of-something-else instructions. |
| Image-reference (`medias`) overrode composition — 3/3 came back as the reference's pose | **Dropped for all variants below.** Consistency comes from repeating the same detailed physical description in every prompt (proven to work for the reference portrait), not from an image reference. |
| Garbled/invented text and numbers on "UI panels" and jersey text | No readable text, signage, or UI elements requested in any variant. Backgrounds are described as blurred/abstract specifically to remove the model's opportunity to render text. |
| Locker-room/arena context seemed to trigger real-league association even with exclusions | Fictional-universe framing stated up front, environments kept generic (plain lockers, generic arena lights) rather than "NBA locker room" / "NBA arena." |

Character baseline (repeated in every variant): 6'6" muscular point guard,
medium-brown skin, short fade haircut with a crisp line-up, light trimmed
beard, plain unbranded black tank jersey with crimson side panels and gold
trim, one bold gold number 4 on the chest and nothing else printed on it,
plain black sneakers with no visible brand marks.

---

## Asset 1 — Locker-Room Gear Check (redo — previous attempt flagged for real logos)

**Variant A — Quiet Focus (tight, intimate)**
> Original fictional streetball universe (not NBA, not any real league) — cinematic photo of [character baseline], seated on a plain wooden bench in a dim practice-gym locker area, elbows on knees, hands lacing a plain black sneaker with no visible brand marks, eyes down in quiet focus. Background is a softly blurred row of plain metal lockers with no nameplates, signage, or text visible anywhere in frame. Single warm overhead practice-light spotlight, soft shadow falloff, shallow depth of field, photo-realistic video-game cutscene render quality, 9:16.

*Expected result:* A quiet, intimate seated shot — warm light pooling on him as he laces up, plain unbranded gear, moody and focused.
*Why it could perform:* "Before the grind" contemplative energy is a proven secondary-asset beat; tight framing with few background elements is also the lowest-risk option technically (less for the model to invent).

**Variant B — Wide Establishing**
> [same baseline], wide shot showing the full practice locker room, player seated center-frame lacing his shoes, several more blurred plain lockers and a hallway visible in the background, all unbranded, no readable text or nameplates anywhere, natural fluorescent gym lighting, 9:16.

*Expected result:* More environmental context, a "behind the scenes" documentary feel.
*Why it's weaker:* More background elements = more surface area for the model to introduce an unwanted logo or text, based on what just happened. Higher risk for a similar payoff.

**Variant C — Over-the-Shoulder Detail**
> [same baseline], tight over-the-shoulder detail shot focused on his hands lacing the sneaker, torso and jersey number softly blurred in the background, extremely shallow depth of field, 9:16.

*Expected result:* Artsy detail shot, de-emphasizes the face/character.
*Why it's weaker:* Loses the character-recognition value this shot is supposed to provide as part of the set.

**Pick: Variant A.** Tightest control over background elements (lowest risk after last round's failures), still delivers the "focused before the grind" beat the shot list wants.

---

## Asset 2 — Slasher Action / Highlight Poster

**Variant A — Rim-Level Poster**
> Original fictional streetball universe (not NBA, not any real league) — dynamic photo-realistic action shot of [character baseline] mid-air, exploding above the rim for a powerful one-handed slam, body fully extended, fierce focused expression. Blurred out-of-focus crowd silhouettes and generic arena lights in the background — no readable scoreboard, banners, or signage text anywhere. Low dramatic upward camera angle, gold rim-light flare, high contrast, cinematic sharp focus on the player, 9:16.

*Expected result:* A jaw-dropping mid-air dunk freeze-frame, dramatic gold rim lighting, clean unbranded gear.
*Why it could perform:* This exact shot type (aerial dunk, low hero angle) already scored the highest clickability (9.8/10) of any prompt in this entire project when it went through the text-based quality gate — reusing the proven-strongest angle.

**Variant B — Ground-Level Drive**
> [same baseline], full-speed downhill drive toward the rim, one out-of-focus defender silhouette in the foreground for scale (no identifiable features, fully blurred, no jersey detail visible), ball low and controlled, motion blur on the trailing leg, 9:16.

*Expected result:* Kinetic "in the action" feel rather than a frozen peak moment.
*Why it's weaker:* Motion blur tends to read as lower quality when cropped small (thumbnail scale); a second figure (even blurred) adds a failure surface we don't need.

**Variant C — Post-Slam Celebration**
> [same baseline], just after the dunk, briefly hanging on the rim, roaring with emotion, net still moving, 9:16.

*Expected result:* High emotional payoff, but rim/hand-grab physics are a known common AI-image failure point.
*Why it's weaker:* Higher technical risk (hand-on-rim anatomy) for a similar emotional beat to Variant A.

**Pick: Variant A.** Highest proven clickability, lowest technical risk (no second person, no rim-grab hand physics).

---

## Asset 3 — Park/Rec Neon Moment

**Variant A — Swagger Stance**
> Original fictional streetball universe (not NBA, not any real league) — cinematic photo of [character baseline], standing confidently on an outdoor blacktop court at night, ball resting on one hip, relaxed half-smile, silhouetted crowd behind a plain chain-link fence (no readable signs, banners, or text anywhere in the background). Abstract colorful light glow in crimson and gold tones (soft colored light blur, not readable neon signage or lettering), wet blacktop reflecting the color, cool night ambience, cinematic low-angle hero shot, sharp focus on the player, 9:16.

*Expected result:* Confident hero shot, the character owning a nighttime court, colorful but text-free lighting.
*Why it could perform:* "Day-one build swagger" is the exact narrative hook that already scored 9.5+ clickability in this shot's original text-based approval; "abstract glow, not readable signage" specifically targets the garbled-text failure from the very first attempt this session.

**Variant B — Walk-Up Wide**
> [same baseline], wider shot of him walking onto the court from a distance, full body visible, more court and crowd context shown, 9:16.

*Expected result:* More narrative/documentary, less punchy as a single image.
*Why it's weaker:* Weaker single-image hook, more background elements = more risk (same lesson as Asset 1 Variant B).

**Variant C — Ball-in-Hand Close**
> [same baseline], tighter chest-up crop, ball held close to chest with both hands, direct eye contact with camera, minimal background, 9:16.

*Expected result:* More portrait-like, loses the outdoor-court environmental identity.
*Why it's weaker:* Redundant with the reference portrait — doesn't add anything the set doesn't already have.

**Pick: Variant A.** Best balance of environmental storytelling and controlled risk, proven-strongest narrative angle.

---

## Asset 4 — Thumbnail (nano_banana_pro, 4K, 16:9, clean render — text added as an HTML/CSS overlay afterward, not baked in, per the thumbnail workflow's own default policy and to avoid yet another text-rendering risk)

**Variant A — Hero Dunk Freeze**
> Bold, punchy YouTube-thumbnail composite — poster-grade, photoreal and high-impact, 16:9, single unified frame. SUBJECT: [character baseline] exploding above the rim for a powerful one-handed slam dunk, fierce determined expression, rendered LARGE and dominant filling ~50% of the frame, pushed to the foreground, camera at a low dramatic angle looking up. All facial features crisply sharp as the anchor of the shot. KEY ELEMENTS: a bright basketball mid-flight near his hand, subtle motion streaks. BACKGROUND: bold vivid crimson-to-black gradient color field, punchy high contrast, soft vignette, blurred generic arena lights (no readable signage or scoreboard text). LIGHTING: signature YouTube thumbnail rig — strong key light sculpting the face, soft dream-light fill, a defined gold-and-crimson back/hair light tracing a bright rim along the silhouette. GRADE: vivid high-impact color grade, punchy high contrast, bright clean exposure, rich saturated colors, deep blacks and bright highlights, crisp and glossy, poster-punchy. No text, no readable UI labels, no watermark.

*Expected result:* A MrBeast-grade poster thumbnail — player mid-dunk, dramatic gold rim lighting, crimson/gold color grade, nothing branded, no baked text (headline added as an overlay after).
*Why it could perform:* Action + dramatic rim lighting + high color contrast is the single highest-CTR combination for this content category; reuses the same composition already proven strongest in this project.

**Variant B — Confident Face-Forward Portrait**
> [same baseline], chest-up confident portrait facing camera, arms crossed, determined/charisma expression, same lighting rig and grade rules as Variant A.

*Expected result:* Cleaner "build reveal" energy, less kinetic.
*Why it's weaker:* Static portraits generally underperform action shots for CTR in this genre — good as a secondary asset, not the primary thumbnail bet.

**Variant C — Split Comparison (build screen ⟶ payoff dunk)**
> Split-frame thumbnail, left panel a plain builder-screen style portrait, right panel the same character mid-dunk, same lighting/grade rules, clean seam divider, no labels/text on or between panels.

*Expected result:* Shows both "the build" and "the payoff" in one image.
*Why it's weaker:* Requires the character to render consistently twice within one image — more technical risk for a first attempt, especially right after a session where consistency across separate renders already proved unreliable.

**Pick: Variant A.** Highest expected CTR, lowest technical risk of the three.

---

## Summary — what's queued for approval

| Asset | Picked variant | Model | Aspect ratio | Est. cost |
|---|---|---|---|---|
| Locker-Room Gear Check (redo) | A — Quiet Focus | soul_2 | 9:16 | ~$0.12 |
| Slasher Action Poster | A — Rim-Level Poster | soul_2 | 9:16 | ~$0.12 |
| Park/Rec Neon Moment | A — Swagger Stance | soul_2 | 9:16 | ~$0.12 |
| Thumbnail | A — Hero Dunk Freeze | nano_banana_pro | 16:9 (4K) | ~$4.00 |

**Total if approved as-is: ~$4.36.** Nothing renders until you say go — and if any of these still comes back flagged, it gets analyzed and re-presented here for approval, not blindly retried.
