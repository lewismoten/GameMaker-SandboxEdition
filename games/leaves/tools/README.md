# Leaves in the Wind: tools

- `check.ts`: the bot plays the whole game and must win without losing a life. `route.ts` reads the first sign, stops at each maple of the tumble until its leaf has come all the way down (the floating one takes longest), stops by each tree of the gust through a gust, and takes the last door. It also checks that no solid block is drawn like open ground, and that every leaf path fits a monster (ten corners at most, whole blocks, speeds 1 to 4) and lands on the row the hero walks on, inside the room.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the bot's run.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it enters scenes `2 3 1`.
- `preview.ts`: PNGs of the blocks, the leaf pictures, 16x10 views of each room with the hero in it (the size of the game's screen) and every picture on the built disk. The leaves are born while the game runs, so the room views show none.
- `shots.ts`: zoomed pictures of the leaves, the trees in each lean and three leaf paths, and pictures of the game playing from the walkthrough (the three leaves of level 1, a gust in level 2), for a stranger's look.
- `manual.ts`: draws the pictures the manual's "How this level is made" pages show into `manual.json` (`diagram.ts` draws a path).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Level 1's first two trees are the mistakes: a leaf of one picture going straight down, then a leaf whose eight frames turn it but whose path is still straight down. The walkthrough stops at each until its leaf lands, then at the floating one.

## Where the wind comes from

Level 2's leaf paths are not drawn by hand. `src/wind.ts` simulates each leaf one game tick at a time (gravity with lift while it glides, drag toward the air's speed, a side-to-side sway, and a breeze to the right that rises and falls by a seeded smooth noise), then cuts the flight to at most ten corners in whole blocks. `src/leaves.ts` picks, for each leaf, the first stretch of the wind that suits it: strong for a gust leaf, calm for the others. The same seeds give the same paths, so a rebuild changes nothing. Change a kind's `BODY` or the `AIR` there to change how all its leaves fly, then rebuild and rerun `check.ts`, `walkthrough.ts`, `gendemo.ts` and `manual.ts`.

## How the gust stays in step

Every top block of every crown is a loop of five blocks with the same times (`GUST_LOOP` in `src/levels.ts`), and the last block of each loop gives birth to a gust leaf every `GUST_EVERY` ticks. A block only gives birth while it is the one showing, and the engine gives birth before it turns the blocks over in a tick, so the block showing as each `GUST_EVERY` ticks come round is the loop's last one. The map holds the loop's first block for that reason. While you change the times, keep the loop's total equal to the birth time, or the leaves stop coming.
