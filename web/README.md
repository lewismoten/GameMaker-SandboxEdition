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
- **Publish games as web apps**: "Export web app" builds a ZIP with the player, the
  game's files, a web app manifest and a service worker. Unzipped onto any static host,
  the game can be installed on the desktop or home screen and played offline.

Graphics use an HTML canvas (an emulated 320×200, 256-color VGA mode 13h) and sound
uses the Web Audio API (an OPL2 FM synthesizer in an AudioWorklet for `.cmf` music,
oscillators for PC speaker effects, and buffers for `.voc` samples).

## Running it

```sh
cd web
npm install
npm run dev       # http://localhost:5173
npm test          # format round-trips against the CD's files, audio, zip
npm run build     # static site in web/dist
npm run preview   # serve the build (needed to try "Export web app")
```

`npm run dev` and `npm run build` first run `scripts/copy-games.mjs`, which copies
`cd/gameware` into `public/games` and writes a catalog (`public/games/index.json`).

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

## Data notes

Some files in `cd/gameware/bcuda` were cut off at 16 KiB in this copy of the CD, so
parts of *Barracuda* are incomplete; two `cd/gameware/pipemare/*.gif` files are not
GIF pictures (the original ignores them too). The shareware games are copyrighted by
their authors and are not bundled into the site; open their folders to play them.
