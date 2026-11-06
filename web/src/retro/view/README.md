# `retro/view/`: showing pictures on the PC

Part of [`retro/`](../README.md) and the [source map](../../README.md). VPIC.EXE in `C:\COMM`, the picture viewer for GIFs and JPEGs downloaded from the BBS.

Entry point: `vpic.ts`, run from the DOS prompt.

- `vpic.ts`: VPIC.EXE.
- `picture.ts`: a 256-color graphics screen for pictures: VGA's 320 x 200 and the SVGA modes.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: none here. Check: `cd web && npx tsc --noEmit -p .`; download a picture from the GIF Gallery on `/dos.html` and view it.
