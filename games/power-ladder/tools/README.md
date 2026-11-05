# Stronger Keys: tools

- `check.ts`: the bot plays all three levels. `route.ts` bumps the silver door with only the bronze key (level 1) and the gold door with only the bronze key (level 3): both stay shut. It takes the silver key, opens the door, and in level 1 spends the change on the bronze door. In level 2 one gold key pays for a bronze and a silver door. It asserts the coins (9, 10, 8) and wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the start of level 1, up to the silver door opening).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero bumps the shut silver door, then opens it, without dying.
- `preview.ts`: PNGs of the blocks, the hero, the levels and every picture. `ticks.ts`: how many ticks the bot takes each level (to size the demo).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot bumps a door it cannot pay for.
