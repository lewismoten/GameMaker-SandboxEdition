# Under the Surface: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: in level 1 Kit steps into the creek, holds Right and is carried back to the bank he came from, unhurt, then hops the stones; in level 2 he floats to the top row of the deep pool and swims across; in level 3 the tall pool lifts him up and to the left to the ledge. Every coin is taken and no life is lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is all three levels as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 4 with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

Water is only a gravity setting on a block (`PLAYGAME.C` `MoveCharGrav`): each tick the block the hero is mostly in adds 1 to his speed in every direction its bits name (1 up, 2 right, 4 down, 8 left) up to 44, and the move per tick is capped at 11 pixels, so a pull cannot be beaten by walking. A block with no bits lets his speed fade by 5/6 a tick, which is why the pools' top rows (no pull) settle a floater. Block gravity moves only the hero. A touched coin becomes air (which pulls down), so no coin goes inside water. There is no drag, no depth and no swimming frames: that is the "What it cannot do" page.
