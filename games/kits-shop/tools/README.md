# Kit's Shop: tools

- `check.ts`: the bot plays the level and must win without losing a life. `route.ts` asserts what the signs teach: six coins on the path, the gold and silver key stalls each take three, the heart stall does nothing with no coins left (a bump), two more coins from the ladder, the heart (a fourth life), two gates, the exit.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole level, up to the exit).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks both keys were bought with no coins left, then the heart.
- `preview.ts`: PNGs of the blocks, the hero, the level and every picture.

## What the engine does here

Money is counter 3, the one counter PLAYGAME prints as a number (F2, "Money: n"). A touch on a block whose Effect counter is 3 or 20 and up is refused when the counter plus the Effect amount is zero or less (`DoBlockTouchChar`, code/GM/PLAYGAME.C); a counter holds one more than the coins carried. A block has one Effect counter, so the price takes it and the item comes from the block the stall turns into (`give.key`, `give.silver`, `give.heart`: passable, add the item, turn into `sold`). The shop blocks are drawn in `games/kit/starter/shop.ts`.
