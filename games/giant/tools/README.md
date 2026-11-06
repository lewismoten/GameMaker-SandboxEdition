# The Giant: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. Level 1: from the ground one star pops each bottom part (20 points, nothing else changes); a star thrown from the ground at the head changes nothing (the mistake); from the step one star pops each top part; then the tunnel is open and the coins are all taken (6). Level 2: a hit part becomes the blinking monster, a star thrown through it hits the one behind, a third quick star while both blink scores nothing (the mistake), both are cracked once the blink ends, and a second hit pops each; bottom pair from the ground, top pair from the step; then the coins (7).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the start of level 1: two pops from the ground and a star under the head.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks both bottom parts popped, the head is untouched and three stars were thrown.
- `preview.ts`: PNGs of the blocks, the hero (with the three throw poses), the monsters, each giant put back together (`giants.png`), each level and every picture.
- `shots.ts <dir>`: pictures of the lessons for the progress shots.

## Starter rule: show the mistake once

Level 1's mistake is a star thrown at the head from the ground; level 2's is a star thrown while both bottom parts blink. `route.ts` asserts each does nothing.
