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
|            | `FreePtr` | name pool      | NUL-terminated names; a scene's `Files[i]` is an offset into it; offset 0 holds an empty string = "no file" (`GRATOR.H:116-118, 134-147`) |

Example size: 60 scenes, 3,000-byte pool = 256 + 6 + 16,980 + 2 + 3,000 = **20,244 bytes**.
Older games (before version 3.00) use a 330-byte scene with 9 file names of 10 characters inline, 15-character descriptions and 20 links of five ints (`GRATOR.H:36-61`); the web port converts them (`fmt/game.ts:221-274`).

## 13.3 `.map`, blocks, monsters, character, palette

Offsets for each record are in the chapters that explain them: block 420 (chapter 5), monster 300 (chapter 6), character 3,784 (chapter 7). The `.map` file has no header: 20,000 bytes of `{blk, mon}` pairs in row-major order, then 200 x 10 bytes of placed monsters (`PG:4330-4336`).
Reading is by count, not by file length (`fread` of exactly `MLEN*MWID`, then `LASTMM`); `loadspecmap` ignores both read counts and reports success once the file opens (`PG:4330-4337`). A short read can leave old bytes in these persistent arrays, but that is not a promise that all previous-scene state survives: scene initialization also changes it.
Block, monster and sound loaders likewise ignore read counts (`PG:4294-4327`), as does the character's general loader (`code/GM/GENC.C:295-307`). There is an important exception to the stale-byte warning: sound names are zeroed before reading (`PG:4301-4302`); block buffers are newly allocated on ordinary scene entry (`PG:1347-1350`, `PG:1541-1545`). Exact partial-record and visible results are **[not yet checked in DOSBox]**. The web map parser instead builds fresh arrays and zero-fills missing bytes (`engine/formats/map.ts:28-40`, `engine/formats/binary.ts:33-68`).

## 13.4 `.snd` (30 effects)

30 records of 36 unsigned 16-bit frequencies (72 bytes), then 30 names of 9 bytes: 2,160 + 270 = **2,430** (`PG:4294-4304`, `SOUND.H:11, 30-33`). A frequency of 0 is silence. A name starting with a NUL or a space means "use the speaker" (`PG:4595`).
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
