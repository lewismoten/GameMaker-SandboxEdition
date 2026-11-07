# Both Together: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Kit turns one dial on, a spark runs the wire and dies at the dial that is still off (it never gets past column 17.3) and the lamp stays dark; then he turns the second on, the lamp lights, its light settles at the foot of the post and fills counter 22, and the gate opens. Every jump leaves a block of sky under the lamp, so Kit cannot reach it. Level 2 has three dials, one up a ladder. It then asserts every coin (five, then eight).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the start of level 1: one dial on, the spark dying at the other, then both on.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks that mistake once (a spark that gets no further than the dial that is off), then the lamp lit with both dials on.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots. `lightShots.ts`: real game-screen PNGs from the walkthrough around the moment the lamp lights and its light drops.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is turning on only one of the two dials: the spark dies at the other (level 1).
