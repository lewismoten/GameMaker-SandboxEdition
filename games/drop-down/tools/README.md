# Drop Down: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 Plop starts on its crate, Kit cannot hop over it (the mound's roof stops him), walking into the crate does nothing, a first hit (Enter) cracks it and a second breaks it, and Plop ends in the dip with its back level with the floor; in level 2 Pip starts on two crates, four hits break them (upper first), drifts down at most 2 px a tick, lands on the floor and does not push Kit. It then asserts all twelve coins.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: Kit reads the signs, tries to hop Plop, bumps the crate (nothing), hits it twice and walks over Plop.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Plop starts on its crate and ends in the dip.
- `shots.ts <outDir>`: before and after pictures of each level's lesson (not on the disk).
- `preview.ts [outDir]`: the block sheet, the hero, the monsters and every level and picture, as PNGs.
- `probe.ts`: not committed; a scratch script to poke the headless engine.
