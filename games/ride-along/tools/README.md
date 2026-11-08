# Ride Along: tools

- `check.ts`: the bot plays all three levels and must win without losing a life. `route.ts` asserts what each sign teaches. In level 1 the hero jumps up to the ledge for its four coins. In level 2 the rocket rises 2 pixels a tick with no key held, Up makes it 4 and Down 1, Space does nothing, the first gate of rocks holds it (row 42, still, for 25 ticks) until it steers left, and it catches the stars on its path. In level 3 the canoe rises 1.5 pixels a tick on average, a paddle stroke is 4 for 6 ticks, and it catches every lily. The bot steers with Left and Right alone, looking a block and a half ahead.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: the walk to the ledge sign and the jump up to the ledge.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the hero jumped onto the ledge and took its coins.
- `preview.ts`: PNGs of the blocks, the hero, the rocket and the canoe, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.
- `play.ts`: the bot's whole game on the built disk, level after level (check, walkthrough and gendemo run it). `sim.ts`: the headless player pointed at this game's `disk/`.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is flying straight at the first gate of rocks: the rocket's push goes on, the rock holds it, and only steering to the side frees it. The check asserts the hold and that it was freed by steering alone.

## What the engine does (checked here)

The drift is the idle sequence's `y` (rideChars.ts). The manual says why the river is not made of block gravity: a block with Gravity up adds to the character's speed every tick until the engine's limit of 11 pixels a tick (measured on this game's canoe with the water set to pull up: 2, 4, 4, 6, 6, 8, 8, 10, 10, then 11 every tick). That is `MoveCharGrav` in `code/GM/PLAYGAME.C`, which adds 1 to the gravity speed each tick it is in a pulling block and clamps the move to 11.
