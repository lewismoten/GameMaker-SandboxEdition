# Road Tiles: tools

- `check.ts`: the bot plays all three levels and must win without losing a life, and the maps must have no invisible walls. `route.ts` asserts that every block he stops on is road (the straights and round corners, the diagonals and the triangles beside them, the crossroads, the T and the bridge), that each level's finish line lands him on the next level's first block in the idle pose, and that the water beside the bridge stops him. The scenes entered must be `2 3 4`, then the ending.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters the same scenes and plays every key.
- `preview.ts`: PNGs of the block sheet and each whole level (default folder: the system temp dir).

## Starter rule: show the mistake once

The mistake here is the river in level 3: the bot walks off the bridge into the water once, and is stopped, before it crosses.
