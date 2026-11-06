# Around the Room: tools

- `check.ts`: the bot plays all four levels. `route.ts` asserts what each room shows: Space lifts the hero off the surface and the block's pull brings him back to where he stood, the first block stops him, and every block and trench is jumped with the arrow that points that way on the screen. The run wins, no life is lost and every coin is taken. `BOT_LOG=1` prints each step.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (all four levels as one unbroken list of keys, stopped before the last door).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 4 5 with no game over.
- `preview.ts`: PNGs of each room's blocks and hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

Gravity belongs to the block the hero is mostly standing in (`PLAYGAME.C` `MoveCharGrav`), a block's `grav` is four bits (up 1, right 2, down 4, left 8), and a sequence frame's x and y move him on the screen. Nothing turns the room: a wall level is the floor level with every block's Gravity changed, its pictures drawn turned, and a character file whose Left, Right, Up and Down sequences move him along the wall. The arrows always mean the way they point on the screen. A jump is a momentum frame that pushes away from the surface.
