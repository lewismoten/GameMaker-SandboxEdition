# Gravity On, Gravity Off: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: in level 1 Space lifts Kit and gravity brings him back to the same spot, the wall stops him until he jumps it, and walking off the ledge drops him to the ground; in level 2 Space does nothing, Up and Down walk, the wall stops him until he walks around it, and walking off the deck drops him nowhere. No life may be lost. It also checks that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 1 (both levels, then the ending).
- `preview.ts`, `shots.ts`: PNGs of both block sets, Kit's side-view and top-down poses, each level and every picture.

## Starter rule: show the mistake once

The demo and walkthrough bump the wall in both levels and walk off the ledge (level 1: he falls) and off the deck (level 2: nothing happens), each once.
