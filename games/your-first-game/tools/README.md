# Your First Game: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: in level 1 the wall is jumped, the hill's coins and the first coins are taken and the gumdrop pops (130 points); in level 2 one spike is walked into on purpose (one hurt, 10 hit points), the pair is jumped, the locked door is bumped and stays shut, the key is fetched up the ladder and the door opens (105 points); in level 3 everything together (135 points) with no more hit points lost. The run wins with no life lost.
- `wallCheck.ts` (run by check.ts): the hero leaps at each locked door (level 2 from the key ledge and from the ground without the key, level 3 from the low wall) and at the hedge; none may get over, and both walls must be brick from world row 0.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1, all of it).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it takes all eight coins, pops the gumdrop and reaches the exit.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the game for the progress shots.
