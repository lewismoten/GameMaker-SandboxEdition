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

## Installing the DOS download

Every playable DOS ZIP includes `INSTALL.BAT` and `INSTALL.TXT` (`dosInstall.ts`).
The browser loads installation support dynamically only inside `exportDos`; the
optional host-side floppy command loads `dosFloppies.ts` only when exporting a
validated disk set. Shared DOS name checks live in `dosNames.ts`, not in the ZIP
writer, so web-player downloads and assistant checks do not pull installation
code into shared first-load chunks. `firstLoad.test.ts` guards these boundaries.

The support files use
ASCII/CP437 text, CRLF endings, 8.3 names and only DOS 3.3 COMMAND.COM commands.
The player name, game bytes, `SNDBLAST.DRV`, `CONFIG.BAT` and optional `CONFIG.HLP`
are unchanged. A game's own installation files are never silently overwritten:
conflicting names stop the export. Imported copies of these exact generated
instructions are recognized byte for byte and refreshed on re-export.

Unzip first. From the source drive and directory (for example `A:`, then `CD \`),
run `INSTALL` to copy to `C:\<DOSNAME>`, or `INSTALL D:` for `D:\<DOSNAME>`.
The same procedure works from B:; do not invoke `A:\INSTALL` while C: is current.
The destination is a fixed root directory named after the game, not an arbitrary
path. Existing directories are reused and same-named files are overwritten;
back up saves and configuration before reinstalling. No files are deleted.
Each copy uses `/B` and `/V`, checks that destination files exist, and pauses
for the operator to inspect COPY's messages. Old DOS COPY error codes are not
portable; a partial file can still exist. An error means cancel with Ctrl+C,
answer Y, fix the problem and restart from disk 1. The batch never promises an
automatically verified success or launches the game. After all copies are good,
change to the hard-disk game directory, run `CONFIG` once, then `<DOSNAME>.EXE`.
The TXT includes manual copying, floppy use and Sound Blaster/IRQ troubleshooting.

The ordinary ZIP is **not** a floppy image or a multi-volume archive. For an
optional whole-file 1.44 MB layout, from `web/` run:

```sh
npx vite-node scripts/dosFloppies.ts game.zip NEW-OUTPUT-DIRECTORY
```

`dosFloppies.ts` reserves FAT12 cluster space and directory entries for support
files, puts the player, driver, setup and main game on disk 1, and refuses any
file that cannot fit whole. Copy each `DISKn/` folder's **contents** to a separate
formatted disk. Every disk carries identical batch text (COMMAND.COM rereads it
after swaps), instructions and `DISKn.ID`. The installer prompts for disk N of
the set and retries a wrong number before copying. Markers check numbers, not
content or release identity; do not mix sets. No UI option, formatter, boot sector
or image writer is added. For manually divided files, put the ordinary installer
on each disk and run it again for each disk, or use the manual COPY instructions.

All producers share `exportDos`: the editor/download chooser, retro computer
Transfer download, MCP export, build/dev catalog ZIPs (`scripts/gameArchive.ts`
via `cdGames.ts`), and the standalone folders made by `scripts/dosbox.ts`.
The chooser's direct catalog download already serves those generated ZIPs.
Resource-only catalog folders have no player and intentionally get no installer.
Original `cd/` and `runtime/` files and the DOSBox tooling's archival CD copies
are left intact; generated downloads are build output, not tracked ZIPs to edit.

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
