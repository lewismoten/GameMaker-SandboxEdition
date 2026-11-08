# Background blocks

Limits recap (chapter 2): 150 blocks per file (`BACKBL`, `BLOC.H:6`), 151 allocated, 420 bytes each.

## 5.1 The record, byte by byte (`BLOC.H:35-53`)

|  Offset | Size | Field       | Meaning (as PLAYGAME uses it)                                                                |
| ------: | ---: | ----------- | -------------------------------------------------------------------------------------------- |
|       0 |  400 | `p[20][20]` | pixels, row by row, one byte per pixel; 255 is transparent (`TRANSCOL`, `PG:58`)             |
|     400 |    1 | `Birthmon`  | monster number that this block births (`PG:3301`)                                            |
|     401 |    2 | `Birthtime` | ticks between births; **bit 14 is a working flag** (below)                                   |
|     403 |    2 | `Xtra[2]`   | not used                                                                                     |
|     405 |    1 | `solid`     | 1 top, 2 right, 4 bottom, 8 left (`BLOC.H:11-14`): which sides stop the hero and monsters    |
|     406 |    1 | `hitpt`     | "same, but can hurt the character": **not read by PLAYGAME** (`PG:3444-3467` uses `chhitpt`) |
|     407 |    2 | `scorepts`  | score added on touch (`PG:3502`)                                                             |
|     409 |    2 | `chhitpt`   | hit points added on touch (negative hurts) (`PG:3444-3467`)                                  |
|     411 |    1 | `nextbl`    | block this one turns into after `ntime` ticks; equal to its own number = never               |
|     412 |    2 | `ntime`     | how long this block shows before turning into `nextbl`; 0 = never                            |
|     414 |    1 | `touchbl`   | block that replaces this one **in the map cell** when it is touched; own number = no change  |
|     415 |    1 | `grav`      | bits: 1 pulls up, 2 right, 4 down, 8 left (`BLOC.H:49`; used at `PG:3708-3764`)              |
|     416 |    1 | `obj`       | nonzero: the hero can pick this block up (`PG:2116-2138`)                                    |
|     417 |    1 | `effect`    | counter number this block changes on touch (chapter 9)                                       |
|     418 |    2 | `eamt`      | amount added to that counter                                                                 |
| **420** |      |             | the port's `BLOCK_SIZE` agrees (`web/packages/engine/src/formats/blocks.ts:7`)               |

Block files hold 150 (`.bbl`), 100 (`.mbl`) or 50 (`.cbl`) records. PLAYGAME applies most behavior fields **only to background blocks** (`blks[0]`): `Birthmon`, `Birthtime`, `nextbl`, `ntime`, `touchbl`, `grav` and `obj` do nothing in a
monster or hero block. Two exceptions, found while checking the source audit (which lists all behavior fields of `.mbl` as no-ops, and is wrong on this point):
a **monster block's** `solid` stops other monsters (`PG:2714, 2750-2778`), and when a monster touches the hero the **monster frame's** block runs through the same touch code as a
background block, so its `scorepts`, `chhitpt`, `effect` and `eamt` all apply (`PG:3113-3115`: `DoBlockTouchChar(&blks[1][temp])`). Hero blocks contribute pixels only.

## 5.2 Animation is per block number, not per cell

Two arrays of 150 entries drive it (`PG:302-303`):

- `blkmap[150]` (`uchar`): which block each number _currently shows_.
- `nxtchg[150]` (`ulongi`, 32-bit): the clock value at which that number next changes.

At scene start every number shows itself, and `nxtchg = clock + ntime`, or `0xFFFFFFFF` (never) when `ntime <= 0` (`PG:4714-4722`).
Each tick `changeblks` (`PG:2322-2356`) walks all 150 numbers; one whose time has come and whose `nextbl` differs from the displayed block switches to `nextbl`, and
`nxtchg += ntime` of the block it just became (`PG:2333-2341`). So **`ntime` is how long the block is shown, and a ring of N blocks is N frames with N durations**. The time is added to the old
deadline, never to "now", so the ring does not drift.

Consequences:

- Every cell holding number N changes **at the same instant**. A ring has one phase. To get phase-shifted copies, place different **members** of the ring in different cells.
- The map stores the **base** number (`map[y][x].blk`); drawing and touching go through `blkmap[...]` (`PG:2347, 3789-3799`).
- Cost: a fixed 150-entry scan, followed by a separate scan of the visible interior for redraws (`PG:2330-2354`). Which dominates on a target PC has not been measured; redraw cost is discussed below.
- Only the 15 x 9 interior of the 16 x 10 screen is repainted when a frame changes (`PG:2344-2345`); chapter 3 explains the stale edge.
- Time bound: `ntime` is an `int` (16-bit): at most **32,767 ticks**, about **30 minutes** at the nominal tick rate per frame [16-bit].
- Terminal frames: set `nextbl` to the block itself. At scene entry `ntime <= 0` sets the deadline to `0xFFFFFFFF` (`PG:4715-4721`). During animation the next frame is selected first: if the **old** frame has `ntime <= 0`, the deadline becomes **0**, which is due, not "never", despite the comment (`PG:2333-2340`). Entering a zero-time frame from a positive-time frame adds zero to the old deadline; it can leave on the next tick. Each scan advances each number at most once. The port keeps this distinction (`engine/engine/scene.ts:352-355`, `engine/engine/scene.ts:381-391`).

### Redraw budget (a limit on the hardware copy path)

`changeblks` draws one 400-byte block per **visible cell** whose number changed. A screen is at most 15 x 9 = 135 interior cells. Each draw also adds a dirty rectangle, and
the dirty list holds at most **170** rectangles (`MAXDIRTY 170`, `DIRTRECT.C:12`; `AddDirtyRect` silently ignores the rest, `DIRTRECT.C:34`). Animated cells + monsters (2 rectangles each: erase and draw) +
hero compete for those 170 (`PG:1453-1462`, `PG:1497-1520`, `PG:2265-2277`, `PG:2292-2316`). The illustrative budget 135 animated cells + 20 monsters x 2 + hero 4 = 179 > 170 exceeds capacity: later copy requests are dropped (`DIRTRECT.C:32-74`). Whether this leaves a visible stale picture, and for how long, depends on overlapping copies and later refreshes. **[inference; not yet checked in DOSBox]** The dirty-box debug define `SHOWDIRTYBOXES` (`DIRTRECT.C:11`) can help check it. On the software path `SoftwareScroll` runs instead and the dirty list is cleared (`PG:1513-1520`; chapter 12).

## 5.3 Births

A block with `Birthtime > 0` is a **spawner** (`InitBirthArray`, `PG:4218-4236`). Up to 150 spawners, 5 bytes each (`BlkMonStruct`: `blnum` + a 32-bit `nexttime`, `PG:206-211`).
Every tick `BlocBirthMon` (`PG:3275-3310`):

1. clears the flag bit on every block: `Birthtime &= 0xBFFF` (`PG:3281`);
2. for each spawner whose `nexttime <= clock`: `nexttime += Birthtime` and sets the flag `Birthtime |= 0x4000`;
3. scans the cells from `mx-8` to `mx+23` and `my-5` to `my+14` (**32 x 20 = 640 cells**: the screen plus half a screen on each side, `PG:3290-3292`);
4. for each cell **showing** a flagged block (via `blkmap`), births monster `Birthmon` there (`PG:3299-3305`), with `fromchar = 0` (it can hurt the hero).

So one spawner block fills every visible-or-nearby cell showing that block in the same tick, limited by free monster slots (chapter 6). Spawners off screen (more than half a screen away) do nothing, but their
timers keep running, so on return they are on the absolute grid.

**The flag bit costs range.** The code's own comment says the high bit is the flag (`BLOC.H:40`), but it uses `0x4000` (bit 14). The comparison `Birthtime > 0` treats the field as a signed `int`, so:

| `Birthtime`      | Behavior                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 .. 16,383      | works as written (16,383 ticks = 15 minutes)                                                                                                       |
| 16,384 .. 32,767 | first deadline is `clock + stored value` (`PG:4724-4732`); bit 14 is cleared on every `BlocBirthMon` call, before checking that deadline, so later deadline increments are `value - 16,384` (`PG:3281-3289`) |
| 32,768 .. 65,535 | negative as an `int`: the block never counts as a spawner                                                                                          |

[16-bit] At exactly 16,384 the later increment is zero: after the first deadline, the spawner remains due every tick. For 20,000 the later increment is 3,616 ticks. These are source scheduling rules, not measured birth observations. The web port reads the same signed field (`engine/formats/blocks.ts:72-76`) but keeps the flag in a separate array and preserves the positive period for 16,384..32,767 (`engine/engine/monsters.ts:268-288`, `engine/engine/scene.ts:356-358`). Values whose signed representation is negative do not become spawners in either implementation.

## 5.4 Touch swaps (`touchbl`)

When the hero touches a block and the effect is accepted (chapter 9), `really_checktouch` replaces the **map cell** with `touchbl` (`PG:3524-3547`):

- it edits `map[y][x].blk`, a permanent change for the rest of the scene visit;
- it happens **only if the cell is on screen** (`onscrn`, `PG:3535`); an off-screen touch does the effect but not the swap;
- the block used for the test is the **displayed** one (`blknum`), so the touch rule of a ring follows its current frame (the "timing judge").
- `obj` blocks are skipped by `CheckTouch` (`PG:3518-3519`) and only act through a pickup (`PG:2116-2138`), which applies the effect and then swaps the cell.

## 5.5 Gravity bits

`grav` bit 1 sucks the hero up, 2 right, 4 down, 8 left (`BLOC.H:49`). The accumulated gravity per axis is capped at `MAXGRAV x 4 = 44` (`PG:3761-3764`), and the per-tick move at `MAXGRAV = 11` pixels
(`PG:2484-2487`). The gravity timer runs every `GRAVSPEED` = 1 tick (`PG:3738`). 44 / 11 = 4: the cap is four full-speed ticks of acceleration.

## 5.6 Tips

- Number your ring so the base member (the one in the map) is the one you want when the scene starts.
- Keep animated hazards one cell in from the left and top (chapter 3).
- A touch swap needs the cell on screen: put pickups where the hero will see them.
- Do not let two rings share a member: the member has one `nextbl`.

## 5.7 Hazards

- `hitpt` does nothing. Use `chhitpt` for damage.
- `Xtra` is unused.
- `Birthtime` of 16,384 or more behaves as above.
- A block with `solid` bits and a `touchbl` that is not solid makes a "door that opens when touched" only for the hero that actually overlaps it; a solid block cannot be overlapped, so
  doors need a one-pixel-margin trick or a trigger cell next to them. See chapter 8.
