# `desk/disks/`: the disk box, labels and drive A:

Part of [`desk/`](../README.md) and the [source map](../../README.md). The floppies on the desk: the box they stand in, their printed labels and the buttons beside drive A:.

Entry points: `desk/desk.ts` and `desk/deskShelf.ts`. The disks' contents are in [`retro/dos/disks.ts`](../../retro/dos/disks.ts); `dosPage/diskMenu.ts` is the DOS page's version of the box.

- `diskBox.ts`: flip through the floppies and put one in drive A:. `diskBoxFill.ts` draws the closed box. `stripQueue.ts` draws labels' level strips one at a time, only when on screen.
- `diskGroups.ts`: the index-card dividers' groups, in the home page's collection names: My games and Imported in your case; Sandbox, Bizarre, Specials, Starters, Gameware and Shareware in the other. A group with no disks has no divider. Which groups are folded shut is remembered per browser (`gm-disk-box-folded`). `diskDividers.ts` draws them: a manila card with a colored tab before each group (the tab folds it), and the row of tabs above each case that goes to a group. While a search is on, every group stands open with its count (0 too) and a "No disks match" line; each case keeps its width whatever the search leaves. PageUp/PageDown step through the groups.
- `diskLabel.ts`: a Sandbox Software disk's printed label; `rsdLabel.ts`: RSD's own.
- `driveActions.ts`: Play, Design (or New game), Eject beside drive A:.
- `*.css`: each next to the module it styles.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `diskGroups.test.ts` (grouping, order, empty groups, folded groups). Check: look at the box at 1440 and 390 wide, put a disk in with the keyboard, and run `npx tsc --noEmit -p .`.
