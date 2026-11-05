# Birds of a Feather: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the five birds fly 22 blocks right and back while Kit reads, and the V they started in never drifts more than 2 pixels; in level 2 the two gold birds pull away and the V comes apart. It then asserts every coin (six, then eight).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the start of level 1: Kit walks to the signs while the birds fly out and back.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the birds fly on while the V holds its shape.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is giving two birds more speed, so the V comes apart (level 2).
