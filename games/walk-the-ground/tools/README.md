# Dig It: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: in level 1 the rock stops Kit at the foot of the hill, he jumps and digs over it, tunnels through, and takes all four gold flecks; in level 2 he steps onto the soil trapdoor and sinks to the dirt floor, tunnels right under the lane of spikes without touching them, and climbs the ladder out. Every nugget is dug and no life is lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is both levels as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 and 3 with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

Digging is the block's touch setting (`PLAYGAME.C` `CheckTouch`, `really_checktouch`): each tick the cells the hero overlaps at his destination are touched, and a block with a `touchbl` is swapped for it in the map before the solid check, so a solid soil block is gone by the time the move is tested. Gravity pushes Kit into the block under his feet every tick, which is also a touch, so soil under him gives way. Only blocks on the screen are swapped (`onscrn`), so a ceiling at the very top edge of the view stays solid until the view scrolls: the tunnels here go sideways and down, and the way up is a ladder. There is no dig key, no side of a block and no refilling: that is the "What it cannot do" page.
