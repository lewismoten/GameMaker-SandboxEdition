# Rooms on One Map: tools

- `check.ts`: the bot plays both levels and must win without losing a life, and the maps must have no invisible walls. `route.ts` asserts what each sign teaches. In level 1 every door lands the hero on the middle cell of the next room (red to blue to green, across the map); green's back door takes him to blue once, and he comes back and goes on to gold; eight coins. In level 2 he enters the hub twice by different doors and must stand on the very same cell, find the hub's coins back with the score kept, then go east and out.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1's first room: two coins and the red door, which lands in the blue room.
- `preview.ts`: PNGs of the blocks, both maps whole, each room as the screen shows it (16 by 10 blocks around the landing cell, with Kit standing there) and every picture.

## Starter rule: show the mistake once

The mistake here is a door that goes back: the bot takes green's back door once in level 1, ends up in blue again and walks on. `route.ts` asserts the landing both ways.
