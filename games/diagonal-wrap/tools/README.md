# Diagonal Wrap: tools

- `check.ts`: the bot plays both levels, holding Down and tapping Left and Right to stay on the road. `route.ts` asserts what each sign teaches: the hedge stops Kit, the straight road takes him off the bottom of the map and in at the top once, the tilted road three times and across the right edge once, and level 2 takes about three times as many ticks as level 1. No life may be lost. It also checks that no solid block is drawn like open lawn.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the first part of the run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters the levels it should.
- `preview.ts`, `shots.ts`: PNGs of the block set, Kit's top-down poses, each level's whole map and every picture; and the progress shots (the start, the dashed edge and a lap sign, and a small picture of each whole map).

## Starter rule: show the mistake once

The demo and walkthrough walk Kit into the hedge once (he stops) before he runs the road.
