# Teach, Test, Twist: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each level teaches: in level 1 the gap is jumped, then dropped into for its coin and climbed out of (50 points, nothing hurts); in level 2 the spiked gap is dropped into on purpose (whole spikes hurt, 10 hit points each) and the wider spiked gap is jumped with a run-up and no loss (70 points); in level 3 the key is fetched from the gap, the spiked gap is jumped and the locked door opens (95 points) with no more hit points lost. The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1, all of it).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it takes all five coins and reaches the exit.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the game for the progress shots.
