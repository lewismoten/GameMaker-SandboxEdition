# The Show: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. In level 1 Kit stops to read and comes to the stage after the play is over (nobody is on it), goes back through the encore door, then watches the whole play from the front: every act of Pip and Blu in order, and both speech bubbles. In level 2 he watches the cameo walk in, say hello once and go, and checks it does not come back. Then it asserts the coins (5 and 5).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: late to the stage, the encore door, then the play.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the level was entered twice (the encore door), the stage was empty the first time and every act happened the second.
- `timing.ts`: prints, tick by tick, which acts are on stage in level 1. The speech bubbles are timed to start when their speaker stops (`walkTicks` in `src/monsters.ts`: about 20 ticks a block at speed 1), so run it after changing a path or a lifetime.
- `preview.ts`: PNGs of the blocks, the hero, the actors, each level and every picture.
- `shots.ts <dir>`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

The mistake here is coming to the stage after the play is over: the bot does it once in level 1 and `route.ts` asserts the stage is empty, then takes the encore door.
