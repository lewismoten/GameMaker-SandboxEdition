# Kit Ducks: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: in level 1 a held Space is still one hop of about three blocks, a tap of Up lifts Kit a little and drops him, and a held Up lifts him above the nine-block cliff; in level 2 a held Enter is one dash of about three blocks, and the three gaps need one, two and three presses. Every coin is taken and no life is lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is both levels as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 and 3 with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

Each key starts one sequence in the character file (`PLAYGAME.C`, the loop that steps `chr.cframe`). When a sequence runs out of frames the game looks at its settings: with "one sequence per key stroke" (`norepeat`) on, or when the key has been lifted, it goes back to the sequence before; otherwise it starts the frames again, so a held key keeps running them. A sequence with the Momentum setting adds its frames' x and y to the hero's speed, and gravity takes it back a step a tick (up to a top speed of 44); one without moves him directly. Either way his move per tick is capped at 11 pixels, which is why a dash is six frames of 11 (about three blocks) and not one big step. A sequence marked "cannot be interrupted" (`ground`) runs to its end whatever other key is pressed. There is one speed per frame and no way to change it halfway through a sequence, no way to tell how long a key was held, and a sequence has one key: a dash to the left needs a sequence of its own.
