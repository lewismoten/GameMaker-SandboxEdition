# Don't Get Seen: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. In level 1 Kit steps into the light first and is seen (it costs hit points, not a life), steps back, then waits in a trench while the light walks over. A hop between safe places only starts when the light cannot reach him in the time he needs, as a person watching the lamp would; every hop must cost no hit points. It then asserts the coins (5 and 5).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: seen once, then hiding in the first trench while the light passes over.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Kit was seen once (hit points, not a life) and the light walked over him in the trench.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture.
- `shots.ts <dir>`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

The mistake here is stepping into the light: the bot does it once in level 1 and `route.ts` asserts it cost hit points and no life.
