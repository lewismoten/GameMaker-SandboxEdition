# Follow Me: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Puff starts a few blocks away, flies to Kit while he reads, falls behind when he runs and catches up when he stops; in level 2 Puff waits under the ledge, never gets on top of it, and flies out to Kit once he steps off the end. It then asserts all twelve coins.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit walks to the signs, runs ahead, and waits while Puff catches up.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Puff gets far behind and ends beside Kit.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is running ahead and leaving Puff behind, and standing above it so it cannot reach Kit.
