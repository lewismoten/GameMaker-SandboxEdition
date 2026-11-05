# Monsters

## 6.1 Four different numbers, four different causes

| Name                 |               Value | What it counts                                                 | Where                    | Tag            |
| -------------------- | ------------------: | -------------------------------------------------------------- | ------------------------ | -------------- |
| Monster **types**    |      64 (`LASTMON`) | records in a `.mon` file; the value 64 also means "no monster" | `MON.H:6`                | [design]       |
| Monster **blocks**   |       100 (`MONBL`) | pictures in a `.mbl`; 101 allocated, 100 means "no picture"    | `BLOC.H:7`, `PG:1349`    | [64K] [design] |
| Placed/live monsters |      200 (`LASTMM`) | slots in `mm[]`/`mi[]`; **births share them**                  | `MAP.H:8`, `PG:282, 618` | [design]       |
| **Drawn** monsters   | 50 (`MaxMonsShown`) | monsters painted in one frame (the rest still move and hit)    | `PG:80, 617, 1504`       | [DOS] (memory) |

All four are round numbers; only the last has a memory price (chapter 4: 50 x 400 = 20,000 bytes of save-under).

## 6.2 The `.mon` record, 300 bytes (`MON.H:21-41`)

| Offset | Size | Field           | Meaning                                                                                                                                                           |
| -----: | ---: | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      0 |    2 | `used`          | editor bookkeeping; **the player never reads it** (existence comes from `mm[].monnum < LASTMON`, `PG:2976-2978`)                                                  |
|      2 |    2 | `fly`           | "gravity affects it": **never read**                                                                                                                              |
|   4, 6 |  2+2 | `jump`, `stick` | "not currently used" (`MON.H:25-26`)                                                                                                                              |
|      8 |    1 | `power`         | 0..255; 100 (`CHARPOWER`) is the hero; lower than 100 dies when it touches the hero (`PG:3119`); a higher power kills a lower one (`DoCollision`, `PG:2793-2845`) |
|      9 |    1 | `thru`          | "stops on solid": **never read** by the player; solidity comes from the block's `solid` (`PG:2754-2778`)                                                          |
|     10 |   84 | `pic[21][2]`    | 21 pairs of (block number, ticks to show it)                                                                                                                      |
|     94 |    4 | `lasttime`      | editor preview clock; the player uses `minfo::NextAni`                                                                                                            |
|     98 |    1 | `newmon`        | monster born when this one dies; 64 = none (`PG:3253-3263`)                                                                                                       |
|     99 |    2 | `upscore`       | score awarded when the hero's shot kills it (`PG:2827`)                                                                                                           |
|    101 |   21 | `xtra`          | filler                                                                                                                                                            |
|    122 |    2 | `activate`      | 0 none, 1 attack path absolute, 2 attack path relative to the hero (`PG:3003-3025`)                                                                               |
|    124 |    2 | `end`           | -2 never dies, -1 dies after its path, 0 dies when killed, `n` > 0 lives `n` ticks (`PG:3157-3160`)                                                               |
|    126 |    2 | `towards`       | 0 follow the path; 1..63 chase at that speed; negative flee; 64 or more wander at random (`PG:3040-3075`)                                                         |
|    128 |    4 | `close[2]`      | "close enough to take action": not read by name; overlapped by the index -1 read of `march` (see below)                                                           |
|    132 |  160 | `march[2][10]`  | two paths of 10 corners (normal, attack); a corner is `x`, `y`, `pic` = speed in pixels per tick, `orient` (8 bytes)                                              |
|    292 |    8 | `cur`           | editor preview cursor                                                                                                                                             |

Check: 8 + 2 (power, thru) = 10; 10 + 84 = 94; + 4 = 98; + 1 + 2 = 101; + 21 = 122; + 2 + 2 + 2 + 4 = 132; + 160 = 292; + 8 = **300**. The port's `MONSTER_SIZE` agrees
(`engine/formats/monster.ts:7`). A `.mon` file is 64 x 300 = **19,200 bytes**.

### Discoveries while checking against the source audit

- **`close[2]` is not read by name, but it is read by accident.** A search of `code/GM` for `close` as a field (`->close`, `.close`, `close[`) finds only the declaration (`MON.H:37`); the real trigger distance is hard-coded:
  `MonInRange` fires when `|dx| < ATTACKX` (8) **and** `|dy| < ATTACKY` (5) in blocks (`PG:2606-2611`, `PG:72-73`), a 15 x 9 block window, the size of the animated interior of the screen. So `activate` works at that fixed distance and `close` does not set it.
  **But** `march[0]` sits right after `close[]` in the record, and the path code reads `march[CurMarch][dest-1]` (`PG:3043`); when `dest` is 0 that is index **-1**, the eight bytes just before the array: `end`, `towards`, `close[0]`, `close[1]`,
  read as a corner (`x = end`, `y = towards`, `speed = close[0]`, `orient = close[1]`). For the attack path, index -1 is the last corner of the normal path. The web port reproduces this overlap (`engine/engine/monsters.ts:41-47`).
  So `close[0]` can matter as a speed in the one case where a path is followed from `dest == 0`. **[not yet checked in DOSBox]** Check it in DOSBox how often that happens, and what MONEDIT writes into `close`.
- **A monster block's effect fields run when a monster touches the hero** (`PG:3113-3115`), so the audit's "type-dependent no-op" for `.mbl` is only true of birth/next/touch/gravity/object fields.

## 6.3 How a monster moves

Every tick, for each of the 200 slots in order (`moveallmons`, `PG:2961-3150`):

1. **Animate**: when `clock >= NextAni`, `CurPic++`. A frame ends the animation when `CurPic >= LASTSL` (20) or its block number is >= `MONBL` (`PG:2980-2991`). **Only 20 frames play; the 21st pair is never shown.**
   If the first picture is not valid the monster has no picture at all (`CurPic = LASTSL`) and is invisible but alive.
2. **Move** (every tick, `MONMOVESPEED 1`): `speed = clock - NextMove + 1`, so after a late tick it moves **more** to catch up (`PG:2994-2996`). Path monsters move `corner.pic x speed` pixels by Bresenham's line
   (`PG:3042-3050`). There is **no speed cap** for monsters (the hero's cap is `MAXGRAV` 11 px/tick); a corner speed of 40 px/tick crosses two blocks a tick and can step past a thin target.
3. **Path end**: after the last corner (or a corner with `pic == 0`) a monster with `end == -1` dies (and becomes `newmon`, if any); otherwise it restarts at corner 0 (`MonEndPath`, `PG:3150-3180`).
4. **Chase/flee/wander** use `towards`: chase heads for the hero's map cell plus sub-block offset; flee flips the sign; wander picks a new target 5 to 11 cells away along x when it arrives (`PG:3052-3075`).
5. **Walls**: a monster stops against solid background cells using the block's `solid` bits (`ChkHorizWalls`, `ChkVertWalls`, `PG:2606-2700`); there is a commented-out second test with the remark "in practice it does not work well at all" (`PG:2618-2620`).

Both paths are stored as **offsets from the monster's start**; corners after the first are deltas from the previous corner (`PG:3165-3176`).

## 6.4 Drawing and the 50 cap

Each tick every drawn monster is **erased in reverse slot order** (`PG:1459`), then moved, then drawn in **slot order** (`PG:1503-1510`):

- A monster is drawn when its cell, put on the screen, is inside `{1,1}`..`{300,180}` (`PG:294`; chapter 3). The cap counts monsters **actually drawn**, not alive: `MonsOnScrn` only increments inside `minfo::Draw` when the monster is drawn (`PG:2297-2300`), and the loop stops at 50 (`PG:1504`).
  The 51st visible monster, in slot order, is **not drawn** but still moves, still hurts, still blocks (hit tests never ask whether it was drawn).
- Drawing order is slot order, so **a higher slot number is drawn on top**. Slots 0 to 199 come from the order placed in the editor; births take the first free slot.
- Each drawn monster saves the 20 x 20 pixels behind it into `MonsterMem + MonsOnScrn x 400` (`PG:2299`). The save-under slot is therefore assigned **by draw order each tick**, not by monster number.

Memory cause: 50 x 400 = **20,000 bytes**, a fifth of the monster side of the budget. [DOS]

## 6.5 Births and the 200 slots

`BirthMon` (`PG:3327-3350`) puts a new monster in the first slot whose `monnum == LASTMON`, searching from `FirstEmptyMM` and wrapping at 200. If every slot is busy it **silently does nothing**: a spawner block, a fired shot or a
`newmon` that cannot be placed just fails. Hero shots use the same table (`CharBirthMon`, `PG:3356-3385`): the monster is born in the hero's column, `y/20 - 1` rows from the hero, with `fromchar = 1`; a shot that is `fromchar` cannot hurt the hero
(`PG:3115-3116`) and kills what it touches if stronger.

`fromchar` is also a **counter**: when a shot transforms through `newmon`, `fromchar++` (`PG:3266`), so a chain of transformations stays "the hero's".

### A possible hang (new, source-only, **[not yet checked in DOSBox]**; the web port does not reproduce it: it clamps the hint with `Math.max(0, mm - 1)`, `monsters.ts:256`)

`KillMon` sets `FirstEmptyMM = MMnum - 1` when it frees a slot **below** the current hint (`PG:3258`), and `FirstEmptyMM` is an unsigned `int` (`PG:296`). If slot 0 is freed, the hint becomes 65,535.
`BirthMon` then starts at `t = 65535` (`PG:3332`) and runs `do { ... t++; if (t >= LASTMM) t = 0; } while (t != FirstEmptyMM)` (`PG:3333-3339`). While a free slot exists the loop stops on it. If **all 200 slots are in use**, `t` wraps through
0..199 forever and never equals 65,535: the program would **hang**. It needs a full table, so it takes about 200 live monsters; no game I know reaches that. The first probe `mm[65535]` also reads memory at offset `65535 x 10 mod 65536 = 65,526` of the data segment
(harmless read). The port's `monsters.ts:221-246` should be compared; **[not yet checked in DOSBox]** Check it in DOSBox with a scene of 200 placed monsters after killing monster 0.

## 6.6 Monster against everything else

See chapter 8 for the pixel test. Short version: monster against hero, monster against monster (different power only, `PG:2793-2845`), monster against walls. A monster of the **same power** as another passes through it.

## 6.7 Tips

- Put the "long life" monster in a low slot (placed first) so it is drawn underneath, and effects (sparks) in higher slots.
- A lifetime (`end > 0`) is an exact stopwatch; chain lifetimes with `newmon` for timed stages.
- Keep fewer than 50 monsters visible at once; a screen of 20 or fewer is comfortable on a slow PC (chapter 12).
- `thru` and `fly` do nothing. Use a block's `solid` and `grav`.
- Corner speed 0 ends a path early. That is a feature: put a 0-speed corner to shorten a path.

## 6.8 Hazards

- `used`, `fly`, `jump`, `stick`, `thru`, `lasttime`, `cur`, `xtra`: ignored; `close[2]` is read only through the `march[-1]` overlap (chapter 14).
- A monster whose first picture is not a valid block number never draws.
- Monsters born past the screen edge continue to hurt while invisible.
