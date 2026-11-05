# Beams and Fog: tools

- `check.ts`: the bot plays the whole game and must win without losing a life. `route.ts` reads the first sign, stands in each of the three beams, crosses the solid fog and the dithered fog, stands under the drifting fog and under each lantern, and takes the last door. It also checks that no solid block is drawn like open ground.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the bot's whole run.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it enters scenes `2 3 4 1`.
- `preview.ts`: PNGs of the blocks, 16x10 views of each room with Kit in it (the size of the game's screen) and every picture on the built disk.
- `shots.ts`: zoomed pictures of the lessons (the wall and its lit twins, the hills in both fogs, the lanterns) for a stranger's look.
- `manual.ts`: draws the frames the manual's "How this level is made" pages show into `manual.json`, with the painted pixels in purple.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here nothing can go wrong. The mistakes the game shows are pictures: a solid beam that hides the bricks, solid fog that hides the trees, and a solid halo, each beside the dithered one. The walkthrough stops at all of them.

## How it is checked beyond the bot

The three puffs of a fog bank are three monsters that must stay together. While you change their paths, run a few hundred ticks of scene 3 and compare the monsters' positions; they stayed exactly one block apart at every tick when the game was made.
