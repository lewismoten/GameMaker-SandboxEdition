# Make a Title: tools

- `check.ts`: the bot plays both levels. Each hall has three signs to read and a door at the end; the first door leads to level 2 and the second ends the game, with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: walk the hall to the third sign, without the door).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine, checks the hero walks to the third sign and stays in the first hall, and that the file holds no more than the 1,000 key changes a recording can (`RECLEN` in `code/GM/PLAYGAME.C`).
- `templateCheck.ts`: the templates on the disk (TMENU, TSCORES, TLOAD, TSAVE, from `src/templateBoxes.ts`) against the real engine: its own menu, high score and save and load drawing writes the longest words each screen can hold over a blank screen, and every pixel must land in a box, every box must get some, and no label may cover a box. `--out <dir>` writes PNGs of each template, its plain version and the template with words on it.
- `preview.ts`: PNGs of the blocks, the hero, each map and every picture. `shots.ts`: pictures of both halls for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the mistake is a picture: level 1 shows the menu with busy art under the game's words (they get lost) before the plain one, then the menu template with the real words inside its boxes. The halls themselves have no way to go wrong.
