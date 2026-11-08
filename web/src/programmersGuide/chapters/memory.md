# The memory model

## What PLAYGAME was built as

PLAYGAME is a **real-mode DOS** program, so it sees the first 1 MB through 16-bit segment:offset pairs and has about 640 KB of conventional memory
for code, data and heap. The checked-in `code/GM` C/C++, headers, assembly, makefiles and link lists contain no EMS, XMS, HIMEM, expanded-memory or extended-memory references. The visible allocation paths use `new` and `farmalloc` (`PG:611-625`, `DIRTRECT.C:82-94`, `SOUNDC.C:75-94`). That source check does not establish what an opaque driver or library does, or how much conventional memory is free on a particular machine; those remain **[not yet checked in DOSBox]**.
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
- Pixel positions fit easily, but `ulongi` (32-bit) is used for clocks (`PG:301-309`). A 32-bit counter at 18.2 ticks a second has about 7.5 years of capacity; that is arithmetic, not a safe-uptime promise. The main loop copies `TimerCounter` into `clock` (`PG:1453-1455`), while `SndClock` advances at eight times that rate (`PG:4423-4445`); deadline comparisons, save/load and the faster counter can meet wrap hazards sooner. **[not yet checked in DOSBox]** long-running behavior.
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

**The 150-block limit and the segment budget.** For 420-byte packed records, floor(65,535 / 420) = **156** slots before allowing for allocator overhead. The game allocates one extra slot (`PG:1347-1350`), and 150 itself marks an empty inventory entry (`PG:2203-2204`). A payload-only ceiling with that spare would be **155** usable blocks; the actual constants are 150 backgrounds, 100 monster blocks and 50 character blocks (`BLOC.H:6-8`).
**[inference]** These round limits may have been chosen with the 64 KB budget in mind; the source does not explain why these particular numbers were chosen or how the authors balanced the three sets. The arithmetic does not establish a safe larger allocation or the speed of `huge` pointers. Nor does it prove the library lacks a larger `new`: the supplied link map lists both unsigned-int and unsigned-long overloads (`code/GM/PLAYGAME.MAP:459-460`).

**Why the map is 100 x 100.** 64 KB / 2 bytes per cell = 32,768 cells, so a square map could have been 181 x 181 (181^2 = 32,761). The authors chose 100.
The constants are written as `MLEN`/`MWID` in headers (`MAP.H:8-19`) but the drawing code hard-codes 100 and 16/10: `PG:4346` uses `%100`, and `PG:4344-4345` loops 16 x 10. A 100 x 100 map plus 200 placed monsters makes a 22,000-byte payload (`PG:4330-4337`, `engine/formats/map.ts:42-46`). **[inference]** A round number, floppy budget and two-digit coordinates may have influenced that choice; the source does not say. The grid alone was **not** at the segment ceiling (181 x 181 x 2 = 65,522 bytes), but that does not mean the rest of the engine supports a larger map unchanged.
Also: a map cell holds one block byte and one monster-index byte, so a hit test on a cell is two byte reads.

**Why the screen buffer is 65,570 bytes.** The software-scroll path keeps a full 64 KB ring (next chapter). 65,536 + 34 leaves room for the "round up to the next paragraph" step
(`DIRTRECT.C:86-92`: the comment "In case we need to round up add 32" plus the pointer's low 4 bits). A segment starts every 16 bytes, so an arbitrary far pointer must be bumped up to a multiple of 16 before the assembly code can use it as a segment base (`ScratchSeg`).

## What 640 KB means

Add it up for a full-size game: blocks 63,420 + 42,420 + 21,420 = **127,260 bytes**, the screen 65,570, the map 20,000, monsters 19,200 + 20,000 + `mi` (200 x sizeof(minfo))
plus the program image, the CMF song and the digitized sounds. Any roughly 300 KB data total is an **[estimate]**, not proof that a particular game fits under DOS: the executable, allocator overhead, song, sounds and resident drivers also matter. `PG:617-625` shows the error box "NOT ENOUGH MEMORY!" when the 65 KB scratch buffer fails, with the comment that it is "the biggest".
The block-set lifetime itself is explicit: allocate on scene entry (`PG:1347-1350`), load (`PG:1374`), then delete all three sets on ordinary scene exit (`PG:1541-1545`). **[inference]** Saving conventional memory may explain that design; the source does not establish the authors' motive or the free-memory margin on a real machine.

## Tips

- A scene's three block files must each stay at their counts; extra blocks are not loadable. Palette-wise you can use up to 150 distinct backgrounds, 100 monster frames, 50 hero frames.
- "Number 150 is empty": never try to use block 150 as a real block; it is the marker.
- `.bbl` size is a good integrity check: 150 x 420 = 63,000 bytes exactly.

## Hazards

- **No bounds check** on the effect index: `ci.meter[blk->effect]` (`PG:3440-3442`, `PG:3478-3499`) with `effect` an unsigned char and `meter` holding 30 ints. An effect of 30..255 can read past the counter array; a write depends on the touch being accepted and the counter branch being taken. The declaration places `seqon[20]` after `meter` (`PG:150-172`), and the supplied link map places `chr` 135 bytes after `ci` (`code/GM/PLAYGAME.MAP:726-727`). That supports a layout calculation, not a guarantee of a shipped executable's out-of-bounds behavior: exact corruption is **[not yet checked in DOSBox]**. The web port bounds its counter writes (`engine/touch.ts:120-133`), so it cannot reproduce adjacent DOS memory corruption.
