# Power Up: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: an ordinary jump falls short of the ledge, a star gives exactly 4 high jumps and one is used landing on it; an ordinary jump drops into the canyon (nothing hurts) and the steps lead out, each sneaker gives 50 strides and the leap across lands on the far side. The run wins with no life lost.
- `powerCheck.ts`: what a power does as it runs out: four high jumps of about six blocks, then the ordinary three; the sneakers double the walk until their strides are used up, then the ordinary walk is back; standing still uses nothing (nothing counts time).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (both levels as one unbroken list of keys, so it shows the short jump, the star, the high jump, the drop, the sneakers and the leap once each).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 1 (both levels, then the ending).
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake happening once. Here the bot jumps under the ledge and falls short, then finds a star; and it jumps at the canyon with an ordinary jump and drops in, then finds the sneakers. Nothing in this game hurts, so a run that loses a life fails.
