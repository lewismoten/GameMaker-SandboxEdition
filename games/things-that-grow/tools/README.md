# Seeds and Nests: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Kit stands under the shelf nest and sees birds hatch, one after another; in level 2 he sees blue birds hatch from the path nest, steps on it (it becomes the empty nest) and sees the blue ones go and no more come. It then asserts all twelve coins.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit walks to the signs and the shelf nest hatches a bird.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the nest hatched a bird.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the "mistake" is waiting under a nest that has not hatched yet: birds come one birth time (about four seconds) after the level starts, not at once.
