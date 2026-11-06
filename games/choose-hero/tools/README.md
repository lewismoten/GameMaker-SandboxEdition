# Who Do You Want to Be?: tools

- `check.ts`: the bot plays both levels twice, once through each door. `route.ts` asserts what the signs say: Fast Feet takes both steps; Big Hops skips the first step with one hop and takes the three high coins; either one finishes with no life lost and every coin its hero can reach.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. Both pick the Big Hops door (scene 4); the demo is both levels as one unbroken list of keys, stopped before the last door.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 and 4 with no game over.
- `preview.ts`: PNGs of the blocks, both heroes, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A scene's file list has a slot for a character file (.CHR) and one for its character blocks (.CBL). The engine loads them when the scene starts (`PLAYGAME.C`, loadscene), so two scenes can load the same map with different heroes. Here the room's two door links go to scenes 3 and 4, which differ only in those two slots. Nothing carries the choice between scenes, and a hero cannot be swapped inside one.

A move is capped at 11 pixels a tick, so a jump push of 17 (Kit has 12) rises six blocks (measured), a little less than the sum of its steps would give.
