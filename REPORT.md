# Continuity audit, November 23, 2026

Suggested commit message: `Correct Starter cast, disk counts, and game publication cross-references`.

Monday, 19:13 UTC — Read the earlier report and searched the research directory and develop history. The surviving full report labels itself October 31. The November 5 historical-line update is documented separately. Used the requested November 5 cutoff, comparing `372fd7816..ece456627` on local `origin/develop`.

Monday, 19:14–19:19 UTC — Corrected the cast's claim that Kit leads every Starter, two single-disk claims, the Scoop's preview of the superseded Tune-Up instrument hunt, and the printed model year of THE CHEZ. The magazine's static text and the generated printable track their sources. Added one Pages release fragment. The detailed evidence and the preserved prior pass are in [.for-lewis/research/continuity-audit.md](.for-lewis/research/continuity-audit.md).

Two editorial calls remain. The support sticker uses the installation line as its technical-support number. The newsletter calls driving THE CHEZ a first for the Teddy finale, although the intervening Tune-Up has a test drive. The latter is accurate if “first” refers to the trilogy. NOTICE.md credits OpenAI Codex for the text corrections.

## Verification

- `npm run format -w gamemaker-web` passed. `npm run typecheck` passed with an 8 GiB Node heap after the default heap was exhausted.
- `npm run test -w gamemaker-web` passed 161 tests across 30 files covering the cast, both magazine editions, static magazine text, Guide references, Scoop numbering and previews, catalog/disk facts, the BBS, tour and hint-book ePub. The separate Tiny Pockets Press zine suite passed all five tests.
- The additional whole-manual test selection found one failure outside the changed publications. The tracked Level Maps hash for `and-gate` is `9eae9a5c09504e78`. A fresh build of its disk still produced `e154abffd236ad71`. The failing assertion is in `web/src/manual/printables/levelViews.test.ts:22`. The continuity patch changes none of that assertion's inputs.
- Monday, 19:28 UTC — `npm run lint` passed with an 8 GiB Node heap. The default-heap attempt exhausted memory. All four requested gates are green.
- Monday, 19:59 UTC — The four affected games passed reproducibility builds, bot and walkthrough checks, text bounds, and all applicable game checks. The shared heart, save-sign, box-hours and version checks passed. The checker reported advisories on color cues, audio, screen-edge monsters and accepted findings. No game version bump was required.
