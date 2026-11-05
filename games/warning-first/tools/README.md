# Warning First: tools

- `check.ts`: the bot plays both levels. `route.ts` watches every tick: in level 1 each vent goes rumble, puff, rest in order for the lengths its blocks say (40, 30 and 90 ticks, give or take two), the first vent is stood on through its rumble and stings exactly once (10 hit points), and the other two are crossed after their puffs without a scratch; in level 2 the bridges go flicker, gone, solid on time, the bot stays on the first through its flicker and falls to the mat with nothing lost, hops out, then crosses each bridge while it is solid. It asserts the coins (4 and 4). The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: take the first puff, wait out the others).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it shows exactly one 10-point sting.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots (a vent at rest, rumbling and puffing; a bridge solid, flickering and gone).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot stands on level 1's first vent through its puff, and on level 2's first bridge through its flicker.
