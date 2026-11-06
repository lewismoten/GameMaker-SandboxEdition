# `retro/computer/`: the PC's parts and drives

Part of [`retro/`](../README.md) and the [source map](../../README.md). The PC's hardware seen from the programs: screen modes, drives, folders, sound and the startup files. `../computer.ts` is the PC itself (power, boot, programs); this folder is what it is built from.

Entry points: `retro/computer.ts` imports `drives.ts`, `setup.ts` and the rest. The page around the PC (the desk or `dosPage/`) supplies `setup.ts` `ComputerOptions`.

- `drives.ts`: the PC's parts and drives: screen modes, the keyboard queue and the file system's drives.
- `folders.ts`: game folders on the PC's disks: which game is in one, and making it editable.
- `setup.ts`: the PC's options, monitor modes and startup files on C:.
- `pcAudio.ts`: the PC's own line to the speakers (the BIOS beep and everything the PC itself plays).
- `soundBlaster.ts`: the remembered Sound Blaster card, which programs may read at startup.
- `mouseDriver.ts`: AUTOEXEC's mouse line at boot, usually plain and now and then a day of its own.
- `monitor.css`: the picture inside the monitor (`.crt`), wherever the monitor is.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: `mouseDriver.test.ts`; the boundary test above.

Check: `cd web && npx vitest run src/retro/computer src/dosPage`.
