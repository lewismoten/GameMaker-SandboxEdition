# Out Loud: tools

- `check.ts`: the bot plays all three levels. `route.ts` asserts what each sign teaches: Enter plays the HELLO clip and a second Enter starts it over; the first speaker's counter goes up and plays WELCOME; the second's goes down and plays DEEPER; a clip started over another cuts it (tried on a copy of the run, a person would wait); the last speaker's line (BYE) has ended before the door. The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (levels 1 and 2 as one unbroken list of keys, stopped before the last door).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 with no game over.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots.

## What the engine does here, and what it does not

A sound set (.SND) names, for each of its 30 sounds, a PC speaker tune and, optionally, a .VOC file that a Sound Blaster plays instead (code/GM/PLAYGAME.C `DoSound`). A sound starts when a character move that names it starts (Enter here), or when a block's touch changes a counter: sound 7 when a counter goes up, 8 when one goes down. A block cannot choose its own clip, only the counter does. One clip plays at a time: starting another stops the first (`PlaySbVocFile` calls `StopSound`), and a scene change frees the clip (`ShowGraphic`). Text pages and animations cannot play a voice. The file is read whole into memory when the sound starts, with a 16-bit byte count, so keep a clip under 64 KB (about 5 seconds at 11 kHz). The clips are hums made in `src/voices.ts`, not recordings.
