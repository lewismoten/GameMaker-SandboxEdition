# `retro/dos/`: DOS on the PC

Part of [`retro/`](../README.md) and the [source map](../../README.md). COMMAND.COM, the file system and the floppies.

Entry points: `retro/computer.ts` starts `shell.ts`; the designers use `workArea.ts` and `picker.ts`.

- `shell.ts`: COMMAND.COM: the `C:\>` prompt, built-in commands and running programs.
- `batch.ts`: the .BAT interpreter (DOS 3.30 to 5.0 rules): ECHO (on, off, `ECHO.`), REM, CLS, PAUSE, labels and GOTO, IF [NOT] EXIST / ERRORLEVEL / `a==b`, CALL, SHIFT and `%0`-`%9`. A .BAT named without CALL replaces the running one, as in DOS. Ctrl+C or Ctrl+Break between lines or at PAUSE asks "Terminate batch job (Y/N)?". SET, FOR and redirection or pipes print a "not supported in this PC" note; other lines go to the shell as typed. Runs RSD's C:\GM batch files (see below).
- `vfs.ts`: a small DOS file system: drives of 8.3 named files and folders.
- `hardDisk.ts`: game folders on C:\GM\<GAME>.
- `cDriveStore.ts`: what C: gained and lost since Game-Maker was installed.
- `disks.ts`: the 3.5" floppies in the desk's disk box.
- `sampleDisk.ts`: the Sample Disk and Sample CD (the Starters as small games).
- `deskClock.ts`: the room's one clock: real time plus the offset DOS's TIME and DATE set. `dosTimeEvent.ts` announces each TIME.
- `workArea.ts`: the designers' file handling (WINDIO.C loadany, saveany, delany).
- `picker.ts`: Game-Maker's file picker (getfname) with folders.
- `okMsg.ts`: OKMSG, the secret word GM.EXE passes to MENU, PLAYGAME and IMAGE.
- `gmPrograms.ts`: what each program in C:\GM runs as at the prompt. Typed by hand, the
  designers, UTILITY, PLAYGAME and IMAGE run on their own and quit back to the prompt; MENU
  refuses without OKMSG, and XFERPLAY finds no game of its own name there.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: `deskClock.test.ts`, `sampleDisk.test.ts`.

Check: `cd web && npx vitest run src/retro/dos`; then `TIME` and `DIR` at the prompt on `/dos.html`.

## RSD's batch files in C:\GM

They exist for PCs that cannot chain programs (`gmmenu.bat` and friends); each runs as on a real PC. No designer is given cOoL there: typed or run from a .BAT, a designer just quits to the prompt (see `gmPrograms.ts`).

| File                                           | What it does                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GMMENU.BAT`, `MM.BAT`                         | Clears, shows the Game-Maker main menu; the choice is typed at the prompt (PL, DE, UT, AB, QU, HE)             |
| `DE.BAT`                                       | The Design menu (PA, BL, MO, MA, CH, IM, SO, IN, MM, DH)                                                       |
| `PA`, `BL`, `MO`, `MA`, `CH`, `IM`, `SO`, `IN` | Clear, run PALCHOS, BLOCEDIT, MONEDIT, MAPMAKER, CHAREDIT, IMAGE, SNDEDIT or GRATOR, then show the Design menu |
| `PL.BAT`, `UT.BAT`                             | Run PLAYGAME or UTILITY, then the main menu                                                                    |
| `AB.BAT`, `HE.BAT`, `DH.BAT`                   | Type ABOUT.TXT, HELPBAT.TXT or HELPDESN.TXT, wait for a key, then the main menu (the last: the Design menu)    |
| `QU.BAT`                                       | Clears and goes up one folder (to C:\)                                                                         |
| `GOGM.BAT`                                     | Goes to C:\GM, runs GM with up to three parameters, returns to C:\                                             |
