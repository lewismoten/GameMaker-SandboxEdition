# Wired Room: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches. Level 1: one red lever puts 3 on counter 22, three of the six dotted planks turn solid and Kit drops into the soft pool at the fourth (a link back to the way in, no life lost); then both levers (6) and the whole bridge. Level 2: both blue levers put 6 on counter 23, the odd red lever puts 2 on counter 24, and walking on opens the two-square hatch (another soft drop); the second time only the blue pair is pulled, the hatch stays shut under Kit and the bridge holds. Every coin is taken (12, then 10).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is both levels as one unbroken list of keys, stopped before the last door, so it shows the short bridge and the hatch once each.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 2 3 3 (each soft drop re-enters its scene) with no game over.
- Layout: the screen is 16 blocks wide and the first view is centered on the entrance, so each level puts its pool (the goal) within eight blocks right of the entrance, with the levers, ladder and ledge to the west. The bot walks west to pull them and back east to cross. `shots.ts` also writes `first-screen-1.png` and `first-screen-2.png`, the exact first view of each level.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A block changes only itself when touched, so a lever cannot change a plank or a hatch across the room: they share a counter (22, 23, 24). A counter from 20 up refuses a touch that would take it to zero or less, which is why a dotted plank with nothing on the counter stays a dotted outline and a hatch with nothing on its counter stays shut. There is no AND or OR: the bridge needs the sum of two levers' counts.

A scene link fires when the hero touches its first square, so a pool or a hole with a link at the bottom is a drop with no hurt. A link into the same scene starts the room again, and counters keep their numbers.

The hatch is two squares wide, and the red lever gives two. With one square a walking hero crosses it before he falls.
