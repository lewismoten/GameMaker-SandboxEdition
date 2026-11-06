# Lightning: tools

- `check.ts`: the bot plays both levels. `route.ts` waits for a flash at each sign and counts, from the blocks the engine shows, that every timed block (the sky and each lit twin, the bolt, level 2's stones) turns lit in the same tick and stays lit 3 ticks. In level 2 it walks into the ditch on purpose, walks back up the step, waits for a flash and hops the three stones. It also checks that every timed block keeps the same round (117 dark, 3 lit), so nothing drifts out of step with the sky or the song, that no life is lost and that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1, then level 2 up to the drop into the ditch and back out).
- `demoCheck.ts`: plays the title demo headless: scenes 2 and 3, every key played.
- `frames.ts`: works out which block each cell shows a given number of ticks in (the same way PLAYGAME does), for the previews and shots.
- `preview.ts`, `shots.ts`: PNGs of the block sheets, each level dark and in the flash and every picture; and the progress shots (the bolt sign and the stones, dark and lit, and the bolt's five blocks).
