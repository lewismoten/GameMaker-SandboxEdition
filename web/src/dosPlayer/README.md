# `dosPlayer/`: the DOS player customizer

Part of the [source map](../README.md).

The DOS player customizer's core, with no DOM. `patchTable.ts` is
what it offers of XFERPLAY.EXE (words, colors, frames, positions, times, F-keys: the safe and
caution entries of the patch map, with offsets and rules); `patchRules.ts` checks and writes
each value; `applyPatches.ts` patches only the CD's player (MD5 `fcaf47d5…`) and reads a
hand-edited one back into patches; `fileExtensions.ts` is the Files tab's renamed extensions
(every copy of each the player asks for, the kinds the .gam names, the rules, Acord Games'
set) and reads a player that asks for other ones; `md5.ts` (RFC 1321); `presets.ts` (Builder's blanked menu,
Rōdïp's status words, Reset all); `playerRecord.ts` keeps the choices in the .gam's
`dosPlayer` companion section (`projectPatches.ts` reads and writes a stored project's, for the
desk, and `patchesChanged.ts` tells an editor that has the game open, so its autosave keeps
them); `describePatches.ts` lists them in words (the DOS export's
README, which says its .EXE was customized; `exportDos.ts` writes them into XFERPLAY.EXE).
`catalogPatches.ts` is a catalog game's own look: an original game's `games/<id>/player.json`
(the same record), carried on its catalog entry as `player`, which its Play, demos,
walkthrough, downloads, the desk's copies and Transfer, and Look inside / Edit a copy read
(`gamePlayers.test.ts` checks every player.json with `games/kit/player.ts`).

- The native downloads wrap the single page in the prebuilt players: `macApp.ts` (with
  `macSign.ts`, `macIcon.ts`, and `iso9660.ts`, `dsStore.ts` and `udif.ts` for the `.dmg`),
  `winApp.ts` (`peResources.ts`, `winIcon.ts`) and `linuxApp.ts` (`tar.ts`).
- What a download carries about itself: `notices.ts` (`THIRD-PARTY-NOTICES.txt`),
  `recordedAudio.ts` (a Bard of Bizarre game's non-commercial voice clips), `fiction.ts` (the note
  that this project's games were made in 2026), `pageSeo.ts` (an exported page's search and share
  tags) and `gameAbout.ts` (a few lines of the game's own story, for descriptions).
