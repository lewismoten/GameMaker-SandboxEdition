# Who Wins?: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Kit throws nothing and waits while the big one pops both pips (and survives); in level 2 the first star is thrown at the big one, does nothing and is seen to fizzle, then a star pops the pip and another pops the grump, 50 points each. It then asserts all twelve coins.
- `bumpCheck.ts`: Kit walks through the big one at no cost, then pushes on into the pip for 3 seconds. He must stop in front of it with his hit points and lives unchanged and the pip still there.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit walks to the sign and waits while the big one pops the pips.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks both pips are gone, the big one still stands and no star was thrown.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots (the signs and charts, a pop, a fizzle).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here level 2's first star is thrown at the big one and fizzles, and the check asserts that nothing popped.
