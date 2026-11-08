# Reading this book

Paths are relative to the repository root. `PG:n` = `code/GM/PLAYGAME.C` line n. The original source is read-only; where the web port is cited
(`web/packages/engine/src/...`, shortened `engine/`) it is named as such, because the port is a re-implementation, not the source.

## What this book is

A reference for people who make Game-Maker 3.0 games and want to know **why** each limit is what it is, not only what it is.
Every limit has a number, a source line, a cause tag and (where the source is silent) a marked guess at the authors' reasoning.
It covers the player (PLAYGAME). The editors' own limits are noted only where a file format forces them.

## How the authors built it (facts, with where each is found)

| Fact                                                                                                                                                                               | Evidence                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borland C++, **large** memory model (`-ml`), 80186/286 code (`-1`), no floating point emulation (`-f-`), `-O2`                                                                     | `code/GM/MAKERS.MAK:8-9`                                                                                                                                                                |
| Assembler: TASM, 286 instruction set                                                                                                                                               | `MAKERS.MAK:8-9`; `.ASM` files `SVGAA.ASM`, `GM.ASM`, `GENA.ASM`, ...                                                                                                                   |
| Linked image of PLAYGAME: code 122,400 bytes (0x1DE20), a separate far-data segment of 20,000 bytes (the map), a near data+BSS group of 38,544 bytes (0x9690), a 15,000-byte stack | `code/GM/PLAYGAME.MAP:6-48`; `PG:356` (`_stklen=15000U`)                                                                                                                                |
| Shipped `PLAYGAME.EXE` is 163,130 bytes on disk; its layout differs from the map                                                                                                    | `cd/gm/playgame.exe`: MZ header bytes at offsets 0x0E-0x11 give SS=0x2D0D, SP=0x0080, hence image-relative stack origin 0x2D0D0; `PLAYGAME.MAP:48` gives 0x2C2D0. This static mismatch needs no DOSBox run; which historical builds they represent remains unknown. |
| Overlays are not used in PLAYGAME (the map has an `_OVERLAY_` stub of length 0)                                                                                                    | `PLAYGAME.MAP:36-37`                                                                                                                                                                    |
| Sound Blaster support is Creative's own sample library plus two drivers loaded at run time: a voice driver file (named in the config) and the FM driver                            | `SOUNDC.C:79-100`, `SBMUSIC.C:46-100`                                                                                                                                                   |
| Targets: 286 or better, VGA, optional Sound Blaster, optional joystick, mouse                                                                                                      | `-1` flag; `Vcard` list at `SVGA.H:10`; `JSTICKA.ASM`; `initmouse()` at `PG:~602`                                                                                                       |

The authors worked in the early 1990s (copyright 1991 on the headers, `MAP.H:4`, `MON.H:2`; the integrator rewrite is dated August 1994, `PG:7`).
Header authors named in the files: Gregory Stone (map), Oliver Stone (monster, character), Peter Savage (Sound Blaster interface, `SOUNDC.C:4`).

## The cause tags

Every limit in this book carries one of seven tags.

| Tag          | Meaning                                                                              | Typical symptom                  |
| ------------ | ------------------------------------------------------------------------------------ | -------------------------------- |
| **[16-bit]** | `int` is 16 bits, so a value or index tops out at 32,767 or 65,535                   | counter caps, `0xFFF0` name pool |
| **[64K]**    | one object must fit in one 64 KB segment (large model does not do `huge` arithmetic) | 150 blocks, 64 KB scratch buffer |
| **[VGA]**    | what the display hardware can do (mode 0x13, 320 x 200, one byte per pixel)          | 16 x 10 blocks, 4-pixel scroll   |
| **[PIT]**    | the timer chip: one divisor drives clock, music and speaker                          | 18.2 Hz tick, 145.6 Hz steps     |
| **[file]**   | the layout of a file on disk                                                         | 283-byte scenes, 22,000-byte map |
| **[DOS]**    | 8.3 names, handles, 640 KB conventional memory                                       | 13-byte names, memory budget     |
| **[design]** | just a round number somebody picked                                                  | 200 monsters, 20 links           |

Two more marks:

- **[inference]**: the source states the number but not the reason; this is a reading and may be wrong.
- **[not yet checked in DOSBox]**: confirm in DOSBox (or on real hardware).

## How to cite the source

Say `PG:2344` for PLAYGAME.C line 2344. Other files by name and line (`BLOC.H:35-52`). The line numbers are those of the checkout in `code/GM`
in this repository; they will not move because the folder is read-only.

## What this book does not claim

- It does not claim to know what the authors intended unless a comment says so. Comments are read narrowly: the zero-bound alternative at `PG:3830` shows another expression, not when or why it was changed.
- Editor behavior is described only where the released source or a file format supports it. The sound editor **is** in `code/GM/SNDEDIT.C`: its graph and preview are visible at `SNDEDIT.C:241-256` and `SNDEDIT.C:306-324`.
- The web port matches the source tick for tick in the places it was checked, but it is not the source. A behavior marked "port only" must not be printed as DOS behavior without a DOSBox check.

## Chapter map

2 memory model; 3 screen and blocks; 4 maps and scenes (with the memory budget); 5 background blocks; 6 monsters; 7 the character;
8 touch and collision; 9 counters and effects; 10 sound (+ 10b VOC and the 286); 11 palettes and fades; 12 timing and the game loop;
13 file formats byte by byte; 14 bugs kept for fidelity and fields the player ignores; 15 tips that exploit the rules.
