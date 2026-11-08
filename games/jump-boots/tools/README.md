# Boots and Jet Pack: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 one tap rises a hop and a tap in the air rises well past it, then Kit taps up the 18-block cliff and across the 10-block gap. In level 2 the boots hold two taps: a third tap does nothing (the rise stops at two taps' height), a tap with none left does nothing, three bubbles fill the boots to three, a step 5 blocks tall and the pit each take two taps and the staircase two more. It then asserts every coin (eight, then five).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the bot's own run to the far side of level 2's pit.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks level 1's eight coins, then level 2 with the pit crossed on two taps.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is a third tap with two taps in the boots: it does nothing, Kit drops, and Space then does nothing until a blue bubble fills the boots (level 2).
