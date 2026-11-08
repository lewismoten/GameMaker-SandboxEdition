# Snow Trails: tools

Run from `web/` after `npx vite-node ../games/snow/build.ts`.

- `check.ts`: play all three levels without losing a life. Checks animated snow, a hop leaving untouched powder, the return walk stamping it, a shallow drift becoming deep, prints in the open field that face all four ways and fade to nothing, a held arrow keeping a trail of dozens (well under the 200 monster slots), and reaching the ending. Four new games and four forced scene reloads verify clean maps; repeated walks do not create monsters or grow the map.
- `route.ts`, `play.ts`, `sim.ts`: human-paced arrows/Space route and the shared headless PLAYGAME loop, pointed at this game's actual disk.
- `gendemo.ts`: record the three lessons, including the hop and return walk, into `src/demo.ts`. Rebuild afterward. `demoCheck.ts` replays it on the actual player.
- `walkthrough.ts`: record the three lessons and the ending, verified by the actual player.
- `shots.ts <dir>`: PNGs (including level 3 in four directions and six frames of a trail fading) using the engine's renderer and live map/animation state, plus the built title. GameSim does not load palettes; the shot tool reads the palette named by the scene. No map reconstruction or guessed animation state.

The bank is visual, not a rising solid platform; soles are stamped per touched powder cell, not per animation footstep. Both limits are explained in the player-facing pages. Snowbound is a reference only; its artwork is not copied. Starter kit assets and Twinkle, Twinkle's tune are reused with their existing credits.

Level 3's prints are monsters (`src/prints.ts`): the top-down hero's walking sequences have frames whose bottom block is MONBL, which gives birth to a monster at his feet. Each of eight monsters (four facings, two feet) shows four pictures in turn and has a lifetime, so every print fades on its own clock; a map tile cannot, because every tile of a block changes together (PLAYGAME `changeblks`).
