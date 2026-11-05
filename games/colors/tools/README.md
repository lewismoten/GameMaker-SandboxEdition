# Colors That Work: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each level teaches: in level 1 the two red plates sting 5 hit points each (30 to 20) and the green ones don't; in level 2 the bot jumps the two spikes and walks the light striped plates, so it costs nothing. Each level then gives its three coins.
- `colorCheck.ts`: the color-vision check. It takes each level's two blocks (the one that stings and the safe one) and asks whether a player with normal vision, deuteranopia, protanopia or tritanopia can still tell them apart, by color (mean delta E of 25 or more) or by shape (a fifth of the block's cells differ). Level 1 must pass for normal eyes and fail for deuteranopia (that is the lesson); level 2 must pass for all four. It uses `games/kit/colorVision.ts` (the Machado, Oliveira and Fernandes 2009 matrices). Level 1's green is tuned to the red for deuteranopia, the common kind; protanopia is not matched, so the check lists it without a requirement.
- `shots.ts`: PNGs of both levels, whole and zoomed on the row of plates, as you see them and as the three kinds of vision see them.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run as one list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 1 (both levels, then the ending).
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture on the disk, including each level card's second and third pictures (`oneview`, `onealike`, `twoview`, `twoalike`).

## Starter rule: show the bad thing once

The demo and walkthrough show level 1's mistake once: the bot walks across the red plates it cannot pick out by color and gets stung twice, then jumps the spikes in level 2 without a scratch.
