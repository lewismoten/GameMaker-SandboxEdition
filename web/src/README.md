# web/src: a map

Game-Maker: Sandbox Edition in the browser. Two pages load this code:

- `index.html` → [`main.ts`](main.ts): the site. It opens on the **1994 desk** (`desk/`, a
  look-alike DOS PC running the ported designers) or **today's web** interface
  (`editor/`), whichever the visitor used last (`localStorage` `gm-ui`).
  [`seo/route.ts`](seo/route.ts) keeps the page's title and share tags in step with what
  is on screen.
- `play.html` → [`play.ts`](play.ts): a full-window player for one game
  (`?game=<id>`, `?project=<id>`, or the game bundled in an exported web app).

Every module starts with a comment saying what it is for. Code ported from the original C
source names the file it came from (`code/GM/*.C` in the repository root).

## Folders

| Folder | What it holds |
| --- | --- |
| [`formats/`](formats) | Readers and writers for every Game-Maker file (`.gam .pal .bbl/.mbl/.cbl .chr .mon .map .snd .his .rec .bkd .lst .txt`) and the standard ones it uses (`.gif .fli .cmf .voc`). Borland C++ 16-bit layout: `int` is 2 bytes, structs are byte-packed. `cmfSong.ts`/`cmfEdit.ts`/`cmfPreview.ts` are the music editor's model of a CMF song. |
| [`engine/`](engine) | The game engine, a TypeScript port of `PLAYGAME.C`: `game.ts` (`DoGame`), `scene.ts` (`playscene`), `character.ts`, `monsters.ts`, `scroll.ts`, `world.ts`, menus, function keys, recordings and the "machine" (screen, keyboard, timers). |
| [`audio/`](audio) | `opl.ts` (OPL2 FM emulation), `cmfPlayer.ts` (port of `PlayIt` and the SBFMDRV calls), the AudioWorklet, Web Audio output, PC speaker sound sets and sample editing. |
| [`gfx/`](gfx), [`input/`](input) | The mode 13h screen and 8×8 font; keyboard scan codes and the gamepad. |
| [`player/`](player) | The embeddable player: canvas, start overlay, whole-pixel scaling, touch controls. Used by `play.ts`, the editor's play test, the desk and exports. |
| [`project/`](project) | A game's files (`GameFiles`, 8.3 names, the CD catalog), IndexedDB storage, zip, the health check, importing an exported page. |
| [`export/`](export) | Publishing a game: as an offline web app, a single web page, or a DOS folder with PLAYGAME; plus the service worker. |
| [`media/`](media) | Demo playback (`.REC`) and saving the screen as video (MP4), animated GIF or WAV. |
| [`editor/`](editor) | Today's web interface (see below). |
| [`desk/`](desk) | The 1994 desk: `desk.ts` lays out the scene; `pc/` the case, CRT, keyboard, modem, speakers and capture card; `boxes/` the retail boxes and shelf; `disks/` the disk box; `mug/` the BBS mug; `room/` the window, poster, clipping and props. |
| [`retro/`](retro) | What runs on the desk's PC: `computer.ts` (power, programs) with `computer/` (drives, game folders); `dos/` (COMMAND.COM, file system, disks); `text/` (80×25 text mode, Game-Maker's text UI); `bbs/` (the terminal, BBSes, modem sound); `gm.ts` (GM.EXE's menus). |
| [`vga/`](vga) | Game-Maker's eight designers ported from their C source (PALCHOS, BLOCEDIT, MONEDIT, MAPMAKER, CHAREDIT, IMAGE, SNDEDIT, GRATOR). One file per `.EXE` at the top (each exports `program`); a large designer's parts are in a folder of the same name, and `shared/` has the VGA screen, block routines and Game-Maker's look. |
| [`manual/`](manual) | The Owner's Guide (desk), the web Guide, and each original game's printed manual and box contents (`printables/`). |
| [`seo/`](seo) | Page titles, descriptions and JSON-LD for the site and its game pages. |

### `editor/`: today's web interface

| Folder | What it holds |
| --- | --- |
| `core/` | What everything in the editor uses: DOM helpers (`ui.ts`), the open project (`project.ts`), undo (`history.ts`), drawing indexed graphics (`draw.ts`), the CD library (`library.ts`). |
| `shell/` | The pages: home (`home.ts` with `homeShowcase.ts` (the selected game at the top), `homeCards.ts`, `homeImport.ts`, `projectExport.ts`), the workspace (file list + editor), new games (`starter.ts`), new-file templates, the health badge, and the shared stylesheet `editor.css`. |
| `widgets/` | Shared pieces: file picker, block chooser, thumbnails, previews, waveform, roving grid, and the game-accurate graphic previews used by the media editors. |
| `editors/` | One folder per file kind, each with its `.ts`, `.css` and helpers. `registry.ts` maps a file kind to its editor; `all.ts` imports every editor so it registers itself. |
| `tools/` | Ways to make files beyond "new": importing pictures, composing songs, recording or synthesizing samples, speaker effects, textures. `makers.ts` is their registry, offered by the file picker. |
| `keymap/` | Working out which keys a game uses (`keyMap.ts`, also behind the desk's key card) and the ⌨ Keys dialog (also shown by the player). |

## Main flows

**Desk or modern UI.** `main.ts` is a tiny entry: it loads `desk/desk.ts` or
`modernUi.ts` (today's home, guide and workspace) only for the interface being shown, and the
editors (`editor/editors/all.ts`) only when a game is opened, so each interface is its own
download. `offline.ts` registers the service worker, which precaches only the app shell and
caches games as they are used. Game files go through `fetchGameFile` (`project/files.ts`),
which shares each request, and `games/index.json` is fetched once. `main.ts` starts one or
the other and switches between them;
the desk's PC can also open today's editors full screen on its monitor
(`retro/computer.ts` `openEditor`, through the same editor registry).

**Formats → engine → player.** A game is a `GameFiles` (`project/files.ts`): loaded from
the CD catalog, IndexedDB, a zip or a folder. `player/player.ts` mounts a canvas and runs
`engine/game.ts`, which parses the `.gam` and the files each scene names with
`formats/`, and plays them on the `engine/machine.ts` screen, keyboard and timers (an
18.2 Hz game clock, 145.6 Hz for scrolling and sound) with `audio/` for music and
sound.

**Editors.** Each `editor/editors/<kind>/<kind>.ts` calls
`registerEditor([...kinds], fn)` (`editors/registry.ts`). The workspace
(`shell/workspace.ts`) lists the project's files by kind and renders `editors[kind]` for
the one chosen; edits go through `core/project.ts`, which autosaves to IndexedDB. Files
are always written in the original binary formats.

**Exports.** `shell/projectExport.ts` calls `export/`: `exportWebApp.ts` (the built
player listed in `player-files.json`, the game's files, a manifest and a service worker),
`exportSinglePage.ts` (`standalone.html` with the game embedded, built by
`../scripts/singlePageBuild.ts`), and `exportDos.ts` (the files plus the CD's
`XFERPLAY.EXE`, renamed after the game).

**Media.** `media/demo.ts` plays a `.REC` demo in the player; `media/demoPreview.ts` plays one silently inside a picture on the home page. `media/video.ts` turns
canvases into video: frame by frame with WebCodecs and `mp4Mux.ts`, or live with
MediaRecorder (with the game's sound from `audioTap.ts`). `gifEncode.ts` writes animated
GIFs and `wav.ts` sounds. The desk's capture card (`desk/pc/capture.ts`) takes screenshots
and recordings of the PC's screen with `screenCapture.ts` and the live recorder.

## Build-time code

[`../scripts`](../scripts) holds Vite plugins: `cdGames.ts` serves the CD's games and
`../games` (and writes them into the build), `singlePageBuild.ts` builds
`standalone.html`, `seoBuild.ts` puts tags, JSON-LD and readable text into the pages and
writes (and serves in dev) `robots.txt`, `sitemap.xml` and `llms.txt`. `../vite.config.ts` also emits the
service worker and `player-files.json`.
