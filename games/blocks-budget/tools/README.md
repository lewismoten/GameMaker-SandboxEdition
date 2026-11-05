# 150 Blocks: tools

- `check.ts`: the bot plays both levels and must win without losing a life, and the maps must have no invisible walls. `route.ts` asserts what each sign teaches. In level 1 Kit walks into the tower, stands in it and walks out of its far side without a jump (a picture is not solid), then takes six coins. In level 2 he walks through the houses (still pictures), leans on the brick wall until it is plain it does not give, then jumps it and takes nine coins.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1 as far as the tower: Kit walks into it and stands inside.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Kit was inside the tower and did not jump.
- `preview.ts`: PNGs of the blocks, both maps whole and every picture.
- `shots.ts <dir>`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

The mistake here is expecting a picture to be a wall: Kit walks into the tower and through it. In level 2 it is the other way, and he walks into a wall and is stopped. `route.ts` asserts both.
