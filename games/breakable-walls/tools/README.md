# Switches: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: the lever puts six on the red counter, the six dotted planks take them off one by one (the counter is back to empty and the bridge holds), and in level 2 the blue lever does not pay for red planks (Kit falls in, one life, back at the way in). Both bridges are crossed and every coin taken. The run wins; the one life the red planks take is on purpose (`play.ts` allows exactly that one).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is both levels as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door, so it shows the lever, the bridge and the wrong lever once each.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 3 (the fall re-enters scene 3) with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A block changes only itself when touched. A lever cannot change a plank across the room: they share a counter (22 red, 23 blue). A counter from 20 up refuses a touch that would take it to zero or less, which is why a dotted plank with nothing on the counter stays a dotted plank. A counter keeps its number when a life is lost, but the room's blocks (levers included) start again.
