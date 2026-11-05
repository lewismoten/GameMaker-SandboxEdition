# Corner View: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: in level 1 the diagonal wall of cubes stops him and he goes round it in square steps (up, right, up, right, past its open end, down to the gold diamond); in level 2 the stair of towers stops him and he goes round its front; in level 3 (each arrow walks a diagonal) two taps in turn go straight left, Right walks lower right into the wall, and Up runs to the gold diamond. No life may be lost. It also checks that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 1 (both levels, then the ending).
- `preview.ts`, `shots.ts`: PNGs of each level's blocks and map, Kit's four facings (kit-four-facings.png) and every picture; the lesson shots (Kit at the wall, in front of the stair).

## Starter rule: show the mistake once

The demo and walkthrough walk into the wall of cubes in level 1 and into the stair of towers in level 2, each once, before going round.

Kit starts in the middle of the screen in both levels on purpose: the view never scrolls and the engine centers it on where he starts.

Kit's pictures are `src/cornerHero.ts`: four diagonal facings, no front view. To update his look, edit `pose()` there (colors from the kit's palette).
