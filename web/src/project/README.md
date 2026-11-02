# `project/`: a game's files

Part of the [source map](../README.md).

Portable `GameFiles` and 8.3 names belong to the engine package (`src/core/gameFiles.ts`). ZIP, game packs, import scanning, leftovers and customized-player recovery belong to the archives package (`src/project/`). The filenames below refer to those package implementations; this folder retains site integration and tests.

A game's files (`files.ts`: the CD catalog),
streaming a hosted game (`streamGame.ts`, from its pack, `gamePack.ts`), IndexedDB storage
(`storage.ts`), the Optimize tool's checkpoint (`checkpoint.ts`: a stamp of the game kept in its stored record, never exported), zip (`zip.ts`), the health check (`health.ts`), importing an exported page
(`importPage.ts`), finding the games in what an import was given, in folders and zips (zips
inside zips too) by their .gam files, and reading the picked ones again (`importScan.ts`; a test
.gam missing files beside a whole game in the same zip is a leftover, left unticked:
`importLeftovers.ts`), when each of your games was last played or opened, for the home page's
"Continue where you left off" (`projectUse.ts`), a
folder's own hand-edited player read into DOS player patches, its renamed
extensions mapped back (`importPlayer.ts`; the names inside its files are rewritten by
`extensionNames.ts`, which the DOS export uses the other way), and the editor-only companion file (`companion.ts`, which also holds release notes by game version, the author's `gameVersion` and the `showVersion` switch, with `composeFiles.ts` stamping that version on a copy of the menu picture for Play and Export,
never exported).

`importScan.ts` and `importPlayer.ts` use the portable `gameFiles.ts` container directly;
archive consumers can reuse them without loading the site's catalog or UI.

- The secret games (`secretGames.ts`; `catalogWatch.ts` keeps the listings live when one is
  revealed or hidden).
- The Bard of Bizarre's collections (`bizarre.ts`), a game's title as boxes print it
  (`gameTitle.ts`), its DOS folder name (`dosDir.ts`) and what a 1990s buyer asked first:
  floppies, hard disk and download time (`diskFacts.ts`).
- A game's version, "major.minor" (`gameVersion.ts`): `games/<id>/about.json` `"version"`, which the
  catalog carries; the home page's byline, the manual cover and the box back's small print show it.
- `saveData/` reads and writes a game's saves, high scores and save backups, shared by the web's
  Saves & scores and the desk's SAVEHACK and BACKUP.

Built catalogs use one DOS distribution ZIP per game. `files.ts` shares that download between readers; lazy `hostedZip.ts` uses the archives SDK to recover native filenames and customized-player extensions (a zip whose player .exe is the CD's own skips that step; and `peekGameFile` reads a `.gam` straight from the zip's entries, sharing the one download with the pack that follows, so the home page telling whether a game has a demo never fetches the play page's 118 kB chunk; it falls back to the full read when the zip has no such file; `hostedZip.test.ts`). The editor and player read the same archive. ZIP failures never fan out into requests for missing loose files. In dev the server may answer an archive with 202 while its worker builds it; `archiveWait.ts` (`fetchArchive`) retries 2, 4, 8, 16, then every 30 s at most and shows an aria-live polite "Preparing … (still building)" note. Legacy external GMPK/loose-file catalogs remain readable; Vite and production use ZIPs.

See [game distributions](../../../docs/game-distributions.md) for permanent URLs, DOS 8.3 filenames, archive contents and cache updates.
