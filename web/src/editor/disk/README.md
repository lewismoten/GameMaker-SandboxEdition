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
- `similarBackgrounds.ts`: `.bbl` sets that would fit together; reported only, since joining them
  renumbers every map cell.
- `size.ts`: what the DOS export (`export/exportDos.ts`) ships, PLAYGAME's own files included, and
  the disks it takes at 1.44 MB and 720 KB (FAT12 clusters, the root directory's entry limit).
- `refs.ts`, `palettes.ts`, `blockSlots.ts`, `commit.ts`: which scene opens what, palette
  questions, block-slot placement, and writing a step's result (refusing when a file changed since
  the preview). A block is drawn with its own scene's palette wherever it is stored, so a merge
  never changes how a scene looks.

`games/kit/diskSpace.ts` runs the planner over every built game
(`cd web && npx vite-node ../games/kit/diskSpace.ts [id…] [--write] [--strict]`).
