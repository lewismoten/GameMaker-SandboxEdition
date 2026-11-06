# Heat Waves: tools

- `check.ts`: the bot plays the three levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the hills left of the rock always show the same picture of their ring in all three rows, while right of it each row is one picture behind the row under it, and the hills change every 4 ticks round all 6 pictures; in level 2 each puddle block comes onto the scrolling screen, then hides (jumps down out of sight) before Kit is near it; in level 3 the hills never change.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run). `demoCheck.ts` plays the built `demo.rec` headless and checks it enters the three levels and the ending with every key played.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level whole (1x and 3x, level 3 in the evening palette) and every picture. `shots.ts`: PNGs of the lessons for the progress shots, taken from the real engine as the bot plays.

## Starter rule: show the mistake once

Level 1 shows the mistake beside the fix: left of the rock the same ring is laid with one start in every row, so the hills sway together like jelly. The walkthrough and the demo stand Kit in front of both halves while the hills sway, then walk him on. Level 2's puddle is a trick that only works on a road that scrolls; its page says why.
