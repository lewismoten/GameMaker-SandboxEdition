# Beat the Clock: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: in level 1 the bar goes dark and the gate shuts at tick 300 and is solid, the clock door starts the level again with a full bar and an open gate, and the second go gets through with time to spare; in level 2 the gate shuts at tick 225, a push into it gets nowhere, the bar refills and the gate reopens at tick 305. It then asserts the coins (13 and 9). The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: out of time once, the clock door, then in time).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the gate shuts, the level starts again with it open, and the exit is reached.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots (bar full, going out, dark with the gate shut, the clock door).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot is too slow in level 1 and finds the gate shut before it takes the clock door and runs; and it reaches level 2's gate while it is shut and waits.
