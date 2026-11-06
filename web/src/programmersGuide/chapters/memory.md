# The memory model

## What PLAYGAME was built as

PLAYGAME is a **real-mode DOS** program, so it sees the first 1 MB through 16-bit segment:offset pairs and has about 640 KB of conventional memory
for code, data and heap. Nothing in the source touches EMS or XMS (`grep -in "ems\|xms\|himem" code/GM/PLAYGAME.C` finds nothing relevant; [not yet checked in DOSBox] with a repo-wide grep before printing).
It was compiled with Borland C++ `bcc -f- -c -C -ml -1 -P -O2` and assembled with TASM `/ml /jP286N /m2` (`code/GM/MAKERS.MAK:8-9`):

| Flag           | Meaning                               | Consequence                                                                                                                      |
| -------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `-ml`          | **large** memory model                | code pointers and data pointers are both 32-bit far pointers; one program can be bigger than 64 KB, but **no single object can** |
| `-1`           | generate 80186/286 instructions       | the minimum machine is a 286. No 32-bit registers, so `int` is 16 bits                                                           |
| `-f-`          | no floating point emulation           | the game uses integers only (positions in pixels, speeds in pixels per tick)                                                     |
| TASM `/jP286N` | 286 instruction set in the .ASM files | `SVGAA.ASM`, `GM.ASM` and friends                                                                                                |

Large model matters more than any other choice. A far pointer is a 16-bit segment plus a 16-bit offset, and the compiler only does arithmetic
on the offset half. So `p++` past offset 0xFFFF **wraps within the segment** instead of moving to the next one. That is the origin of the
"nothing bigger than 64 KB" rule, and it explains why `map` is declared `far` (`PG:283`) and why every big array is a single `new` (`PG:617-620, 1348-1350`).

## The 16-bit consequences

- `int` is 16 bits: range -32,768..32,767. The cap on every counter, hit points and a sequence's repeat count is `INF_REPEAT 32767` (`CHAR.H:13`); the touch code has explicit wrap guards (`PG:3441-3443, 3493-3500`, "Stop any wrap-around").
- Pixel positions fit easily, but `ulongi` (32-bit) is used for clocks (`PG:301-302, 308`), so a game can run 2^32 ticks / 18.2 = about 7.5 years before `clock` wraps.
- Block numbers, monster numbers, scene-link indexes are `unsigned char` (`BLOC.H` `blk`; `MAP.H:20`; `GRATOR.H:29` `NOLINK 0xFF`). That alone would allow 256; the authors stopped well short (below).

## What actually has to fit in 64 KB: the arithmetic

`sizeof(blkstruct)` = 20x20 pixels (400) + Birthmon 1 + Birthtime 2 + Xtra 2 + solid 1 + hitpt 1 + scorepts 2 + chhitpt 2 + nextbl 1 + ntime 2 + touchbl 1 + grav 1 + obj 1 + effect 1 + eamt 2 = **420 bytes**
(`BLOC.H:35-52`; the port's `BLOCK_SIZE = 420`, `web/packages/engine/src/formats/blocks.ts:7`, confirms the 1-byte packing).

| Object                        | Count              | Bytes                  | Where                        | Fits in 65,536?                                                |
| ----------------------------- | ------------------ | ---------------------- | ---------------------------- | -------------------------------------------------------------- |
| Background blocks             | `BACKBL+1` = 151   | 151 x 420 = **63,420** | `PG:1348`, `BLOC.H:6`        | yes, with 2,116 to spare                                       |
| Monster blocks                | `MONBL+1` = 101    | 42,420                 | `PG:1349`, `BLOC.H:7`        | yes                                                            |
| Character blocks              | `CHARBL+1` = 51    | 21,420                 | `PG:1350`, `BLOC.H:8`        | yes                                                            |
| Map grid                      | 100 x 100 x 2      | **20,000**             | `PG:283`, `MAP.H:7-9, 20-25` | yes (declared `far`)                                           |
| Placed monsters               | 200 x 10           | 2,000                  | `MAP.H:27-34`                | yes                                                            |
| `.mon` types                  | 64 x 300           | 19,200                 | `MON.H:6, 25-45`             | yes                                                            |
| Save-under for drawn monsters | 50 x 400           | 20,000                 | `PG:80, 617`                 | yes                                                            |
| Screen scratch buffer         | 65,570 (farmalloc) | 65,570                 | `DIRTRECT.C:86`              | it IS the whole segment, plus 34 bytes to round to a paragraph |

**Why the block file stops at 150.** One `new blkstruct[N]` must stay under 65,536 bytes: N <= floor(65,535 / 420) = **156**. The game also allocates one extra slot
(`BACKBL+1`) because the value 150 itself is used as the "no block" marker (`PG:1983-1990` tests `ci.inv[..] != BACKBL`), so the true ceiling was **155**; the authors picked 150, a round number just under it.
Monsters get `MONBL` 100 and characters `CHARBL` 50 for the same reason, scaled by need. **[inference]** The numbers were chosen as round numbers under a 64 KB ceiling, not computed to the byte.
Going past 156 would have meant `huge` pointers (slow, and the library's `new` does not return them in this model).

**Why the map is 100 x 100.** 64 KB / 2 bytes per cell = 32,768 cells, so a square map could have been 181 x 181 (181^2 = 32,761). The authors chose 100.
The constants are written as `MLEN`/`MWID` in headers but the drawing code hard-codes 100 and 16/10: `PG:4346` uses `%100`, and `PG:4344-4345` loops 16 x 10. **[inference]** 100 is a round number that kept the .map file near 22 KB (20,000 + 2,000) on a floppy-sized budget, and a two-digit coordinate. It was **not** forced by segments (181 would have fit).
Also: a map cell holds one block byte and one monster-index byte, so a hit test on a cell is two byte reads.

**Why the screen buffer is 65,570 bytes.** The software-scroll path keeps a full 64 KB ring (next chapter). 65,536 + 34 leaves room for the "round up to the next paragraph" step
(`DIRTRECT.C:86-92`: the comment "In case we need to round up add 32" plus the pointer's low 4 bits). A segment starts every 16 bytes, so an arbitrary far pointer must be bumped up to a multiple of 16 before the assembly code can use it as a segment base (`ScratchSeg`).

## What 640 KB means

Add it up for a full-size game: blocks 63,420 + 42,420 + 21,420 = **127,260 bytes**, the screen 65,570, the map 20,000, monsters 19,200 + 20,000 + `mi` (200 x sizeof(minfo))
plus the program image, the CMF song and the digitized sounds. That is roughly 300 KB of data, so a 640 KB machine had room, but not much on a PC with a mouse driver, network and a Sound Blaster driver loaded
(`PG:617-629` shows the error box "NOT ENOUGH MEMORY!" when the 65 KB scratch buffer fails, with the comment that it is "the biggest" so earlier allocations succeeded). **[inference]** Hence the games ship "load a scene's blocks, free them at the scene's end" (`PG:1543-1545` deletes `blks[0..2]`).

## Tips

- A scene's three block files must each stay at their counts; extra blocks are not loadable. Palette-wise you can use up to 150 distinct backgrounds, 100 monster frames, 50 hero frames.
- "Number 150 is empty": never try to use block 150 as a real block; it is the marker.
- `.bbl` size is a good integrity check: 150 x 420 = 63,000 bytes exactly.

## Hazards

- **No bounds check** on the effect index: `ci.meter[blk->effect]` (`PG:3441, 3478`) with `effect` an unsigned char and `meter` holding 30 ints (`CHAR.H:50`). An effect of 30..255 reads and writes memory past the counter array. The editors never offer it, so a hand-edited .bbl is the only way in. **[not yet checked in DOSBox]** what sits after `ci.meter`.
