# Touch and collision

Five separate tests exist. They use different coordinates and different notions of "touching", which is where most surprises come from.

| Test                    | Asks                                                | Coordinates                    | Where                         |
| ----------------------- | --------------------------------------------------- | ------------------------------ | ----------------------------- |
| Solid sides             | may the hero or monster move into this block?       | map cells + block `solid` bits | `PG:2606-2700`, `3549-3688`   |
| Block touch             | does the hero overlap a block (effect, swap, link)? | the 6 touched map cells        | `PG:3512-3547, 3770-3836`     |
| Hero against monster    | do hero and monster pixels overlap?                 | screen pixels                  | `ChkMonChr`, `PG:2722-2790`   |
| Monster against monster | do two monsters overlap, and whose power wins?      | block-relative pixels          | `DoCollision`, `PG:2793-2845` |
| Link                    | is the hero on a link cell?                         | the same 6 cells               | `chklnk`, `PG:3837-3858`      |

## 8.1 The six cells (`GetTouchbl`, `PG:3770-3836`)

The hero is 20 wide and 40 tall, placed at map cell (`x[0]`,`y[0]`) plus a pixel offset `x[1]`,`y[1]` (0..19). The cells it can overlap are a 2 x 3 grid:

| Slot | Cell                          | When it exists                                                                  |
| ---- | ----------------------------- | ------------------------------------------------------------------------------- |
| 0, 1 | row `y-1`, columns `x`, `x+1` | when the hero has a top block (`ci.topthere`); the right one only if `x[1] > 0` |
| 2, 3 | row `y`, columns `x`, `x+1`   | always (left); right only if `x[1] > 0`                                         |
| 4, 5 | row `y+1`, columns `x`, `x+1` | only if `y[1] > 0`; right one also needs `x[1] > 0`                             |

An unused slot holds the pair (`MLEN`, `MWID`) = (100, 100) and block 150 (`BACKBL`), "put on extra lines just for Pete" (`PG:3776`). Everything wraps with `%MLEN`/`%MWID` (`PG:3780-3820`).
Facts that follow: the right column counts only when the hero is **even one pixel** past a block boundary; standing exactly aligned touches fewer cells. The cell numbers come from **`blkmap`** (the displayed frame), not the placed block.

## 8.2 What touching does

`CheckTouch` runs when movement, gravity, a solid monster or `ci.update` enters the character-update branch (`PG:2475-2500`): for each of the 6 cells whose block is **not** an object (`obj == 0`) it calls `really_checktouch` (`PG:3512-3547`):

1. `DoBlockTouchChar`: score, hit points, counter (chapter 9). If that returns "refused" nothing else happens.
2. If the block's `touchbl` differs from itself **and the cell is on screen**, the map cell is replaced and redrawn (chapter 5).

There is no per-cell once-only latch: a persistent overlap can repeat on every **executed check**, not necessarily every tick. A hurting block's first accepted damage starts `HURTSEQ`; the `chr.cseq != HURTSEQ` test then suppresses damage during that sequence (`PG:3455-3463`).
Touch is per **overlap of cells**, not of pixels: a block's transparent pixels (255) are not consulted for background blocks, so even a blank-looking corner of a hurting block hurts.

## 8.3 Solid sides

Bits: 1 top, 2 right, 4 bottom, 8 left (`BLOC.H:11-14`). A block's **right** bit stops something moving **left** into it from the right (`chklefts` tests `SOLRIG` of the cell to the left, `PG:3562-3580`), and so on. So the bit names the side that is solid, not the direction blocked.
The hero's body is two cells high, so each direction tests two cells (three when offset). Two behaviors worth knowing:

- **Corner nudge.** If only the lower cell of a two-high wall stops the hero and he is more than half a block down, the code **moves him** to the next block boundary (`chr.y[1] = BLEN`) or up to 0 (`PG:3585-3592`). That is the slide that carries a hero around a corner.
- **Monsters** check the block under the _next pixel step_ in a single axis at a time (`ChkHorizWalls`/`ChkVertWalls`, `PG:2606-2700`). There is a commented-out second test (`PG:2618-2620`) the authors abandoned because "in practice it does not work well at all".

The solid test uses the **displayed** frame (`blkmap`) as well (`PG:2632-2669`: `blks[0][blkmap[map[...].blk]].solid`), so a ring of block frames can switch a wall on and off. That is the door/gate primitive.

## 8.4 Hero against monster (`ChkMonChr`, `PG:2722-2790`)

1. If the monster's `ScrPos.x == OFFSCRN` (-100) the answer is **no** (`PG:2728`). A monster not on screen cannot touch the hero.
2. A bounding test in screen pixels, with the hero 20 wide and **40** tall (`PG:2739-2743`, "`*2` for 2-high chars").
3. The pixel test `PicChkTouch` (`PG:2850-2950`): lay the two 20 x 20 pictures over each other and return true at the first position where **neither** pixel is 255 (`TRANSCOL`). It is run twice, once for the hero's bottom block, once for the top block (`PG:2747-2749`).
4. A hit applies the **monster's current frame block** through `DoBlockTouchChar` (`PG:3113-3115`) and, if the monster's power is below 100, kills it (`PG:3119`). A shot born from the hero (`fromchar == 1`) never hurts the hero (`PG:3115`).

So the hero's transparent pixels do not touch: **an all-clear hero frame is immune**. And "touch" depends on the frame; a monster with three frames can pay, hurt, and do nothing in turn.

### Which monsters count as "on screen" (the cell test)

`CalcDraw` (`PG:2281-2290`) runs `onscrn` on the monster's **map cell**, not its pixel: `ScrPos = (cell - view) x 20 - scroll offset`, with map wrap, tested against `{1,1}`..`{300,180}` (`PG:294`, `PG:3819-3830`). Only after that passes does it add the monster's pixel offset inside the cell (`curx[1]`). Rejected cells get `OFFSCRN`, which rejects hero contact (`PG:3104-3113`, `PG:2722-2729`). These source rules also appear in the port (`engine/engine/touch.ts:27-43`, `engine/engine/monsters.ts:72-79`, `engine/engine/monsters.ts:598-605`).
Consequences from those tests (not new DOSBox observations):

- With `scroll.nx = 0` the cell at the screen's left edge has `ScrPos.x = 0`, below the lower bound of 1. The **whole left column** of cells is rejected before any pixel offset is added. The same holds for the top row when `scroll.ny = 0`. Zero is a real state: initialization sets both offsets to 0 (`PG:193-201`, `PG:4693-4699`), and scrolling normalizes them to 0..19 (`PG:4033-4036`), despite the "1-20" comment. So the hidden band is one **block** wide, not one pixel, on an unscrolled screen.
- `ScrPos` then gets the in-cell offset (0..19) added, so a monster in the right-most allowed cell (screen 300) with an offset of 1 or more lands at 301..319 and **fails the draw test** (`PG:2292-2308`) but keeps a real `ScrPos`: it can still reach the hero collision/effect tests (`PG:3104-3119`). Invisible does not always mean harmless.
- The Round-and-Round fix moved the loop and car down one **block** (commit `03c724f6c`). That historical change is compatibility context, not a new DOSBox test of these rules.

## 8.5 Monster against monster (`DoCollision`, `PG:2793-2845`)

Only monsters of **different power** collide (`PG:2810`); equal power passes through. The pixel test uses the screen-free block-relative offsets (`curx[1]`, `cury[1]`) plus a whole block in x and/or y for neighbors (`where` bits 1 and 2). The higher power kills the lower;
if the **winner** was fired by the hero (`fromchar > 0`), the loser's `upscore` goes to the hero's score, the kill sound plays and the shot itself is killed (`PG:2822-2845`). Both kills run `KillMon`, so each can turn into its `newmon`.

## 8.6 Cost (estimates)

`PicChkTouch` loops over the overlap rectangle: **up to 400 iterations**, returning at the first jointly non-255 pixel pair (`PG:2850-2953`). A large overlap with no jointly opaque pixels, or a very late first match, makes it scan the most; _nearly_ touching geometrically gives a smaller rectangle. The port uses the same bound and early exit (`engine/engine/monsters.ts:353-402`).
About 25-30 clock cycles per iteration on a 286 = 10,000-12,000 cycles, roughly 0.8-1.5 ms at 8-12 MHz, and 0.2-0.3 ms on a 486DX2-66 remain **[estimate; not measured on those CPUs]**. Source loop bounds do not establish instruction timings or cross-CPU speedups. Eligible monsters may test against both hero halves and up to four occupancy cells (`PG:2748-2751`, `PG:3130-3137`); bounding checks and early exits change the work. The web slow-PC model's 1.2 ms per monster is an explicit modeling choice, not a DOS benchmark (`engine/engine/slowPc.ts:72-76`).

## 8.7 Tips

- A hurting block should have a one-block margin of free space; because touch is by cell, the hero is hurt when he overlaps its cell, not its art.
- For a gate: a block ring with `solid` bits in some frames. For a door that opens when touched: `touchbl` on a trigger cell **next to** the door.
- Make a pass-through shot with the same power as its target (they will not collide) and a different power for a shot that should kill.
- To make a monster harmless for a moment, give a frame a block that is all 255.

## 8.8 Hazards

- A monster in the left column or top row of a still screen cannot hurt.
- A monster at the right edge at an in-cell offset can hurt while invisible.
- Hero blocks with transparent halves "slide through" monsters; check each frame.
