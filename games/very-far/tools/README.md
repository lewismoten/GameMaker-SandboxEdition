# Near and Far: tools

- `check.ts`: the bot plays both levels and must win without losing a life, and the maps must have no invisible walls. `route.ts` asserts what each sign teaches. In level 1 the trail through the hedge lands Kit on the middle of the far plane, he takes the far coins, the trail there lands him back in the near plane, and he goes into the distance again to the far door. In level 2 he walks at the cliff and the cliff stops him, goes into the distance, walks past where the cliff is, and the far trail lands him in the near plane on the other side of it (a second window of the same map).
- `walkthrough.ts`, `gendemo.ts`, `demoCheck.ts`: re-record the walkthrough and the title demo, and check the demo. The demo is level 1's first scene: two coins, then the trail into the far plane.
- `preview.ts`: PNGs of the blocks, all four maps whole, each scene as the screen shows it (16 by 10 blocks around the landing cell, with Kit standing there, half size in the far plane, and the far palette) and every picture.

## Starter rule: show the mistake once

The mistake here is the cliff: the bot walks up to it and jumps at it in level 2, and `route.ts` asserts that it holds him back before the trail takes him past it. Level 1's mistake is stepping back out of the far plane: the trail there is a link of its own, so the bot comes back near and goes in again.
