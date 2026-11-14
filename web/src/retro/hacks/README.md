# `retro/hacks/`: the Warez area's programs and the PC's utilities

Part of [`retro/`](../README.md) and the [source map](../../README.md). Utilities of the kind passed around BBSes in the 1990s, plus the fictional scene releases in the Sandbox BBS's Warez area. Most are DOS programs on the PC; each has a `...Text.ts` for its .NFO, FILE_ID.DIZ or manual, kept apart so the BBS file list can show the words without loading the program. The parent README has the full account of what each does.

Entry points: `retro/computer.ts` runs them from the DOS prompt; `retro/bbs/warezArea.ts` and `sofaFiles.ts` list them.

- `saveHack.ts`, `saveGames.ts`, `saveHackText.ts`: SAVEHACK.EXE, a save game editor, and the games it works on.
- `backupExe.ts`, `backupArgs.ts`: BACKUP.EXE in C:\DOS and its command line.
- `gmcrack.ts`, `gmcrackSerial.ts`, `gmcrackText.ts`, `cracktro.ts`: GMCRACK.EXE, its made-up serials, its words and its intro.
- `playHack.ts`, `playHackDisk.ts`, `playHackGroups.ts`, `playHackText.ts`: PLAYHACK.EXE, which edits a game's player.
- `gm30Install.ts`, `gm30Text.ts`: the "rip" of Game-Maker 3.00 and its installer.
- `patchingText.ts`: PATCHING.TXT and its FILE_ID.DIZ.
- `flags.ts`, `flagsItems.ts`, `flagsBackup.ts`, `flagsPlayed.ts`, `flagsText.ts`: FLAGS.EXE, the desk PC's hard-to-see browser state. `flagsDesk.ts` holds the newer desk items (GRADES for Starter grades and graduations, COURIER, BUDDY, CHICKEN, TOUR); `flagsTypes.ts` the item type and its error.
- `flagsHelp.ts`, `flagsBackupKeys.ts`: Command help loads with FLAGS, while the backup key list lets the PC list FLAGS.BAK without loading flag handlers or the achievement catalog.
- `roomFix.ts`, `roomFixItems.ts`: ROOMFIX.EXE, putting the room's small remembered states back.
- `fastPlay.ts`, `fastPlayText.ts`: FASTPLAY.EXE, the first-run setup policy.
- `reggie.ts`, `reggieText.ts`: REGGIE.EXE, who the rubber chicken is.
- `dosUi.ts`: the look of a 1994 shareware utility in text mode, shared by several.
- `deskFiles.ts`, `pcExtras.ts`: files and changes the BBS and GMCRACK add to the PC's C: drive.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: `fastPlay.test.ts`, `flags.test.ts`, `patchingText.test.ts`, `playHackDisk.test.ts`, `playHackGroups.test.ts`, `reggie.test.ts`, `roomFix.test.ts`.

Check: `cd web && npx vitest run src/retro/hacks`.
