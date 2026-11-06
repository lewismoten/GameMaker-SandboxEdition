# `retro/hexedit/`: HEXEDIT.EXE

Part of [`retro/`](../README.md) and the [source map](../../README.md). A 1994-style hex viewer and editor in `C:\DOS` for looking at how Game-Maker's files are laid out.

Entry point: `hexEdit.ts`, run from the DOS prompt.

- `hexEdit.ts`: the program.
- `hexFiles.ts`: where its files come from and go back to on the desk PC.
- `structure.ts`: its map of a file: which bytes are which field.
- `structureGm.ts`: maps of Game-Maker's own formats (.GAM, .MAP, block sets, .CHR, .MON, .PAL, .HIS, ...).
- `structureMedia.ts`: maps of the media files Game-Maker plays (.FLI, .GIF, .VOC, .CMF).

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: none here. Check: `cd web && npx tsc --noEmit -p .`, then run `HEXEDIT` on a `.GAM` on `/dos.html`. The maps should agree with `web/packages/engine/src/formats/` (inferred; compare when a format changes).
