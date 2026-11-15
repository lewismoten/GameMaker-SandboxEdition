# `dosPlayer/`: the DOS player customizer

Part of the [source map](../README.md).

Portable `patchTable.ts`, `patchRules.ts` and `fileExtensions.ts` now live in the engine package under `src/player/`; `applyPatches.ts` and `md5.ts` live in the archives package under `src/player/`. This folder retains site customization and integration tests.

The DOS player customizer's core, with no DOM. `patchTable.ts` is
what it offers of XFERPLAY.EXE (words, colors, frames, positions, times, F-keys: the safe and
caution entries of the patch map, with offsets and rules; and the experimental gameplay
constants of the `play` group, every copy of each, `gameplayPatches.test.ts`); `patchRules.ts` checks and writes
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
`playerOrigin.ts` is an imported game's own player, kept read-only in the .gam's
`importedPlayer` companion section: which Game-Maker build it is (1.0 to 3.00, from the
archives package's `player/playerBuild.ts`, with a confidence and reasons), its About page when
its author changed it, and the bytes no setting explains (`player/playerPreserve.ts`). Play's
F10 shows that About page and "Originally made with Game-Maker x.xx"; the DOS export writes a
3.00 player's kept bytes back byte for byte (`keptParts`; an older build's offsets differ, so
its bytes stay in the record only).

The neighboring [`export/`](../export/README.md) area owns the download wrappers and notices
below; these filenames are relative to that area.

- The native downloads wrap the single page in the prebuilt players: `macApp.ts` (with
  `macSign.ts`, `macIcon.ts`, `dsStore.ts` and `udif.ts`, plus `iso9660` in the tools package for the `.dmg`),
  `winApp.ts` (`peResources.ts`, `winIcon.ts`) and `linuxApp.ts` (`kit/tar` in the tools package).
- What a download carries about itself: `notices.ts` (`THIRD-PARTY-NOTICES.txt`),
  `recordedAudio.ts` (a Bard of Bizarre game's non-commercial voice clips), `fiction.ts` (the note
  that this project's games were made in 2026), `pageSeo.ts` (an exported page's search and share
  tags) and `gameAbout.ts` (a few lines of the game's own story, for descriptions).

`catalogPatches.ts` also carries a catalog game's `controls.json` (`controls` on its catalog entry, from `scripts/cdGames.ts`) into the companion `catalogCompanion` builds, through `putControls` in `editor/core/gameControls.ts`, so a catalog game opened in the editor (or copied) shows its Overview › Controls. It is editor-only: exports never include it, and controls the author already saved win.
