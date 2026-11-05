# Block Brains: tools

- `check.ts`: the bot plays both levels. `route.ts` watches every tick: each gate's ring is open 36 ticks and shut 72 (give or take two), a gate is open exactly while its lamp is lit, and exactly one gate of the three is open. In level 2 the sun and moon gates are never both open or both shut, and each is open or shut 45 ticks. The bot reads the signs, watches the lamps, walks into the first gate while it is shut (it stays shut), then goes through each gate when its lamp is lit, and takes the coins (5 a level). The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero waits at the first gate and then goes through all three, without dying.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lamps and gates in each turn, for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot tries a gate that is still shut.
