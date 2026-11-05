# Parallax: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the hills, town and fence blocks change every 4, 2 and 1 ticks and each ring comes round (10, 10 and 5 pictures) while the sky does not change; in level 2 the wisps and clouds change at their own rates, the three suns fill at ticks 100, 200 and 300, the barred door is solid when Kit comes to it, and it opens with the last sun (about 16 seconds).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the start of level 1: Kit drops onto the path and waits while the three bands go by, then starts toward the door.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks the three bands change at their own rates and come round.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots, taken from the real engine as the bot plays (level 1 twice, five ticks apart; level 2 with no suns, two suns and the door open).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. This one has no mistake to make; the lessons are a ring of pictures that slides, bands that differ only in their wait, and blocks that turn into the next after a time. Level 2's walkthrough waits at the barred door until the last sun has filled.
