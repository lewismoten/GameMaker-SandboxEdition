# Quirks kept for fidelity, and fields PLAYGAME ignores

The rule for the book: the web port matches the DOS program bugs and all, so these are described, not fixed. Tags: [16-bit] [64K] [file] [DOS] [design]; [inference]; [not yet checked in DOSBox].

## 14.1 Quirks of behavior

|   # | Quirk                                                                                                                                                                                                                                                                                                                                                           | Where                                | Port matches?                                               | Status                                               |
| --: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------- |
|   1 | **Stale animated edge cells.** `changeblks` redraws only the 15 x 9 interior; an animated block in the left column or top row of a still screen keeps its old picture until a scroll redraws it, but touches use the true frame                                                                                                                                 | `PG:2344-2351`                       | no: the port repaints every cell (`engine/render.ts:36-42`) | [not yet checked in DOSBox]; taste call              |
|   2 | **Hidden band is a block, not a pixel.** The on-screen test for monsters runs on the **cell** (`CalcDraw`, `PG:2281-2290`), so a still screen's left column and top row of cells are "off screen"; an off-screen monster neither draws nor hurts (`ChkMonChr`, `PG:2728`). A monster in the last allowed cell with a pixel offset is **invisible and can hurt** | `PG:294, 2281-2290, 2728, 3815-3830` | port copies the same tests (`monsters.ts:412, 600`)         | [not yet checked in DOSBox]                          |
|   3 | **Counter index not checked.** `ci.meter[effect]` with `effect` 30..255 writes past the 30-element array, into `seqon` (30-39) and then the character record (40+)                                                                                                                                                                                              | `PG:3440, 3478-3500`                 | port: `undefined`/`NaN` (`touch.ts:89`)                     | [not yet checked in DOSBox]; no editor offers it     |
|   4 | **Two "empty inventory" markers.** The inventory screen and pickup test for 150 (`BACKBL`); a new game fills the live inventory with 151 until a scene copies the character's own                                                                                                                                                                               | `PG:1959-1966, 2123, 4638, 4649`     | yes (`character.ts:145`)                                    | harmless                                             |
|   5 | **Full-table hang (source reading).** Freeing monster slot 0 sets the unsigned search hint to 65,535; a later birth with all 200 slots full never ends                                                                                                                                                                                                          | `PG:296, 3258, 3332-3339`            | no: the port clamps (`monsters.ts:256`)                     | [not yet checked in DOSBox]; needs 200 live monsters |
|   6 | **`Birthtime` is limited to 16,383 ticks.** Bit 14 is used as the "birth now" flag; larger values lose 16,384 after the first tick, 32,768 and up never birth                                                                                                                                                                                                   | `PG:3281, 3289, 3299`, `BLOC.H:40`   | no: the port keeps the flag apart (`monsters.ts:272-277`)   | [not yet checked in DOSBox]                          |
|   7 | **CMF header check uses `&&`.** A file is rejected only if all four id letters are wrong                                                                                                                                                                                                                                                                        | `SBMUSIC.C:73-74`                    | n/a                                                         | [not yet checked in DOSBox]                          |
|   8 | **VOC or CMF over 64 KB is cut.** `read(..., (uint) size)` and `fread` with a `long` count                                                                                                                                                                                                                                                                      | `SOUNDC.C:204`, `SBMUSIC.C:100`      | n/a                                                         | [not yet checked in DOSBox]                          |
|   9 | **A repeated touch re-triggers a digital sound every tick**, each time stopping the previous one                                                                                                                                                                                                                                                                | `PG:3437-3506`, `SOUNDC.C:164`       | [not yet checked in DOSBox] in the port                     | chapter 10b                                          |
|  10 | **A short data file is not detected.** `fread` results are ignored when loading the map, blocks, monsters, character and sounds; missing bytes keep the previous scene's data                                                                                                                                                                                   | `PG:4294-4340`                       | [not yet checked in DOSBox]                                 |                                                      |
|  11 | **Monsters wrap speed catch-up but the hero does not.** After a late tick monsters move `speed x ticks elapsed`; the hero is stepped once                                                                                                                                                                                                                       | `PG:2994-2996, 1492-1494`            | yes (`monsters.ts:500-502`)                                 | design                                               |
|  12 | **DOS time drifts fast** by 8 / 65,536 (about 10.5 s a day) while PLAYGAME runs                                                                                                                                                                                                                                                                                 | `PG:4618-4624`                       | n/a                                                         | harmless                                             |
|  13 | **`KillMon` stores `MMnum - 1` as the search hint**, so the next birth probes one slot early                                                                                                                                                                                                                                                                    | `PG:3258`                            | yes                                                         | harmless                                             |
|  14 | **Pickup needs the last inventory slot empty** (`inv[9] == 150`), even if earlier slots are free                                                                                                                                                                                                                                                                | `PG:2123`                            | [not yet checked in DOSBox]                                 |                                                      |
|  15 | **A refused touch repeats every tick** with no side effects, but each `DoBlockTouchChar` that succeeds repeats too (score every tick while standing on a score block)                                                                                                                                                                                           | `PG:3512-3547`                       | yes                                                         | chapter 8                                            |

## 14.2 Fields that are written but ignored

All rows are from the audit unless marked **(mine)**. "Ignored" means PLAYGAME's play path never consumes the value; an editor may still use it.

### `.mon` (300 bytes)

| Field                 | Offset | Status                                                                                                                                                                   |
| --------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `used`                |      0 | editor bookkeeping; existence is `mm[].monnum < LASTMON` (`PG:2976-2978`)                                                                                                |
| `fly`                 |      2 | unused anywhere                                                                                                                                                          |
| `jump`, `stick`       |   4, 6 | unused ("not currently used", `MON.H:25-26`)                                                                                                                             |
| `thru`                |      9 | **a visible no-op:** MONEDIT offers "Monster blocked by solid blocks" (`MONEDIT.C:719, 774`) and PLAYGAME never reads it; solidity comes from the block (`PG:2754-2778`) |
| `lasttime`            |     94 | editor preview clock                                                                                                                                                     |
| `xtra[21]`            |    101 | filler                                                                                                                                                                   |
| `cur`                 |    292 | editor preview cursor                                                                                                                                                    |
| `close[2]` **(mine)** |    128 | not read by name; reached only through `march[0][-1]` overlap (chapter 6)                                                                                                |

### Blocks (420 bytes)

| Field                                                         | Offset | Status                                                                                                                                                                                                                            |
| ------------------------------------------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Xtra[2]`                                                     |    403 | filler                                                                                                                                                                                                                            |
| `hitpt`                                                       |    406 | declared as "hurt side mask"; **not read** (`PG:3444-3467` uses `chhitpt`); no editor control found                                                                                                                               |
| `.mbl` behavior fields **(a correction to the source audit)** |        | `Birthmon`, `Birthtime`, `nextbl`, `ntime`, `touchbl`, `grav`, `obj` do nothing in a monster block; `scorepts`, `chhitpt`, `effect`, `eamt` **do** apply when a monster touches the hero (`PG:3113-3115`); `solid` stops monsters |
| `.cbl` behavior fields                                        |        | do nothing (pixels only)                                                                                                                                                                                                          |

### `.map`

| Field                                    | Status                                         |
| ---------------------------------------- | ---------------------------------------------- |
| per-cell `mon`                           | live occupancy scratch; the player rebuilds it |
| placed monster `status`, `xtra`, `extra` | filler (`MAP.H:21-28`)                         |

### `.chr` (3,784 bytes, two records)

| Field                                  | Status                                      |
| -------------------------------------- | ------------------------------------------- |
| frame `extra[5]`, sequence `xtra[5]`   | filler                                      |
| saved `x[3]`, `y[3]`, `cframe`, `cseq` | overwritten on scene entry (`PG:4673-4678`) |
| the whole **second** record            | never read (`PG:4252`)                      |

### `.gam`

| Field                                                                     | Status                                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| header `Ver`, `Encrypt`, `FileType`, the 250-byte filler ("RSD" repeated) | only "GM" is checked                                                                                                  |
| `GratorHeader.FilesPerScene`, `LinksPerScene`                             | always 20; not read                                                                                                   |
| scene `Pos`                                                               | integrator layout only                                                                                                |
| scene `Scroll.Style`, `Xtra[11]`                                          | not read; the four direction bytes are used, and **swapped** on entry (up with down, left with right, `PG:1380-1383`) |
| scene `NumLinks`                                                          | not read; all 20 slots are scanned                                                                                    |
| pre-3.00 `PinChar`, `red`, `green`, `blue`                                | dropped by the converter                                                                                              |

### Constants that are defined and never used (a search of the source)

| Constant             | Where           | Status                                                |
| -------------------- | --------------- | ----------------------------------------------------- |
| `FREQL`, `FREQH`     | `SOUND.H:12-13` | document the sound editor's 64 to 8,192 Hz graph only |
| `DELAY 7`            | `SOUND.H:15`    | unused                                                |
| `ATTACKX`, `ATTACKY` | `PG:72-73`      | **used** (monster attack window)                      |
| `JSTICKKEY 1`        | `PG:71`         | used as a stack marker                                |

## 14.3 What the port does not reproduce (a summary)

Stale edge cells (1), the `Birthtime` bit (6), the slot-0 hint wrap (5). Everything else compared matches. These are deliberate, in the sense that the port is a clean-room-style re-implementation checked against games, not a recompile.
A fix would make web play look worse (1) or change what authors rely on (6); none is urgent; each needs a DOSBox check first.

## 14.4 Tips

- Do not rely on a field in the ignored list: a future PLAYGAME could read it. Use a field that does something.
- Do not put `thru` expectations in a game's notes: a monster is stopped by solid blocks always.
- Set `Birthtime` under 16,384.
- Keep every digital sound off blocks that stay touched.

## 14.5 What real games did with the ignored fields (a survey of shareware games)

- Coverage: **408 of 413** unique shareware game archives could be measured. Counts are field instances and say bytes were stored, **not** that they changed play.
- **`thru = 0` (the "Monster blocked by solid blocks" checkbox) was set in 14,113 monster records, 648 asset files and 313 games.** Authors turned on a control that PLAYGAME never reads: monsters in those games are stopped by solid blocks anyway
  (`PG:2754-2778`). This is the one exposed no-op, and the strongest reason chapter 14 exists.
- **No readable monster had a nonzero `fly`, `jump` or `stick`.** So `fly` never marked a monster that was meant to fall, and no game in the collection needs a fall-intent list. `fly` cannot make a monster fall.
- Large non-default counts in `.mbl`/`.cbl` behavior fields (`Birthmon`, `Birthtime`, `touchbl`, ...) are record reuse and editor residue, as a survey of the files suggests.
- **One disagreement:** a first reading of the files called every behavior field of a monster block a no-op. The source (`PG:3113-3115`) shows a monster block's `scorepts`, `chhitpt`, `effect` and `eamt` **are** applied when a monster touches the hero, so those four are live in `.mbl` (chapters 5 and 6). The survey's counts for those four fields should be read as "used", not "ignored". **[not yet checked in DOSBox]** Check it in DOSBox with a monster whose frame block gives 10 points.
