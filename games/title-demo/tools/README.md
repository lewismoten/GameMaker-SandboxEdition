# Cutscenes: tools

- `check.ts`: the bot plays both levels. `route.ts` watches the stage floors: level 1's floor is shut, flashes on tick 252 and opens on 306, and each tale's quick floor flashes on 54 and opens on 90. The bot pushes at the stage's right-hand wall first (it is not a way out), then waits; in level 2 it climbs to each door in turn (two tales, then the end). The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: walk across the stage to the wall).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero walks to the wall and the demo ends with the floor still shut.
- `preview.ts`: PNGs of the blocks, the hero, each map and every picture. `shots.ts`: pictures of the lessons for the progress shots (the stage shut, flashing, and dropping, and the menu room).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot pushes at level 1's right-hand wall as if it were a way out before it waits for the floor; level 2's doors are all ways on, so it has no way to go wrong.
