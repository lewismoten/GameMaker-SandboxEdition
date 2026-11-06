# Snow Trails: tools

Run from `web/` after `npx vite-node ../games/snow/build.ts`.

- `check.ts`: play both levels without losing a life. Checks animated snow, a hop leaving untouched powder, the return walk stamping it, a shallow drift becoming deep, and reaching the ending. Four new games and four forced scene reloads verify clean maps; repeated walks do not create monsters or grow the map.
- `route.ts`, `play.ts`, `sim.ts`: human-paced arrows/Space route and the shared headless PLAYGAME loop, pointed at this game's actual disk.
- `gendemo.ts`: record both lessons, including the hop and return walk, into `src/demo.ts`. Rebuild afterward. `demoCheck.ts` replays it on the actual player.
- `walkthrough.ts`: record both lessons and the ending, verified by the actual player.
- `shots.ts <dir>`: eight PNGs using the engine's renderer and live map/animation state, plus the built title. GameSim does not load palettes; the shot tool reads the palette named by the scene. No map reconstruction or guessed animation state.

The bank is visual, not a rising solid platform; soles are stamped per touched powder cell, not per animation footstep. Both limits are explained in the player-facing pages. Snowbound is a reference only; its artwork is not copied. Starter kit assets and Twinkle, Twinkle's tune are reused with their existing credits.
