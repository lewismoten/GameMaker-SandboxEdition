# Timing and the game loop

## 12.1 One crystal, three clocks

The PC's timer chip (PIT, 8253/8254) counts down from a 16-bit divisor driven by 1,193,180 Hz (`SOUND.H:35-36`). BIOS sets the divisor to 65,536 (written as 0), giving **18.2065 Hz**, 54.925 ms, the DOS clock.
PLAYGAME writes a divisor of `65535/8` = **8,191** to channel 0 (`FastTimer`, `PG:4618-4624`); `SlowTimer` puts 65,535 back on exit (`PG:4610-4615`).

| Clock                               | Rate          | Arithmetic                                                                                  | Used for                                                          |
| ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Timer interrupt (`NewTimer`)        | **145.67 Hz** | 1,193,180 / 8,191 = 145.67; period 6.865 ms                                                 | the speaker step, `PlayIt()` (music), `SndClock`, the scroll step |
| Game tick (`TimerCounter`, `clock`) | **18.21 Hz**  | every 8th interrupt (`(SndClock & 7) == 0`, `PG:4423-4430`) = 65,528 PIT counts = 54.92 ms  | everything that moves: hero, monsters, blocks, births             |
| DOS time of day                     | 18.2 Hz       | the old BIOS handler is called on **every 8th** interrupt only (`(*OldTimer)()`, `PG:4425`) | the DOS clock stays correct                                       |

Drift: 8 x 8,191 = 65,528, which is 8 counts short of BIOS's 65,536, so DOS time runs fast by 8 / 65,536 = 0.012%, about **10.5 seconds a day** while PLAYGAME runs. [PIT] [inference: arithmetic only]
**Why a divisor of 8,191 and not a free choice.** The music file is written for 146 ticks a second (`HDRCLK 146`, `SOUND.H:36`), the speaker needs a step every few milliseconds, and the BIOS clock must be called at about 18.2 Hz; one divisor that is an exact eighth of BIOS's serves all three. 1 game tick = **8** music ticks exactly. [PIT]
`TimerCounter` and `clock` are 32-bit (`PG:301, 308`): 2^32 / 18.21 = 235,860,000 s = **7.5 years** before they wrap. [16-bit avoided]

Elapsed time shown on the inventory screen is `clock/18 - clock/1818` seconds (`PG:1983`): 1/18 - 1/1818 = 0.05494 s per tick, the 18.2 Hz correction written as integer math.

## 12.2 The loop, in order (`playscene`, `PG:1403-1530`)

The loop repeats as fast as the CPU allows, doing two jobs:

**Every pass, once per timer interrupt (145.67 Hz):** `if (oldSndclk <= SndClock) { if (DoScroll) DrawScroll(SndClock - oldSndclk + 1); oldSndclk = SndClock + 1; }` (`PG:1415-1418`).
The scroll step happens at most once per interrupt however many went by. Each hardware scroll step **waits for the vertical retrace** (`MoveViewScreen`, `SV:70-76`: spin on port 0x3DA bit 3), so on a hardware-scroll card a pass takes at least up to one screen refresh (14.3 ms at the 70.09 Hz of mode 0x13; 16.7 ms at 60 Hz) [VGA].

**Once per game tick (`if (OldClock < TimerCounter)`, `PG:1454`):**

1. `OldClock = clock = TimerCounter` (`PG:1454-1455`). A late loop **skips** the ticks it missed (the clock jumps) instead of catching up.
2. `erasechars()`, then erase every monster in reverse slot order (`PG:1456-1460`).
3. `BlocBirthMon()`, `moveallmons()`: births and monster movement (`PG:1461-1462`).
4. Apply pending keys, when the current sequence can be interrupted (`PG:1471-1489`).
5. `movechars()` in a loop until a frame to draw is found (`PG:1492-1494`).
6. `changeblks()`: ring animation (`PG:1498`, chapter 5).
7. Draw monsters in slot order, stop at 50 drawn (`PG:1503-1510`), then `drawchars()` (`PG:1511`).
8. Present the picture: either `SoftwareScroll()` (copy all 64,000 bytes) when the video type is "Simulate", or `DrawDirtyRects()` (copy only the changed rectangles) (`PG:1512-1521`).
9. Recompute scrolling and **check the links** (`chklnk`, `PG:1522-1525`).

Skipped ticks mean: **block rings, births and monster lifetimes stay exact** (they compare against the absolute `clock`); **monsters move `speed x ticks elapsed`** to catch up (`PG:2994-2996`); **the hero moves once per call**, so on a slow PC the hero is slower, not "caught up". [inference from `movechars` being called once per tick; verify]

## 12.3 Keys

Keys arrive on the keyboard interrupt into a pending list (`KeysPending[30]`, `PG:321`) and are applied once per tick (`PG:1471-1489`); resolution is **one tick, 54.9 ms**, latency 0 to 1 tick. A pending key waits while the running sequence is `ground` (uninterruptible), unless it is on its first frame.
The held-key table is `keydn[128]`, indexed by scan code (`PG:340`). A sequence ends early when its key is released (`keydn[key>>8] == 0`, chapter 7).

## 12.4 Cost of one tick

All cycle counts here are **[estimate]**: 286 timings are the Intel data-sheet figures (REP MOVSW 5 + 4n clocks, zero wait states), plus wait states for an ISA video card; "ISA bound" means the card's bus cycle, not the CPU, sets the speed.

### The copy to the screen

- **Hardware-scroll path** (`DrawDirtyRects`, `DR:63-74`): one `SvgaBufToScrn` per rectangle, at most **170** (`MAXDIRTY`, `DR:12`). A 20 x 20 block is 20 rows of 10 words: roughly 20 x (20 + 10 x 8) = **2,000 clocks**, 0.17 ms at 12 MHz. A tick with the hero, 10 monsters and 10 animated cells is about 40 rectangles = 80,000 clocks = **7 ms** at 12 MHz.
- **Software path ("Simulate", the `VgaTypes` list entry `PG:4787`, `SoftwareSim`)**: the **whole 64,000-byte screen is copied every tick**: 32,000 words (`rep movsw`, `SV:182-248`).

| Machine                        | Bound                                       | Time for 32,000 words | Share of a 54.9 ms tick |
| ------------------------------ | ------------------------------------------- | --------------------- | ----------------------- |
| 286 at 8 MHz, 8-bit VGA card   | two 8-bit ISA cycles per word, about 1.3 µs | **42 ms**             | 76%                     |
| 286 at 12 MHz, 16-bit VGA card | ISA 16-bit write about 0.5 µs               | **16 ms**             | 29%                     |
| 386DX-33, 16-bit VGA           | ISA, about 0.35 µs                          | 11 ms                 | 20%                     |
| 486DX2-66, 16-bit ISA VGA      | about 0.3 µs                                | 10 ms                 | 17%                     |
| 486DX2-66, local-bus VGA       | about 0.1 µs                                | 3 ms                  | 6%                      |

A "Simulate" player on an 8 MHz 286 with an 8-bit card spent **three quarters of every tick just copying the picture**, leaving 13 ms for everything else (the hardware-path estimate of a quiet tick is about 15 ms, see below), so every tick ran late and the loop skipped the next: the game ran at **about half speed** and the hero was slow while monsters, which catch up, were not. [inference]

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

At 12 MHz that is 1.3-2.2 ms; at 8 MHz 1.9-3.4 ms. 20 monsters on screen: **26-44 ms at 12 MHz**, the whole tick, with nothing left for the hero. That reproduces the observation that **a crowded screen on a 286 is the case that slows down**, and that the 50-monster cap bounded it. 50 would be 65-110 ms. [estimate]

### The interrupt itself

Per `NewTimer` call (`PG:4421-4445`): `INT` entry and `IRET` (about 60 clocks), nine register pushes and pops from Borland's `interrupt` prologue (about 80), the `SndClock & 7` test, `enable()`, `outportb(0x20, 0x20)` (an I/O write, about 12 clocks plus bus), the speaker tests, `PlayIt()` when a song is loaded (about 60 clocks on a tick with no event), `SndClock++` (a 32-bit add):
**about 350 clocks = 29 µs at 12 MHz, 44 µs at 8 MHz**, times 145.67 = **4.2-6.4 ms per second: 0.4-0.6% of the CPU**. [estimate]

Music events: each note goes through the FM driver (`sbfd_note_on`, `SB:~150-190`, a software interrupt into a resident driver). An OPL2 write needs 3.3 µs after the address and 23 µs after the data; a note-on is about 10 register writes, so **about 260 µs per note**; a four-note chord and a drum hit in one tick can take 1-1.5 ms of a 6.9 ms interrupt.
A busy song at 15 events a second costs **about 4 ms a second, 0.4%**. [estimate]

Conclusion: **the timer interrupt and the music together cost about 1% of a 286; they do not make a 286 slow.** The copy, the monsters and (with a voice) the disk read do.

## 12.5 Why gameplay was choppy on a 286 (a 1994 memory), in order

1. **The "Simulate" screen path** (above): 16-42 ms of every 54.9 ms tick.
2. **Crowded screens**: 20 monsters is a tick or more on a 286 (above).
3. **Scrolling while crowded**: each scroll step (2.5 ms) plus strips (1.5 ms each) can run up to 70 times a second (one per retrace), more than a tick's worth on a 286 (the port's own note: scrolling steps are lost and the view trails the hero, `slowPc.ts:14-24`).
4. **Digital sound reads** stall one or two ticks per trigger on a hard disk (chapter 10b).
5. **Tick skipping** is what the player sees: when the loop is late the clock jumps; the hero advances once, so the game looks like it runs at half speed in jerks while monsters, rings and births do not.

The port's slow-PC model says a 286-16 with the **hardware** path "keeps full pace" on a still screen (`slowPc.ts:14-24`), matching one player's memory of that machine; a recollection of chop is consistent with a different video setting, a crowded screen, or voices.
**[not yet checked in DOSBox]** all of this in DOSBox with `cycles=fixed 4000` (about a 286-12) and the four conditions toggled one at a time.

## 12.6 Tips

- On a slow PC the cheapest wins are fewer monsters on screen and no re-triggered voices; the hero's own cost is small.
- If a level must run on every machine keep 10 or fewer monsters visible and avoid scrolling through a crowded screen.
- Timing-critical puzzles: use block rings and lifetimes (exact), not hero speed (not exact on a slow PC).
- A judged rhythm window must be at least 2 ticks (110 ms): input resolution is a tick.

## 12.7 Hazards

- The audio starts before the game clock does at scene start.
- Function keys pause the game clock but not the music.
- DOS time runs 10 s a day fast while the game is running.
