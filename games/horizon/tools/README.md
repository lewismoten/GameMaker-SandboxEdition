# To the Horizon: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 balls are born at the horizon in all three lanes and each passes through all four sizes on its way down (at least six are born); in level 2 the finish arch shows four sizes, the barred door is solid when Kit comes to it, and it opens at tick 350 (about 19 seconds), when the arch has arrived.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the start of level 1: Kit drops onto the road and waits while the balls roll out of the hill, then starts toward the door.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks balls are born at the horizon and grow through all four sizes.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots, taken from the real engine as the bot plays (balls at four sizes; the arch far, near and the door open).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. This one has no mistake to make; the lessons are a picture in perspective, hidden blocks that give birth, and blocks that turn into bigger blocks. Level 2's walkthrough waits at the barred door until the arch has arrived.
