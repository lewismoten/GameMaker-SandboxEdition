# Round and Round: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the hills, the trees and the rail each go round their ring of blocks at least one and a half times, the nearer strips slide farther, and neighboring columns start half a tile apart; in level 2 the car is home at the start line at each lap (112 ticks), it is turned all four ways, a lamp lights as each lap ends, the barred door is solid when Kit comes to it, and it opens at tick 336 (the third lap), when Kit walks out.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the start of level 1: Kit drops onto the truck and waits while the scenery slides, then starts toward the door.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks each strip goes round its ring, the nearer ones farther.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots, taken from the real engine as the bot plays (the scenery at three moments; the car seen at several places round the loop; two lamps lit; the door open).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. This one has no mistake to make; the lessons are a ring of blocks, a path that ends where it began, and a lamp counted by the clock. Level 2's walkthrough waits at the barred door until the third lap is done.
