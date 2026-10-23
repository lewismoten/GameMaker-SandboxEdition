# Game-Maker: Sandbox Edition

A browser version of Recreational Software Designs' Game-Maker 3.0 (1994), built from
the original source in [`code/GM`](../code/GM). It can:

- **Design games** with editors for every Game-Maker file type, saving in the original
  binary formats, so files work in both DOS Game-Maker and the web version.
- **Start quickly**: a new game can be "ready to play" (a first level with scenery,
  monsters, a hero and sounds from the CD's free gameware), every kind of file is listed
  with a + to add one, and files are chosen visually — thumbnails of your own and of
  the CD library — instead of from drop-down lists.
- **Make media today**: convert any picture to a 320×200, 256-color GIF (median cut,
  dithering, or a game palette); build FLI animations from an animated GIF or several
  pictures; compose Sound Blaster `.CMF` songs by mood, key and speed; record `.VOC`
  samples with the microphone or synthesize them; generate and transform PC speaker
  effects; and record demo `.REC` files by playing. (`src/editor/tools`, encoders in
  `src/formats`.)
- **Read original projects**: open a game folder, loose files or a `.zip`, including
  pre-3.00 `.gam` files (they are converted the same way the 3.00 integrator did).
- **Run the original games**: the sample "gameware" from the CD, the shareware games
  (`cd/sharware`, which shipped as compiled `.exe` + data files) or any game folder.
  The player is a TypeScript port of `PLAYGAME.C`, not a DOS emulator: a shareware game's
  `.exe` is never run; the port plays its data files.
- **Respect shareware**: the gameware samples that came with Game-Maker can be edited
  and reused. The shareware games are copyrighted by their authors, so they are
  play-only, exactly as distributed on the CD, with each author's shareware notice
  shown beside the game. Importing a shareware game's folder (recognized by its
  `.gam` file) offers to play it rather than opening it in the editor.
- **Publish games as web apps**: Download → Web, as a web app (.zip), builds a ZIP with the player, the
  game's files, a web app manifest and a service worker. Unzipped onto any static host,
  the game can be installed on the desktop or home screen and played offline.
- **Publish games for Mac, Windows and Linux**: Download → Mac, Windows and
  Linux build a game that plays offline in its own window right in the browser: a small
  native player plus the game's one-page export (`src/export/macApp.ts`, `winApp.ts`,
  `linuxApp.ts`). For Mac, a Swift player ([`mac/`](../mac/README.md)) in a `.dmg` to drag to
  Applications or a `.zip`, for Apple silicon and Intel Macs (macOS 11+); for Windows, one
  `.exe` with WebView2 ([`win/`](../win/README.md)), for Windows 10 and 11 on x64 or Arm; for
  Linux, a `.tar.gz` folder with a WebKitGTK player ([`linux/`](../linux/README.md)), for x86_64
  and aarch64, that opens the game in the web browser when WebKitGTK is missing. None is
  notarized or code-signed, so macOS and Windows ask once before the first run; the site's
  `#/mac`, `#/windows` and `#/linux` pages explain it to players.
- **Publish games for DOS**: Download → DOS builds a ZIP with the game's files in
  their original formats plus the CD's stand-alone player (`cd/gm/XFERPLAY.EXE`)
  renamed after the game (`MYGAME.GAM` gets `MYGAME.EXE`), `SNDBLAST.DRV` and a
  `CONFIG.BAT`, so anyone can unzip it and run the game in DOSBox. File names must be
  DOS 8.3 names; the export lists any that aren't. Saved games made in the browser
  are left out because they use a different format.

Graphics use an HTML canvas (an emulated 320×200, 256-color VGA mode 13h) and sound
uses the Web Audio API (an OPL2 FM synthesizer in an AudioWorklet for `.cmf` music,
oscillators for PC speaker effects, and buffers for `.voc` samples).

**Port, simulation or emulator?** Game-Maker and PLAYGAME are re-implemented in TypeScript
from their C source; this is not a PC emulator, and no DOS or x86 code runs. The desk's
PC (its DOS, BBSes and utilities) is a simulation written for this project. Some hardware
*is* emulated, because the original code drove it directly: VGA mode 13h and its 6-bit
palette DAC, the Yamaha YM3812 (OPL2) FM chip behind the Sound Blaster's music, the
Sound Blaster's ADPCM sample decoding, and the PC timer's tick rates (including a slower
PC's skipped ticks).

## The 1994 desk

The site opens on a mid-90s desk; "Switch to today's web" (remembered per visitor)
goes to the modern interface and its "💾 1994 desk" button comes back. The desk's PC is
a simulation, not a PC emulator: the DOS prompt, Game-Maker's menus and the BBS are
written in TypeScript to look and act the way they did, from the original source and files.

- **The PC** boots to a `C:\>` prompt (`DIR`, `CD`, `MD`, `TYPE`, `HELP`, …). Drive
  C: holds Game-Maker in `C:\GM`, with a folder per installed game (changes to them
  are kept, and Utilities ▸ Restore puts them back) and `C:\DOWNLOAD` for BBS
  downloads; D: is the CD as shipped; A: is the floppy drive. `GM` starts Game-Maker's
  text-mode menus (from `MENU.C`, with the original `.HLP` help screens from
  `runtime/run/GM`); its Design bar runs the eight designers ported from their C source
  (`src/vga`: PALCHOS, BLOCEDIT, MONEDIT, MAPMAKER, CHAREDIT, IMAGE, SNDEDIT, GRATOR), each
  with its own text menu and 320x200 VGA mode 13h screen drawn in the monitor. `PLAYGAME`
  and a game's `.EXE` play games on the monitor, whose picture bulges like CRT glass
  (an SVG displacement filter; full screen stays flat).
- **TURBO** on the case switches between full speed and a 286-class PC (see below).
- **The speakers** have a Sound Blaster switch (`desk/pc/blasterSwitch.ts`): with the card
  out, games and designers play every sound on the PC speaker and there is no music, as
  PLAYGAME did when it found no card.
- **The ball mouse** on its pad is the PC's mouse (`input/deskMouse.ts`): it reports how
  far it rolled, and the designers and PLAYGAME move their own pointers by that much.
- **The capture card** (`desk/pc/capture.ts`) saves screenshots at the VGA card's
  resolution and records the screen (or the whole desk) with everything the PC plays.
- **The disk box** holds 3.5" disks standing shutter-down: RSD's own Sample, Pipemare
  and Nebula, the other gameware, your games, and a blank disk. Scroll through them and
  click one to put it in drive A:; the drive then offers Play, Design and today's web.
- **The pink Game-Maker box** and its CD start Game-Maker. **The shareware catalog**
  lists the shareware games. **`TERMINAL`** has a dialing directory of recreated
  Pittsburgh boards: THE -= S A N D B O X =- BBS (Renegade, sandbox-themed ANSI art),
  where the games can be read about and "downloaded" (time-compressed) into
  `C:\DOWNLOAD` and run from DOS, and The Sofa (a multi-line Major BBS with a live
  teleconference). The modem rings and handshakes, and PKUNZIP runs as fast as the PC.
- **The case** has a seven-segment MHz display, a 3.5" floppy drive (the drive offers
  Play, Design or today's web for the disk in it) and a CD-ROM drive whose tray slides
  out; the PC boots through HIMEM, EMM386, the CD-ROM driver and MSCDEX. A 101-key
  keyboard presses its keys as you type, and an external modem on top of the case
  dials the BBS when clicked, its lights following the call.
- **The window** shows snow falling on the neighbors' houses.
- **The wall phone** (`desk/room/phone`) gets a dial tone, dials the numbers on Mom's
  notes, the BBSes (a modem screeches), the weather and movie lines and more; voices use
  the browser's speech synthesis, with captions.
- **Felt eggs** (`src/eggs`): each Sandbox game hides an egg the hero can carry, so it
  ends up in a saved game; a shadow box on the shelf shows the ones found. Finding them all
  unlocks secret games, which the site never lists or names until then.
- **The shelf** holds the boxes of the original games in `../games`: click one to bring
  it forward and turn it (drag, scroll to zoom, shift-drag to pan), read its manual or
  put its disk in drive A:.
- **The poster** on the wall, Moten Snow-to-Software Operations, is an homage to
  shoveling snow in the winter of 1992 to buy Game-Maker.
- **The Owner's Guide** is a manual for the desk, typeset like a 1994 printed manual,
  with screen shots drawn by the same text-mode screen (`src/manual`). It can be
  printed. Today's web interface has its own guide at `#/help`.

## Original games

`../games` holds the games made for this edition: the Sandbox Software games, and the
"bizarre" shareware games made from Lewis's songs (The Bard of Bizarre's, and Veni, Vidi,
Risi!), which get a Bizarre tab of their own on the home page (see
[`../games/README.md`](../games/README.md)). The Cast page (`#/cast`, `src/cast`) shows the
characters who appear in more than one of them. Each is built in code by its `build.ts` with the
format encoders and `games/kit`, into a `disk/` folder that the site serves like the CD's
shareware, with box art, a printed label and a manual from `about.json`/`manual.json`, and a
`walkthrough.json` that plays the whole game. Rebuild one with
`cd web && npx vite-node ../games/<id>/build.ts`.

## Running it

```sh
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # every *.test.ts in test/ and src/ (vitest), about 25 s
npm run typecheck  # tsc --noEmit (strict)
npm run format     # Prettier on web/'s code, games/*.ts and code/README.md (config at the repo root)
npm run format:check  # the same, only checking (CI runs it)
npm run lint       # ESLint 9 with typescript-eslint's type-aware rules (web/eslint.config.js)
npm run lint:fix   # lint, fixing what it can
npm run build      # typecheck, then the static site in web/dist
npm run preview    # serve the build (the service worker and the web app download need it)
npx vitest run test/formats.test.ts   # one test file
```

The games are never copied into `web/`. The Vite plugin in `scripts/cdGames.ts` serves
them straight from `../cd` and `../games` while developing, and only the production build
(for example the GitHub Actions run) writes them into `dist`:

| Site path | Source |
| --- | --- |
| `games/index.json` | the full catalog: every listed game with its notice, manual and printables |
| `games/catalog.json` | the same list without those (a quarter of the size); what the home page, shelf and play page load |
| `games/details/<id>.json` | one game's notice, manual and printables, fetched when opened |
| `games/extra.json` | the secret games, fetched only once all the felt eggs are found (`project/secretGames.ts`) |
| `games/gameware/<id>/` | `cd/gameware/<id>/` (editable samples) |
| `games/shareware/<id>/` | `cd/sharware/<id>/` (play only; `.exe`/`.bat`/`.com` files left out) |
| `games/originals/<id>/` | `../games/<id>/disk/` and its `walkthrough.json` |
| `games/shots/<id>-*.png` | each game's pictures for tiles, boxes and the play page, drawn at build time (`scripts/gameShots.ts`) |
| `gm/index.json`, `gm/<file>` | the installed `C:\GM` folder (`runtime/run/GM`) for the desk's PC |
| `dos/xferplay.exe`, `dos/sndblast.drv` | `cd/gm/`, for Download → DOS |
| `mac/`, `win/`, `linux/` | the prebuilt native players, for the Mac, Windows and Linux downloads (in `public/`, built by `../mac`, `../win` and `../linux`) |
| `cast/` | the Cast page's pictures and walk cycles (in `public/`, drawn by `scripts/castArt.ts` and `scripts/castSprites.ts`) |
| `extras/demos.json`, `extras/demos/<id>.rec` | demos recorded for CD games that shipped without one (in `public/`) |

Every game file but a GIF also gets a gzip copy (`<file>.gz`), which the site fetches and
unpacks, since GitHub Pages sends unknown file types uncompressed.

The GitHub Actions workflow in [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)
tests and builds on every push and pull request, and deploys `web/dist` to GitHub Pages
from `master`. In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Layout

[`src/README.md`](src/README.md) maps the source folders and the main flows in more
detail. In short:

| Folder | What it holds |
| --- | --- |
| `src/formats` | Readers/writers for every file type. Borland C++ 16-bit layout: `int` is 2 bytes, structs are byte-packed. |
| `src/engine` | The game engine: `game.ts` (`DoGame`, `play`), `scene.ts` (`playscene`), `character.ts`, `monsters.ts`, `scroll.ts`, `touch.ts`, `keys.ts`, plus menus, text screens and the "machine" (screen, keyboard, timers). Function names follow `PLAYGAME.C`. |
| `src/audio` | `opl.ts` (OPL2 emulation), `cmfPlayer.ts` (port of `PlayIt` and the SBFMDRV calls), `music.worklet.ts`, `engine.ts` (Web Audio output). |
| `src/gfx`, `src/input` | Mode 13h screen and the 8×8 font; keyboard scan codes and the gamepad. |
| `src/player` | The embeddable player (canvas, start overlay, touch controls). |
| `src/project` | Game file store and the catalog, streaming a hosted game, IndexedDB storage, ZIP reader/writer, health check. |
| `src/export` | Web app, single-page and DOS exporters, the service worker generator, and the Mac app (`.dmg`/`.zip`), Windows `.exe` and Linux `.tar.gz` writers. |
| `src/macHelp`, `src/winHelp`, `src/linuxHelp` | The `#/mac`, `#/windows` and `#/linux` pages: opening a downloaded game the first time, and removing it. |
| `src/cast` | The Cast page (`#/cast`): the characters who turn up in more than one new game. |
| `src/saves` | The home page's "Saves & scores" panel: a game's saved games and high scores. |
| `src/media` | Demo playback and previews, the demo sound choice, and saving video, animated GIFs and WAV. |
| `src/walkthrough` | Playing a Sandbox game's walkthrough on the engine, and rendering it to MP4. |
| `src/eggs` | The felt eggs: which are found (from saved games), their shadow box and viewer, and `EGG.EXE`. |
| `src/editor` | Today's web interface: `shell/` (home page, workspace), `core/` (DOM helpers, the open project, undo), `widgets/` (pickers, thumbnails, previews), `editors/<kind>/` (one folder per file type, registered in `editors/registry.ts`), `tools/` (making pictures, songs and sounds), `keymap/` (the ⌨ Keys map). |
| `src/desk` | The 1994 desk: `desk.ts`, and `pc/`, `boxes/`, `disks/`, `mug/`, `room/` for the things on it. |
| `src/retro` | The desk's PC: `computer.ts` (with `computer/`), `dos/` (COMMAND.COM, files, disks), `text/` (text mode and Game-Maker's text UI), `bbs/` (terminal and BBSes), `gm.ts` (GM.EXE's menus). |
| `src/vga` | The eight designers ported from their C source, one file per `.EXE` (a big one's parts in a folder of the same name), and `shared/` (VGA screen, block routines, Game-Maker's look). |
| `src/manual` | The Owner's Guide, the web Guide, and the original games' manuals and box contents. |
| `src/seo` | Page titles, descriptions and JSON-LD. |
| `src/*.ts` | Entries (`main.ts`, `play.ts`), the address (`urlState.ts`), the service worker (`siteWorker.ts`, `offline.ts`), `prefetch.ts`, `theme.ts`, `edition.ts`. |
| `scripts` | Vite plugins: serving the CD's games, the build's game pictures, the one-page player, SEO pages. Run by hand: `macDmg.ts`, `winExe.ts` and `linuxTar.ts` (native downloads of catalog games, into `../dist`), `castArt.ts` and `castSprites.ts` (the Cast page's pictures, with the other `cast*.ts` drawings they use). |
| `test` | Vitest tests, one file per subject, each starting with a line saying what it covers (a few `*.test.ts` sit beside their source in `src/`). |

## How the site works

- **Addresses** (`src/urlState.ts`): both interfaces keep their place in the hash, so a
  reload or a shared link comes back to it: `#/` (home, `?tab=…`), `#/game/cd:nebula` (a game
  on the home page), `#/p/<project>/<file>?scene=3` (a file open in the workspace, with what is
  selected in it), `#/help/<section>` (the web Guide), `#/cast`, `#/mac`, `#/windows`,
  `#/linux` and `#/desk`. Small changes replace the
  history entry; opening a page or file pushes one. `play.html?game=<id>` (and each game's
  own `play-<id>.html`) plays one game full window.
- **Loading** (`src/main.ts`): the desk and today's web are separate downloads, and the
  editors load only when a game is opened. Lists come from `games/catalog.json`; a game's
  manual and notice from `games/details/<id>.json` when it is opened. Tiles and boxes show
  the prebuilt `games/shots` pictures instead of drawing them from game files.
- **Streaming** (`src/project/streamGame.ts`): a hosted game starts as soon as its `.gam`
  is in; its other files follow in the order play needs them, and the engine waits only
  if it reaches a file still on its way.
- **Offline** (`src/siteWorker.ts`, `src/offline.ts`): the build writes a service worker
  that precaches the app shell and caches games as they are used. A new deploy downloads
  only what changed, then waits: a small notice offers to reload, so a game being played is
  never swapped out. `src/prefetch.ts` fetches likely next code when the page is idle.
- **Demos** (`src/media`): the home page plays a game's title demo in its picture, one at
  a time; the demo video dialog plays it full size. Every demo on the page plays with one
  remembered sound choice: Sound Blaster, PC speaker only, or none (`media/demoAudio.ts`;
  silent until the visitor has used the page). CD games that shipped without a demo have
  one recorded for this edition (`media/extraDemos.ts`, kept apart from their files), and
  any other game gets an "attract mode" made up from its hero's keys.
- **Walkthroughs** (`src/walkthrough`): each Sandbox game's `walkthrough.json` plays the
  whole game on the real engine, deterministically, with chapters to jump to; "Download
  MP4" renders it faster than real time at 320×200, 60 fps, with H.264 video and AAC (or
  Opus) sound rendered offline.
- **Editors** (`src/editor/editors/<kind>`): one per file type, each with Undo and Redo
  (Ctrl+Z / Ctrl+Y; `editor/core/history.ts`, or `editor/core/fileUndo.ts` for editors that
  rewrite whole files). Work is saved to IndexedDB as you go.
- **Tests** (`test/`, and a few beside their source): one Vitest file per subject, each starting with a line saying what
  it covers; they run in Node (`npm test`). Many check formats against the CD's own files.

## File formats

| File | Contents | Size |
| --- | --- | --- |
| `.gam` | Scenes, their files and links. v3.00: 256 byte `GM` header, scene records (283 bytes), file name pool. Pre-3.00: 20 × 330 byte records. | varies |
| `.pal` | 256 × RGB, 6 bits per component | 768 |
| `.bbl` `.mbl` `.cbl` | 150 / 100 / 50 blocks of 420 bytes: 20×20 pixels + behavior | 63000 / 42000 / 21000 |
| `.chr` | 2 × 3784 byte character records (only the first is used) | 7568 |
| `.mon` | 64 × 300 byte monsters | 19200 |
| `.map` | 100×100 × {block, monster} + 200 × 10 byte placed monsters | 22000 |
| `.snd` | 30 × 36 PC speaker frequencies + 30 × 9 byte `.voc` names | 2430 |
| `.his` | 10 × {long score, 30 char name} | 340 |
| `.rec` | {uint ticks, uchar scan code} key events | varies |
| `.bkd` | x, y and a GIF name: a 320×200 window of a larger picture | varies |
| `.lst` | Slide show: `file [seconds]` per line | text |
| `.txt` | Text screen, 31 columns | text |
| `.gif` `.fli` `.cmf` `.voc` | Standard GIF, Autodesk FLI, Creative Music File, Creative Voice File | |

Every `.bbl/.mbl/.cbl/.chr/.mon/.map/.snd/.gam` file on the CD re-serializes byte for
byte (`test/formats.test.ts`).

## How faithful is the player?

The engine keeps the original's timing (a 145.6 Hz timer for scrolling and sound, an
18.2 Hz game clock), its block/monster/character rules, and many of its quirks (for
example, touching a block off screen does not change it, and blocks with no change
time animate every tick). Differences:

- The screen is redrawn every frame instead of with VGA page scrolling and dirty
  rectangles; the result looks the same, including the cropped 312×196 play area.
- Saved games (F5/F6) are stored as JSON, not the DOS memory dump.
- The FM synthesizer is an approximation of the YM3812, not a cycle-exact emulator.
- The 8×8 font is the public domain `font8x8` (based on the IBM PC BIOS font), since
  the VGA ROM font is not part of this repository.
- A quick key tap shorter than one game tick still registers for Esc and F-keys.
- Joysticks come from the browser's Gamepad API (no calibration screen).

**Speed.** Game logic runs on the PC timer: an 18.2 Hz game clock and a 145.6 Hz
scroll/sound clock, measured at 18.3 and 145.7 ticks per second in Chrome. That clock is
the same on any CPU, but playgame *skips* ticks its main loop could not keep up with,
so on period hardware animation, character moves and gravity ran slower (monsters still
covered the same distance). Animations set to change every tick — like the spinning
tornado in the Terrain/Tutor monster set — therefore look faster at full speed than
many players remember. The desk's TURBO button (or `speed.ticksPerSecond` in code)
emulates a slower PC by processing at most 8 ticks per second and skipping the rest,
exactly as the original did.

## Data notes

Some files in `cd/gameware/bcuda` were cut off at 16 KiB in this copy of the CD, so
parts of *Barracuda* are incomplete; two `cd/gameware/pipemare/*.gif` files are not
GIF pictures (the original ignores them too). Shareware titles come from each game's
own credit and story screens, because older `.gam` files name the title scene things
like "Title Screen" or "V1.0".

## Credits and license

A modified fork of RSD Game-Maker (Recreational Software Designs, 1991–1995), whose source Andy
Stone released under the MIT License in 2014. The web port, the 1994 desk and today's web
editor were written with Claude Opus 5.5. See [../NOTICE.md](../NOTICE.md) and
[../LICENSE](../LICENSE).
