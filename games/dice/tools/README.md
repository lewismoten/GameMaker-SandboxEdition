# Roll the Dice: tools

- `check.ts`: the bot plays the level. `route.ts` watches every tick: the die goes face 1, 2, 3 ... 6, 1 in order, 10 ticks each (give or take two). The bot reads the signs, walks into the die and finds which face it stopped on (the still block on the map), then tries the wrong door first (it stays shut) and goes to the right one: the gold door on the ground for an odd face, the silver door up the ladder for an even one. It asserts the coins (4). The run wins with no life lost. Both roll outcomes were run once by hand (a longer wait before the touch gives a 3, and the shipped timing gives a 2).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it stops the die on a face without dying.
- `preview.ts`: PNGs of the blocks, the hero, the level and every picture. `shots.ts`: pictures of the die for the progress shots (rolling on three faces, then stopped).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot tries the door that does not match its key.
