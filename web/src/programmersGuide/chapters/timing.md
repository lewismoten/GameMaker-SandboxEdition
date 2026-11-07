# Timing and the game loop

## 12.1 One crystal, three clocks

The PC's timer chip (PIT, 8253/8254) counts down from a 16-bit divisor driven by 1,193,180 Hz (`SOUND.H:43-44`). BIOS sets the divisor to 65,536 (written as 0), giving **18.2065 Hz**, 54.925 ms, the DOS clock.
PLAYGAME writes a divisor of `65535/8` = **8,191** to channel 0 (`FastTimer`, `PG:4618-4624`); `SlowTimer` puts 65,535 back on exit (`PG:4610-4615`).

| Clock                               | Rate          | Arithmetic                                                                                  | Used for                                                          |
| ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Timer interrupt (`NewTimer`)        | **145.67 Hz** | 1,193,180 / 8,191 = 145.67; period 6.865 ms                                                 | the speaker step, `PlayIt()` (music), `SndClock`, the scroll step |
| Game tick (`TimerCounter`, `clock`) | **18.21 Hz**  | every 8th interrupt (`(SndClock & 7) == 0`, `PG:4423-4430`) = 65,528 PIT counts = 54.92 ms  | everything that moves: hero, monsters, blocks, births             |
| DOS time of day                     | 18.2 Hz       | the old BIOS handler is called on **every 8th** interrupt only (`(*OldTimer)()`, `PG:4425`) | approximately preserves the BIOS clock rate (nominal drift below) |

Nominal drift: with the usual 65,536-count BIOS baseline and no lost interrupts, forwarding once per 8 x 8,191 = 65,528 counts gives `86400 * (65536/65528 - 1)` = **10.55 seconds/day fast** (`PG:4421-4427`, `PG:4618-4624`). This is calculated from the programmed divisor, not measured wall-clock drift. [PIT]
**One divisor serves all three.** The file is written for 146 music ticks/s (`HDRCLK 146`, `SOUND.H:43`), while the programmed timer is about 145.67 Hz. The speaker advances on that interrupt and the BIOS/game clock on every eighth one (`PG:4421-4445`). Thus 1 game tick = **8** music-service calls exactly; 8,191 is close to, not exactly, an eighth of the usual BIOS divisor. The source does not explain the historical choice. [PIT]
`TimerCounter` and `clock` are 32-bit (`PG:301, 308`): 2^32 / 18.21 = 235,860,000 s = **7.5 years** before they wrap. [16-bit avoided]

Elapsed time shown on the inventory screen is `clock/18 - clock/1818` seconds (`PG:1983`): 1/18 - 1/1818 = 0.05494 s per tick, the 18.2 Hz correction written as integer math.

## 12.2 The loop, in order (`playscene`, `PG:1403-1530`)

The loop repeats as fast as the CPU allows, doing two jobs:

**Every pass, when the interrupt clock has advanced (nominally 145.67 Hz):** `if (oldSndclk <= SndClock) { if (DoScroll) DrawScroll(SndClock - oldSndclk + 1); oldSndclk = SndClock + 1; }` (`PG:1418-1422`).
There is at most one `DrawScroll` call per loop pass, supplied with the elapsed interrupt count (`PG:1418-1422`), but its Bresenham calls actually use 1 rather than the `speed` parameter (`PG:3972-3995`): missed scroll steps are not replayed there. `MoveViewScreen` first waits **out** an active retrace (`SV:77-81`). If the fine-pan value changes, it additionally waits out retrace and then for the next one (`SV:138-159`); that wait is skipped when the value is unchanged. Thus not every hardware-scroll pass unconditionally waits a whole refresh. [VGA]

**Once per game tick (`if (OldClock < TimerCounter)`, `PG:1454`):**

1. `OldClock = clock = TimerCounter` (`PG:1454-1455`). A late loop **skips** the ticks it missed (the clock jumps) instead of catching up.
2. `erasechars()`, then erase every monster in reverse slot order (`PG:1456-1460`).
3. `BlocBirthMon()`, `moveallmons()`: births and monster movement (`PG:1461-1462`).
4. Apply pending keys, when the current sequence can be interrupted (`PG:1471-1489`).
5. `movechars()` in a loop until a frame to draw is found (`PG:1492-1494`).
6. `changeblks()`: ring animation (`PG:1498`, chapter 5).
7. Draw monsters in slot order, stop at 50 drawn (`PG:1503-1510`), then `drawchars()` (`PG:1511`).
8. Present the picture: either `SoftwareScroll()` when the video type is "Simulate", or `DrawDirtyRects()` (copy only changed rectangles) (`PG:1513-1520`). The software routine copies 64,000 bytes in its non-wrapped branch, **65,536** in its wrapped branch (`SV:206-240`).
9. Recompute scrolling and **check the links** (`chklnk`, `PG:1522-1525`).

Skipped ticks are not replayed (`PG:1453-1455`). **Monster movement is elapsed-scaled** (`PG:2997-3000`), but character displacement and gravity are not (`PG:2460-2492`, `PG:3729-3764`); the character loop can retry while `cframe==-1` (`PG:1491-1494`). Absolute clock tests do **not** make rings and births fully catch up: a ring advances at most one successor per call (`PG:2330-2341`), and a spawner schedules one overdue event per call (`PG:3283-3290`). Lifetimes expire on the first processed check at or after their deadline (`PG:3141-3142`), not necessarily at that wall-clock instant.

## 12.3 Keys

Keys arrive on the keyboard interrupt into a pending list (`KeysPending[30]`, `PG:321`) and are applied once per tick (`PG:1471-1489`); resolution is **one tick, 54.9 ms**, latency 0 to 1 tick. A pending key waits while the running sequence is `ground` (uninterruptible), unless it is on its first frame.
The held-key table is `keydn[128]`, indexed by scan code (`PG:340`). A sequence ends early when its key is released (`keydn[key>>8] == 0`, chapter 7).

**Why does Escape restart the level?** Escape is checked twice, not latched as a quit request. The first held-key check, `if (keydn[1]) done=TRUE`, ends the scene (`PLAYGAME.C:1424`). After `FadeAllTo(Black)` (`PLAYGAME.C:1533`), a second check sets the quit link only if Escape is still held (`PLAYGAME.C:1547`). If you tap Escape and release it during the fade, the scene can keep its restart link instead of quitting. On a slow computer, **hold Escape until the screen goes black**, then release it. [DOS] [not yet checked in DOSBox]

The web engine preserves this sequence for **DOS fidelity**: held Escape ends the scene loop (`engine/engine/scene.ts:668-671`), then the engine awaits the black fade before checking the held key again for the quit link (`engine/engine/scene.ts:715-721`). This is the original behavior, not a web-only restart shortcut.

## 12.4 Cost of one tick

All cycle counts here are **[estimate]**: 286 timings are the Intel data-sheet figures (REP MOVSW 5 + 4n clocks, zero wait states), plus wait states for an ISA video card; "ISA bound" means the card's bus cycle, not the CPU, sets the speed.

### The copy to the screen

- **Hardware-scroll path** (`DrawDirtyRects`, `DR:63-74`): one `SvgaBufToScrn` per rectangle, at most **170** (`MAXDIRTY`, `DR:12`). A 20 x 20 block is 20 rows of 10 words: roughly 20 x (20 + 10 x 8) = **2,000 clocks**, 0.17 ms at 12 MHz. A tick with the hero, 10 monsters and 10 animated cells is about 40 rectangles = 80,000 clocks = **7 ms** at 12 MHz.
- **Software path ("Simulate", `SoftwareSim`, `PG:1513-1518`)**: a full-screen copy per processed tick. The non-wrapped branch copies **32,000 words**; the wrapped branch copies **65,536 bytes**, because the intended 1,536-byte subtraction is commented out (`SV:206-240`). The table below estimates the non-wrapped 64,000-byte case only.

| Machine                        | Bound                                       | Time for 32,000 words | Share of a 54.9 ms tick |
| ------------------------------ | ------------------------------------------- | --------------------- | ----------------------- |
| 286 at 8 MHz, 8-bit VGA card   | two 8-bit ISA cycles per word, about 1.3 µs | **42 ms**             | 76%                     |
| 286 at 12 MHz, 16-bit VGA card | ISA 16-bit write about 0.5 µs               | **16 ms**             | 29%                     |
| 386DX-33, 16-bit VGA           | ISA, about 0.35 µs                          | 11 ms                 | 20%                     |
| 486DX2-66, 16-bit ISA VGA      | about 0.3 µs                                | 10 ms                 | 17%                     |
| 486DX2-66, local-bus VGA       | about 0.1 µs                                | 3 ms                  | 6%                      |

Under the assumed 42 ms copy cost, a "Simulate" player on an 8 MHz 286 with an 8-bit card would spend about **three quarters of a tick copying**, before other work. **[inference] [estimate]** adding enough other work could produce roughly half-speed character updates. Source settles the skipped-update mechanism and the different movement scaling, not a universal half-speed result on every such machine (`PG:1453-1455`, `PG:1513-1520`, `PG:2997-3000`). No such timing was measured.

### Per monster and per scroll step

The port's authors modeled a 286-16 as: **15 ms** for a tick with only the hero, **1.2 ms per monster** drawn, **2.5 ms** per scroll step plus **1.5 ms per 4-pixel strip** (`web/packages/engine/src/engine/slowPc.ts:33-39`, `TURBO_OFF`). The order of magnitude can be reproduced from the source:

| Per monster per tick                                               |            Clocks | Why                        |
| ------------------------------------------------------------------ | ----------------: | -------------------------- |
| save the 400 pixels behind it                                      |       about 2,000 | `BufGetBlkAddr`, `PG:2301` |
| masked draw (compare each of 400 pixels with 255)                  |       4,000-6,000 | `BufDrawSpBlkAddr`         |
| erase (restore the saved 400)                                      |       about 2,000 | `Erase`, `PG:2312-2316`    |
| two dirty rectangles (erase and draw) to the screen                |       about 4,000 | above                      |
| move (Bresenham) and wall tests                                    |         500-1,500 | `PG:2994-3100`             |
| hero touch test (`PicChkTouch`, top and bottom blocks, early exit) |      2,000-12,000 | chapter 8                  |
| **total**                                                          | **15,000-27,000** |                            |

At 12 MHz that is 1.3-2.2 ms; at 8 MHz 1.9-3.4 ms. 20 monsters on screen: **26-44 ms at 12 MHz**, a large share of a 54.9 ms tick before other work, not the whole tick by itself. 50 would be 65-110 ms. These are **[estimate]**, not a reproduced hardware observation. The source does establish the save/draw/erase/contact work and the 50-draw cap (`PG:2297-2316`, `PG:2722-2751`, `PG:1503-1508`).

### The interrupt itself

Per `NewTimer` call (`PG:4421-4445`): `INT` entry and `IRET` (about 60 clocks), nine register pushes and pops from Borland's `interrupt` prologue (about 80), the `SndClock & 7` test, `enable()`, `outportb(0x20, 0x20)` (an I/O write, about 12 clocks plus bus), the speaker tests, `PlayIt()` when a song is loaded (about 60 clocks on a tick with no event), `SndClock++` (a 32-bit add):
**about 350 clocks = 29 µs at 12 MHz, 44 µs at 8 MHz**, times 145.67 = **4.2-6.4 ms per second: 0.4-0.6% of the CPU**. [estimate] This is a low-event scenario, not an upper bound: generated Borland prologue, the old BIOS handler every eighth call and external music-driver work have not been timed (`PG:4421-4445`).

Music events call an external FM driver (`SB:157-187`); this source does not expose its register-write count. **[estimate]** if a note took 10 writes at about 26 µs each, it would cost about 260 µs; a hypothetical 15-event/s workload would cost about 4 ms/s. Those are assumptions, not DOS driver measurements. The web uses a different explicit model: 4/1/11 writes for note-on/off/instrument change and 30 µs/write (`engine/engine/slowPcMusic.ts:19`, `engine/engine/slowPc.ts:170-172`). Neither model proves the cost of every real song interrupt.

Under these **[estimate]** assumptions, low-event timer/music work is small beside copying, monsters and voice reads. This does not rule out real driver or event-load costs on an unmeasured 286.

## 12.5 Possible reasons for choppy 286 play (a 1994 memory)

1. **The "Simulate" screen path** (above): an estimated 16-42 ms copy in the assumed card/CPU cases.
2. **Crowded screens**: the modeled 20-monster work is a large share of a tick, before other work.
3. **Scrolling while crowded**: the port budgets 2.5 ms per scroll pass plus 1.5 ms per strip (`engine/engine/slowPc.ts:72-76`). Those are modeled costs, not a sourced DOS one-pass-per-retrace limit.
4. **Digital sound reads**: synchronous stalls; one or two ticks per hard-disk trigger is an estimate (chapter 10b).
5. **Tick skipping**: when the loop is late the clock jumps without replaying updates. Monster movement is elapsed-scaled; character movement is not, and rings/births can also lag as described above. The visible cadence depends on the workload.

The port's slow-PC model says a 286-16 with the **hardware** path "keeps full pace" on a still screen (`slowPc.ts:14-24`), matching one player's memory of that machine; a recollection of chop is consistent with a different video setting, a crowded screen, or voices.
**[not yet checked in DOSBox]**: compare the four conditions one at a time, with `cycles=fixed 4000` as an initial trial, not a verified 286-12 calibration. The costs, visible slowdown and historical cause ranking remain unmeasured; the recollection is context, not a benchmark.

## 12.6 Tips

- On a slow PC the cheapest wins are fewer monsters on screen and no re-triggered voices; the hero's own cost is small.
- If a level must run on every machine keep 10 or fewer monsters visible and avoid scrolling through a crowded screen.
- Timing-critical puzzles: absolute deadlines avoid depending on hero speed, but rings/births do not replay every missed transition and lifetime checks still wait for the next processed update.
- A judged rhythm window must be at least 2 ticks (110 ms): input resolution is a tick.

## 12.7 Hazards

- The audio starts before the game clock does at scene start.
- Function keys pause the game clock but not the music.
- The programmed timer implies about 10.55 s/day nominal BIOS-clock gain under the stated baseline/no-loss assumptions; actual clock drift is not measured.

## CPU MHz does not set the clock

The game runs at **18.2 ticks a second**, about one tick every 54.9 milliseconds. This is the PIT timer chip's clock, independent of the CPU: a 10 MHz processor and a 66 MHz processor receive essentially the same timer rate. Everything that moves is counted in ticks: a hero's frame pause, a monster's step, a block's change time.
Sequence keys are applied on processed ticks; a busy machine or an uninterruptible sequence can delay the response beyond one tick. Escape is checked to leave the scene and again after the fade to choose whether to return to the menu. Hold Escape through the fade until the menu appears: a short tap can end a scene yet be released before the second decision, causing the scene to restart.

Eight of the timer chip's 146 steps make one tick, and PLAYGAME uses that interrupt for the game clock, the speaker and the music. Slow drawing can skip game updates while the interrupt clock keeps advancing.

The interrupt divisor and one-in-eight forwarding are `code/GM/PLAYGAME.C:4421-4445`, `code/GM/PLAYGAME.C:4610-4624`; the crystal constant is `code/GM/SOUND.H:43-44`. CPU speed affects whether the main loop processes each tick, not that PIT input frequency. Pending sequence keys and link decisions occur at `code/GM/PLAYGAME.C:1471-1489`, `code/GM/PLAYGAME.C:1522-1525`. Escape's two held-key checks are `code/GM/PLAYGAME.C:1424`, `code/GM/PLAYGAME.C:1547`; a quick release before the second can restart the scene. Hold through the fade until the menu appears. [not yet checked in DOSBox]
