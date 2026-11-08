# Home Keys: tools

- `check.ts`: the bot plays the whole game twice. The first run has no detour and must win pressing only the arrows, Space and Enter (the check lists any other key it pressed). The second run also takes level 3's extra coins and may press only Q and E, and only in level 3. `route.ts` asserts what each sign teaches: a jelly holds Kit until a star pops it (two jellies, two presses of Enter), a hop and Right cross both gaps in level 2, and E and Q put Kit on the two shelves, with Q from the first shelf up to the ledge above it.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough (with the extras) and the title demo (the whole run as one unbroken list of keys, stopped before the last door).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2, 3 and 4 with no game over.
- `manual.ts`: writes `manual.json`, with the keyboard drawn as an SVG from `src/keyboardLayout.ts`, the same list the HOW TO PLAY picture is drawn from.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A character file holds twenty sequences and each has one key (`PLAYGAME.C` steps `chr.cframe`), by PC scan code: the arrows are 75, 77, 72 and 80, Space 57, Enter 28, Q 16, E 18, and the number pad's 7, 9, 1 and 3 are 71, 73, 79 and 81. Any key can be bound, and several sequences can run together, so Space and Right held at once give a jump that goes right. A diagonal key is just another sequence: Q and E here are a push up and a push sideways in one press. A solid monster with power 150 cannot be killed by touch (100 or more), and a star's 200 can. The web player takes Home, Page Up, End and Page Down as the number pad's 7, 9, 1 and 3.
