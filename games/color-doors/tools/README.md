# Color Doors: tools

- `check.ts`: the bot plays the whole game and must win without losing a life. `route.ts` visits each of the five doors, asserts that it leads to its own scene, that the scene loads the right palette file and the same map file as the others, and that the way back lands one block beside the door Kit used. Then the last door ends the game.
- `viewCheck.ts`: the sign text keeps a contrast of at least 7 to 1 in all five palettes, and every palette is 768 bytes; it also lists which swatches run together in each view (a report, not a pass or fail). The views are a model, not a measurement of anyone's eyes.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the bot's whole run: all five doors, then the end.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it enters scenes `2 3 2 4 2 5 2 6 2 7 2 1`.
- `viewShots.ts`: Lena jumps (Space, Up and Space, Space walking) from several places, the view settles, and the real engine's picture is checked: the swatches, names, lamps and signs must stay inside it. `--out dir` writes the pictures; `--hall`, `--view 0..4`. Exits 1 if one is cut off.
- `preview.ts`: PNGs of the blocks, each room in each view's palette and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here nothing can go wrong; the "mistake" the game shows is the one it is about: a swatch that reads clearly in one room and runs into its neighbor in another (red and green in the red-green rooms), while the name under it does not.
