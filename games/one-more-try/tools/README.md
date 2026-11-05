# Try Again: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: Kit falls into the pit and cannot jump out of it, touching the post enters the scene again (the coin is back in the pit, the score stays, Kit is at the way in), he then jumps the pit, and in level 2 he takes the coin in each of three pits and climbs out by a ladder, planks and solid blocks. The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1 as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door, so it shows the fall, the post and the restart once.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 2 (the post enters level 1 again) with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A scene link fires when one of the hero's touched squares is the square the link starts at; its target can be the scene the hero is already in. The scene is then loaded again (the map starts as built, so coins and touched blocks come back) and the hero is put at the link's `to` square. The hero's score stays. There is no key for it: the post has to be reachable. `route.ts` checks the pit is deep enough that he cannot jump out (a jump is a little over three blocks).
