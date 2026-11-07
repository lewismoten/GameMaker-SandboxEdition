# PLAYGAME music timing on a 286: what drives it, and what could stall it

Written by Claude Opus 5.5 running in Hermes Agent, Thursday 2026-11-05. **Static analysis only.** Nothing here was run in DOSBox or on a 286. Every timing number is an **[estimate]**, worked out from the source, the shipped EXE and period hardware figures. This is the dated prediction record, preserved for comparison with the [subsequent DOSBox-X measurements](playgame-music-286-results.md) on `feature/playgame-286-measurements`. That report lands with the measurement branch; until integration, read it there. Section 5 lists the original predictions. The measurements distinguish audible silence from stopped note progression: release tails or sustained notes can bridge a musical hold. Numerical and disassembly claims below remain static hypotheses unless the measurement report validates them.

Measurement cross-reference and the distinction between audible silence and stopped note progression clarified with OpenAI Codex (GPT-6), directed by Lewis Moten, Friday 2026-11-06. The original author and predictions remain credited above.

Sources: `PG:n` is `code/GM/PLAYGAME.C` line n, and `SB:n` is `code/GM/SBMUSIC.C` line n. `EXE 0x…` is a **file offset** in `cd/gm/playgame.exe` (163,130 bytes, SHA-256 `49ed1c78…65d4b`, load image at 0x2000). `code/GM/PLAYGAME.MAP` comes from a different build, so its segment addresses do not match the shipped EXE. Use the file offsets below instead.

## 1. Answer

- **The music is advanced by the timer interrupt, not by the game loop.** PLAYGAME reprograms PIT channel 0 to 145.67 Hz and hooks INT 8. Every interrupt calls `PlayIt()`, which steps the CMF song by one tick. The game loop never calls `PlayIt`, so a slow game loop cannot slow the music.
- **Prediction for a 286 (6, 8 or 12 MHz): music inside a scene keeps tempo.** The game slows down when the screen is crowded, when "Simulate" video is on, or while a VOC loads. The music stays at 145.67 CMF ticks per second through all of these.
- **Original prediction: note progression stops at each scene change, then the song restarts.** Audible silence is not guaranteed; the subsequent measurements distinguish PCM silence from a musical hold with residual sound. `StopSong()` runs at the end of each scene (PG:1532), and the next song starts only once `loadscene()` has loaded it (PG:4288-4289). The gap covers the fade-out plus the next scene's file loads, so it **gets longer on a 286**. The song always starts again from the beginning.
- **A small tempo loss happens on every CPU.** On some songs the busiest tick writes more than 100 OPL registers. Creative's FM library spaces those writes with a delay loop calibrated to wall-clock time, so a tick like that takes 7–14 ms against a 6.865 ms interrupt period. Interrupt ticks that arrive during the burst are lost to the music. Across the CD's 52 readable songs this loses at most about 0.5% of a song loop. A 286 loses at most 0.2 percentage points more than a 486-66, because the delay is the same on both and only the CPU overhead differs.
- **Four side findings:**
  - a joystick read with interrupts off (up to 768 polling loops, every game tick, only when the joystick is on);
  - a stop/start race that can leave one FM note sounding through a scene change;
  - CMF song data over 64 KB is read only modulo 64 KB. This affects `gmdoingy.cmf`, Donut's "Wood Castle".
  - the F3 music toggle restarts the song.

## 2. The timing mechanism, with evidence

| What | Source | Shipped EXE | Detail |
| --- | --- | --- | --- |
| Hook INT 8 | `DoGame`, PG:877-881 | — | `OldTimer = getvect(8); setvect(8, NewTimer); FastTimer();` before the title song starts (PG:884). Undone at PG:1014-1016. |
| PIT rate | `FastTimer`, PG:4618-4625 | 0x14F10 | `out 43h,36h; out 40h,FFh; out 40h,1Fh`: divisor 0x1FFF = 8,191, so 1,193,182 / 8,191 = **145.67 Hz** (period **6.865 ms**). `SlowTimer` (0x14EFA) puts back 0xFFFF. |
| Song clock check | `SOUND.H:40-43`, SB:79 | — | A CMF plays only if its header `clock_ticks` = 146 (`HDRCLK`). All 184 `.cmf` files on the CD say 146, so **1 CMF tick = 1 interrupt**. |
| Interrupt handler | `NewTimer`, PG:4421-4446 | 0x14A1A-0x14AAC | `test SndClock,7`. On 1 tick in 8 it does `pushf; call far [OldTimer]` (the BIOS handler sends the EOI). On the other 7 it does `sti; out 20h,20h`. Then the PC-speaker step (`sound()`/`nosound()`), then `if (SongInfo == 3) PlayIt()` (0x14A8B-0x14A94), then `SndClock++`. |
| Song stepper | `PlayIt`, SB:135-205 | 0x1CBA0-0x1CD8B | Decrements a 32-bit `wait`. While it is 0, it dispatches each event and reads the next delta (`getpaws`, SB:207-223, 0x1CD8C). Note-on/off, program change, mode 0x67 and end of song (`sbfd_music_off`, offset = 0: the song loops) are handled. Aftertouch, pitch bend and SysEx are skipped. |
| FM driver | Creative "FM-Music Functions … 1990", **linked in** (`sbcl.lib`) | string at 0x20440; stubs 0x203A7-0x20435 | No resident driver and no software interrupt. `sbfd_note_on` (0x203CC) builds a MIDI status byte and far-calls the library's event dispatcher (0x20CA4). |
| Library busy flag | — | 0x20CB1 / 0x20C61 | Both dispatchers do `pushf; cli`, test a busy byte, set it, then `popf`. A call made **while the library is busy returns 0xFFFF and does nothing**, so the event is dropped. |
| OPL register write | — | 0x207A9 | `out addr; delay d63 loops; out data; delay 7×d63 loops`. |
| Delay calibration | run by `sbfd_init` (0x20984) from `SoundCard()` (PG:649, 716), before `DoGame` | 0x20704-0x20773 | Hooks INT 8 temporarily, unmasks only IRQ0 and sets the PIT to 7,000 counts (5.866 ms). It counts loops over one period and sets `d63 = (1.5 × loops) >> 10`. Then it restores the PIT divisor to 0 (65,536). Because this runs before `FastTimer`, it does not undo the 145.67 Hz rate. |

The same code is in the 3.0 distribution player and in an older 2.04 player. Byte signatures, with relocated data offsets wildcarded:

| EXE | `NewTimer` | `PlayIt` | OPL write |
| --- | --- | --- | --- |
| `cd/gm/xferplay.exe` (renamed into every 3.0 game) | 0x141B8 | 0x1C330 | 0x1FF3C |
| `cd/sharware/orb/orb.exe` (2.04) | 0xD1D6 | 0x142C2 | 0x15E5C |

**Two clocks, one source.** The game tick (`TimerCounter`, 18.2 Hz) is every 8th interrupt (PG:4423-4428). The main loop polls it (PG:1453). The music (`PlayIt`) runs **inside** the interrupt. A game loop that is late **skips** game ticks (PG:1455). It never delays a music tick.

**Interrupt state while `PlayIt` runs (from the EXE):**

- **7 ticks in 8:** interrupts on and EOI already sent. A long `PlayIt` can be interrupted by the next IRQ0, so `NewTimer` nests.
- **1 tick in 8:** the BIOS handler returns with `iret` to the flags `NewTimer` pushed with `pushf` inside the interrupt (IF = 0). `PlayIt` runs with **interrupts off**. Any further IRQ0 waits as one latched request in the PIC, and any after that are lost.

## 3. What one music tick costs

### OPL writes: about 70 µs each, on any CPU

The delay loop and the calibration loop are the same shape (`nop; inc/dec cx; or; jcc`), so each write's delay is 8 × d63 loops ≈ 8 × 1.5/1,024 × 5,866 µs ≈ **60–69 µs of real time**, rounded down by the integer `d63`. Add two ISA `OUT`s and the call overhead:

| CPU | loops per 5.866 ms | d63 | delay | **µs per OPL write** |
| --- | ---: | ---: | ---: | ---: |
| 286-6 (15 clocks/loop) | 2,346 | 3 | 60 µs | **≈ 74** |
| 286-8 | 3,128 | 4 | 60 µs | **≈ 71** |
| 286-12 | 4,692 | 6 | 60 µs | **≈ 68** |
| 486DX2-66 (≈ 6 clocks/loop) | 64,526 | 94 | 68 µs | **≈ 71** |

The music's dominant cost is therefore **the same on a 286 as on a 486**. DOSBox runs the same calibration against its emulated PIT, so it should land in the same range. **[verify]**

### Writes per event (library code)

| Event | OPL writes | Library address |
| --- | ---: | --- |
| Note on (melody) | 3 (level, A0, B0) | 0x20A62 |
| … plus instrument reload when the chosen voice last played another channel | +11 | 0x2084B |
| … plus voice steal when all voices sound | +2 | 0x20904 |
| Note off of a sounding voice | 2 | 0x209EE |
| Rhythm-mode drum on / off (channels 11-15) | 4 / 1 | 0x20B13 / 0x20A1E |
| Program change | 11 × voices of that channel still sounding | 0x20BE6 |
| Mode change (controller 0x67) | 1 | 0x20BB7 |
| All notes off (`StopIt`, under `cli`) | 10 | 0x207CF |
| Load instrument table (`SetInstTable`, once per song load) | 99 | 0x207EF |

Voice allocation (0x20904, nine melody voices) prefers, in order:

1. a released voice that last played the same channel;
2. a never-used voice;
3. any released voice;
4. the oldest sounding voice.

### Budget per interrupt on an IBM AT 286

One period is 6.865 ms = **41,190 clocks at 6 MHz, 54,920 at 8 MHz and 82,380 at 12 MHz**.

- **Quiet tick:** `NewTimer` plus a `PlayIt` with no event is about 350 clocks (programmer's-guide estimate, re-derived from the disassembly). That is 58 / 44 / 29 µs, **under 1%** of the period. Every 8th tick adds the BIOS handler.
- **Event tick:** about 600 clocks of CPU work per event (`PlayIt` dispatch, far call, dispatcher, voice search) **[estimate]**, plus about 70 µs per OPL write.

I simulated the allocator over every song on the CD (§7). The heaviest single tick per song, at 8 MHz:

| Song (used by) | Loop | Busiest tick | 286-6 | 286-8 | 286-12 | 486-66 | Ticks over 6.865 ms per loop (286-8 / 486-66) |
| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| `gentle.cmf` (Donut menu) | 184 s | 72 writes, 16 events | 7.0 ms | 6.3 ms | 5.7 ms | 5.2 ms | 0 / 0 |
| `egyption.cmf` (Donut "Sand Castle") | 191 s | 122 writes, 20 events | 11.1 ms | 10.2 ms | 9.3 ms | 8.7 ms | 10 / 8 (incl. song start, 8.6 ms) |
| `gmlost.cmf` (Donut "Water Castle") | 196 s | 122 writes, 24 events | 11.5 ms | 10.5 ms | 9.5 ms | 8.7 ms | 5 / 2 |
| `gmsong2.cmf` (Glub 1 and 2) | 115 s | 126 writes, 25 events | 11.8 ms | 10.8 ms | 9.8 ms | — | 6 / — (song start 9.5 ms) |
| `gmspace.cmf` (Orb first level) | 117 s | 151 writes, 30 events | 14.2 ms | 13.0 ms | 11.8 ms | — | 9 / — (song start 11.0 ms) |
| `spooky.cmf` (Donut "Stone Castle") | 210 s | 47 writes | 4.0 ms | 3.7 ms | 3.5 ms | 3.4 ms | 0 / 0 |

Across the 52 distinct readable songs, the busiest tick exceeds one period in 33 songs at 6 MHz, 25 at 8 MHz, 22 at 12 MHz and 19 at 486-66. The worst song loses about **0.55% of its loop at 6 MHz and 0.34% at 486-66**.

## 4. What can pause or slow the music

Ranked by how likely it is to be heard.

1. **Scene change: note progression stops, then the song restarts** (by design, every CPU, **predicted longer on a 286**; sustained sound may bridge the gap). `playscene` ends with `StopSong()` (PG:1532), which does all-notes-off, frees the song and clears `SONGLOADED`. Then comes `FadeAllTo(Black)`, which is CPU-bound palette arithmetic, then the return to `play()`, then the next `playscene`. Its `loadscene` reads the palette, map, blocks, monsters, character, sounds and song, and calls `InitMusic`, which loads the 99-write instrument table. Music starts at `SongInfo |= SONGLOADED` (PG:4289). That is *before* `drawmap` and the fade-in (PG:1397-1399), so on a slow PC the first bars play over a black or fading screen. The same applies to the title, menu, storyline, game-won and game-lost songs: `PlaySong` (PG:759-773) stops the old song first.
2. **F3 toggles the music** (PG:1432-1437). Turning it off calls `StopIt` (offset = 0). Turning it back on resumes **from the start of the song**, not from where it stopped.
3. **Burst overrun: lost ticks** (every CPU, a little worse on a slow 286; §3).
   - **7 ticks in 8:** the nested `NewTimer` finds `wait == 0` and decrements it to 0xFFFFFFFF. The outer `PlayIt` then overwrites `wait` (SB:203). That tick is lost to the music, though `SndClock` still counts it.
   - **1 tick in 8:** interrupts are off. One IRQ0 is latched and later IRQ0s are lost. Bursts longer than 13.7 ms also cost game and DOS clock ticks. Only the busiest ticks of `gmspace.cmf` (14.2 ms at 6 MHz) and Parsec's `parsec_t.cmf` (14.7 ms at 6 MHz) come near that.
   - **What you hear:** a lag of 6.9 ms per lost tick, at a fixed point in the song, never a pause.
4. **Wood Castle: song over 64 KB** (every CPU; the stall part scales with CPU speed). `load_file` calls `fread(sbmusic, 1, MusicSize, fp)` with a 16-bit size (SB:100; EXE 0x1CB17 pushes one word). Only `77,559 mod 65,536 = 12,023` bytes of `gmdoingy.cmf` are read, and the rest of the buffer is whatever the heap held. `PlayIt` addresses the song with a 16-bit offset (`les bx,[sbmusic]; add bx,[offset]`, EXE 0x1CBC9). After about **42.8 s** (3,085 events, tick 6,235) it walks into unread memory. **[inference]** If that memory is zeros, each three-byte run decodes as a zero-delta note-off that matches no voice. One interrupt could then process thousands of events, with no OPL writes but about 600 clocks each: roughly 1.8 s at 8 MHz with interrupts nested or off, against about 0.2 s on a 486. Other heap contents give random notes or a `sbfd_reset` restart. Only this file on the CD is over 64 KB.
5. **Joystick read with interrupts off** (scales with CPU speed). `ReadJoyStick` (JSTICKA.ASM:56-78; EXE 0x1D290-0x1D2B5) runs `cli`, then polls port 0x201 up to 0x300 = 768 times. `HandleJStick` calls it once per game tick when the joystick is on (PG:4378, enabled by F8 or after calibration, PG:1441, 2099).
   - With a stick plugged in, the loop ends when the axes time out (about 1.1 ms or less).
   - With a game port and **no stick**, the axis bits never fall. The full 768 loops take about 50 clocks each: **6.4–7 ms at 6 MHz, 4.8 ms at 8 MHz, 3.2 ms at 12 MHz** with interrupts off.
   - Below one period this only shifts that tick (jitter). At 6 MHz it can cross the period and lose a tick each game tick, about one tick in 8: a 12% slowdown. **[estimate; real hardware only]**
6. **Stop/start race leaves a stuck note** (every CPU; the window is longer on a 286). `StopSong` calls `StopIt()` (all notes off, offset = 0), then `sbfreemem()`, then clears `SONGLOADED` (PG:749-757). An interrupt between `StopIt` and the clear runs `PlayIt` with offset 0 and plays the song's first-tick note-ons from freed memory. Nothing turns them off: the next `SetInstTable` reloads instruments but writes no key-off. One FM note can then drone through the scene change until the next song reuses that voice. The window is the two `farfree` calls, a few hundred to a few thousand clocks. That gives roughly **1–4% of scene changes on a 286 and well under 1% on a 486**. **[inference]**
7. **Library busy (event dropped).** If the main program is inside the FM library when the interrupt calls it, the event is skipped. A dropped note-off leaves a note hanging. In the shipped code the main program calls the library only while no song is loaded or right before it stops one, so I found no in-scene path. **[inference]**

**Ruled out as music stalls (on the evidence):**

- **Drawing, scrolling, palette fades, GIF and FLI decoding, VOC loads:** these are main-loop work with no `cli`. The one `cli` in `SVGAA.ASM` (line 443) is commented out, and `FLI.C` does not touch the PIT or INT 8. The game slows; the music does not.
- **`DoFunKy` (function-key screens):** its `disable()` sections are three statements long (PG:1583-1587, 1660-1664, 1824-1829). Music keeps playing through help, save and load screens.
- **`sndblast.drv` (CT-VOICE):** it contains no `out 43h/40h` and no INT 21h, so it does not reprogram the PIT. Its `cli` sections are short and were not timed.
- **Disk I/O on a real AT:** BIOS reads wait for the disk interrupt with interrupts on. They might delay IRQ0 by less than 1 ms per sector **[inference; verify on hardware]**. DOSBox handles disk and DOS calls instantly in emulated time, so **DOSBox cannot show disk-caused stalls**.

## 5. Falsifiable predictions

| # | Prediction | Falsified if |
| --- | --- | --- |
| P1 | In-scene tempo is 145.67 CMF ticks/s (6.865 ms per tick) within 0.6% at every CPU speed. It does not change with game load: same song, quiet screen vs. crowded screen vs. "Simulate" video. | Tempo differs by more than 1% between a 286-class and a fast run, or tracks the game-tick rate. |
| P2 | Tempo loss appears as **steps of 6.865 ms** at specific song ticks (the busy ticks in §3, such as `egyption.cmf` ticks 0, 1924, 3844, 5764 …), never as a smooth slow-down. The total per loop is within about 2× of §3's estimate at each speed. A slow setting loses at most about 0.2 percentage points more than a fast one. | Smooth drift, or steps somewhere else, or a large difference between speeds. |
| P3 | At each scene change the music stops, then restarts **from the beginning**. The predicted gap in note progression grows as emulated CPU speed falls; this need not be audible silence. In DOSBox the gap is mostly CPU time (fade arithmetic, file decoding), not disk time. | The music continues across the scene change, resumes mid-song, or the gap does not depend on CPU speed. |
| P4 | F3 off then F3 on restarts the song from the top. | It resumes where it stopped. |
| P5 | Donut "Wood Castle" (`gmdoingy.cmf`): the music is correct for about 42.8 s, then turns to noise, silence or a restart. If the unread memory is zero, a freeze of the whole game (keyboard dead) follows. The freeze is several times longer at 286 speed than at fast speed. | The full 4.5-minute song plays correctly. |
| P6 | Over many scene changes, a few show one FM note held through the black gap. They are more frequent at 286 speed. | No held note in about 200 or more scene changes at 286 speed. A null result here is weak evidence, since the window is small. |

## 6. Test scenarios for the measurement task

Run each at a 286 setting and at a fast setting. For DOSBox: `cycles=fixed 3000` for about a 286-12 and `fixed 2000` for about a 286-8 **[verify the mapping]**, plus `cycles=max`. Use `sbtype=sb2` or `sb1`, `oplmode=opl2`, `BLASTER=A220 I7 D1`, and PLAYGAME configured for Sound Blaster (`config.dat`). PLAYGAME plays music only when `SoundCard()` finds the FM chip.

| # | Game / scene | Action | Expected symptom | Tests |
| --- | --- | --- | --- | --- |
| S1 | Donut (`cd/gameware/donut`), menu | Leave the menu for 60 s | Steady `gentle.cmf`, no tick over the period | P1 baseline |
| S2 | Donut, "Sand Castle" (`egyption.cmf`) | Stand still for 60 s, then walk into a crowd of monsters or scroll for 60 s | Same tempo in both halves. Steps of 6.865 ms at ticks 1924, 3844, 5764 | P1, P2 |
| S3 | Any game, title/menu with a GIF | Watch the GIF decode while the song plays (it is slow at 286 speed) | Music steady during decoding | P1 |
| S4 | Donut or Glub, scene change (Glub 1 → Glub 2 both use `gmsong2.cmf`) | Finish a level | Note progression stops, then the same song starts from the top; residual sound may continue. Predicted longer gap at 286 speed | P3 |
| S5 | Any scene with music | F3, wait 5 s, F3 | Song restarts from the top | P4 |
| S6 | Donut, "Wood Castle" (`gmdoingy.cmf`) | Play or idle for 90 s | Music breaks at about 42.8 s; possible freeze | P5 |
| S7 | Scripted loop of scene changes (die/restart or a short link) | 200 or more changes at 286 speed | Occasional held note in the gap | P6 |
| S8 | Joystick (only if the harness can emulate a game port with no stick) | F8 on, play 60 s at 6 MHz | Tempo about 12% slow while the joystick is on | §4.5 (real hardware is the better test) |
| S9 | A scene with many digital sounds (VOC) | Trigger pickups | Game stutters; music does not | P1 (rules out VOC as a music stall) |

## 7. How to detect each symptom in a trace

**Best trace: an OPL register log.** Use DOSBox's raw OPL capture (`.dro`, Ctrl+Alt+F7 in DOSBox 0.74; DOSBox Staging and DOSBox-X have equivalents **[verify which the harness uses]**). It records every register write with millisecond delays. An audio WAV works as a backup with onset detection, but it is coarser.

- **Expected timeline.** Walk the CMF the way `PlayIt` does: skip the leading delta, and an end of song restarts it. The result is a list of (tick, channel, key) note-ons. Key-on in the log is a write to B0-B8 with bit 5 rising.
- **Tempo (P1).** Pair logged key-ons with expected ones in order, then fit `time = a + b·tick`. Expect `b ≈ 6.865 ms`. A frame-driven player would instead give `b` proportional to the game tick rate, so it would differ between quiet and crowded runs and between CPU speeds.
- **Lost ticks (P2).** The residuals of that fit step up by multiples of 6.865 ms. Each step should follow a write burst lasting longer than about 6.9 ms in the log: count the writes between two key-on groups.
- **Scene-change gap (P3).** Look for the all-notes-off signature: BD, then B8, B7 … B0 written with key-on cleared, 10 writes back to back. Next comes the instrument-table load: 99 writes to 20-35h, 40-55h, 60-75h, 80-95h, E0-F5h and C0-C8h, about 7 ms. Then the first key-on. OPL gap = all-notes-off to first key-on; measure PCM RMS separately before calling it silence. "Restarts from the top" means the first key-ons match tick 0 of the song.
- **F3 (P4).** Same signatures without the instrument-table load. Then the first key-ons match tick 0.
- **Wood Castle (P5).** Key-ons stop matching the expected list after tick 6,235. A freeze shows as a long stretch with no writes, while the screen (screenshots) and keyboard also stop.
- **Stuck note (P6).** A voice keyed on after the all-notes-off signature and before the next instrument-table load, or still keyed on across that load.
- **Joystick (S8).** The tempo slope `b` grows by about 1/8 while the joystick is on.

**Game-speed trace, for contrast.** Use screenshots at fixed emulated intervals, or a debugger watch on `TimerCounter` at DS:1974h in the shipped EXE (`NewTimer` adds to it at 0x14A36). Showing the game slow down while `b` stays at 6.865 ms is the core result.

## 8. Limits of this analysis

- The per-tick costs depend on my reading of the library's voice allocator and on cycle estimates of about 600 clocks per event and about 15 clocks per delay loop. They are estimates, good to about ±30%. The simulation does not model released-voice timing exactly.
- How the BIOS handler leaves the interrupt flag comes from the `pushf; call far` sequence. A TSR chained on INT 8 or INT 1Ch would add its own time on 1 tick in 8.
- I did not time `sndblast.drv`'s interrupt handler or the keyboard handler.
- Real-hardware effects (disk BIOS, ISA wait states, game port timing) cannot be measured in DOSBox.
- The scripts used here (a CMF walker with the allocator model, and a `.gam` scene-to-song lister) were scratch tools. They are attached to the task card and not committed.
