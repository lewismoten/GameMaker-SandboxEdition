# Little Shadows: tools

- `check.ts`: the bot plays the whole game and must win without losing a life. `route.ts` walks the yard twice (past a pip on each ground), asserts that scenes 2 and 3 load one map file and their own pictures (`solid.*` or `dither.*`), watches the three hoppers, jumps once, watches the two bees and takes the last door. It also checks that no solid block is drawn like open ground.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the bot's whole run.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it enters scenes `2 3 4 5 1`.
- `preview.ts`: PNGs of the blocks, 16x10 views of each room with Kit in it (the size of the game's screen) and every picture on the built disk.
- `manual.ts`: draws the frames the manual's "How this level is made" pages show (Kit and a pip with each shadow, the hop's six pictures, the bee's four) into `manual.json`, with the shadow pixels in purple.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here nothing can go wrong. The mistakes the game shows are pictures: a pip that hops with no shadow (it floats), one whose shadow never changes (it looks stuck) and, next to them, the one that shrinks. The walkthrough stops at all three.

## How it is checked beyond the bot

The bee and its shadow are two monsters that must stay together. While you change their paths, run a few hundred ticks of scene 5 and compare the two monsters' x positions; they were equal at every tick when the game was made.
