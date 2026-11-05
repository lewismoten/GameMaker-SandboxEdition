# Buy It: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. Level 1: two coins and a bump at the stall (nothing happens, no coins taken), the ladder for two more, then three paid, one coin left and one gold key, the gold door. Level 2: the coin left over is still in the pocket, five more are taken, the stall takes five.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1 up to the payment).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks money peaks at four and ends at one.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture.

## What the engine does here

Money is counter 3, the one counter PLAYGAME prints as a number (F2, "Money: n"). A touch on a block whose Effect counter is 3 or 20 and up is refused when the counter plus the Effect amount is zero or less (`DoBlockTouchChar`, code/GM/PLAYGAME.C); a counter holds one more than the coins carried, so three coins pay a price of three. A block has one Effect counter, so the price takes it and the item comes from the block the stall turns into (`give.key`, passable, adds to counter 20 and turns into `sold`). The shop blocks are drawn in `games/kit/starter/shop.ts`.
