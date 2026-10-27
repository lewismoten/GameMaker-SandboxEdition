# `project/`: a game's files

Part of the [source map](../README.md).

A game's files (`files.ts`: `GameFiles`, 8.3 names, the CD catalog),
streaming a hosted game (`streamGame.ts`, from its pack, `gamePack.ts`), IndexedDB storage
(`storage.ts`), zip (`zip.ts`), the health check (`health.ts`), importing an exported page
(`importPage.ts`), finding the games in what an import was given, in folders and zips (zips
inside zips too) by their .gam files, and reading the picked ones again (`importScan.ts`; a test
.gam missing files beside a whole game in the same zip is a leftover, left unticked:
`importLeftovers.ts`), when each of your games was last played or opened, for the home page's
"Continue where you left off" (`projectUse.ts`), a
folder's own hand-edited player read into DOS player patches, its renamed
extensions mapped back (`importPlayer.ts`; the names inside its files are rewritten by
`extensionNames.ts`, which the DOS export uses the other way), and the editor-only companion file (`companion.ts`,
never exported).

- The secret games (`secretGames.ts`; `catalogWatch.ts` keeps the listings live when one is
  revealed or hidden).
- The Bard of Bizarre's collections (`bizarre.ts`), a game's title as boxes print it
  (`gameTitle.ts`), its DOS folder name (`dosDir.ts`) and what a 1990s buyer asked first:
  floppies, hard disk and download time (`diskFacts.ts`).
- A game's version, "major.minor" (`gameVersion.ts`): `games/<id>/about.json` `"version"`, which the
  catalog carries; the home page's byline, the manual cover and the box back's small print show it.
- `saveData/` reads and writes a game's saves, high scores and save backups, shared by the web's
  Saves & scores and the desk's SAVEHACK and BACKUP.
