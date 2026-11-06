# `retro/dos/`: DOS on the PC

Part of [`retro/`](../README.md) and the [source map](../../README.md). COMMAND.COM, the file system and the floppies.

Entry points: `retro/computer.ts` starts `shell.ts`; the designers use `workArea.ts` and `picker.ts`.

- `shell.ts`: COMMAND.COM: the `C:\>` prompt, built-in commands and running programs.
- `vfs.ts`: a small DOS file system: drives of 8.3 named files and folders.
- `hardDisk.ts`: game folders on C:\GM\<GAME>.
- `cDriveStore.ts`: what C: gained and lost since Game-Maker was installed.
- `disks.ts`: the 3.5" floppies in the desk's disk box.
- `sampleDisk.ts`: the Sample Disk and Sample CD (the Starters as small games).
- `deskClock.ts`: the room's one clock: real time plus the offset DOS's TIME and DATE set. `dosTimeEvent.ts` announces each TIME.
- `workArea.ts`: the designers' file handling (WINDIO.C loadany, saveany, delany).
- `picker.ts`: Game-Maker's file picker (getfname) with folders.
- `okMsg.ts`: OKMSG, the secret word GM.EXE passes to MENU, PLAYGAME and IMAGE.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: `deskClock.test.ts`, `sampleDisk.test.ts`.

Check: `cd web && npx vitest run src/retro/dos`; then `TIME` and `DIR` at the prompt on `/dos.html`.
