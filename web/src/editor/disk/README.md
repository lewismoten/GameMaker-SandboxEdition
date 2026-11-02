# `editor/disk/`: the disk-space tool

Part of the [editor](../README.md) (the Overview's Tools tab). A DOS game's files are fixed size
(a `.mbl` is always 42,000 bytes, a `.mon` 19,200) however little they hold, and in 1994 every
byte meant download time and floppy space. This area finds files that can share one, offers to
merge them, and says how many 3.5" disks the game needs.

- `plan.ts`: `planDisk(files, gam)` returns the **steps** that are safe to apply (each is found by
  applying the one before to a copy and looking again, so a chain of merges previews whole) and
  the **notes**: near misses the tool leaves to the author. Findings are suggestions; the tool
  cannot see how a level plays, so run the Level check (and Make a walkthrough) after applying.
- `mergeMonsterBlocks.ts`: two `.mbl` sets whose drawn blocks fit in one file of 100 and whose
  scenes have a palette in common. The dropped file's blocks move into the kept file's blank slots
  (a twin is reused; a blank slot a kept monster still draws is not free), and every monster file
  only that set's scenes use points at the new block numbers.
- `mergeMonsters.ts`: two `.mon` files (used with one `.mbl`, so merge blocks first) whose
  monsters fit in one file of 64. Everything that names a monster by number follows: the maps'
  placements, a background block that gives birth to monsters, a character frame that fires one
  (`pic2 == MONBL`), and a monster's "becomes this when it dies". A map, block set or character
  that the kept file's scenes share with the dropped file's scenes is ambiguous, so that pair stays
  apart (the note says which file).
- `mergePalettes.ts`: two `.pal` files with the same 256 colors (always safe).
- `mergeBackgrounds.ts`: two `.bbl` sets whose scenes share a palette and whose drawn blocks fit in 150: the dropped set's blocks move into the kept set's blank slots (an identical block there is reused; `tools/block-merge`), its maps get the new numbers and its scenes open the kept file. The kept set is not renumbered. Pickups, required and starting items and block 0 keep their number or the pair stays apart. Planned last, after the monster and palette merges.
- `blockUse.ts`: the blocks a set's maps draw and what they turn into.
- `lookAlikes.ts`, `lookAlikeView.ts`, `pictureCanvas.ts`: per background set, the blocks drawn the
  same colors under every palette the set is shown with and with the same rules (found by
  `tools/look-alike`), and blocks of one shape in other colors, which stay (a scene has one palette).
  Pickups, a character's required and starting inventory blocks and block 0 keep their numbers.
  Reported with a picture of each block; applying comes next.
- `size.ts`: what the DOS export (`export/exportDos.ts`) ships, PLAYGAME's own files included, and
  the disks it takes at 1.44 MB and 720 KB (FAT12 clusters, the root directory's entry limit).
- `floppy.ts`, `floppyData.ts`: the card's picture, a 3.5" disk drawn on a canvas. The plastic is
  color 255 of the first palette that is not one solid color; the label is the title scene's first
  still picture (an animation if there is none) and the player's character block. A game with a title
  picture shows its name in that picture, so no title text is printed; one without (imported or in
  progress) gets its title written on the label, wrapped or shrunk to fit (`floppyTitle.ts`). No
  per-game override: a picture means it shows the title, except a picture of one solid color (every
  pixel the same palette index or the same RGB, as in a game from "New game"), which counts as none
  (`isBlankPicture`).
- `diskCard.ts` (the floppy and status line the Tools card draws, kept small so that tab stays
  light) and `diskTool.ts` (the dialog: sizes, the merges with a preview of each, Apply, and Undo
  through the project's file history, which stays while the project is open).
- `checkpointPanel.ts` and `compareDialog.ts`: the dialog's checkpoint (make, compare, restore, discard;
  `project/checkpoint.ts` keeps it in the game's stored record, so no export carries it) and the
  Before/After look around (the file changes from `tools/disk-diff`, then each level's map drawn
  both ways). Applying a merge makes a checkpoint first when there is none.
- `refs.ts`, `palettes.ts`, `blockSlots.ts`, `commit.ts`: which scene opens what, palette
  questions, block-slot placement, and writing a step's result (refusing when a file changed since
  the preview). A block is drawn with its own scene's palette wherever it is stored, so a merge
  never changes how a scene looks.

`games/kit/diskSpace.ts` runs the planner over every built game
(`cd web && npx vite-node ../games/kit/diskSpace.ts [id…] [--write] [--strict]`).
