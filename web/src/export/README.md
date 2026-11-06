# `export/`: publishing a game

Part of the [source map](../README.md).

Publishing a game: as an offline web app (`exportWebApp.ts`), a single web
page (`exportSinglePage.ts`, `singlePage.ts` (its no-script view: `pageSeo.ts`, `titleImage.ts`), played by `standalonePlayer.ts`), the web player
(`exportWebPlayer.ts`), a DOS folder with PLAYGAME (`exportDos.ts`), or one file for the Pocket Player's
microSD card (`exportPocket.ts`, packed by `pocketPack.ts`, which `web/scripts/pocketData.ts` shares, and bundled as
NAME.GMP by `pocketFile.ts`); plus the service worker (`serviceWorker.ts`). How a download is made is below.

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

## Inside this game (the one-page export's content)

`insideGame.ts` builds a visible, folded section after the player (never hidden text; the player
hides it while the game runs) so a game is found by more than its title:

- **Kept once, read back:** a GIF is an `<img>` whose data: URL is the file; a `.txt` is a `<pre>` with
  its code page and line ends in `data-gm-*` attributes (`insideText.ts`, only when the rebuilt
  bytes match). Their names are in the record's `ext` (version 2) instead of the gzip data; the
  player (`insideRead.ts` `readExternalDom`), the importer and the link-in unpacker
  (`readExternalHtml`) read the bytes back, byte for byte (`test/exportInside.test.ts`).
- **Preview plus original:** an FLI gets a half-size animated GIF (at most 45 KB), a VOC a WAV
  `<audio preload="none">`, a CMF a line of text. The originals stay in the data. There is no ogg
  or MIDI preview (no encoder in the repo).
- **From "About this game"** (`project/aboutGame.ts`, the companion's `about`): visible credits and
  `gameLd.ts`, the site's `gameJsonLd` plus genre, license, version, abstract, contributors and
  screenshots. The DOS download writes a `FILE_ID.DIZ` from the same fields (`project/fileIdDiz.ts`).
