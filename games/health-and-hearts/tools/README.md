# Health and Hearts: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: the lone spike costs exactly one sting (10 hit points), the pool exactly one life (the room starts again at its way in, hit points back to 50, lives one less), and the planks and the bridge cost nothing. The run wins; the one life the pool takes is on purpose (`play.ts` allows exactly that one).
- `bumpCheck.ts`: a scripted player stays in the spikes for 2 seconds (standing, then pushing on). He must live and lose at most 10 hit points per spike: they turn flat when touched, so nothing holds him in a hurt that never ends.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is levels 1 and 2 as one unbroken list of keys (the demo recorder counts game ticks across scene changes), so it shows the sting and the fall once each.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 3 4 (the fall re-enters scene 3) with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture.

## Starter rule: show the bad thing once

A Starter's demo and walkthrough show what each sign teaches, including the bad thing happening once. Here the bot walks into one spike, pauses so a watcher sees the hit points drop and the hurt pose, then falls into the pool once and comes back. A run that loses any other life, or the game, fails.
