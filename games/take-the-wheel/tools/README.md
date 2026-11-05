# Take the Wheel: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Kit jumps the bird and it is still there; in level 2 the kart is stopped by the first bird and cannot get past, one honk clears exactly one bird (it becomes a flying one), and the second bird goes the same way.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit walks to the bird and jumps it.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Kit jumped the bird and landed past it, the bird still sitting.
- `preview.ts`: PNGs of the blocks, Kit and the kart, the monsters, each level and every picture.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is driving into the first bird: a kart cannot jump, so it stops, and only the honk gets it past.
