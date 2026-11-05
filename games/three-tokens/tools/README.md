# Three Tokens: tools

- `check.ts`: the bot plays the whole game on the built disk and must win without losing a life (`BOT_LOG=1` prints every step). `route.ts` gives it the orders and asserts what each sign teaches. In level 1 (Three for the Gate) Kit takes two tokens, bumps the three-slot gate (it stays shut and takes nothing), climbs the ladder for the third, and the gate then opens and takes all three. In level 2 (The Gate Is the Exit) he starts with no tokens, takes two on the ground and three on the ledge, and the five-slot gate that is the exit takes all five. It also asserts the coins.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the whole of level 1: two tokens, the gate that stays shut, the third token, the gate that opens.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Kit is stopped by the gate once with two tokens, then takes the third and the gate opens and takes all three.
- `preview.ts`: PNGs of the block sheet, the hero's poses, the monsters, each level's whole map and every picture on the built disk.
- `shots.ts`: PNGs of the lessons for the progress shots (never on the disk): in level 1 Kit stopped at the three-slot gate with two tokens, then the third token on its ledge; in level 2 the five-slot gate that is the exit.
- `play.ts`, `sim.ts`: the bot's whole game on the built disk, and the headless player it uses.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here level 1's gate is tried with two tokens and stays shut, and the check asserts that it let no one through and took nothing.
