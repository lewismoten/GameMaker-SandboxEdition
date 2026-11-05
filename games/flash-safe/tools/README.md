# Flash Safe: tools

- `check.ts`: the bot plays all three levels. `route.ts` watches every tick: in level 1 it walks into the first burr and checks the hit takes exactly 5 hit points, the burr is gone and the number -5 is rising and then gone, then jumps the other two without a scratch; in level 2 each lamp goes round its ring on the ticks its blocks say (the blink is 9 lit and 9 dark, the pulse eight ticks a step); in level 3 the sky goes lift, hold, settle, calm in order for 4, 22, 4 and 60 ticks. It asserts the coins (4, 4 and 4). The run wins with no life lost.
- `flash.ts`: replays `walkthrough.json` on the real engine and counts, in every second, the large light changes WCAG 2.3.1 calls flashes (a general flash and a red flash, on each 320x200 frame; `games/kit/flashMeter.ts`). Exits 1 above 3 a second. `games/kit/flashCheck.ts` is the same for any game.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: take the first burr's hit, jump the others).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it shows exactly one 5-point hit.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots (before and after a hit, the lamp dark and lit, the sky calm and held).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the lesson is a hit shown without a flash, so the bot takes one hit on purpose; the wrong way (a flash) is only ever a still picture.
