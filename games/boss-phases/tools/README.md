# Three Phases: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. In level 1 Kit walks into the bug first and is stung, and that counts for nothing; then he throws from the tunnel mouth, waiting for the bug to walk close (a miss is thrown again), and each hit must move the bug exactly one stage on for 20 points. It measures how fast each look walks: the hurried one must beat the calm one, and level 2's tiny last one the hurried one. It then asserts the coins (8 and 7).
- `bumpCheck.ts`: Kit pushes into the bug for 2 seconds. He must stop in front of it, be stung, lose no life, score nothing and leave it on its first stage.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: a sting, then four hits, calm then hurried.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the sting came first and all four hits landed.
- `preview.ts`: PNGs of the blocks, the hero (with the three throw poses), the monsters, each level and every picture.
- `shots.ts <dir>`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

The mistake here is walking into the bug: the bot does it once in level 1 and `route.ts` asserts it stung and counted nothing.
