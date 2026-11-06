# Scroll or Stay: tools

- `check.ts`: the bot plays both levels. `route.ts` asserts what each sign teaches: in level 1 the view (the engine's top-left block and pixel offset) never moves, even when Kit leans on the hedge at the far left; in level 2 it follows him the length of the level. Every coin is taken and no life is lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is both levels as one unbroken list of keys (the demo recorder counts game ticks across scene changes), stopped before the last door.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

Scrolling is four switches on each scene (up, down, left, right), `PLAYGAME.C` `ChangeScroll`. The view always starts with the hero's start block in the middle of the 16 by 10 block screen. With scrolling off the view stays there, so a level that stays must be the screen itself, 16 by 10, with Kit entering in the middle and visible walls all round. The map is 100 by 100 and wraps: a view that scrolls past a level's edge shows the other side of the map, so the kit continues the ground and sky outward and a visible hedge ends the level.
