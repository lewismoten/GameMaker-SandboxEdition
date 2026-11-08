# Score Popups: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the plain coins pay 10 and leave nothing, and each of the three coin monsters pays exactly 100 and leaves a number that rises and is gone; in level 2 the gem and box pay 200 and 500 with numbers of their own, the stuck number is still blinking 200 ticks later, and the last coin's number leaves. It then asserts the scores (320 and 900).
- `touchCheck.ts`: Kit walks through the stuck number back and forth; it is not solid, costs nothing and pays nothing. The last coin's number leaves.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit takes the plain coins and the first coin, and its number rises and goes.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks one coin paid 100, its number appeared and is gone, and two coins are untouched.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is the coin whose number never leaves: Kit takes it, sees it blink in place, and walks on.
