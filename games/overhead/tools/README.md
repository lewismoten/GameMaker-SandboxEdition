# Overhead: tools

- `check.ts`: the bot plays both levels and must win without losing a life, and the maps must have no invisible walls. `route.ts` asserts what each sign teaches. In level 1 each arrow plays its own walking sequence (the picture that faces that way) and walks him, Space does nothing, the table stops him, and he goes round it by the rug for its four coins and out by the door. In level 2 he leaves the meadow by its north edge and must land on the middle of the woods in the idle pose; takes the woods' three coins and comes back south into the meadow (links go both ways); goes east to the pond for three coins and north to the village; is stopped by the house wall; goes in by the door for the shop's three coins, out by its back door, in again and out by the exit door. The scenes entered must be `2 3 4 3 6 5 7 5 7 1`.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters the same scenes and plays every key.
- `preview.ts`, `shots.ts`: PNGs of the block set, Kit's four facings, each map, each area as the screen shows it and every picture; and pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

The mistake here is the table in level 1 and the house wall in level 2: the bot walks into each once, and is stopped, before it goes round the one and through the door of the other.
