# Under the Hood: tools

- `check.ts`: the bot plays all three levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the hero picks up the four bytes of Play and the gate takes all four; in level 2 START is bumped first and jams its slot (the block becomes the NO ROOM plate and the hero stays on this side), then the hero climbs to the GO slot, which opens; in level 3 the backup disk is picked up and the backup gate takes it. It also asserts every coin.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it shows level 1's lesson once: the four bytes picked up, and the gate takes all four.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.
- `play.ts`: the bot's whole game on the built disk, level after level (check, walkthrough and gendemo run it). `sim.ts`: the headless player pointed at this game's `disk/`.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here level 2's START slot is tried before the GO slot, and the check asserts that it jammed and did not let the hero through.
