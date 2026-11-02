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
- `shrinkGifs.ts` (`kind: 'gif'`, one step for all pictures; logic in `tools/gif-shrink`): a `.gif` whose color table is bigger than the colors it draws with shrinks to the smallest power of two (at least 4) that holds them. PLAYGAME (`code/GM/GIFC.C` `intro`/`readcols`) loads the table into VGA colors 0..N-1, zeroes the rest, and uses N as the LZW clear code, so a color is never renumbered and a table only shrinks when every dropped entry is already black: decoded pixels and all 256 screen colors stay identical (the proof checks it). The step touches no `.gam`, block number or saved game. PNG is not a game file (the DOS export has none), so nothing handles it.
- `mergePalettes.ts`: two `.pal` files with the same 256 colors (always safe).
- `mergeCharacterBlocks.ts`: two `.cbl` sets (50 blocks) that share a palette and fit in one file: blocks move into free slots (a twin is reused), the dropped set's `.chr` frames (top and bottom picture; birth frames have none) follow, scenes open the kept file. Refused when a `.chr` is used with both sets. No built game has two, so the proof shows no such step yet.
- `reduceColors.ts` and `reduceView.ts`: color reduction proposals, planned around the project's palette reservations (`editors/palette/paletteReservations.ts`): a block file that draws with another kind's reserved colors would move those pixels to the nearest allowed color (its range plus the unreserved colors; `tools/color-reduce`), with a delta E score and the blocks before and after. Never a step (it changes the look); applied one file at a time after a checkpoint. `rangeDrift` reports sprite files whose reserved colors differ between the palettes their scenes show.
- `reservePlan.ts`, `rangeSync.ts`, `spriteColors.ts`, `reserveView.ts`: palette reservations for a game with none (`tools/palette-reserve` `planRanges`: a range per sprite role, sized by the colors its blocks draw, placed where other blocks use the fewest of those numbers; shown on a strip of the palette; saved to the companion only on a click). `rangeSync.ts` makes a role's reserved range identical in every palette its files are shown with (colors move in, pixels renumbered, too many colors reduced by delta E): a **step** (`sync`, first in the plan) when no scene would draw differently, otherwise a proposal with before and after blocks and a score, applied on a click. A palette a slide or animation scene opens is never edited, and a range other blocks still draw with refuses until their colors are reduced.
- `packAll.ts`, `packView.ts`, `sceneDelta.ts`: **Pack with reserved palettes**, the whole route in one preview (a button "Look for more savings", so the dialog opens fast). With the project's reservations, or the ranges `reservePlan.ts` proposes for a game with none, it chains the color reductions and range syncs they call for, then plans every merge again. It reports the bytes saved (and how many more than the plain steps), how many map pixels would draw differently and the delta E mean and worst (`sceneDelta.ts`, over every scene's map), and applies in one click: checkpoint if ticked, one undo step, the ranges saved to the companion when proposed, block names and groups following (`remapExtras.ts`). The plan is dropped when any file changes after it was made. `optimize:proof` runs this same plan.
- **Monsters and characters only** (`PackMode` in `packAll.ts`): the Pack section finds both ways and shows each with its steps, bytes saved and delta E; the radio picks which one Apply runs. The sprites-only pack leaves out look-alike folds, background-set merges and background color reductions; `backgroundsKept.ts` checks that every scene still opens the same `.bbl` bytes and that every color number its drawn blocks use is the same RGB in the scene's palette (otherwise that pack is not offered). `optimize:proof` prints it per game.
- `blockSlots.ts` places only the blocks something draws (monster pictures, character frames, map cells), and a later identical block in the dropped file shares the slot an earlier one took, so unused and repeated blocks never take room in a merged file. There is no separate pack step: a DOS block file is a fixed size, so dropping or sharing a block saves nothing until two files become one.
- `blockSheet.ts`: a block file drawn as a grid of its slots (15 columns) in a scene's palette; the Compare dialog shows the changed block files before and after.
- `savesSafe.ts` and `savesWarning.ts`: which steps change what a saved game holds (`code/GM/PLAYGAME.C` `SaveGame` stores scene numbers, the map as block numbers, the character's blocks, live monsters by monster and picture number; no pixels, colors or file names). Safe: picture tables, palette merges, range syncs, color reductions, a block merge where no block changes number. Not safe: monster-file merges, look-alike folds, block merges that renumber. While the game has saved games the dialog applies in place only the safe ones (`planDisk(..., keepSaves)`) and says how many more steps it holds back.
- `optimizedCopy.ts`, `makeOptimizedCopy.ts`: **Make an optimized copy** applies every step to a new game in My Games (files and editor notes copied; this game, its checkpoints and saves untouched). Its name says where it came from: "Tune-Up (optimized from v2.0)" in My Games, and the `.gam` title (the DOS menu's, 19 characters) says "Tune-Up (opt v2.0)", the title cut short to fit, else just "(opt)". The version is the release tag the game is exactly at, else the menu version, else the newest tag with a "+", else the date. A pack that would renumber while saves exist offers the copy instead.
- `lookAlikeFold.ts`: the fold as a step (`kind: 'look'`), one block set at a time: blocks drawn alike under every palette the set is shown with, with equal rules, become one (the pinned one, else the lowest), the set's maps and "becomes" links follow, the freed slots go blank. It saves no bytes itself; it comes before the block-set join so the join has room. Two blocks that are both pickups or carried stay apart.
- `lookAlikeColors.ts` (also `kind: 'look'`): blocks of the same shape in other colors fold when a palette rewrite makes them draw identically. B becomes A and the palette the scenes drawing B open is rewritten so A's color numbers show B's old RGB, but only when no scene draws both, no scene that opens that palette draws A, the rewritten color numbers (not 0-15 or 255) are drawn by nothing else there (other blocks, monsters, characters) and no slide or animation opens it. Rules and "becomes" links must match; the character's blocks and pickups never fold. Every scene draws the same map, pixel for pixel in RGB (`optimize:proof` checks it).
- `mergeBackgrounds.ts`: two `.bbl` sets whose scenes share a palette and whose drawn blocks fit in 150: the dropped set's blocks move into the kept set's blank slots (an identical block there is reused; `tools/block-merge`), its maps get the new numbers and its scenes open the kept file. The kept set is not renumbered. Pickups, required and starting items and block 0 keep their number or the pair stays apart. Planned last, after the monster and palette merges.
- `remapExtras.ts`: when a step moves or folds blocks (`Step.moves`: old to new numbers per file), the block names and groups kept in the companion follow (the kept block's own name wins; a dropped file's names and groups move to the file that took its blocks). Undo and Redo bring them back with the files. Other companion sections that name blocks (terrains, stamps, buildings) are not remapped yet.
- `remapBrushes.ts`: the same for the map editor's terrains, stamps and buildings (kept under the `.bbl`): block numbers follow a fold or merge, a block that went nowhere becomes none (-1), and a dropped set's brushes move to the kept set.
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
- `checkpointPanel.ts` and `compareDialog.ts`: the dialog's checkpoint list (make, compare, play, restore, tag as a release, delete;
  `project/checkpoint.ts` keeps them in the game's stored record as deltas, `tools/delta`, so no export carries them) and the
  Before/After look around (the file changes from `tools/disk-diff`, then each level's map drawn
  both ways). Applying a step makes a checkpoint first only when "Make a checkpoint first" is ticked (off by default; Undo works either way); deleting a release checkpoint asks again.
- `notesUndo.ts`: the Optimize dialog's Undo and Redo take the editor notes (the whole companion: block names, groups, palette reservations) back together with the files, one note snapshot per file snapshot (`diskTool.ts` calls `keep.before`, never the file history directly). A checkpoint Restore is one such step, so a person can hop between the head and a checkpoint with Undo and Redo; a pack's saved reservations go with Undo.
- `playCheckpoint.ts`: "Play…" on a checkpoint runs the web player on that checkpoint's own copy of the files in a dialog (nothing saved, no saved games touched), to play the before beside the after.
- `refs.ts`, `palettes.ts`, `blockSlots.ts`, `commit.ts`: which scene opens what, palette
  questions, block-slot placement, and writing a step's result (refusing when a file changed since
  the preview). A block is drawn with its own scene's palette wherever it is stored, so a merge
  never changes how a scene looks.

`games/kit/diskSpace.ts` runs the planner over every built game
(`cd web && npx vite-node ../games/kit/diskSpace.ts [id…] [--write] [--strict]`).

`npm run optimize:proof` (web/, `games/kit/optimizeProof.ts`) applies every step to a copy of each built game and checks that each scene draws the same map pixel for pixel and that carried block numbers keep their picture and rules. It prints the steps and bytes saved per game and exits 1 on a difference.

`optimize:proof` also, per game, proposes palette reservations (`reservePlan.ts`), applies the color reductions and range syncs they call for, plans again with the ranges, and prints the extra bytes saved, how far any scene then draws from the original (CIELAB delta E, mean and worst) against the worst the steps themselves reported; it fails if a scene is further than that. `-- --no-reserve` skips it (it is slow). The palette merge also accepts two palettes that differ only in colors no block draws with, and sprite block sets join when their scenes' palettes match over the reserved range.
