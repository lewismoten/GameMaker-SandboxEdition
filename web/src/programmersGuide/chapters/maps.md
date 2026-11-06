# Maps, scenes and the memory budget

## 4.1 The map

| Limit           | Value                                                                                                             | Where                                                                                            | Tag      |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Map size        | 100 x 100 cells (`MLEN`, `MWID`)                                                                                  | `MAP.H:9-10`                                                                                     | [design] |
| Cell            | 2 bytes: `blk` (background block 0..149) and `mon` (live occupancy index)                                         | `MAP.H:15-19`                                                                                    | [file]   |
| Grid            | 100 x 100 x 2 = **20,000 bytes**, declared `far`                                                                  | `PG:283`; far-data segment 1DE2:0000, `PLAYGAME.MAP:810`                                         | [64K]    |
| Placed monsters | `LASTMM` = 200 records of 10 bytes = 2,000                                                                        | `MAP.H:8, 21-28`                                                                                 | [design] |
| `.map` file     | 20,000 + 2,000 = **22,000 bytes**                                                                                 | `PG:4330-4336` (two `fread`s: `MLEN*MWID` cells, then `LASTMM` records)                          | [file]   |
| Indexing        | `map[y][x]`, row major, y first                                                                                   | `PG:4346`                                                                                        |          |
| Wrap            | both axes: `(ly+y)%100`, `(lx+x)%100` in drawing; `(x+MLEN)%MLEN` in births and paths; `chr.y[0]-1+MWID` in touch | `PG:4346`, `PG:3013-3014`, `PG:2632-2669` (solid-wall look-ups), `PG:3386-3393` (the hero wraps) | [design] |

A monster record is `monnum` (1) + `status` (2) + `xtra` (1) + `curx,cury` (4) + `extra` (2) = **10 bytes** (`MAP.H:21-28`; no padding, the port's
`engine/formats/map.ts` agrees). Only `monnum`, `curx` and `cury` are used (`PG:4704-4707`); the other three fields are filler ("Filler, should never be used", `MAP.H:24`).
The per-cell `mon` byte is **runtime occupancy**, not level data: the player starts monsters from the records and rebuilds `map[][].mon` as they move (`PG:3092-3140`).

**Why 100.** One cell is two bytes, so a square map could reach 181 x 181 (181^2 x 2 = 65,522 <= 65,536) and still sit in its own segment. The 64K rule is
therefore **not** what stopped it at 100. [inference] 100 is a round number, a two-digit coordinate for the editors' status line, and a `.map` file of
about 22 KB for floppies. The next section checks whether memory could have been the reason.

## 4.2 The memory budget (the answer to "was 100 x 100 chosen to leave room?")

A recollection from 1994: "map size may also be smaller to allow for characters and monsters to be on the screen with limited memory."

This table adds up everything PLAYGAME holds. Sizes come from the headers (cited) or from the link map for the program image. Estimates are marked.

### Program image (loaded from the EXE)

| Item                                                             |       Bytes | Source                                                          |
| ---------------------------------------------------------------- | ----------: | --------------------------------------------------------------- |
| Code (`_TEXT`, `PLAYGAME_TEXT`, `DIRTRECT_TEXT`, `CT_TEXT`, ...) |     122,400 | `PLAYGAME.MAP:6-31` (0x1DE20)                                   |
| Far data (the map)                                               |      20,000 | `PLAYGAME.MAP:33` (0x22C40 - 0x1DE20 = 0x4E20)                  |
| Near data + BSS (`DGROUP`)                                       |      38,544 | `PLAYGAME.MAP:38-47` (0x2C2D0 - 0x22C40 = 0x9690)               |
| Stack                                                            |      15,000 | `PG:356` (`_stklen`); the map's 0x80 is only the linker default |
| **Image total**                                                  | **195,944** |                                                                 |

Cause worth noting: `DGROUP` (near data, BSS, stack) must stay under 64 KB in the large model. It is 38,544 + 15,000 = 53,544 (leaving 11,992).
**If the map had been a normal global it would not have fit:** 53,544 + 20,000 = 73,544 > 65,536. That is why `map` carries `far` (`PG:283`). [64K]

### Heap, allocated at start (`PG:613-620`)

| Item                                                     |             Bytes | Source                                                                                                                                                         |
| -------------------------------------------------------- | ----------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorder (`Recording`, 1,000 x 3-byte records)           |    3,000 + object | `PG:216-245` (`RECLEN 1000`, `RecordStruct` = `uint`+`uchar`)                                                                                                  |
| Hero save-under, top and bottom (2 x 20 x 20)            |               800 | `PG:615-616`                                                                                                                                                   |
| Monster save-under (`MaxMonsShown` 50 x 400)             |            20,000 | `PG:80, 617`                                                                                                                                                   |
| `mi`, per-monster runtime state, 200 x `sizeof(minfo)`   |      about 11,000 | `PG:618`; fields at `PG:113-137`; counting the fields gives 55 bytes with byte packing [estimate] **[not yet checked in DOSBox]** (a `sizeof` would settle it) |
| `mon` (64 monster types x 300)                           |            19,200 | `PG:619`, `MON.H:6, 41`                                                                                                                                        |
| Screen scratch buffer (the 64 KB ring + paragraph slack) |            65,570 | `DIRTRECT.C:86`                                                                                                                                                |
| **Subtotal**                                             | **about 119,570** |                                                                                                                                                                |

### Heap, allocated when a game starts playing (`playscene`, `PG:1348-1350`; freed at `PG:1543-1545`)

| Item                          |       Bytes | Source                       |
| ----------------------------- | ----------: | ---------------------------- |
| Background blocks (151 x 420) |      63,420 | `PG:1348`, `BLOC.H:6, 35-53` |
| Monster blocks (101 x 420)    |      42,420 | `PG:1349`                    |
| Hero blocks (51 x 420)        |      21,420 | `PG:1350`                    |
| **Subtotal**                  | **127,260** |                              |

### Fixed total

195,944 + 119,570 + 127,260 = **442,774 bytes (432 KiB)**, before any scene data and before DOS.

### Variable (depends on the game)

| Item                                                                     |                Bytes | Source                                              |
| ------------------------------------------------------------------------ | -------------------: | --------------------------------------------------- |
| Scene table: 283 x number of scenes (60 scenes = 16,980)                 |        283 per scene | `PG:5168`, `GRATOR.H:162-173`                       |
| Scene file-name pool (the `.gam` stores it whole, up to 0xFFF0)          | a few KB; max 65,520 | `PG:5173-5180`                                      |
| Birth table: 5 bytes per birthing block, max 150                         |            up to 750 | `PG:206-211, 4228`                                  |
| CMF song: `inst_num x 16` (max 128 x 16 = 2,048) + the music block       |          2 KB + song | `SBMUSIC.C:88-100`                                  |
| Sound Blaster voice driver (read whole into memory)                      |       file size + 16 | `SOUNDC.C:79` **[size of the driver file: verify]** |
| Voice buffer: the **largest** VOC ever played stays allocated            |          up to 64 KB | `SOUNDC.C:176-200`                                  |
| Display-a-text-file screen copy (64,000, only while a text screen is up) |               64,000 | `PG:1995`                                           |

A typical game: 60 scenes (17 KB), a few KB of names, a 10-40 KB song, one or two voice files (10-60 KB): **about 30-120 KB** on top of the fixed total.

### What is left for DOS

A 640 KB machine has 655,360 bytes of conventional memory. 655,360 - 442,774 = **212,586** bytes. Subtract the variable part (30-120 KB) and **90-180 KB** remain for DOS, the command shell,
the mouse driver and the FM driver. DOS 5 or 6 with `DOS=HIGH` leaves a program about 590 KB; DOS 3.3 with a network shell, much less. **[estimate; those DOS figures are not from the source]**
So a full-size game fits a clean 640 KB machine, and not with room to spare. That fits the code's own reactions to running out of memory:
"NOT ENOUGH MEMORY!" if the 64 KB buffer cannot be had (`PG:621-625`; the comment at `PG:621` says the failing allocation is "the biggest"), "Sorry...Out of Memory!" if a block file cannot be had (`PG:1352-1368`),
and a silent `return(FALSE)` in the voice player (`SOUNDC.C:196-199`).

### Where the memory goes, and what a bigger map would have cost

| Group                                                                                                                     |            Bytes | Share of the 442,774 fixed |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------: | -------------------------: |
| Screen scratch buffer                                                                                                     |           65,570 |                      14.8% |
| Block files (all three)                                                                                                   |          127,260 |                      28.7% |
| **Everything about monsters** (types 19,200 + runtime ~11,000 + placed 2,000 + save-under 20,000 + monster blocks 42,420) | **about 94,620** |                  **21.4%** |
| Map                                                                                                                       |           20,000 |                   **4.5%** |
| Program image (code + stack + near data)                                                                                  |          175,944 |                      39.7% |

- The map is **not** where the memory goes. The monster side is about **4.7 times** the map.
- The 50-monster save-under (20,000 bytes) is exactly the size of the map. [inference] The authors balanced "how big the world is" against "how many things move on one screen"; they
  put the same number of bytes into both.
- A map of 150 x 150 would cost 45,000 (+25,000, to 467,774 fixed); 181 x 181 would cost 65,522 (+45,522, to 488,296 fixed) and leave **167 KB** for DOS **and** all the variable data above.
  **[inference]** That is the plausible reason 100 was kept: it is the largest round number that leaves a typical machine a few tens of KB of margin, with the map segment at about 30% full.
- The editors hold their own copies (MAPMAKER keeps a map plus its working data). Their budgets are not totaled here. **[not yet checked in DOSBox]** It matters only if the editors' limit mattered more than the player's.

Verdict on A recollection from 1994: **plausible but only partly supported.** Memory was tight (about 60% of a 640 KB machine is spoken for before a scene loads), and the number of drawn monsters
is capped for memory (`MaxMonsShown`, `PG:80`), exactly as he remembers. But the map itself is a small piece; a 181 x 181 map would still have fit the segment.

## 4.3 Scenes and links

`GameClass::Load` (`PG:5156-5170`) reads a 256-byte `DataFileHeader`, a 6-byte `GratorHeader`, then `NumScenes x sizeof(Scene)`, then the file-name pool (`PG:5171-5180`).

### The scene record, 283 bytes (`GRATOR.H:162-173`)

| Field       |   Bytes | Notes                                                                                                                            |
| ----------- | ------: | -------------------------------------------------------------------------------------------------------------------------------- |
| `gametype`  |       2 | 10 for an adventure scene (`ADVTYPE`); start/end screens use 1/2 (`GRATOR.H:14-15`, port `game.ts:29-31`)                        |
| `Pos` (x,y) |       4 | integrator (editor) position only                                                                                                |
| `Scroll`    |      16 | up, down, left, right (0 no scroll, 0xFF scroll with character, other = constant speed); `Style` and 11 spare (`GRATOR.H:63-78`) |
| `NumLinks`  |       1 | a `uchar` (`GRATOR.H:160`); the player ignores it and loops all 20                                                               |
| `desc`      |      20 | `SCENEDESCLEN`, 19 characters and a NUL                                                                                          |
| `Files[20]` |      40 | 20 offsets into the name pool                                                                                                    |
| `links[20]` |     200 | 10 bytes each: `ToScene` (2), `From` (4), `To` (4)                                                                               |
| Total       | **283** | 2 + 4 + 16 + 1 + 20 + 40 + 200                                                                                                   |

The 20 file slots are assigned by position: 0 palette, 1 map, 2 background blocks, 3 monsters, 4 monster blocks, 5 character, 6 character blocks, 7 sounds, 8 song
(`PG:4244-4289`; slots 9-10 are the before/after pictures, `GRATOR.H:22-23`; the rest are free). `STARTENDFILES 5` is for start and end scenes only.

| Limit                | Value                                               | Reason                                                                                                                                   | Tag            |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Links per scene      | 20                                                  | `MAXSCENELINKS`, a round number; fixed loop at `PG:3848`                                                                                 | [design]       |
| File slots per scene | 20                                                  | `SCENEFILES`; only 9 used by adventure scenes                                                                                            | [design]       |
| Scene count          | the header says 20 (`OLDMAXSCENES`) but 60-101 ship | the 3.00 loader uses `NumScenes` as given (`PG:5164-5168`). A **64 KB ceiling** applies to `new Scene[N]`: 65,535 / 283 = **231 scenes** | [16-bit] [64K] |
| Name-pool size       | 0xFFF0 = 65,520 bytes                               | `PG:5173-5174` clamps it                                                                                                                 | [16-bit]       |
| File name            | 13 bytes (`SCENEFILENAMELEN`): 8 + dot + 3 + NUL    | DOS 8.3                                                                                                                                  | [DOS]          |
| Digital sound name   | 9 bytes: 8 + NUL; `.voc` is appended                | `SOUND.H`, `SOUNDC.C:167`                                                                                                                | [DOS]          |
| Link coordinates     | `int`, but the map is 100 wide                      | no check                                                                                                                                 | [16-bit]       |

Why 231: **[inference]** `new` takes a 16-bit size in the large model (it is the C library's `size_t`). 283 x 232 = 65,656 wraps to 120, so a 232-scene game would allocate 120 bytes and
overwrite the heap. It is untested; nothing in the shipped games goes near it. **[not yet checked in DOSBox]** Check it by building a 232-scene `.gam` and loading it in DOSBox.

### How a link fires (`chklnk`, `PG:3837-3858`)

Each tick, for each of the 20 links, for each of the **6** map cells the hero overlaps (`GetTouchbl`, `PG:3770-3799`: three rows by two columns, the right column only when
`x[1] > 0`, i.e. when the hero is not exactly aligned to a block), the link fires when its `From` equals that cell and its `ToScene` is not `NOSCENE`. The first match wins, in slot order.
The hero is placed at `To` (`chr.x[0]`, `chr.y[0]` are overwritten with the link's `To`, `PG:3849-3851`).
A link whose `To` is in another scene's map must still have a valid cell: nothing checks the range. A link triggers when the hero overlaps its cell **partly**, not only when standing on it.

Scrolling directions are stored per scene but **reversed on entry**: `scroll.up = Scroll.down` and so on (`PG:1380-1383`, `PG:1807-1810`). [inference] The editor's "scroll up" means "the
view moves up when you move up", the runtime stores which edge stops it.

## 4.4 Tips

- Treat 22,000 bytes as an integrity check for any `.map`.
- Keep important cells off the map's last row and column when you rely on wrap: a monster's target wraps with `(x+MLEN)%MLEN` (`PG:3013-3014`) and the hero wraps too: `chkmapbounds` adds or subtracts 100 (`PG:3386-3393`), so walking off the right edge puts the hero on column 0. Both are reasons to wall the seam (or use it on purpose).
- A scene count above 231 is a hazard even if the editor allows it.

## 4.5 Hazards

- `FreePtr` and the scene allocation are the two 16-bit limits a very large game could hit. Both are theoretical.
- Anything that reads `mm[].status`, `xtra`, `extra` or `map[][].mon` from a file is reading nothing the player uses.
