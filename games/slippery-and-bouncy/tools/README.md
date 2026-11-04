# Slippery and Bouncy: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: a spike takes exactly 10 hit points once, a heart gives exactly 10 back, and four spikes along the ground cost a life (the room starts again at its way in, hit points back to 30, lives one less). The second try takes the ledge hearts (50 hit points) first and survives, and the face adds a life. The run wins; the one life lost is on purpose (`play.ts` allows exactly that one).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the whole run as one unbroken list of keys (the demo recorder counts game ticks across scene changes).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 4 4 1 (level 3 twice, then the ending).
- `preview.ts`, `shots.ts`: PNGs of the blocks, the hero, each level and every picture.

## Starter rule: show the bad thing once

The demo and walkthrough show each sign's lesson, including the bad thing happening once: the bot takes a spike, mends with hearts, then runs out of hit points in level 3 and loses one life. A run that loses any other life, or the game, fails.
