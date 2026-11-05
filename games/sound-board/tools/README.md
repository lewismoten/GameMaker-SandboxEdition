# Sound Board: tools

- `check.ts`: reads the built files back and asserts what the ears get: the sound set holds nine different tunes and one silent one, none above 3000 Hz, the long one uses most of its 36 steps and the short one is short; Kit's jump and hurt play sounds 9 and 10; each pad's block changes the counter whose sound number its sign names, and turns into a pressed pad that changes nothing. Then the bot plays both levels. `route.ts` asserts what the engine is asked to play (`sim.ts` writes down each DoSound with its tick): each pad plays its number, the silent pad plays 3 (an empty sound), the replay door puts the pads back, the short sound starts within one sound's length of the long one (so it cuts it off), and the coin, key, gate, jump, spike and wrong gate play 5, 7, 8, 9, 10 and 6. The run wins without losing a life.
- `soundWav.ts`: writes every sound to a WAV file (a square wave like the PC speaker's, 0.35 of full scale) and checks none clips or runs past a quarter of a second; prints each sound's notes by name.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the whole run as one unbroken list of keys.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 2 3 1 (level 1, level 1 again by its replay door, level 2, the ending).
- `preview.ts`, `shots.ts`: PNGs of the blocks, the hero, each level and every picture; `shots.ts` makes the progress pictures.

## Starter rule: show the lesson once

The demo and walkthrough act out each sign's lesson: every pad plays once, the replay door puts them back, a jump through the long and short pair shows the cut-off, and in level 2 each thing that happens has its sound. The bot loses no life.
