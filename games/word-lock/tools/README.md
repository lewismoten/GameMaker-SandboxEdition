# Say the Word: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Kit collects three words, the first lock takes them and opens, the gold tray behind it gives them back, and the second lock takes them again; in level 2 (no tray) Kit bumps the exit lock with no words left and it stays shut, then collects the words on the ground and the ledge and pays each lock. It also asserts every coin.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it shows level 1's lessons once: three words picked up, the lock takes all three, and the tray right behind it gives three back.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.
- `play.ts`: the bot's whole game on the built disk, level after level (check, walkthrough and gendemo run it). `sim.ts`: the headless player pointed at this game's `disk/`.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here level 2's exit lock is bumped with an empty count, and the check asserts that it did not open.
