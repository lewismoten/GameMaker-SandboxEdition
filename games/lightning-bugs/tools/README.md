# Lightning Bugs: tools

- `check.ts`: the bot plays the whole game and must win without losing a life. `route.ts` stops under level 1's six copies and counts, tick by tick, that they keep the same frame and the same place on their loop and light up together; then under the six kinds, which must never be in step or all lit at once; then at two places in level 2's meadow, where the fireflies in view must never be in step or all lit, more than half of them may be lit at only a few ticks, and some firefly must be lit most of the time. `check.ts` also checks that no two fireflies of one kind start within 8 blocks of each other, that every kind's blink takes its own time, and that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the bot's run through level 1.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it enters scenes `2 3`.
- `screen.ts`: what the engine shows at a tick (blocks, every firefly at its place and frame, and the hero), read from the headless player's world; `shots.ts` uses it.
- `shots.ts`: pictures of the lessons from the real engine (a firefly's frames, level 1's copies and kinds at four moments, the meadow at eight, the title) for the progress shots.
- `preview.ts`: PNGs of each level's blocks, each whole level with its fireflies where they start, and every picture on the built disk.
- `manual.ts`: draws the frames, one kind's blink, the glow's painted pixels and each kind's loop into `manual.json`'s "How this level is made" pages.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is the six copies of one firefly in level 1: they blink and fly as one, like a marching band, and the bot stops to watch them before it walks on to the six that are each their own monster.

## How it is checked beyond the bot

Every monster on a map starts at the same tick, so the copies stay in step for as long as the level runs; the route proves it for 150 ticks. If you change the kinds' times, keep every kind's round different (`check.ts` says so if two match) and rerun the check: the meadow's numbers in its log (`BOT_LOG=1`) show how often more than half the fireflies in view are lit together.
