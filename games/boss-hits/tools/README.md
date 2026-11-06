# Big Bug: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. In level 1 Kit walks into the bug first and is stung, and that counts for nothing; then five stars each move the bug one stage on (a new monster number each time) for 20 points, and the fifth leaves a puff that goes away. Level 2 does the same with the lamped bug, whose stages are different pictures. It then asserts the coins (8 and 7).
- `bumpCheck.ts`: Kit pushes into the lamped bug for 3 seconds. He must stop in front of it, be stung, lose no life, score nothing and leave it on five lights.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: a sting, then five hits.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the sting came first and all five hits landed.
- `preview.ts`: PNGs of the blocks, the hero (with the three throw poses), the monsters, each level and every picture.
- `shots.ts <dir>`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

The mistake here is walking into the bug: the bot does it once in level 1 and `route.ts` asserts it stung and counted nothing.
