# Quicksand: tools

- `check.ts`: the bot plays both levels (`route.ts`). In level 1 it stands still on the sand and checks the block under it gives way after as many ticks as its chain has links left (give or take 4), that the hole is one block deep, then jumps out and walks across without another block giving way. In level 2 it rests on two stones and checks they never sink, stops on the wet sand and checks it gives way much sooner than dry sand, jumps out and goes on. It asserts the coins (4 and 3) and that nothing costs hit points. The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: stand still, drop into the hole, jump out, walk on).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero drops into a hole with nothing lost.
- `preview.ts`: PNGs of each level's blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots (the sand at each stage under the hero, the hole, the stones).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot stands still on level 1's sand until it gives way, and stops on level 2's wet sand until it does too.
