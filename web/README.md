# Game-Maker Web

A browser version of Recreational Software Designs' Game-Maker 3.0 (1994), built from
the original source in [`code/GM`](../code/GM). It can:

- **Design games** with editors for every Game-Maker file type, saving in the original
  binary formats, so files work in both DOS Game-Maker and the web version.
- **Read original projects**: open a game folder, loose files or a `.zip`, including
  pre-3.00 `.gam` files (they are converted the same way the 3.00 integrator did).
- **Run the original games**: the sample "gameware" from the CD, the shareware games
  (`cd/sharware`, which shipped as compiled `.exe` + data files) or any game folder.
  The player is a TypeScript port of `PLAYGAME.C`, not an emulator.
- **Respect shareware**: the gameware samples that came with Game-Maker can be edited
  and reused. The shareware games are copyrighted by their authors, so they are
  play-only, exactly as distributed on the CD, with each author's shareware notice
  shown beside the game. Importing a shareware game's folder (recognized by its
  `.gam` file) offers to play it rather than opening it in the editor.
- **Publish games as web apps**: "Export web app" builds a ZIP with the player, the
  game's files, a web app manifest and a service worker. Unzipped onto any static host,
  the game can be installed on the desktop or home screen and played offline.
- **Publish games for DOS**: "Export for DOS" builds a ZIP with the game's files in
  their original formats plus the CD's stand-alone player (`cd/gm/XFERPLAY.EXE`)
  renamed after the game (`MYGAME.GAM` gets `MYGAME.EXE`), `SNDBLAST.DRV` and a
  `CONFIG.BAT`, so anyone can unzip it and run the game in DOSBox. File names must be
  DOS 8.3 names; the export lists any that aren't. Saved games made in the browser
  are left out because they use a different format.

Graphics use an HTML canvas (an emulated 320×200, 256-color VGA mode 13h) and sound
uses the Web Audio API (an OPL2 FM synthesizer in an AudioWorklet for `.cmf` music,
oscillators for PC speaker effects, and buffers for `.voc` samples).

## The 1994 desk

The site opens on a mid-90s desk; "Switch to today's web" (remembered per visitor)
goes to the modern interface and its "💾 1994 desk" button comes back. Nothing on the
desk is emulated: the DOS prompt, Game-Maker's menus and the BBS are drawn by this app
to look the way they did, from the original source and files.

- **The PC** boots to a `C:\>` prompt (`DIR`, `CD`, `MD`, `TYPE`, `HELP`, …). Drive
  C: holds Game-Maker in `C:\GM`, with a folder per installed game (changes to them
  are kept, and Utilities ▸ Restore puts them back) and `C:\DOWNLOAD` for BBS
  downloads; D: is the CD as shipped; A: is the floppy drive. `GM` starts Game-Maker's
  text-mode menus (from `MENU.C`, with the original `.HLP` help screens from
  `runtime/run/GM`); its Design bar opens the graphic designers full screen in a
  VGA-style skin, each with a button to continue in today's web editor. `PLAYGAME`
  and a game's `.EXE` play games on the monitor, whose picture bulges like CRT glass
  (an SVG displacement filter; full screen stays flat).
- **TURBO** on the case switches between full speed and a 286-class PC (see below).
- **The disk box** holds 3.5" disks standing shutter-down: RSD's own Sample, Pipemare
  and Nebula, the other gameware, your games, and a blank disk. Scroll through them and
  click one to put it in drive A:; the drive then offers Play, Design and today's web.
- **The pink Game-Maker box** and its CD start Game-Maker. **The shareware catalog**
  lists the shareware games, and **`TERMINAL`** dials a fictional BBS where they can be
  read about and "downloaded" (time-compressed) into `C:\DOWNLOAD`, then run from DOS.
- **The Owner's Guide** is a manual for the desk, typeset like a 1994 printed manual,
  with screen shots drawn by the same text-mode screen (`src/manual`). It can be
  printed. Today's web interface has its own guide at `#/help`.

## Running it

```sh
cd web
npm install
npm run dev       # http://localhost:5173
npm test          # format round-trips against the CD's files, audio, zip
npm run build     # static site in web/dist
npm run preview   # serve the build (needed to try "Export web app")
```

The games are never copied into `web/`. The Vite plugin in `scripts/cdGames.ts` serves
them straight from `../cd` while developing, and only the production build (for
example the GitHub Actions run) writes them into `dist`:

| Site path | Source |
| --- | --- |
| `games/index.json` | catalog generated from the folders below |
| `games/gameware/<id>/` | `cd/gameware/<id>/` (editable samples) |
| `games/shareware/<id>/` | `cd/sharware/<id>/` (play only; `.exe`/`.bat`/`.com` files left out) |
| `dos/xferplay.exe`, `dos/sndblast.drv` | `cd/gm/`, for "Export for DOS" |

The GitHub Actions workflow in [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)
tests and builds on every push and pull request, and deploys `web/dist` to GitHub Pages
from `master`. In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Layout

| Folder | What it holds |
| --- | --- |
| `src/formats` | Readers/writers for every file type. Borland C++ 16-bit layout: `int` is 2 bytes, structs are byte-packed. |
| `src/engine` | The game engine: `game.ts` (`DoGame`, `play`), `scene.ts` (`playscene`), `character.ts`, `monsters.ts`, `scroll.ts`, `touch.ts`, `keys.ts`, plus menus, text screens and the "machine" (screen, keyboard, timers). Function names follow `PLAYGAME.C`. |
| `src/audio` | `opl.ts` (OPL2 emulation), `cmfPlayer.ts` (port of `PlayIt` and the SBFMDRV calls), `music.worklet.ts`, `engine.ts` (Web Audio output). |
| `src/gfx` | Mode 13h screen and the 8×8 font. |
| `src/editor` | The editor app: home page, workspace and one editor per file type in `editors/`. |
| `src/player` | The embeddable player (canvas, start overlay, touch controls). |
| `src/export` | Web app exporter and service worker generator. |
| `src/project` | Game file store, IndexedDB storage, ZIP reader/writer. |

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
