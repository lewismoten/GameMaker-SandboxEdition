# Slide and Drift: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: in level 1 a tap of Right leaves a glide, a long hold leaves one at least twice as long, and Left turns Kit around; in level 2 a hop with Space alone goes nowhere and a hop with Right held crosses three gaps, 5, 8 and 10 blocks wide. Every coin is taken and no life is lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is both levels as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 and 3 with every coin of level 1 taken and no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A sequence with the Momentum setting (`CHRSEQ.Momentum`, `PLAYGAME.C`) adds its frames' x and y to the hero's stored speed (`gravx`, `gravy`) instead of moving him. Each tick he moves by that speed, capped at 11 pixels (`MAXGRAV`); the stored speed itself can reach 44. While no Momentum sequence is running, `OnGround` takes a sixth off the speed on any axis the block has no pull on (5/6 each tick), which is the glide. While one is running nothing takes speed away, which is why pressing the other way slows him slower than letting go. A solid side zeroes the speed against it. Here the four walking sequences are Momentum: the first of four frames adds 4, the rest add nothing, so a held key adds 1 a tick on average.
