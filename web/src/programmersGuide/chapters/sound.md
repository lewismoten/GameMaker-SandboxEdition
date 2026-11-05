# Sound

## Three sound systems that never mix

1. **The PC speaker.** A one-bit square wave on PIT channel 2. Used for the nine game sounds and every effect without a digital file (`PG:4591-4606`).
2. **Digitized .VOC** through the Sound Blaster (`PlaySbVocFile`, `PG:4603`; `SOUND.H:68-74`), chosen when the slot has a name **and** a card exists (`PG:4596`).
3. **Music**: an FM song (`.CMF`) played by the Sound Blaster's Yamaha OPL2 from inside the timer interrupt (`PlayIt`, `PG:4444`).

## The speaker effect: 36 steps

Every effect is a table of `NUMFREQ 36` unsigned 16-bit frequencies (`SOUND.H:11, 30-33`): `freq[36]` = 72 bytes; 30 effects (`LASTSND 30`, `SOUND.H:14`) = 2,160 bytes; plus 30 digital names of 9 bytes (8 characters + NUL, the 8.3 rule without the dot) = 270 bytes; the `.snd` file is **2,430 bytes** (the port's `SND_FILE_SIZE`, `web/packages/engine/src/formats/sound.ts:9`).

The player is four lines in the timer interrupt (`NewTimer`, `PG:4421-4445`):

```
if ((CurSnd<LASTSND) && (AtNote<NUMFREQ)) { sound(snd[CurSnd].freq[AtNote]); AtNote++; }
else if (AtNote==NUMFREQ) { AtNote++; nosound(); }
```

So **one step per timer interrupt**, no tween, no envelope, no volume (a speaker is on or off). A starting sound sets `CurSnd` and `AtNote=0` (`PG:4597-4598`), which **replaces whatever was playing** (that is why one sound at a time: there is a single `CurSnd` variable), and a step of frequency 0 plays `sound(0)`, which on Borland's library is silence in practice (the port treats < 20 Hz as silence, `audio/engine.ts:223`: **[not yet checked in DOSBox]** on DOSBox).

## Step length: where 1/145.6 s comes from

PLAYGAME reprograms PIT channel 0 (`FastTimer`, `PG:4618-4624`): divisor `65535/8 = 8191` (`0x1FFF`, `SOUND.H:34`'s `TIMER1`).
The PIT input clock is 1,193,180 Hz (`SOUND.H:35-36` writes the same number), so:

- timer rate = 1,193,180 / 8,191 = **145.67 interrupts a second** (the source rounds to "146", `HDRCLK`, `SOUND.H:36`; the port's `TICK_RATE` is that exact quotient, `audio/cmfPlayer.ts:12`);
- one step = 1 / 145.67 = **6.86 ms**;
- 36 steps = 36 / 145.67 = **0.247 s**, a quarter of a second (the editor's "quarter second" Fit text, `web/src/editor/editors/sounds/speakerFit.ts:12`).

The step length is **not a free choice for sound.** It is the interrupt rate the program needed anyway: the same interrupt plays the music (OPL2 data in a CMF is timed in "ticks" of 1/146 s, `HDRCLK 146`), and every 8th interrupt also calls the original BIOS handler and bumps `TimerCounter`, the **18.2 Hz game clock** (`PG:4423-4430`, `(SndClock&7)==0`). 8 x 18.2 = 145.6.
So three things share one divisor: the music's resolution, the speaker's step and the game tick. **[inference]** The speaker was given one step per interrupt because the interrupt already existed; the authors did not need a second timer, and a sound editor with a bar per interrupt is the cheapest thing to write.
`DELAY 7` in `SOUND.H:15` is defined and **never used** anywhere in `code/GM` (grep); it appears to be a leftover of an earlier design (**[inference]**: a delay of 7 interrupts per step, 48 ms: 36 x 48 = 1.7 s, a rejected longer sound).

## Why 36 steps

The source does not say. What is known: the arrays are `unsigned int freq[36]` (`SOUND.H:30-33`); the effect is therefore 247 ms; and the editor draws one bar per step (`SOUND.HLP`: "a bar chart, with time on the horizontal axis").
**[inference]** 36 bars at 8 pixels = 288 pixels fits a 320-pixel screen with an 16-pixel margin, which is the likely driver; and 36 is 3 x 12, a round number of bars. The sound editor's source was not released, so the bar width cannot be confirmed. A quarter of a second is also the span of a "blip": longer would make a pickup sound block a fast player's next action since only one sound plays at a time.

## Frequency range

`FREQL 6` and `FREQH 13` (`SOUND.H:12-13`): "Low frequency is 2 to the 6th, **64**" and "2 to the 13th, or **8192**": **7 octaves**, a **log scale** (the web editor reproduces it, `sounds.ts:21-26`, `MINF 64`, `MAXF 8192`). These two macros are never referenced elsewhere in `code/GM` (grep), so they document the sound editor's graph, not PLAYGAME. A bar at the very bottom means "off" (`SOUND.HLP`).
The hardware limits are wider than the editor's:

- Borland's `sound(f)` loads PIT channel 2 with `1,193,180 / f`, a 16-bit divisor: **lowest** = 1,193,180 / 65,535 = **18.2 Hz** (below the range of hearing for a tiny speaker); **highest** = 1,193,180 / 2 = 596 kHz (inaudible). 8,192 Hz = divisor 145.
- The table holds 16-bit values so the _file_ can hold up to 65,535 even though the editor draws to 8,192. A hand-written effect can use 20 Hz to ~10 kHz; PC speakers are weak below ~100 Hz and above ~4 kHz. **[inference]** the editor's range is "what the speaker can usefully play".

## Digital and music: the rules that follow

- **Sounds come from counter changes, not from blocks.** A block has no sound field; `DoBlockTouchChar` chooses one of nine by which counter moved (`PG:3440-3500`, constants `SOUND.H:17-25`) and it sounds only if no sound has already been triggered this touch (`Snded`). Per-key sounds come from the sequence's `sound` byte (`CHAR.H:30`).
- Score/pickup sounds must not cut a voice: since a VOC is separate from the speaker table, a digital slot is not interrupted by a new speaker sound but another `PlaySbVocFile` call stops the first (`SOUNDC.C:164`).
- **Music** must be recorded at 146 ticks/s or PLAYGAME refuses it (`engine/formats/cmf.ts`). OPL2 gives 9 melodic voices or 6 + 5 drums, one note per channel; the song is a per-scene file (an empty slot keeps the previous song's data, `PG:4288`).
- Music and speaker effects can overlap (different hardware); music and VOC share the card, which is why a long VOC is a voice-over.
- A pressed function key (F3 music, F4 sounds, `PG:1422-1430`) toggles whole subsystems, not a channel.

## Tips

- One 247 ms effect per event; make the first 2 steps the "attack" (a loud, high step) because only the first 20-50 ms register.
- Descending steps read as "bad", ascending as "good"; a step of 0 between two tones separates them like a gap in a trill.
- A rapid arpeggio of 8 steps x 4 interrupts repeats of 3 notes sounds like a chord on a single-voice speaker.
- Pickups on the same counter always share one sound; to get a distinct sound for one treasure, give it its own counter number.

---

## How VOC files play, and why they were choppy on a 286

A recollection from 1994: "the VOC files used to be choppy as well as game play on the 286."
What follows finds causes in the source that fit that memory. None of the timing numbers below were measured; the first thing to do is to check them in DOSBox with `cycles=` set to 286-class values.

### 10b.1 What PLAYGAME does to play one VOC (`PlaySbVocFile`, `SC:153-235`)

In order, **inside the game loop, on the tick that triggered the sound**:

1. `DoSound` (`PG:4591-4606`) picks digital when the slot has a name (not empty, not a space) **and** a Sound Blaster was found (`CARDEXIST`); else it picks the speaker table. Only `DoSound` callers decide; there is no queue.
2. If the driver's status word is nonzero (a voice is playing) it calls `StopSound` first (`SC:164`; the driver writes the status word itself, address set at `SC:~118`).
3. Builds the file name: working folder + 8-character name + `.voc` (`SC:167`).
4. **Opens the file, reads the whole of it into memory, closes it** (`SC:168, 204-212`): `open`, `read(handle, buffer, (uint) vocfilesize)`, `close`. The read is synchronous DOS file I/O on the game's own thread. Nothing is streamed.
5. If the buffer from the previous voice is big enough it is reused (no `new`), else it is freed and a bigger one allocated (`SC:176-200`). The buffer **only grows** until `FreeSoundSample` (`SC:244-253`).
6. Checks the first two bytes are "Cr" (`SC:214`), skips the VOC header (the length is byte 20, `SC:222`), and calls the driver's function 6 with the sample address (`SC:227-232`). The driver then plays it by **DMA and interrupt** while the game runs on.

What the driver itself does (single-cycle DMA at 8 bits, splitting at 64 KB physical pages, block-to-block chaining) is **not in `code/`**: `CT-VOICE.DRV` is Creative's binary, loaded as a file (`SC:79-100`). **[not yet checked in DOSBox]** Check it by reading the Creative developer kit documentation if it can be had.

#### Limits that fall out

| Limit                    | Value                                                                                       | Where                                                                                                                                                        | Tag            |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| Voice buffer             | the file size, read as `(uint)`                                                             | `SC:195, 204`                                                                                                                                                | [16-bit] [64K] |
| Largest VOC played whole | **65,535 bytes**                                                                            | a bigger file is read **modulo 65,536** bytes (`read(...,(uint) filesize)`), and `new char[filesize]` in the large model takes a 16-bit size **[inference]** | [16-bit]       |
| Name                     | 8 characters + NUL = 9 bytes                                                                | `SOUND.H`, `SC:167`                                                                                                                                          | [DOS]          |
| Sample rates             | the driver's: an 8-bit mono Sound Blaster plays 4 kHz to about 23 kHz; a 2.0 up to 44.1 kHz | hardware **[estimate]**                                                                                                                                      |                |
| Voices at once           | **1** (a new voice stops the old)                                                           | `SC:164`                                                                                                                                                     | [design]       |
| Where the sample sits    | any conventional-memory address                                                             |                                                                                                                                                              | [DOS]          |

A VOC longer than 65,535 bytes is read only for its first `size mod 65,536` bytes (84,839 gives 19,303; 201,258 gives 4,650), so the rest of the sample is simply missing. **[not yet checked in DOSBox]**. 3 of the 486 `.voc` files on the sample CD are over 64 KB
(`cd/sound/musical/gong.voc` 84,839 bytes, `cd/sound/musical/loonlike.voc` 201,258, `cd/sound/speech/backoffm.voc` 75,731); they are in the sound library, not played by a shipped game, which is consistent with "keep each VOC under 64 KB".

### 10b.2 What the sample CD says a typical VOC is

The header of every `.voc` under `cd/` gives: **486 files**, median **10,967 bytes**, 90th percentile **33,114 bytes**, maximum 201,258.
Sample-rate divisors give: 8,000 Hz for 176 files, 11,111 Hz for 48, 22,222 Hz for 33, 10,000 Hz for 19, 45,455 Hz for 16, 9,009 Hz for 12, 6,897 Hz for 10; 47 files start with a block type other than 1 (silence/repeat blocks first).
So the **median clip is about 1.4 seconds at 8 kHz** and the 90th percentile about 4 seconds.

### 10b.3 What a trigger costs (all [estimate])

The cost is **the read**, then **bus and interrupt time during playback**.

| Step                                | 286 at 8-12 MHz                                                                                      | 386DX-33 / 486 | Source of the figure                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------- |
| Open + directory lookup             | 20-40 ms (1-2 head seeks on a hard disk)                                                             | 12-25 ms       | 1994 IDE drive access time about 12-18 ms |
| Read the median 11 KB               | 25-60 ms (PIO IDE at about 300-500 KB/s on a 286)                                                    | 12-20 ms       | DOS `read` on 8/16-bit PIO                |
| Read a 33 KB clip                   | 70-120 ms                                                                                            | 35-55 ms       | same                                      |
| Same read from a 1.44 MB floppy     | 300-600 ms + 400-500 ms spin-up when idle                                                            | same           | about 30-45 KB/s                          |
| Same read from CD-ROM (2x)          | 70-140 ms + 150-400 ms seek                                                                          | same           | 300 KB/s                                  |
| DMA while playing                   | 8 kHz: about 8,000 byte-steals a second (about 0.8% of bus time); 22 kHz about 2%; 45 kHz about 4.5% | same           | one DMA transfer about 1 microsecond      |
| Sound Blaster IRQ per DMA block end | tens of microseconds per block                                                                       | same           | driver, **[not yet checked in DOSBox]**   |

One game tick is **54.9 ms** (chapter 12). So **one VOC trigger from a hard disk costs one tick, sometimes two, on a 286 and about a third of a tick on a 486**, and from a floppy it freezes the game for half a second or more (the screen stops, the music keeps going because it is driven by the timer interrupt, chapter 12).

### 10b.4 Why it was choppy: likely causes, most likely first

1. **The read stalls the game.** The main loop calls the read itself, so every digital sound freezes the picture for the read time. On a 286 with a hard disk that is one dropped or skipped tick per sound (the loop then jumps its clock forward, `PG:1453-1455`); with several sounds in a second the game visibly stutters. This is the best fit for "game play was choppy" **when voices are used**.
2. **The same file is re-read on every trigger.** The buffer is reused but `read` runs every time (`SC:204`). A sound that is re-triggered each tick (below) costs a disk read each tick, which can take more than a whole tick on a 286, so the loop falls behind permanently. DOS disk caches (a 1994 SmartDrive) hide this for repeated files on a 386 or better, and on a 286 with little RAM often did not exist. **[inference]**
3. **A repeated touch re-triggers the voice every tick.** A block that scores or heals plays its sound **every tick while the hero overlaps it** (chapter 8: `DoBlockTouchChar` runs each tick, `PG:3437-3506`, and each call that changes score or hit points calls `DoSound`). `PlaySbVocFile` first **stops** the voice that is playing (`SC:164`), so a sound longer than one tick (54.9 ms) is cut and restarted about 18 times a second: it **chops**. It happens on any CPU. **[inference] [not yet checked in DOSBox]** with a score block of 1 point and a 1-second voice.
4. **A late tick means a late sound.** A voice is started inside `movechars`/`CheckTouch`, which only run once per game tick (`PG:1454-1525`). On a slow PC the tick comes late, so the sound starts late and uneven; a series of quick pickups plays as a series of stops and restarts.
5. **Disk read with interrupts masked.** A floppy or PIO IDE read may keep interrupts off for milliseconds (BIOS routine dependent). The PIT would then drop timer interrupts (the PIC remembers only one pending) so the **clock loses time**, the music tempo drifts and the next tick is late. **[inference] [not yet checked in DOSBox]** a worry rather than a finding.
6. **DMA page boundary.** An 8-bit DMA transfer cannot cross a 64 KB physical page boundary, and the voice buffer comes from the program's heap at an arbitrary address. A sample of N bytes has about N / 65,536 chance of straddling one (11 KB: 17%; 33 KB: 50%). A driver that handles it must split the transfer, which can leave a gap of an interrupt's latency in the middle of the sample. How `CT-VOICE.DRV` handles it is not in the source. **[not yet checked in DOSBox]**
7. **Truncated samples.** A VOC over 64 KB plays only part of itself (above).
8. **Slow playback rates are noisy, not choppy.** 8 kHz is the most common rate on the CD (176 of 486 files); it has an audible 4 kHz limit and no filtering on the early cards. That sounds "rough", not "chopped".

Causes checked and **ruled out**: DMA bus stealing is only 1-5% of the bus; the 145.67 Hz timer interrupt costs well under 1% of a 286 (below); the music interrupt is a few percent at worst (chapter 12). None of them cuts a sample.

### 10b.5 What a game maker can do (all of it works on DOS too)

- Keep each VOC under 64 KB (and the median under 12 KB: one second at 11 kHz). Prefer 11,111 Hz or 8,000 Hz over 22 kHz when a clip is spoken.
- **Never** put a digital sound on a block that is touched for several ticks (a healing floor, a score trail). Put it on a pickup that disappears (`touchbl` to an empty block) or on a sequence key.
- Put long voices in cut scenes and on scene changes; the stall does not matter between scenes.
- Use the speaker table for repeated game sounds and digital sound for voice (chapter 10: one name per slot decides).
- Leave a gap of at least two ticks between two digital sounds that should both be heard.
