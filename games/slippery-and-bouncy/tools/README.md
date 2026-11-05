# Slippery and Bouncy: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: with no key held Kit slides on across the ice for 3 blocks or more into the spike (10 hit points); standing still on the belt carries him 8 blocks or more into another; the spring bounces him up onto the ledge; the wind lifts him up through the shelf and sets him on top, where a third spike waits. Each level costs one spike (Kit has 50), and no life is lost (`play.ts` fails on any). It also fails on a solid block drawn like sky (`kit/starter/invisibleWalls.ts`).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the whole run as one unbroken list of keys (the demo recorder counts game ticks across scene changes).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 4 1.
- `preview.ts`, `shots.ts`: PNGs of the blocks, the hero, each level and every picture.

## Starter rule: show the bad thing once

The demo and walkthrough show each sign's lesson, including the bad thing happening once: the slide on the ice, the ride on the belt and the walk on the shelf each end in a spike. A run that loses a life, or the game, fails.

## What the engine does here (checked with the headless sim)

A block's gravity bits say which ways it pulls: 1 up, 2 right, 4 down, 8 left. The hero is pulled by the block his feet are in. Each tick in it adds one to his speed that way (up to a top speed); outside any sideways pull the sideways speed fades by a sixth a step. So ice and the belt are the same setting (down and right) and differ only in picture and length, wind is up with no down, and a ledge is a block solid on its top side only.
