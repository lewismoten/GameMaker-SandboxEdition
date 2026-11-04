# `export/`: publishing a game

Part of the [source map](../README.md).

Publishing a game: as an offline web app (`exportWebApp.ts`), a single web
page (`exportSinglePage.ts`, `singlePage.ts` (its no-script view: `pageSeo.ts`, `titleImage.ts`), played by `standalonePlayer.ts`), the web player
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

`exportDos` also accepts supplied CD runtime bytes and a fixed ZIP date for reproducible website distributions without browser globals or network requests.

An imported game's F10 About page: `exportSinglePage` and `exportWebApp` take an optional
`playerAbout` (the About lines and "Originally made with" line from `dosPlayer/playerOrigin.ts`),
store it in the page's game record, and `standalonePlayer.ts` hands it to the engine, so F10 shows what
Play's does. The Mac, Windows and Linux downloads embed that same single page, so they carry it too.
Only those lines travel; the companion never does, and a game that wasn't imported exports byte for
byte as before (`exportPlayerAbout.test.ts`). The web player download plays a folder with no per-game
record, so it has none.
