# Game-Maker: Sandbox Edition

Make and play DOS-style games in your web browser, with no programming. A modified fork of
**RSD Game-Maker 3.0**, the 1991–1995 game construction kit by Recreational Software
Designs, whose source Andy Stone released under the MIT License in 2014.

**▶ Play it: https://lewismoten.github.io/GameMaker-SandboxEdition/**

![The 1994 desk: a PC running Game-Maker, with disks, games and manuals](web/public/og-image.png)

## What's in it

- **Two ways to use it:** the *1994 desk*, a recreated PC with a DOS prompt, Game-Maker's
  original menus and designers, a BBS to dial, and the games' boxes, disks and manuals on
  the shelf; or *today's web* editor with point-and-click editors for every part of a game.
- **A port, not a PC emulator:** Game-Maker and its PLAYGAME player are re-implemented in
  TypeScript from the released C source, and no DOS or x86 code runs. The desk's PC is a
  simulation; some hardware is emulated (VGA mode 13h, the OPL2 FM sound chip).
- **Original file formats:** games are read and written byte for byte as `.GAM`, `.MAP`,
  `.BBL`, `.MON`, `.CHR`, `.CMF`, `.FLI` and the rest, so a game made here still runs in DOS
  Game-Maker and DOSBox, and old games open here unchanged.
- **The CD's games:** the sample "gameware" (edit a copy) and the shareware (play only,
  with their authors' notices). CD games that shipped without a title demo get one recorded
  for this edition, kept apart from their original files.
- **Twelve new Sandbox Software games** built for this fork, entirely in code
  ([games/](games)): Maximus: The Hundred Worlds, Sandcastle Knight, Snowbound: The $89
  Shovel, In The Year 2000!, Teddy's Little Big Adventure, Teddy's Little Bigger Adventure,
  Ohm Sweet Ohm, Virus Blaster, Final Curtain, KEEP IT BRIEF! The Tiny Pockets Library,
  Depth Perception and Quest for the Round Tuit. Each comes with a manual, box art,
  printable extras and hidden felt eggs to find.
- **Demos and walkthroughs:** title demos play with Sound Blaster music, the PC speaker or
  no sound, and every Sandbox game has a walkthrough that plays it from power-on to the
  credits on the real engine, with chapters, ready to download as an MP4.
- **Sharing:** export a game as a one-page web game, an installable web app, or a folder
  that runs in DOSBox. Everything is saved in your browser and works offline.

## Run it yourself

You need [Node.js](https://nodejs.org/) 22 or later.

```sh
cd web
npm install
npm run dev      # http://localhost:5173
npm test         # the test suite
npm run build    # the static site, in web/dist
```

Pushes to `master` are published to GitHub Pages by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Where things are

| Folder | What it holds |
| --- | --- |
| [`web/`](web) | The browser app. [web/src/README.md](web/src/README.md) maps the source. |
| [`games/`](games) | The Sandbox Software games, built in code, and the shared kit that builds and play-tests them. See [games/README.md](games/README.md). |
| `cd/` | The original Game-Maker CD image, with its sample and shareware games. |
| `code/` | The original DOS C/C++ source. |
| `runtime/` | A DOS `C:` drive with Game-Maker installed, for DOSBox. |

## The original DOS version

To run the original Game-Maker, install [DOSBox](https://www.dosbox.com/), start it from
the root of this repository, and type:

```
mount c runtime
c:
cd c:\gm
gm
```

To build the DOS source you also need the Borland C++ compiler, which this fork doesn't
include, nor the Borland and Creative library files it links (none are covered by the
MIT License; NOTICE.md lists them). Copy the `tools/` folder and those files from the
[original 2014 repository](https://github.com/gandrewstone/GameMaker) into this one, then,
following Andy Stone's original notes, in DOSBox:

```
c:
dev.bat          (mounts the compiler as T: and the source as D:)
d:
cd gm
del *.obj
del *.exe
creatall         (or "create palchos", "create blocedit"… for one program)
```

## Learn more

- [Game-Maker on Wikipedia](https://en.wikipedia.org/wiki/Game-Maker)
- [The Game-Maker wiki (archived)](https://web.archive.org/web/20260807223841/https://aderack.com/game-maker/index.php?title=Main_Page)
- [The original 2014 source release](https://github.com/gandrewstone/GameMaker)

## Credits and license

RSD Game-Maker was created by G. Andrew Stone, G. Oliver Stone, Oliver Stone Jr. and Joan
Stone. This fork is by Lewis Moten; the web port was written with Claude Opus 5.5, with AI
assistance doing most of the porting and code generation. The CD's games belong to their
authors. See [NOTICE.md](NOTICE.md) for full credits, the story behind this fork and
third-party trademarks.

Released under the [MIT License](LICENSE).
