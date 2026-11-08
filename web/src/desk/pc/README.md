# `desk/pc/`: the PC's case and the things on and around it

Part of [`desk/`](../README.md) and the [source map](../../README.md). The case front, the monitor's glass and glow, the keyboard and tray, the game pad, the speakers, the modem and the things taped or laid beside the monitor. The PC's insides are in [`retro/`](../../retro/README.md).

Entry points: `desk/deskPc.ts` switches the PC on and off and loads these; `desk/deskScene.ts` places them.

- Hardware settings: `machineSettings.ts` remembers and composes the existing CPU/disk estimates and the drive sound switches; `driveSwitches.ts` defines those switches (Spin, Heads and Read/write for the hard drive, CD-ROM and floppy, plus All drive sounds); `machineDialog.ts` opens from the MHz button, with `machineDialog.css` for phone layout.
- Case: `caseParts.ts` (drive cage, MHz display), `caseFace.ts` (key lock and printed parts), `bootSounds.ts`, `driveSounds.ts` (made on the spot with Web Audio).
- Monitor: `crtWarmUp.ts` with `crtOn.css` and `crtOff.css` (switch on and off), `crtWarp.ts` (the tube's bulge), `screenGlow.ts`.
- Input: `keyboard.ts`, `tray.ts` (slide-out shelf), `padChoice.ts`, `padChooser.ts`, `padPrints.ts` (mouse pad), `gamePad*.ts` (the GRAVITAS pad: art, SVG, panel, holds, TURBO switch).
- Sound: `speakers.ts`, `blasterSwitch.ts`.
- Beside the monitor: `keyCard.ts` and `keyCardRows.ts`, `codeWheelSpot.ts`, `capture.ts` (loaded by `captureStub.ts` on first press), `modem.ts`.

Each `.ts` with a `.css` of the same name owns that style.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `bootSounds.test.ts`, `cdTray.test.ts`, `driveSounds.test.ts`, `machineSettings.test.ts`, `keyStrip.test.ts`, `padChoice.test.ts`.

Check: `cd web && npx vitest run src/desk/pc`; then look at the desk at 1440 and 390 wide, light and dark.
