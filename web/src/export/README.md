# `export/`: publishing a game

Part of the [source map](../README.md).

Publishing a game: as an offline web app (`exportWebApp.ts`), a single web
page (`exportSinglePage.ts`, `singlePage.ts`, played by `standalonePlayer.ts`), the web player
(`exportWebPlayer.ts`), or a DOS folder with PLAYGAME (`exportDos.ts`); plus the service worker
(`serviceWorker.ts`). How a download is made is below.

## How a download is made

A game's one Download button opens the chooser in `editor/shell/download.ts`, which
calls `export/`: `exportWebApp.ts` (the built player listed in `player-files.json`, the game's
files, a manifest and a service worker), `exportSinglePage.ts` (`standalone.html` with the game
embedded, built by `web/scripts/singlePageBuild.ts`), `exportWebPlayer.ts` (the web player,
`web-player.html`, with the game's folder and a `games.json`), `exportDos.ts` (the files plus the
CD's `XFERPLAY.EXE`, renamed after the game, and the files renamed to any extensions the DOS
player panel's Files tab gives them), and the Mac, Windows and Linux downloads
(`macApp.ts`, `winApp.ts`, `linuxApp.ts`), which put the single page into the players in
`web/public/mac`, `win` and `linux`, with `THIRD-PARTY-NOTICES.txt` (`notices.ts`).
`export/downloadable.ts` says which catalog games may be downloaded, for the button and for
`web/scripts/macDmg.ts`, `winExe.ts` and `linuxTar.ts`, which run the same code from the command
line.
