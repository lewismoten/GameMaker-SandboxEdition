# Kit Ducks: tools

- `check.ts`: the bot plays both levels with `route.ts`, reading where the birds and balls are as a person would (it gives itself about a second's warning). In level 1 it walks straight into the first bird once and must lose hit points, then ducks under the other two and must lose none. In level 2 it ducks under a ball once (a duck is still in the row of his feet, so it hurts), then ducks for the bird and hops the ball with none lost, and takes every coin. No life is lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (both levels as one unbroken list of keys, stopped before the last door).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 and 3 with no game over.
- `manual.ts`: writes `manual.json`, including the enlarged stand and duck frames and the pixels where a bird touches each, computed the way the engine compares pictures. `preview.ts`: PNGs of the blocks, the hero with the duck frames, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A monster touches the character when its picture overlaps the pixels of the character's pictures, each compared with the monster at the row it is drawn in (`ChkMonChr` and `PicChkTouch` in `code/GM/PLAYBACK.C`, line 2171 on; `chkMonChr` and `picChkTouch` in `web/packages/engine/src/engine/monsters.ts`). A frame whose top picture is the "none" block (`CHARBL`) has nothing in the head row, so a monster there touches nothing. The same frame also leaves the top row out of the blocks the character touches (`GetTouchbl`, `ci.topthere`, `PLAYBACK.C` line 3201), which suggests a one-block-high tunnel could be crawled through; this game does not try it, and it would need a key to crawl on, because a key runs one sequence at a time.

Monster speed is in pixels a tick (a path corner's last number); Kit walks at 4. The bot's fliers are no faster than that, so one that turns around behind him never catches up.
