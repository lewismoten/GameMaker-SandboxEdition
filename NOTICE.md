# Notice and credits

## A derivative work of RSD Game-Maker

This repository is a **modified fork** of the source code of *Game-Maker*, the game
construction kit produced from 1991 to 1995 by Recreational Software Designs (RSD) of
Amherst, New Hampshire, and sold in the US by KD Software. Game-Maker was created by
G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Today it is
usually called **RSD Game-Maker**, to tell it apart from later, unrelated products with
similar names; this repository does the same.

On 12 July 2014 Andy Stone, Game-Maker's original programmer, published the source code,
the CD image and an installed copy on GitHub under the **MIT License**
([gandrewstone/GameMaker](https://github.com/gandrewstone/GameMaker)). This fork keeps
that history and that license. Everything added here (the browser version in `web/`, the
"1994 desk", and the Sandbox Software games in `games/`) is released under the same MIT
License; see [LICENSE](LICENSE), whose original copyright notice is kept unchanged as the
license requires.

## The name: Game-Maker: Sandbox Edition

To keep this fork from being mistaken for RSD's own release, it goes by **Game-Maker:
Sandbox Edition** (short: *Game-Maker SE*), after the Sandbox BBS Lewis ran in Pittsburgh in
the 1990s. It is based on RSD Game-Maker 3.0 and keeps its file formats, but it is not the same
program, and the pieces it draws are its own:

- the **Owner's Guide** on the desk is a new guide written for this edition, not the manual
  RSD shipped;
- the **Game-Maker box** and **CD** on the desk are this edition's own designs, marked
  "Sandbox Edition", not photographs or copies of the original box and disc;
- the DOS **Game-Maker** you run on the desk is a recreation drawn to look like the original.

Refer to this project as *Game-Maker: Sandbox Edition* (https://github.com/lewismoten/GameMaker-SandboxEdition)
and to the original as *RSD Game-Maker 3.0* (Game-Maker 3.0 by Recreational Software Designs)
(https://github.com/gandrewstone/GameMaker).

## Why a web version

When he released the code, Andy Stone said that people were free to use it as they liked,
but that "if there is interest in preserving the old games you guys made then porting
Game-Maker to modern OSes is the first step"
([Wikipedia: Game-Maker](https://en.wikipedia.org/wiki/Game-Maker)). Running it in a web
browser seemed the simplest way to reach every modern operating system at once: Windows,
macOS, Linux, Chromebooks, tablets and phones, with nothing to install.

The port's focus is **the original file formats**. Game-Maker: Sandbox Edition reads and writes
`.GAM`, `.MAP`, `.BBL`/`.MBL`/`.CBL`, `.MON`, `.CHR`, `.PAL`, `.SND`, `.REC` and the rest
byte for byte, so a game made in the browser today still loads in the original DOS
RSD Game-Maker and plays on original hardware or in a DOS emulator such as DOSBox, and an old
game folder opens in the browser unchanged.

## Credits

- **RSD Game-Maker 1.0–3.0** (1991–1995): Recreational Software Designs: G. Andrew Stone,
  G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Source released under the MIT License
  by Andy Stone in 2014.
- **This fork**: Lewis Moten.
- **The web port**: written with **Claude Opus 5.5** (Anthropic), covering both the
  *1994 desk* (the recreated PC, DOS prompt, Game-Maker's VGA designers, the BBS) and the
  *modern web* editor and player. AI assistance did most of the porting and code
  generation: reading the original C source, writing the TypeScript, building the Sandbox
  Software games in code, and testing them, directed and reviewed by Lewis.
- **Sandbox Software games** (`games/`): new games made for this fork, built in code into
  real Game-Maker files. "Sandbox Software", its address and its BBS number are fictional.
- **The sample and shareware games on the CD** (`cd/`) remain the work and copyright of
  their authors (RSD, A-J Games, KD Software, GameLynk, Sheldon Chase and others).
  Shareware games are shown play-only, with their authors' original notices.

## About this fork

Lewis bought Game-Maker in 1992 with money earned shoveling snow that winter
([Moten Snow-to-Software Operations](https://lewismoten.com/1992/12/11/moten-snow-to-software-operations-founder-operator/)).
He made a few games with it, among them a Christmas game full of candy canes and Santa
Claus, but never sold or gave them out, and none survive: they were lost with much else in
an apartment fire during college. He never received a newsletter, never knew there were
BBSes trading Game-Maker games, and never heard there was a later version; he left for
college in 1994, and his parents may well have taken any mail for junk. The original
license and payment terms confused him and felt restrictive, which was the main reason he
never shared his games. He was a kid without a bank account who bought things with money
orders paid for out of his allowance. The Sandbox BBS, the Owner's Guide's plain wording
and the free, open license here are the version of Game-Maker he wishes he'd had.

## Third-party formats, trademarks and code

Game-Maker Web contains no third-party code except as listed. It reimplements file
formats from their published descriptions and from Game-Maker's own source.

- **GIF**: "The Graphics Interchange Format© is the Copyright property of CompuServe
  Incorporated. GIF℠ is a Service Mark property of CompuServe Incorporated." GIF images
  are encoded and decoded with LZW compression, which was patented by Unisys; those
  patents expired in 2003–2004.
- **FLI** animations: the Autodesk Animator format of Autodesk, Inc., implemented from its
  public documentation.
- **Sound Blaster**, **CMF** (Creative Music File), **VOC** and **SBI**: trademarks and
  formats of Creative Technology Ltd. The CMF player is a port of Game-Maker's own
  `SBMUSIC.C` and of the behavior of Creative's SBFMDRV driver; no Creative code is used.
- **OPL2 / YM3812** FM synthesis: a chip by Yamaha Corporation. The emulation in
  `web/src/audio/opl.ts` was written for this project.
- **8×8 text font**: Daniel Hepper's `font8x8_basic`, in the public domain, derived from
  the IBM PC BIOS font.
- **MS-DOS** is a trademark of Microsoft Corporation; **IBM PC** of IBM; **DOSBox** is a
  separate GPL program and is not included.
- **Borland C++** was included in the original 2014 repository (in `tools/`) to build the
  DOS source; it is Borland's (now Embarcadero's) software and is not covered by the MIT
  License, so this fork leaves it out. The README says where to get it.
- The desk's hardware brands (Illogitech, PIXELMAX, SQUEAK, AwkWard BIOS) and its BBSes
  and phone numbers are made up, as are the magazines and awards on the game boxes.
- **Mr. Yuck** is a trademark of UPMC Children's Hospital of Pittsburgh. The green
  poison-warning sticker on the desk's phone is a simple drawing in tribute to it, not the
  original artwork.

Built with [TypeScript](https://www.typescriptlang.org/) (Apache-2.0),
[Vite](https://vitejs.dev/) and [Vitest](https://vitest.dev/) (MIT), used only to build
and test; none of their code ships in the app except Vite's small module runtime.
