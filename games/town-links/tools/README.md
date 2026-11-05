# Maps Within Maps: tools

- `check.ts`: the bot plays the whole trip and must win without losing a life, and the maps must have no invisible walls. `route.ts` asserts what each sign teaches. Kit walks the trail onto the town block and must land on the town's south gate in the idle pose; bumps the locked yard gate (the mistake) and is stopped; goes out by the south gate and must land on the world map just below the town block, not at the start; takes the key; comes back to the town, where the gate now opens (the key counter is kept across scenes); goes in at the house door and must land inside, goes out and must land in the yard just below the door, goes in again, takes the three coins and leaves by the far door. The scenes entered must be `2 3 2 3 4 3 4`, then the ending.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the whole run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters the same scenes and plays every key.
- `preview.ts`: PNGs of the block set, Kit's facings, each map whole, each place as the screen shows it where Kit lands (the world with the tiny Kit, the town gate, the yard, the house) and every picture; for the progress shots.

## Starter rule: show the mistake once

The mistake here is the locked gate: the bot walks into it once, and is stopped, and has to go out to the world map for the key before the gate lets it through.
