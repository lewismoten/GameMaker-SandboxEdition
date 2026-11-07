# File formats, byte by byte

All integers are 16-bit little endian unless said. The file layouts below use byte packing; the web parsers encode the fields explicitly. Sizes of DOS runtime objects in saves still depend on the original compiler's layout (section 13.7). Tags: [16-bit] [64K] [file] [DOS] [design]; [inference]; [not yet checked in DOSBox].

## 13.1 At a glance

| File       |                                   Size | Holds                                          | Fixed by                         |
| ---------- | -------------------------------------: | ---------------------------------------------- | -------------------------------- |
| `.gam`     | 256 + 6 + 283 x scenes + 2 + name pool | the game: scenes, links, file names            | `GRATOR.H`, `GMGEN.H:80-110`     |
| `.pal`     |                                **768** | 256 x (R,G,B), 6 bits each                     | `PALETTE.H:8-17`                 |
| `.map`     |                             **22,000** | 100 x 100 x 2 cells + 200 x 10 placed monsters | `MAP.H`                          |
| `.bbl`     |                             **63,000** | 150 x 420 background blocks                    | `BLOC.H`                         |
| `.mon`     |                             **19,200** | 64 x 300 monster types                         | `MON.H`                          |
| `.mbl`     |                             **42,000** | 100 x 420 monster blocks                       | `BLOC.H`                         |
| `.chr`     |                              **7,568** | 2 x 3,784 (only the first is used)             | `CHAR.H`                         |
| `.cbl`     |                             **21,000** | 50 x 420 hero blocks                           | `BLOC.H`                         |
| `.snd`     |                              **2,430** | 30 x (36 x 2) frequencies + 30 x 9 names       | `SOUND.H`                        |
| `.cmf`     |                               variable | FM song, 146 ticks a second                    | `SBCMUSIC.H:52`                  |
| `.voc`     |                               variable | digitized sound, **under 64 KB**               | `SOUNDC.C`                       |
| `.rec`     |              3 x events, at most 3,000 | demo input                                     | `PG:216-245`                     |
| `.his`     |                                **340** | 10 x (4-byte score + 30-byte name)             | `HISCOREL.C`, `fmt/highscore.ts` |
| saved game |                 about 37.7 KB + extras | the whole live state                           | `PG:1733-1830, 1836-1900`        |

Arithmetic: 150 x 420 = 63,000; 100 x 420 = 42,000; 50 x 420 = 21,000; 64 x 300 = 19,200; 2 x 3,784 = 7,568; 100 x 100 x 2 = 20,000 + 200 x 10 = 2,000; 30 x 72 + 270 = 2,430; 10 x 34 = 340.
A file of the wrong size is a good first test of a bad import. The slot positions in a scene (0 palette ... 8 song) are in chapter 4.

## 13.2 `.gam` (the integrator)

|     Offset |      Size | Field          | Notes                                                                                                                                     |
| ---------: | --------: | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
|          0 |         2 | `GMId`         | ASCII "GM"; the only thing PLAYGAME checks (`GMGEN.H:100`, `PG:5156-5169`)                                                                |
|          2 |         2 | `Ver`          | file version; not checked                                                                                                                 |
|          4 |         1 | `Encrypt`      | unused; written 0                                                                                                                         |
|          5 |         1 | `FileType`     | unused                                                                                                                                    |
|          6 |       250 | filler         | filled with the letters "RSD" repeated (`GMGEN.H:92`)                                                                                     |
|        256 |         6 | `GratorHeader` | `NumScenes`, `FilesPerScene` (always 20), `LinksPerScene` (always 20); only `NumScenes` is read (`PG:5164`)                               |
|        262 |   283 x N | `Scene[N]`     | see chapter 4                                                                                                                             |
| 262 + 283N |         2 | `FreePtr`      | length of the name pool; clamped to 0xFFF0 (`PG:5173-5174`)                                                                               |
|            | `FreePtr` | name pool      | NULLL-terminated names; a scene's `Files[i]` is an offset into it; offset 0 holds an empty string = "no file" (`GRATOR.H:116-118, 134-147`) |

Example size: 60 scenes, 3,000-byte pool = 256 + 6 + 16,980 + 2 + 3,000 = **20,244 bytes**.
Older games (before version 3.00) use a 330-byte scene with 9 file names of 10 characters inline, 15-character descriptions and 20 links of five ints (`GRATOR.H:36-61`); the web port converts them (`fmt/game.ts:221-274`).

## 13.3 `.map`, blocks, monsters, character, palette

Offsets for each record are in the chapters that explain them: block 420 (chapter 5), monster 300 (chapter 6), character 3,784 (chapter 7). The `.map` file has no header: 20,000 bytes of `{blk, mon}` pairs in row-major order, then 200 x 10 bytes of placed monsters (`PG:4330-4336`).
Reading is by count, not by file length (`fread` of exactly `MLEN*MWID`, then `LASTMM`); `loadspecmap` ignores both read counts and reports success once the file opens (`PG:4330-4337`). A short read can leave old bytes in these persistent arrays, but that is not a promise that all previous-scene state survives: scene initialization also changes it.
Block, monster and sound loaders likewise ignore read counts (`PG:4294-4327`), as does the character's general loader (`code/GM/GENC.C:295-307`). There is an important exception to the stale-byte warning: sound names are zeroed before reading (`PG:4301-4302`); block buffers are newly allocated on ordinary scene entry (`PG:1347-1350`, `PG:1541-1545`). Exact partial-record and visible results are **[not yet checked in DOSBox]**. The web map parser instead builds fresh arrays and zero-fills missing bytes (`engine/formats/map.ts:28-40`, `engine/formats/binary.ts:33-68`).

## 13.4 `.snd` (30 effects)

30 records of 36 unsigned 16-bit frequencies (72 bytes), then 30 names of 9 bytes: 2,160 + 270 = **2,430** (`PG:4294-4304`, `SOUND.H:11, 30-33`). A frequency of 0 is silence. A name starting with a NULLL or a space means "use the speaker" (`PG:4595`).
Names are 8 letters and no extension: the player appends `.voc` and looks in the game's folder (`SOUNDC.C:167`). Sound slot numbers: `LASTSND 30`, nine of them assigned to events (`SOUND.H:17-25`).

## 13.5 `.cmf`

The header struct `CMFHDR` is in `SBCMUSIC.H:30-52`; PLAYGAME uses: the four-letter id, `clock_ticks` (must equal 146, `HDRCLK`), the instrument count (16 bytes each; this loader does not check a 128-instrument ceiling), and the offset of the music block (`SBMUSIC.C:71-100`).
Oddity: the id test is written `(id[0] != 'C') && (id[1] != 'T') && (id[2] != 'M') && (id[3] != 'F')` (`SBMUSIC.C:73-74`), which rejects a file only when **all four** letters are wrong; a file with any one correct letter in place passes the check
(a separate test requires the clock-tick value 146, `SBMUSIC.C:80-86`). [inference] it was meant to be `||`; that would require all four letters to match, but the source does not establish the author's intent. The web parser does require all four (`engine/formats/cmf.ts:20-25`). The DOS music block is read with `fread(ptr, 1, MusicSize, fp)` where `MusicSize` is a `long`, and the read count is ignored (`SBMUSIC.C:87-102`). With a 16-bit `size_t`, that count cannot represent a block over **65,535 bytes**. The resulting playback is **[not yet checked in DOSBox]**. [16-bit]

## 13.6 `.rec`, `.his`, `.pal`

- `.rec`: records of `{ uint DeltaTime; uchar key }`, 3 bytes. `key` is a scan code, bit 7 set = released; `DeltaTime` counts game ticks since the last event (so 65,535 ticks = 60 minutes between two keys). The array is `RECLEN 1000`; recording **stops silently** at 1,000 events (`PG:573`). A demo cannot be longer than 1,000 key events.
- `.his`: ten `{ long score; char name[30] }`, 34 bytes each, **340 bytes**.
- `.pal`: 768 bytes, 6-bit values (chapter 11).

## 13.7 The saved game

`SaveGame` (`PG:1836-1900`) and `LoadGame` (`PG:1733-1830`) write the live state in this order (each `fwrite`/`fread` is exactly the type shown):

| Order | Item                                                   |                                 Bytes |
| ----: | ------------------------------------------------------ | ------------------------------------: |
|     1 | `MaxBlkMon`                                            |                                     1 |
|     2 | `prevscene`, `doscene`, `linkin`                       |                                     6 |
|     3 | `SavedTime` (clock)                                    |                                     4 |
|     4 | `nxtchg[150]` (block change times)                     |                                   600 |
|     5 | `blkmap[150]`                                          |                                   150 |
|     6 | `cinfo` (hero's live state)                            |                                   135 |
|     7 | `chr` (the whole character record)                     |                                 3,784 |
|     8 | `mx`, `my`                                             |                                     4 |
|     9 | `mi[200]` (monster runtime state)                      | about 11,000 **[estimate: 200 x 55]** |
|    10 | `mm[200]`                                              |                                 2,000 |
|    11 | `map` (**the live map**, because touches change cells) |                                20,000 |
|    12 | `NoMons`                                               |                                     1 |
|    13 | `BlkMon[MaxBlkMon]`                                    |                                5 each |
|    14 | the recorder object and `RecIndex` events              |                       object + 3 each |

Fixed part under the table's layout assumptions: 1 + 6 + 4 + 600 + 150 + 135 + 3,784 + 4 + 11,000 + 2,000 + 20,000 + 1 = **37,685 bytes**; with 10 spawners and an empty recorder, about 37.8 KB (**[estimate]**). In particular, 55 bytes per `minfo` assumes byte packing, 2-byte ints, 4-byte longs and 4-byte far pointers (`PG:113-146`, `code/GM/COORD2D.HPP:13-19`). The writer uses actual `sizeof` values, not these printed totals (`PG:1874-1890`); the recorder adds its whole runtime object and its events (`PG:220-236`, `PG:255-265`).
The save contains the listed live state, not every mutable global. On load, the **saved map and placed monsters** replace memory; the `.map` file is not re-read. Blocks, monster types, sounds and other assets are re-read from the saved scene's file slots (`PG:1773-1812`). An edited map therefore need not match the saved map, but those reloaded assets and scene references must still make sense for the saved indexes.
Two things to know: `mi` holds a **far pointer** (`save`, `PG:127`) that is serialized, but load clears every `mi[i].save`; it also preserves the current character save-under buffers instead of using the saved pointers (`PG:1766-1767`, `PG:1814-1821`). The saved `ci`/`chr` hold the hero's position (chapter 14).
The web port writes JSON state and restores it through its own scene loader (`engine/scene.ts:761-805`), not the DOS object layout. The printed DOS sizes remain an **[estimate]**: **[not yet checked in DOSBox]**, and no original-toolchain `sizeof` probe verifies them here.

## 13.8 Graphics and text scripts (not Game-Maker structures)

`.bkd` (x, y as signed 16-bit and a GIF name), `.lst` (file names with an optional pause) and `.txt` (raw text) drive scene graphics (`fmt/graphicScripts.ts:1-74`); GIF, FLI and VOC are external formats read by the engine's own decoders.

## 13.9 Tips

- Check sizes first: 22,000 / 63,000 / 19,200 / 42,000 / 7,568 / 21,000 / 2,430 / 768.
- A scene file slot left blank skips its loader (`PG:4239-4253`); do not assume fresh defaults. Persistent arrays can retain data, but the block sets are freed on ordinary scene exit (`PG:1541-1545`), so not every blank slot means "reuse the previous scene" (chapter 4).
- Keep every `.voc` under 65,535 bytes and every `.cmf` music block too.
- Do not rely on the filler bytes; PLAYGAME ignores them (chapter 14).

## 13.10 Audited layouts and real-file walkthroughs

The following atlas mirrors the printed Technical Reference. It adds a source audit after each format, explicitly recording where the port differs or provides no codec.

### 13.10.1 Reading a byte layout

The following plates describe the 3.00 disk files. Offsets start at zero and are decimal unless followed by `h`, which means hexadecimal. `u8`, `u16` and `u32` mean unsigned integers of one, two and four bytes; `i8`, `i16` and `i32` are signed integers of those sizes. Multi-byte numbers are little endian: `2C 01` is 300, and `FF FF` is -1 as an i16 or 65,535 as a u16. There is no automatic padding between fields in these game records.

A record-relative offset must be added to the record's base. Indexes start at zero. NULLL means a zero byte ending a string. LF means line feed (byte 10); CR means carriage return (byte 13). DOS text normally ends a line with CR LF: on a typewriter, carriage return sends the carriage to the start of the line and line feed advances the paper. The end-of-file marker (1Ah, Ctrl-Z, EOF) has the ASCII name SUB, meaning substitute; DOS uses it to mark the end of text, not as an ordinary printed character. Reserved bytes still occupy space and should survive an edit, even where the player gives them no meaning. The plates show field boundaries rather than lengths to scale.

The worked examples use Sandbox games: TEDDY's files unless another game is named. File names are shown in capitals; DOS treats their case alike. They are byte readings, not instructions to replace the examples' artwork. A file's name and extension are external to its contents: most Game-Maker records have no signature, version or count. The scene's file slot tells the reader what to expect.

**Source audit.** The byte packing is checked against the explicit field reads and writes in `engine/formats/binary.ts:1-146`. Worked-file paths are rooted at `games/teddy/disk/`, except W99.BKD in `games/maximus/disk/`. Both games are non-secret. HIS, configuration and transferred-executable illustrations are explicitly constructed or source-derived; they are not claimed game-disk artifacts.

### 13.10.2 PAL: the scene's colors

PALCHOS writes palettes. IMAGE also saves a palette extracted from a GIF. The editors and PLAYGAME read them. A PAL is exactly 768 bytes, with no header, file names or indexes of other files: it is 256 consecutive RGB triples, each component from 0 to 63.

**PAL: 768 bytes; no header**

| Offset | Bytes | Type | Contents       |
| ------ | ----- | ---- | -------------- |
| 3c     | 1     | u8   | Red, 0 to 63   |
| 3c + 1 | 1     | u8   | Green, 0 to 63 |
| 3c + 2 | 1     | u8   | Blue, 0 to 63  |

Color c runs from 0 through 255. A block pixel selects c; it stores no RGB value.

A BBL, MBL or CBL pixel is a one-byte index into this table. The GAM adventure scene names the palette in file slot 0. Sharing pictures across scenes requires compatible color positions, not merely the same collection of colors. Sprite pixel 255 means transparent; background pixel 255 remains an ordinary palette lookup.

**Worked example.** PARK.PAL is 768 bytes and begins `00 00 00 21 21 21`. Color 0 is black; color 1 starts at byte 3 and is RGB (33,33,33), gray. Color 255 starts at byte 765. These are actual file values, independent of the suggested index assignments above.

**Source audit.** Layout and tools: `code/GM/PALETTE.H:8-17`, `code/GM/PALCHOS.C:162`, `code/GM/IMAGE.C:189`; port read/write `engine/formats/palette.ts:7-15`. The three u8 fields are repeated 256 times, with no header in either writer.

### 13.10.3 MAP: cells and placed monsters

MAPMAKER writes and reads MAP files; PLAYGAME loads them from adventure slot 1. Each file contains exactly 10,000 two-byte cells followed by 200 ten-byte placement records. There is no header or palette. The world is 100 columns by 100 rows and wraps at its edges.

**MAP: 22,000 bytes; no header**

| Offset  | Bytes  | Type    | Contents                   |
| ------- | ------ | ------- | -------------------------- |
| 0       | 20,000 | bytes   | 100 × 100 cells, row first |
| 20,000  | 2,000  | records | 200 placed monsters × 10   |
| Cell +0 | 1      | u8      | BBL block index            |
| Cell +1 | 1      | u8      | Placed slot; 200 = none    |
| Slot +0 | 1      | u8      | MON type; 64 = none        |
| Slot +1 | 2      | i16     | Status (reserved)          |
| Slot +3 | 1      | u8      | Reserved                   |
| Slot +4 | 2      | i16     | Map column x               |
| Slot +6 | 2      | i16     | Map row y                  |
| Slot +8 | 2      | i16     | Reserved                   |

Cell (x,y) starts at 2 × (100y + x). Placed slot m starts at 20,000 + 10m.

The first byte of a cell selects BBL block 0 through 149 from adventure slot 2. The second selects a placement record, not a MON type. That placement's first byte selects type 0 through 63 from slot 3's MON. The type in turn selects pictures in slot 4's MBL. Thus changing the order of MON records changes what an unchanged map places.

**Worked example.** PARK.MAP is 22,000 bytes. Cell (5,5) starts at 2 × (100 × 5 + 5) = 1,010 and contains `00 C8`: block 0 and no placement (200). Placement 0 at 20,000 is `18 00 00 00 25 00 25 00 00 00`: MON type 24 at cell (37,37), with the reserved bytes zero. Coordinates are whole signed little-endian words, not packed x/y bit fields.

**Source audit.** Layout and writes: `code/GM/MAP.H:8-28`, `code/GM/MAPC.C:41-53`; DOS reader `PG:4330-4336`; port read/write `engine/formats/map.ts:28-48`. The later MapHeader/MapStruct declarations in MAP.H are not written by savemap; do not prepend them to a 22,000-byte map.

### 13.10.4 BBL: pictures with behavior

BLOCEDIT reads and writes background sets; IMAGE can extract them from GIF pictures. MAPMAKER previews them and PLAYGAME loads them from adventure slot 2. A BBL has 150 consecutive 420-byte records, totaling 63,000 bytes, without a header. Pictures occupy the first 400 bytes of every record, so metadata is interleaved with pictures rather than collected at the end of the file.

**Block record: 420 bytes; no header**

| Offset | Bytes | Type    | Contents                  |
| ------ | ----- | ------- | ------------------------- |
| 0      | 400   | u8[400] | 20 × 20 palette indexes   |
| 400    | 1     | u8      | Birth monster (MON index) |
| 401    | 2     | i16     | Birth interval            |
| 403    | 2     | bytes   | Reserved                  |
| 405    | 1     | u8 bits | Solid sides               |
| 406    | 1     | u8 bits | Hurt sides (reserved)     |
| 407    | 2     | i16     | Score change              |
| 409    | 2     | i16     | Hit-point change          |
| 411    | 1     | u8      | Next block index          |
| 412    | 2     | i16     | Animation interval        |
| 414    | 1     | u8      | Touched block index       |
| 415    | 1     | i8 bits | Gravity direction         |
| 416    | 1     | u8      | Can be carried            |
| 417    | 1     | u8      | Counter index             |
| 418    | 2     | i16     | Counter change            |

Record b starts at 420b. Pixel (x,y) is byte 20y + x within that record. Bits 1,2,4,8 mean top,right,bottom,left.

The map selects a record by index. Each pixel selects a color in the scene's PAL. Next and touched block fields select other records in the same BBL; a birth field selects a type in the scene's MON. The counter field selects a hero counter, not a sound effect. The player chooses event sounds from SND separately. Index 150 means no background block where a field accepts that sentinel. Timers count game ticks; all cells with one block number share its animation state.

**Worked example.** In PARK.BBL, block 10 starts at 4,200; its picture ends at 4,599. Byte 4,605 is `0F`: solid on all four sides. Bytes 4,611 through 4,614 are `0A 00 00 0A`: next block 10, zero interval, touched block 10. The twenty property bytes separate adjacent pictures.

**Source audit.** Fields and counts: `code/GM/BLOC.H:3-8`, `code/GM/BLOC.H:35-54`; writer `code/GM/BLOCC.C:73-87`; port read/write `engine/formats/blocks.ts:72-122`. The offsets follow the same field order and signedness; gravity is a signed byte interpreted as direction bits.

### 13.10.5 CBL and MBL: the sprite libraries

BLOCEDIT reads and writes all three block-set kinds. CHAREDIT reads CBL pictures; MONEDIT reads MBL pictures. PLAYGAME reads CBL from adventure slot 6 and MBL from slot 4. The extension determines the count: 50 records for CBL, 100 for MBL. Both use the complete 420-byte record shown for BBL, including its 20-byte behavior tail.

**CBL and MBL: the same block record**

| Offset     | Bytes  | Type      | Contents                   |
| ---------- | ------ | --------- | -------------------------- |
| CBL 0      | 21,000 | 50 × 420  | Character pictures 0 to 49 |
| MBL 0      | 42,000 | 100 × 420 | Monster pictures 0 to 99   |
| Record 0   | 400    | u8[400]   | Palette indexes; 255 clear |
| Record 400 | 20     | fields    | Same tail as BBL           |

No count or palette is embedded. CHR selects CBL pictures; MON selects MBL pictures. The scene supplies the palette.

CHR frames select CBL pictures by index; MON animation pairs select MBL pictures by index. A sprite pixel of 255 is clear. The files embed neither a palette nor their partner CHR or MON file name. Keep the GAM scene's files together as a compatible set. Picture 50 is absent for a character; picture 100 ends a monster's picture list. Those sentinels do not allocate an extra record on disk.

Do not discard the tail as picture padding. In particular, an MBL picture's score, hit-point and counter fields participate in contact with the hero. Background animation, births and pickup behavior should be designed in the BBL.

**CBL example.** TEDDY.CBL is 21,000 bytes. The first 32 bytes are FFh (transparent). Picture 8 begins at 3,360 and is selected as the lower picture by the character example.

**MBL example.** PARK.MBL is 42,000 bytes. Its first pixel is FFh (transparent). Picture indexes are zero-based: picture 0 is the first, starting at byte 0; picture 1 is the second, starting at 420. Saying picture 1 starts at 420 was correct: bytes 400 through 419 are picture 0's properties, not picture 1's pixels.

**Source audit.** Same record and counts: `code/GM/BLOC.H:6-8`, `code/GM/BLOCC.C:80-84`, `engine/formats/blocks.ts:6-20`, `engine/formats/blocks.ts:72-122`. Contact effects use the monster picture record (`PG:3113-3115`); animation uses MON picture indexes (`PG:2980-2991`). The port deliberately retains all twenty tail bytes for all block kinds.

### 13.10.6 CHR: the hero's program

CHAREDIT writes two character records in a CHR file, 7,568 bytes altogether. PLAYGAME loads the first from adventure slot 5. The second occupies real disk space but is not a second active player. Each record begins with 20 sequences of 185 bytes. The saved positions and current sequence are followed by ten inventory indexes and thirty signed counters.

**CHR: two 3,784-byte character records**

| Offset  | Bytes | Type     | Contents                 |
| ------- | ----- | -------- | ------------------------ |
| 0       | 3,784 | record   | Character used by player |
| 3,784   | 3,784 | record   | Second character storage |
| Char +0 | 3,700 | 20 × 185 | Sequences                |
| +3700   | 6     | i16[3]   | x: cell, pixel, momentum |
| +3706   | 6     | i16[3]   | y: cell, pixel, momentum |
| +3712   | 1     | i8       | Current frame            |
| +3713   | 1     | i8       | Current sequence         |
| +3714   | 10    | u8[10]   | Inventory BBL indexes    |
| +3724   | 60    | i16[30]  | Repetition counters      |

No header. Sequence s begins at character base + 185s. Only the first character record is loaded for play.

Inventory entries and sequence ties select BBL blocks. A sequence's sound selects an SND effect; 30 means none. Its keyboard word combines a PC scan code in the high byte and an ASCII value in the low byte. The standard sequences occupy indexes 0 through 4; key sequences generally use 5 through 19. A counter value of 32,767 means unlimited.

**Sequence: 185 bytes**

| Offset | Bytes | Type     | Contents                    |
| ------ | ----- | -------- | --------------------------- |
| 0      | 170   | 10 × 17  | Frames                      |
| 170    | 2     | i16 bits | Key: scan high, ASCII low   |
| 172    | 1     | i8       | SND effect index            |
| 173    | 1     | i8       | Enabled flag                |
| 174    | 1     | u8       | Required BBL inventory item |
| 175    | 1     | i8       | Cannot interrupt flag       |
| 176    | 1     | i8       | Joystick button             |
| 177    | 1     | i8       | Joystick direction          |
| 178    | 1     | i8       | Once per key press          |
| 179    | 1     | i8       | Momentum flag               |
| 180    | 5     | bytes    | Reserved                    |

Sound 30 means no effect; required block 150 means no inventory tie. Sequence 0 is idle, 1 die, 2 hurt, 3 pick up, 4 drop.

Each sequence has ten 17-byte frames, then fifteen bytes of controls. The top and bottom picture numbers normally address CBL records. The orientation word carries the top orientation in its low nibble and the bottom in its high nibble. Each orientation is 0 through 7. Pause is in 18.2 Hz game ticks; x and y are signed pixel movements, with the hero's final velocity limited to 11 per axis per tick.

**Character frame: 17 bytes**

| Offset | Bytes | Type     | Contents                  |
| ------ | ----- | -------- | ------------------------- |
| 0      | 2     | i16      | x movement in pixels      |
| 2      | 2     | i16      | y movement in pixels      |
| 4      | 2     | u16 bits | Top / bottom orientations |
| 6      | 2     | u16      | Top CBL picture index     |
| 8      | 2     | u16      | Bottom CBL picture index  |
| 10     | 2     | u16      | Pause in game ticks       |
| 12     | 5     | bytes    | Reserved                  |

Frame f begins at sequence base + 17f. Picture 50 is absent, bottom 51 ends, bottom 100 fires the MON type named by the top field.

**Worked example.** TEDDY.CHR frame 0 begins `00 00 00 00 00 00 32 00 08 00 24 00`: no movement, orientation 0, top absent (50), lower picture 8, pause 36 ticks. Bytes 172 and 174 are 30 (no sound) and 150 (no inventory tie). The first two counters at 3,724 are `64 00 03 00`: 100 hit points and 3 lives.

**Source audit.** Nested layouts: `code/GM/CHAR.H:6-51`; writer `code/GM/CHAREDIT.C:213-216`; first-record load `PG:4252`; port read/write `engine/formats/character.ts:70-123`. C char controls are signed in the original declarations; several port controls use u8 reads to retain their bit patterns. Sizes and offsets agree. For movement and frame sentinels, see `PG:2409-2468`; inventory ties use `PG:4655`.

### 13.10.7 MON: the monster types

MONEDIT writes MON sets and reads their partner MBL for previews. PLAYGAME loads 64 types from adventure slot 3. The file has no header: 64 × 300 = 19,200 bytes. MAP placements and BBL births select types by index. A type's picture pairs select MBL pictures and give their durations in game ticks.

**MON: 64 records of 300 bytes**

| Offset  | Bytes | Type       | Contents                   |
| ------- | ----- | ---------- | -------------------------- |
| 0,2,4,6 | 8     | 4 × i16    | Used, fly, jump, stick     |
| 8       | 1     | u8         | Power                      |
| 9       | 1     | i8         | Thru (reserved in player)  |
| 10      | 84    | 21 pairs   | MBL picture / ticks: i16s  |
| 94      | 4     | u32        | Preview clock              |
| 98      | 1     | i8         | Becomes MON type; 64 none  |
| 99      | 2     | i16        | Score bonus                |
| 101     | 21    | bytes      | Reserved                   |
| 122     | 2     | i16        | Attack path mode           |
| 124     | 2     | i16        | Lifetime / end mode        |
| 126     | 2     | i16        | Chase / flee / wander      |
| 128     | 4     | i16[2]     | Close (reserved in player) |
| 132     | 160   | 2 × 10 × 8 | Normal then attack path    |
| 292     | 8     | corner     | Preview cursor             |

Type t starts at 300t, no header. Only 20 animation pairs play. A corner is x,y,speed,orientation: four i16s at +0,+2,+4,+6.

The file stores 21 picture pairs but the player shows at most 20. Picture 100 means no further picture. Normal and attack paths each contain ten corners; each corner holds signed x and y deltas in blocks, speed in pixels per tick and orientation. A zero speed ends a path. The attack mode chooses whether the second path is used. A becomes value of 64 means no successor type.

Power is an unsigned byte; the hero's power is 100. Lifetime -2 means never end, -1 end after the path, 0 end when killed, and positive values specify ticks. Positive chase values below 64 move toward the hero; negative ones move away. Several saved fields are editor preview or reserved state; the record must still retain their bytes.

**Worked example.** PARK.MON type 0 starts `01 00 00 00 00 00 00 00 6A 01`: used 1, fly/jump/stick 0, power 106, thru 1. The first animation pair at byte 10 is `00 00 02 00`: picture 0 for two ticks. Words at 122, 124 and 126 are 0, 9 and 9: no attack path, nine-tick lifetime and chase speed 9.

**Source audit.** Every field, including the 21st pair and preview cursor: `code/GM/MON.H:6-41`; writer `code/GM/MONEDIT.C:201-204`; reader `PG:4308-4314`; port read/write `engine/formats/monster.ts:51-100`. The close fields are not a demonstrated live range control; see chapter 6 for the possible preceding-path overlap. Runtime preview fields are retained for round trips.

### 13.10.8 GAM: the scene graph and its dependencies

GRATOR writes the integrator file. PLAYGAME reads it to find the start, ending and adventure scenes. A 3.00 GAM has a 256-byte identification header, a six-byte scene-count header, N 283-byte scenes and a length-prefixed name pool. The signature is GM. The encryption byte at offset 4 is initialized to zero but the loader never branches on it: it does not turn encryption on. The 250 bytes at offset 6 are reserved header space; the original constructor fills them with repeating bytes `52 53 44` (the maker's three initials in ASCII), rather than scene data. Preserve them on an edit. Older games use 330-byte scenes with names inline; do not apply the 3.00 offsets to them.

**GAM 3.00: header, scenes, names**

| Offset | Bytes | Type    | Contents                  |
| ------ | ----- | ------- | ------------------------- |
| 0      | 2     | ASCII   | GM signature              |
| 2      | 2     | i16     | Version: 300              |
| 4      | 1     | u8      | Encryption flag           |
| 5      | 1     | u8      | File type: 8              |
| 6      | 250   | bytes   | Filler                    |
| 256    | 2     | i16     | Number of scenes N        |
| 258    | 2     | i16     | Files per scene: 20       |
| 260    | 2     | i16     | Links per scene: 20       |
| 262    | 283N  | records | Scenes in index order     |
| P      | 2     | u16     | Name-pool length L        |
| P + 2  | L     | strings | NULLL-terminated file names |

P = 262 + 283N. File pointers are offsets from P + 2, not from the start of the GAM. Pool byte 0 is an empty name.

Each scene contains twenty file pointers and twenty links, even if some are unused. A pointer is a byte offset into the shared pool of NULLL-terminated names; it is not a disk address. Zero selects the pool's empty string. Links use scene indexes, so reordering records requires updating the links. The single-segment planning limit is inferred as 231: 231 × 283 = 65,373, but 232 × 283 = 65,656 exceeds 65,536 bytes in one segment; the reader clamps the name pool to 65,520 bytes. The editor initially allocates 10,000 name bytes, a separate constraint from that reader ceiling.

**Scene: 283 bytes**

| Offset  | Bytes | Type    | Contents                      |
| ------- | ----- | ------- | ----------------------------- |
| 0       | 2     | u16     | Kind: 1 start, 2 end, 10 play |
| 2       | 4     | i16[2]  | Integrator diagram x,y        |
| 6       | 4     | u8[4]   | Scroll up,down,left,right     |
| 10      | 1     | u8      | Scroll style                  |
| 11      | 11    | bytes   | Reserved                      |
| 22      | 1     | u8      | Link count                    |
| 23      | 20    | chars   | Description                   |
| 43      | 40    | u16[20] | File-name pool offsets        |
| 83      | 200   | 20 × 10 | Links                         |
| Link +0 | 2     | u16     | Destination scene index       |
| Link +2 | 4     | i16[2]  | Source map cell x,y           |
| Link +6 | 4     | i16[2]  | Destination map cell x,y      |

Scene s starts at 262 + 283s; link k at scene + 83 + 10k. Destination 65535 means unused. Diagram coordinates are not map cells.

**Adventure slots 0 through 10:** PAL, MAP, BBL, MON, MBL, CHR, CBL, SND, CMF, entrance graphic, exit graphic. Remaining slots are reserved. **Start scene slots 0 through 11:** title graphic, title song, menu graphic, menu song, story graphic, story song, instructions, beginning credits, high-score backdrop, load backdrop, save backdrop, demo REC. **End scene slots 0 through 3:** won graphic, won song, lost graphic, lost song. Scene 0 is the start and scene 1 is the end record. A graphic slot can name GIF, BKD, FLI, TXT or LST; slide images and their music are separate dependencies.

A link stores a destination scene and source and destination map cells. Its source cell triggers the transition and its destination cell places the hero on arrival. Scroll bytes are zero for still, 255 for following the hero, or a constant speed; the style byte selects normal, centered or snap scrolling. Integrator diagram x,y positions only arrange boxes in the editor.

**Worked example.** TEDDY.GAM has 3,685 bytes and begins `47 4D 2C 01 00 08`. Its counts are (10,20,20). The pool word is at 262 + 10 × 283 = 3,092; its length is 591, so 3,092 + 2 + 591 = 3,685. Scene 2 starts at 828; its MAP pointer at 873 is 173, selecting BACKYARD.MAP at absolute byte 3,267. Its first link at 911 goes to scene 3 from (77,39), arriving at (6,39).

**Source audit.** Header and scenes: `code/GM/GMGEN.H:80-109`, `code/GM/GRATOR.H:63-109`, `code/GM/GRATOR.H:162-184`; pool writer `code/GM/GRATOR.H:138-155`; integrator writer `code/GM/GRATOR.C:1395-1414`; player read `PG:5156-5177`; port `engine/formats/game.ts:1-24`, `engine/formats/game.ts:184-217`, `engine/formats/game.ts:277-307`. File slot meanings: `engine/formats/game.ts:43-81` and `PG:4239-4253`. Editor pool allocation is 10,000 (`code/GM/GRATOR.H:123-128`); Add does not grow it (`code/GM/GRATOR.H:138-148`). Treat the 65,520 reader clamp as a loader bound, not a safe editor capacity.

### 13.10.9 SND: speaker effects and digital names

SNDEDIT writes a set of thirty effects; PLAYGAME loads it from adventure slot 7. An effect is a row of 36 unsigned frequency words, followed elsewhere in the same file by a nine-byte digital name. The normal file is 2,430 bytes. Older speaker-only files can end at 2,160 bytes; their missing digital names are treated as empty.

**SND: 2,430 bytes; no header**

| Offset   | Bytes | Type    | Contents                 |
| -------- | ----- | ------- | ------------------------ |
| 0        | 2,160 | 30 × 72 | Speaker frequency rows   |
| 2,160    | 270   | 30 × 9  | Digital sound stems      |
| 72e + 2t | 2     | u16     | Effect e, step t: hertz  |
| 2160+9e  | 9     | chars   | Effect e: VOC stem + NULLL |

e = 0 to 29; t = 0 to 35. A zero frequency is silence. The effect number addresses both tables; the VOC bytes live in another file.

A CHR sequence directly selects an effect number. Block and monster contact uses the player's event assignments: slots 0 through 8 cover hit points up, monster killed, counter additions and subtractions. Every speaker step lasts about 1/146 second; 36 steps make roughly a quarter second. Zero hertz is silence. The speaker produces one tone at a time.

For effect e, the digital name lives at 2,160 + 9e. It holds at most eight characters plus NULLL, without an extension. PLAYGAME adds `.VOC` in the game's working directory. An empty name or one beginning with a space selects the speaker. With digital sound enabled and a usable name, the VOC supplies the samples; it does not replace the frequency row on disk. Only one digital effect plays at once.

**Worked example.** TEDDY.SND begins `0B 02`: 523 Hz. At 2,160 effect 0 names `yum` plus six zero bytes, selecting YUM.VOC. Effect 1 at 2,169 names `pop`, and effect 2 at 2,178 names `crunch`. The sample bytes remain in those separate VOC files.

**Source audit.** Shape and event slots: `code/GM/SOUND.H:11-33`; writer `code/GM/SOUNDC.C:370-381`; player read `PG:4294-4304`; port read/write `engine/formats/sound.ts:37-63`. Speaker/digital selection: `PG:4585-4608`; name-to-path resolution: `code/GM/SOUNDC.C:153-168`. Both readers zero missing digital names; the current Sandbox worked example uses a full 2,430-byte set.

### 13.10.10 VOC: sampled effects

VOC is imported sound, recorded or converted with an external audio tool; SNDEDIT assigns its name and can audition it. Game-Maker does not record a VOC. PLAYGAME reads it through the Sound Blaster voice driver. The standard header is 26 bytes, followed by typed blocks. Each nonzero type has a three-byte payload length; type zero is the one-byte terminator.

**VOC: standard header and block stream**

| Offset    | Bytes  | Type  | Contents                      |
| --------- | ------ | ----- | ----------------------------- |
| 0         | 20     | bytes | Creative Voice File + 1Ah     |
| 20        | 2      | u16   | First block offset B          |
| 22        | 2      | u16   | Version                       |
| 24        | 2      | u16   | Version check                 |
| B         | 1      | u8    | Block type; 0 ends file       |
| B + 1     | 3      | u24   | Payload length (nonzero type) |
| B + 4     | length | bytes | Payload                       |
| Type 1 +0 | 1      | u8    | Time constant                 |
| Type 1 +1 | 1      | u8    | Codec; 0 = unsigned PCM       |
| Type 1 +2 | rest   | u8[]  | Samples; 128 near center      |

Type 1 offsets are relative to its payload. The next block follows the payload. DOS hands blocks to the voice driver; the web reader decodes them.

Type 1 gives a time constant, codec and sample bytes. For uncompressed eight-bit mono sound, the rate is 1,000,000 / (256 - time constant). Type 2 continues samples, type 3 adds silence and types 6 and 7 bracket a repeat. Newer VOC variants need corresponding driver support; a decoder's ability to read a block does not establish that every DOS driver can play it. Keep the whole file under 65,535 bytes for the DOS allocation and read path. The DOS player takes its first-block offset from the low byte of the header field, so the usual 26-byte header is the safest choice.

**Worked example.** WOOF.VOC has 2,459 bytes. The first-block offset at byte 20 is `1A 00` (26). At 26 are `01 7C 09 00 A5 00`: type 1, payload 097Ch = 2,428 bytes, time constant 165, codec 0. The 2,426 samples start at 32, at approximately 10,989 Hz (1,000,000/91), about 0.221 second. The terminator is at 26 + 4 + 2,428 = 2,458.

**Source audit.** DOS consumes only signature bytes and the low byte of the first-block offset (`code/GM/SOUNDC.C:203-235`); Creative driver function 6 handles the block stream. The detailed standard block layout is verified in the port, `engine/formats/voc.ts:1-23`, `engine/formats/voc.ts:35-111`, rather than a DOS struct definition. These are different validation paths, not two independent in-source implementations of every VOC field. The driver codec compatibility limit has not been tested here. [not yet checked in DOSBox]

### 13.10.11 CMF: FM instruments and timed events

A music program creates the original CMF. SNDEDIT's converter writes a new CMF timed for Game-Maker: it rescales the tick division and event delays to 146 ticks per second. PLAYGAME reads CMF names from GAM song slots. A song contains FM instrument definitions and a MIDI-like event stream, not sampled sound or references to VOC files.

**CMF 1.1: 40-byte header**

| Offset   | Bytes  | Type    | Contents                      |
| -------- | ------ | ------- | ----------------------------- |
| 0        | 4      | ASCII   | CTMF signature                |
| 4        | 2      | u16     | Version: 0101h                |
| 6        | 2      | u16     | Instrument block offset I     |
| 8        | 2      | u16     | Music block offset M          |
| 10       | 2      | u16     | Ticks per beat                |
| 12       | 2      | u16     | Ticks per second: 146         |
| 14,16,18 | 6      | 3 × u16 | Title,composer,remark offsets |
| 20       | 16     | u8[16]  | Channels used                 |
| 36       | 2      | u16     | Instrument count K            |
| 38       | 2      | u16     | Basic tempo                   |
| I        | 16K    | records | FM instrument definitions     |
| M        | to EOF | events  | Delta-time / MIDI commands    |

Instrument p begins at I + 16p. Program-change events select instruments by index. Offsets are absolute file positions.

Each instrument occupies sixteen bytes: eleven FM register values and five reserved bytes. The header points to the instrument and event blocks independently, allowing descriptive strings between them. A MIDI program change selects an instrument index; note events select pitch and velocity on a channel. Each event begins with a variable-length delay in seven-bit groups, high bit meaning another byte follows. Running status can reuse the previous channel command. End-of-track is FFh 2Fh 00h after its delay.

The DOS player requires the clock field to be 146 and uses the FM chip's nine voices. Keep the event block under 65,536 bytes and its file offsets representable by the header's sixteen-bit fields. The web writer caps its instrument table at 128; the DOS loader does not validate that same ceiling.

**Worked example.** PARK.CMF has 2,676 bytes: instrument offset 40, music offset 296, sixteen instruments, 70 ticks per beat and clock 146. Sixteen × 16 = 256 bytes of instruments; the event block is 2,380 bytes. Instrument 3 begins at 40 + 3 × 16 = 88.

**Source audit.** Header fields: `code/GM/SBCMUSIC.H:30-52`; DOS reader `code/GM/SBMUSIC.C:57-102`; converter `code/GM/SNDEDIT.C:438-507`; port read/write `engine/formats/cmf.ts:26-42`, `engine/formats/cmf.ts:74-106`. The header declares signed ints while the port treats offsets/counts as u16; the byte positions agree. The 128 instrument cap belongs to encodeCmf, not the DOS loader. The DOS signature conjunction quirk is documented in 13.5.

### 13.10.12 BKD, LST and TXT: pictures and slides

IMAGE writes a BKD to select a 320 × 200 window of a GIF. Its normal output is two coordinate words followed by a forty-byte GIF-name field, 44 bytes total. PLAYGAME reads a shorter prefix: the words and a line of at most 39 name bytes. The GIF itself holds the indexed picture and its palette; neither is embedded in BKD.

**BKD: IMAGE writes 44 bytes**

| Offset | Bytes | Type  | Contents                |
| ------ | ----- | ----- | ----------------------- |
| 0      | 2     | i16   | Left edge of GIF window |
| 2      | 2     | i16   | Top edge of GIF window  |
| 4      | 40    | chars | GIF name, LF, NULLL, tail |

No signature. The player reads two words, then at most 39 name bytes. Shorter name-only tails also occur in shipped files.

**Worked example.** MAXIMUS's W99.BKD is fourteen bytes: `00 00 B8 0B`, then `cards5.gif`. The words choose window (0,3000). This short name tail has no terminator; IMAGE's normal output reserves forty bytes for the name. The GIF remains external.

An LST is a text-authored sequence of graphic names with optional pause seconds. A TXT is text-authored page content. The original IMAGE and GRATOR do not write these text formats; the web editor can write slide lists. PLAYGAME reads both from graphic slots, including entrance, exit, title, story and credits. Do not serialize the in-memory FileEntry structure into an LST.

**LST and TXT: text bytes, no header**

| Offset    | Bytes    | Type  | Contents                  |
| --------- | -------- | ----- | ------------------------- |
| LST 0     | variable | chars | File name [space seconds] |
| Next      | 2        | bytes | CR LF ends each line      |
| Next line | variable | chars | Another graphic file name |
| TXT 0     | variable | CP437 | Text with CR LF lines     |
| EOF       | 0 or 1   | byte  | Optional DOS 1Ah marker   |

LST names select GIF, FLI, BKD, TXT or another list. These are author-supplied text, not binary Scene or FileEntry objects.

**LST example.** PARK.LST has thirteen bytes: `park.gif 30` followed by CR LF (0Dh 0Ah). It asks for the external GIF and a thirty-second pause. It has no end-of-file marker. The DOS reader allocates 100 entries and retains at most fifteen name characters per entry; stay below that allocation and use DOS 8.3 names.

**TXT example.** HELP.TXT has 1,103 bytes and begins `4D 4F 56 49 4E 47`, spelling MOVING. There is no binary header. The display reads at most 31 characters into a 32-byte buffer; keep authored lines short. TXT holds CP437 bytes; CR LF ends a line, and an end-of-file marker (1Ah, Ctrl-Z, EOF) can end DOS text.

**Source audit.** IMAGE record and full-size writer: `code/GM/IMAGE.C:39-44`, `code/GM/IMAGE.C:195-204`; DOS reader `code/GM/GIFC.C:307-339`; port read/write `engine/formats/graphicScripts.ts:14-33`. The port writes only coordinates and name bytes, not IMAGE's forty-byte name field. Short W99.BKD is a Sandbox fixture observation; the DOS reader's LF search is unsafe without a newline, so successful DOS playback of that short file is **not established**. [not yet checked in DOSBox]

LST parsing and allocation: `PG:1181-1243`; TXT display: `PG:1989-2029`; dispatch by extension: `PG:1254-1318`; port read/write `engine/formats/graphicScripts.ts:41-74`. The list allocation is 100, but the loop has no count guard and its pause-default check occurs after increment; 100 is not a safely enforced limit. The web parser does not reproduce that unsafe indexing.

### 13.10.13 REC and HIS: play creates files too

PLAYGAME writes REC demonstrations and reads them from the start scene's demo slot. No header or event count is stored: file length divided by three gives the number of records. Each record is an elapsed game-tick count and a PC scan code. Bit 7 means release. The recorder holds at most 1,000 events; a delay can span 65,535 ticks.

**REC and HIS: no headers**

| Offset  | Bytes | Type    | Contents                  |
| ------- | ----- | ------- | ------------------------- |
| REC 3e  | 2     | u16     | Elapsed game ticks        |
| 3e + 2  | 1     | u8 bits | Scan code; bit 7 releases |
| HIS 34r | 4     | i32     | Score for rank r          |
| 34r + 4 | 30    | chars   | Name, NULLL, unused tail    |

REC holds at most 1,000 events (3,000 bytes). HIS always has ten ranks (340 bytes). Neither embeds a game file name.

**REC example.** TEDDY's DEMO.REC is 174 bytes, or 58 events. Its first six bytes are `01 00 4D 1E 00 48`: wait one game tick, press Right (4Dh), wait thirty more ticks, press Up (48h). A release would set bit 7, for example CDh for Right. The times are deltas, not absolute clock readings.

PLAYGAME also writes a ten-rank HIS table under the game's name. Each rank is a signed 32-bit score followed by thirty name bytes, 340 bytes in all, with no signature. The working directory and game stem associate the table with the game; the file itself contains no GAM pointer. A score fits a signed long, and a normal name leaves room for its terminating NULLL.

**HIS example (constructed).** A score of 80 would begin `50 00 00 00`; a following empty name is a zero byte plus unused tail. Rank 1 begins at 34. Sandbox games do not supply a player-created HIS table, so this illustrates the record rather than claiming to quote a disk file.

**Source audit.** Recorder shape, bound and disk writer: `PG:216-236`, `PG:510-528`, `PG:563-577`; port read/write `engine/formats/recording.ts:19-31`. Score record and writer: `code/GM/HISCOREL.C:16-20`, `code/GM/HISCOREL.C:121-124`; port read/write `engine/formats/highscore.ts:11-24`. REC fixture: `games/teddy/disk/demo.rec`. HIS has a constructed example; no player-created score table is supplied by the game.

### 13.10.14 Configuration and saved play

The utilities share GM.CFG so they can reopen the working directory. It is a 51-byte NULLL-terminated directory field written by the common startup/shutdown code. PLAYGAME setup reads and writes CONFIG.DAT for joystick, display and sound choices. These files configure the installed tools rather than define game content.

**Configuration: no headers**

| Offset   | Bytes | Type   | Contents                |
| -------- | ----- | ------ | ----------------------- |
| GM.CFG 0 | 51    | chars  | Working directory + NULLL |
| DAT 0    | 10    | i16[5] | Joystick x calibration  |
| 10       | 10    | i16[5] | Joystick y calibration  |
| 20       | 2     | enum16 | Video selection         |
| 22       | 2     | enum16 | Sound selection         |
| 24       | 2     | u16    | Sound interrupt         |
| 26       | 2     | u16    | Sound I/O port          |
| 28       | 41    | chars  | Driver path + NULLL       |
| 69       | 431   | bytes  | Reserved; total 500     |

DAT means CONFIG.DAT here. Enum sizes follow the shipped 500-byte file and the 16-bit build; there is no web format codec for either configuration file.

**Configuration example (constructed).** Video enum 13 is `0D 00` at 20; Sound Blaster enum 1 is `01 00` at 22; IRQ 7 is `07 00` at 24; port 0220h is `20 02` at 26. Sandbox game disks do not supply local installation settings. These are source-derived settings, not readings from a game file. GM.CFG allows fifty path characters plus NULLL; CONFIG.DAT allows forty plus NULLL.

PLAYGAME's save menu writes ten 21-byte labels to SAVNAMES.DAT, and live state to GAME0.SAV through GAME9.SAV. Slot number, not a stored pointer, joins each label to its save. A label has twenty characters plus NULLL. Saves retain the current map after touches, monster state, hero state, animation clocks, scene indexes and recorder state; they still depend on the matching GAM and assets.

**DOS saves: fixed prefix, native objects**

| Offset    | Bytes    | Type     | Contents                    |
| --------- | -------- | -------- | --------------------------- |
| 0         | 1        | u8       | Active block spawner count  |
| 1,3,5     | 6        | 3 × i16  | Previous scene, scene, link |
| 7         | 4        | u32      | Saved clock                 |
| 11        | 600      | u32[150] | Block animation times       |
| 611       | 150      | u8[150]  | Block index remapping       |
| 761       | native   | objects  | Hero state, CHR, viewport   |
| Then      | native   | objects  | 200 live + placed monsters  |
| Then      | 20,000   | cells    | Live MAP grid               |
| Then      | variable | objects  | Flag, spawners, recorder    |
| Names 21s | 21       | chars    | SAVNAMES.DAT slot label     |

Only the prefix offsets are portable under the 16-bit packed layout. Later offsets depend on compiler objects and far pointers. Names has ten slots, 210 bytes.

The save's first 761 bytes have explicit scalar and array sizes. What follows includes native compiler objects and far pointers. **Inferred layout:** with byte packing and the expected pointer widths, the fixed state is about 37,685 bytes before spawners and recording data. This is not a guaranteed interchange size. Loading re-reads the scene's assets and restores saved live cells; editing the original MAP does not replace those saved cells. No binary DOS save was available for a worked byte example. Do not mistake a same-named file from a different player for this native layout.

**Source audit.** GM.CFG: `code/GM/GENC.C:42-89`, field width `code/GM/GMGEN.H:29`. CONFIG.DAT: `code/GM/JSTICK.H:9-29`, reader/writer `code/GM/JSTICKC.C:87-107`; the 500-byte fixture confirms two-byte enum storage in this build. There is **no matching engine/formats codec** for these installation files; the byte audit uses the C source and supplied binary, not an invented port match. Enum value 13 is NoType in this header, automatic detection; value 12 is SoftwareSim.

Save prefix and order: `PG:1874-1894`; state types `PG:113-172`, recorder `PG:228-236`; compare 13.7 for assumptions. No binary DOS SAV fixture is present: files under `web/test/fixtures/saves/` are web JSON, including the file described as a DOS save in that folder's README. The port uses JSON in `engine/engine/scene.ts:761-809`, not a native-object codec; no claim of binary interchange is made.

SAVNAMES.DAT: `PG:1664-1725`, web read/write `web/src/project/saveData/saveGame.ts:92-114`. The real dated fixture `web/test/fixtures/saves/2026-11-02-master-66c59762c/SAVNAMES.DAT` is 210 bytes and begins with ASCII first slot plus NULLL, followed by zero padding to byte 21. Slot 0 joins to GAME0.SAV by index. This fixture is web-generated but has the same fixed label layout.

### 13.10.15 Transfer files and imported media

UTILITY's transfer command copies XFERPLAY.EXE under the game's stem, copies the selected dependencies and writes CONFIG.BAT. It does not pack all the scene data into the executable. The batch line is the game stem, a space, `configure`, then a DOS newline; running it opens that transferred player's setup.

**Transfer output: copied EXE and CONFIG.BAT**

| Offset   | Bytes    | Type  | Contents                  |
| -------- | -------- | ----- | ------------------------- |
| EXE 0    | 2        | ASCII | MZ executable signature   |
| EXE 8    | 2        | u16   | Header size in paragraphs |
| EXE 24   | 2        | u16   | Relocation table offset   |
| EXE H×16 | to EOF   | bytes | Copied player load image  |
| BAT 0    | variable | chars | Game stem + space         |
| Then     | 9        | ASCII | configure                 |
| Then     | 2        | bytes | CR LF                     |

UTILITY copies XFERPLAY.EXE under the game name and writes CONFIG.BAT. A DOS paragraph is 16 bytes; the EXE is a program, not a scene container.

**Transfer example (source-derived).** Transferring TEDDY writes a batch line `teddy configure` followed by CR LF, and copies the supplied player to TEDDY.EXE. The executable is an MZ program with its own header, relocations and machine code, not a packed game. There is no generated transferred executable on this game disk to quote. Build-specific executable patching belongs in a separate reference.

GIF pictures, FLI animation and VOC recordings are imported media. CMF conversion changes an imported song's timing; IMAGE extracts game data from GIF rather than writing a new GIF. HLP help files and the Sound Blaster driver are supplied inputs; transfer copies them unchanged. Build, installation and registration tools can also copy executables or write administrative text, but those outputs are not game-resource layouts. This distinction keeps a list of game formats from implying that the editors author every file they can open.

**Source audit.** Transfer copies XFERPLAY.EXE and writes CONFIG.BAT (`code/GM/UTILITY.C:291-311`); byte copying `code/GM/UTILITY.C:337-378`. The batch command is source-derived; no executable copied by an actual transfer run is claimed as a Sandbox example. Standard MZ offsets are also decoded locally in `web/src/programmersGuide/chapters/reading.md` for PLAYGAME; there is no engine format writer for MZ. See chapter 17 for build-specific patch locations. CONFIG.BAT has source-defined text, but no shipped generated example was available; a stem-plus-configure line is a source-derived example, not an observed transfer run.

Writer inventory scope: released interactive tools and PLAYGAME, including installation settings and transfer output. The VGATYPE.DAT macro (`code/GM/GMGEN.H:27`) has no writer in the source. The backdrop rewrite at `code/GM/UTILITY.C:752-785` is commented out; IMAGE is the active writer. Registration/manufacturing helpers (for example `code/GM/MKDSK.CPP:97-109`, `code/GM/REGISTER.C:57`) produce administrative records or patch/copy release executables, not additional playable resource types. Imported GIF/FLI/VOC, supplied HLP and drivers are read or copied, not encoded by these tools.

## Review clarifications: byte diagrams and ownership

Picture indexes are zero-based: picture 0 occupies pixel bytes 0–399 and properties 400–419; picture 1 starts at 420. This is not a correction to a 400-byte picture size: each **record** is 420 bytes (`code/GM/BLOC.H:37-53`, `engine/formats/blocks.ts:6-7`). The booklet's real pixel grids use PARK.BBL block 10, TEDDY.CBL picture 8 and PARK.MBL picture 0, with PARK.PAL. The property plates follow the grids. Solid and gravity low bits use masks 1,2,4,8 (`code/GM/BLOC.H:12-15`, `code/GM/BLOC.H:44-49`). The hurt mask is retained but unused in the player. Character orientation nibbles and keyboard byte order come from `code/GM/CHAR.H:19-40`, `engine/formats/character.ts:55-85`. Every format plate now includes an eight-bit byte ribbon and integer-width/byte-order key; dedicated diagrams explain PAL components, MAP cell bytes, CHR nibbles, REC release bits, VOC u24 lengths and CMF seven-bit delay groups.

The GAM encryption field is initialized FALSE but is not acted on by this loader. Filler at offset 6 is 250 reserved bytes initialized to repeating ASCII RSD (`code/GM/GMGEN.H:80-110`). `Validate` checks only GM; `code/GM/PLAYGAME.C:5156-5169` loads records without decryption. The independent parser also treats these bytes as header padding (`engine/formats/game.ts:184-217`). Preserve them rather than treating them as scene content.

The saved clock at byte 7 is the fast sound clock, not the 18.2 Hz game clock. Its unsigned 32-bit range is 0 through 4,294,967,295. At 1,193,180/8,191 interrupts per second it wraps after about 29,484,300 seconds, or 341.25 days. It continues across scenes during a play session, with pauses restored and a new game resetting it, so it is not per-map time or a permanent all-sessions total. On overflow unsigned arithmetic returns to zero. Clock comparisons and the derived game clock can then jump backward or miss deadlines; uninterrupted play through overflow is unsafe, not a supported duration guarantee. Those consequences follow from the arithmetic and have not been tested by leaving a PC running that long.

The saved value is `SaveGame(SndClock)`, not `clock` (`code/GM/PLAYGAME.C:1609`, `code/GM/PLAYGAME.C:1878`). Load derives `clock = SavedTime >> 3` (`code/GM/PLAYGAME.C:1825-1826`); new-game initialization resets all clocks (`code/GM/PLAYGAME.C:4627-4631`); scene entry preserves a clock snapshot (`code/GM/PLAYGAME.C:1337-1341`, `code/GM/PLAYGAME.C:1403-1404`). At the programmed rate the computed wrap period is 2^32 × 8191 / 1193180 = 29,484,300 seconds = 341.253 days. [inference] Unsigned wrap is certain; gameplay effects at overflow depend on the pending comparisons (`code/GM/PLAYGAME.C:1454`, `code/GM/PLAYGAME.C:3141`). [not yet checked in DOSBox] No engine format codec implements these compiler-object DOS saves.

Old per-extension transfer is commented out (`code/GM/UTILITY.C:619-638`); active transfer copies all game-area files and the supplied player, and writes CONFIG.BAT (`code/GM/UTILITY.C:276-311`). The older registration writer embeds a 34-byte distribution-information stamp in executables (`code/GM/REGIST.C:125-148`); it is obsolete player/distribution information, not a GAM field or a header to add to imported media. GIF/FLI/VOC stay external inputs. No transferred EXE, DOS save, HIS or local configuration is claimed as an observed Sandbox disk example.

**May these formats be described here?** Yes: original explanations of a file layout are appropriate; copying Creative's prose or diagrams would be a different matter. U.S. copyright law separates methods and systems from their written expression ([17 USC 102(b)](https://www.copyright.gov/title17/92chap1.html#102)). The format names and origins are credited to Creative Technology Ltd.; the CMF header is independently checked against `code/GM/SBCMUSIC.H:30-52` and `engine/formats/cmf.ts:25-38`, and VOC framing against `code/GM/SOUNDC.C:164-212` and `engine/formats/voc.ts:1-20`. Creative's original reference is the Sound Blaster Developer Kit's **Creative Music File (CMF)** and **Creative Voice File (VOC)** format documentation. No prose or diagrams from those specifications are reproduced here; NOTICE.md records this attribution and the documentation work.
