# Here Today: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Kit is held back by the bubble, waits, and sees it pop by itself and leave a sparkle; in level 2 he waits while the sleeper becomes the awake one, then walks through it. It then asserts all twelve coins.
- `bumpCheck.ts`: Kit pushes into the sleeper for two seconds and must stop in front of it with his hit points and lives unchanged; once it has woken he walks through the awake one at no cost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit walks to the signs and waits while the bubble pops.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the bubble is there and then gone, with a sparkle.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is walking into the solid bubble and sleeper and being held back until the time is up.
