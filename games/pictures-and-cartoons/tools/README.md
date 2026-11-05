# Pictures and Cartoons: tools

- `check.ts`: the bot plays all three levels and must win without losing a life, taking all nine coins in each. It then runs `picturesCheck.ts`.
- `picturesCheck.ts`: reads the built `pics.gam` and checks each level scene's intro and exit slots: the files exist, every GIF and FLI is 320x200, the cartoon plays under six seconds, and the game has what it teaches (a picture before and after level 1, the cartoon after level 2, a list of two pictures before level 3).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1, to its door).
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it leaves level 1 by the door.
- `preview.ts`: PNGs of the blocks, the hero, each level, every picture and four frames of the cartoon.

Nothing in this game hurts, so there is no mistake for the demo to act out. Each lesson still happens once: the picture before a level, the picture after level 1, and (in the walkthrough) the cartoon after level 2 and the two-picture list before level 3. The headless player cannot see a picture; it only cuts a voice clip at one (`gameSim.ts`), so `picturesCheck.ts` is what proves the files are there and right.
