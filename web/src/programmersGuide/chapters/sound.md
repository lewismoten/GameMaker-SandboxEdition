# Sound

## Three sound systems that never mix

1. **The PC speaker.** A one-bit square wave on PIT channel 2. Used for the nine game sounds and every effect without a digital file (`PG:4591-4606`).
2. **Digitized .VOC** through the Sound Blaster (`PlaySbVocFile`, `PG:4603`; `SOUND.H:64-69`), chosen when the slot has a name **and** a card exists (`PG:4596`).
3. **Music**: an FM song (`.CMF`) played by the Sound Blaster's Yamaha OPL2 from inside the timer interrupt (`PlayIt`, `PG:4444`).

## The speaker effect: 36 steps

Every effect is a table of `NUMFREQ 36` unsigned 16-bit frequencies (`SOUND.H:10`, `SOUND.H:26-29`): `freq[36]` = 72 bytes; 30 effects (`LASTSND 30`, `SOUND.H:13`) = 2,160 bytes; plus 30 digital names of 9 bytes (8 characters + NUL, the 8.3 rule without the dot) = 270 bytes; the `.snd` file is **2,430 bytes** (the port's `SND_FILE_SIZE`, `web/packages/engine/src/formats/sound.ts:9`).

The player is four lines in the timer interrupt (`NewTimer`, `PG:4421-4445`):

```
if ((CurSnd<LASTSND) && (AtNote<NUMFREQ)) { sound(snd[CurSnd].freq[AtNote]); AtNote++; }
else if (AtNote==NUMFREQ) { AtNote++; nosound(); }
```

So **one step per timer interrupt**, no tween, no envelope, no volume (a speaker is on or off). A starting sound sets `CurSnd` and `AtNote=0` (`PG:4599-4600`), which **replaces whatever was playing** (there is a single `CurSnd` variable). A zero step is passed to Borland's `sound(0)` (`PG:4438-4443`); its library behavior remains **[not yet checked in DOSBox]**. The editor explicitly uses `nosound()` for zero (`SNDEDIT.C:314-323`), and the web mutes frequencies below 20 Hz (`engine/audio/engine.ts:210-226`); neither proves what that DOS library call does.

## Step length: where 1/145.6 s comes from

PLAYGAME reprograms PIT channel 0 (`FastTimer`, `PG:4618-4624`): divisor `65535/8 = 8191` (`0x1FFF`, `SOUND.H:42`'s `TIMER1`).
The PIT input clock is 1,193,180 Hz (`SOUND.H:43-44` writes the same number), so:

- timer rate = 1,193,180 / 8,191 = **145.67 interrupts a second** (the source rounds to "146", `HDRCLK`, `SOUND.H:43`; the port's `TICK_RATE` is that exact quotient, `audio/cmfPlayer.ts:12`);
- one step = 1 / 145.67 = **6.86 ms**;
- 36 steps = 36 / 145.67 = **0.247 s**, a quarter of a second (the editor's "quarter second" Fit text, `web/src/editor/editors/sounds/speakerFit.ts:12`).

The step length is **not a free choice for sound.** It is the interrupt rate the program needed anyway: the same interrupt plays the music (OPL2 data in a CMF is timed in "ticks" of 1/146 s, `HDRCLK 146`), and every 8th interrupt also calls the original BIOS handler and bumps `TimerCounter`, the **18.2 Hz game clock** (`PG:4423-4430`, `(SndClock&7)==0`). 8 x 18.2 = 145.6.
So three things share one divisor: the music's resolution, the speaker's step and the game tick (`PG:4421-4445`). **[inference]** reusing the interrupt may have been convenient; the source does not establish which subsystem came first or why the authors chose it.
`DELAY 7` is used by the released sound editor: `PlaySound` calls `delay(DELAY)` once per preview step (`SOUND.H:14`, `SNDEDIT.C:306-324`). That is a nominal **7 ms**, not seven player interrupts: 36 steps give 252 ms before overhead. PLAYGAME uses its timer interrupt instead (`PG:4438-4445`).

## Why 36 steps

The source does not say why 36. It does show the layout: `SNDEDIT.C:28-38` sets `LX=19` and `RX=LX+4*NUMFREQ`; the 36 bars use **four-pixel pitch**, a **144-pixel graph**, with three face pixels and one shaded edge (`SNDEDIT.C:403-414`). The arrays are `unsigned int freq[36]` (`SOUND.H:26-29`), giving about 247 ms in PLAYGAME. **[inference]** screen layout or the short duration may have influenced the choice, but neither historical motive is documented. A new effect replaces the old one (`PG:4591-4604`); the old sound does not block the player's next action.

## Frequency range

`FREQL 6` and `FREQH 13` (`SOUND.H:11-12`) define the sound editor's **log scale**: `SNDEDIT.C:418-428` generates `2^(6+j/25)` for `j=0..174`, stored as unsigned integers. The bottom is **64 Hz**; the top sample is about **7,968 Hz**, below the exclusive 8,192 Hz endpoint. The graph uses those samples (`SNDEDIT.C:250-255`); the separate strip below it sets a bar to zero (`SNDEDIT.C:241-247`). These are editor controls, not PLAYGAME frequency validation.
The table is not restricted to the editor's graph. The hardware/library figures below are **[estimate]**, not verified Borland implementation or speaker measurements:

- Borland's `sound(f)` loads PIT channel 2 with `1,193,180 / f`, a 16-bit divisor: **lowest** = 1,193,180 / 65,535 = **18.2 Hz** (below the range of hearing for a tiny speaker); **highest** = 1,193,180 / 2 = 596 kHz (inaudible). 8,192 Hz = divisor 145.
- The table holds 16-bit values so the _file_ can hold up to 65,535 even though the editor draws to 8,192. A hand-written effect can use 20 Hz to ~10 kHz; PC speakers are weak below ~100 Hz and above ~4 kHz. **[inference]** the editor's range is "what the speaker can usefully play".

## Digital and music: the rules that follow

- **Sounds come from counter changes, not from blocks.** A block has no sound field; `DoBlockTouchChar` chooses one of nine by which counter moved (`PG:3440-3500`, constants `SOUND.H:17-25`) and it sounds only if no sound has already been triggered this touch (`Snded`). Per-key sounds come from the sequence's `sound` byte (`CHAR.H:30`).
- Score/pickup sounds must not cut a voice: since a VOC is separate from the speaker table, a digital slot is not interrupted by a new speaker sound but another `PlaySbVocFile` call stops the first (`SOUNDC.C:164`).
- **Music** must be recorded at 146 ticks/s or PLAYGAME refuses it (`SBMUSIC.C:79-84`; the web separately checks `engine/audio/cmfLoad.ts:18-24`). OPL2 gives 9 melodic voices or 6 + 5 drums, one note per channel; the song is a per-scene file (an empty slot keeps the previous song's data, `PG:4288`).
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
4. **Opens the file, reads into the voice buffer, closes it** (`SC:168`, `SC:184-212`): `open`, `read(handle, buffer, (uint) vocfilesize)`, `close`. The read is synchronous DOS file I/O on the game's own thread, not streaming. The request uses retained buffer capacity, narrowed to `uint`, and only checks for -1, not a short read; "whole file" is not guaranteed (limits below).
5. If the buffer from the previous voice is big enough it is reused (no `new`), else it is freed and a bigger one allocated (`SC:176-200`). The buffer **only grows** until `FreeSoundSample` (`SC:244-253`).
6. Checks the first two bytes are "Cr" (`SC:214`), skips the VOC header using byte 20 (`SC:221-224`), and calls the driver's function 6 with the sample address (`SC:227-231`). The wrapper returns; the driver's playback internals are not shown here.

The wrapper loads the configured `cs->SndDrvr` file (`SC:75-105`); detection defaults it to **`sndblast.drv`** (`SC:34-45`), not a hard-coded `CT-VOICE.DRV`. Single-cycle DMA, 64 KB page splitting and block chaining are **unverified driver internals**, not established by the start/stop interface. **[not yet checked in DOSBox]** Exact-driver documentation or tracing is needed.

#### Limits that fall out

| Limit                 | Value                                                                                       | Where                                                                                                                                                                               | Tag            |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Voice buffer          | retained allocation capacity, requested as `(uint)`                                         | `SC:184-204`                                                                                                                                                                        | [16-bit] [64K] |
| VOC size hazard       | **keep under 64 KB; no safe whole-play maximum proved here**                                | retained `ulongi vocfilesize` is cast to `uint` for `read` (`SC:24`, `SC:184-209`); intended 16-bit count wraps at 65,536; allocation/compiler/driver limits remain **[inference]** | [16-bit]       |
| Name                  | 8 characters + NUL = 9 bytes                                                                | `SOUND.H`, `SC:167`                                                                                                                                                                 | [DOS]          |
| Sample rates          | the driver's: an 8-bit mono Sound Blaster plays 4 kHz to about 23 kHz; a 2.0 up to 44.1 kHz | hardware **[estimate]**                                                                                                                                                             |                |
| Voices at once        | **1** (a new voice stops the old)                                                           | `SC:164`                                                                                                                                                                            | [design]       |
| Where the sample sits | any conventional-memory address                                                             |                                                                                                                                                                                     | [DOS]          |

A new allocation uses file size for the retained capacity; a reused buffer keeps the older, larger capacity (`SC:184-204`). The read count is **that capacity** cast to `uint`, and short reads leave bytes unchecked. This is not a promise of harmless truncated playback: allocation failure, stale bytes and driver handling can change the result. Oversized-file playback is **[not yet checked in DOSBox]**. 3 of the 486 `.voc` files on the sample CD are over 64 KB
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

One nominal game tick is **54.9 ms** (chapter 12). Under the table's **[estimate]** assumptions a hard-disk VOC read can consume one or two ticks on a 286, and a floppy read half a second or more. The sourced fact is the synchronous stall (`SC:168-212`), not those durations. Whether the timer and music also stall depends on the disk BIOS/driver (cause 5).

### 10b.4 Possible causes of chop: mechanisms, not a measured ranking

1. **The read stalls the game.** The main loop calls the synchronous read, and a late loop skips updates (`SC:168-212`, `PG:1453-1455`). How many ticks a particular disk loses, and whether that explains the recollection, remain **[estimate]**, not a diagnosed historical cause.
2. **The same file is re-read on every trigger.** The buffer is reused but the open/read runs every time (`SC:164-212`). **[inference]** a disk cache could reduce the cost; cache prevalence on a particular 286 and whether reads exceeded one tick are not established here. The web's decoded-audio cache is separate from the per-trigger disk charge in its slow-PC model (`engine/audio/engine.ts:238-245`, `engine/engine/slowPc.ts:185-188`).
3. **Repeated qualifying touches restart the voice.** `CheckTouch` runs when movement, gravity, a solid monster or a character update requires it (`PG:2475-2500`), not unconditionally for every overlap tick. Each successful non-object score/heal touch can request the digital sound again (`PG:3512-3546`, `PG:3444-3506`, `PG:4591-4605`), and `PlaySbVocFile` stops an active voice before reading and restarting (`SC:164-231`). This settles the restart mechanism, not an unconditional 18 restarts/s on any CPU. **[not yet checked in DOSBox]**: try a persistent 1-point block and a 1-second voice while moving over it; cadence and audible chop remain unmeasured.
4. **A late update means a late sound.** Sound requests in `movechars`/`CheckTouch` run on processed game updates (`PG:1453-1525`); the character loop can retry while `cframe==-1`. A delayed update delays its request, but an audible series of uneven pickups still depends on the workload and sound choices.
5. **Disk read with interrupts masked.** **[inference]** a particular disk BIOS might mask interrupts long enough to lose timer calls; this wrapper does not prove which reads do so. What is sourced: `PlayIt` decrements a wait once per call and processes events at zero (`SBMUSIC.C:135-142`, `SBMUSIC.C:198-205`), with no wall-clock catch-up. Omitted calls would delay the song rather than skip ahead. The reported 0.16-0.23 s holds in recordings are context, not proof of this BIOS mechanism.
6. **DMA page boundary.** The driver receives a heap buffer's segment/offset (`SC:194-195`, `SC:221-231`). **[inference]** if its playback uses 8-bit DMA with 64 KB page boundaries, page splitting could matter. The `N / 65,536` crossing probability (11 KB: about 17%; 33 KB: about 50%) assumes uniformly distributed physical starting offsets, not a measured heap distribution. Whether the configured driver splits transfers or leaves gaps is **[not yet checked in DOSBox]**.
7. **Oversized samples.** A VOC over 64 KB exposes the narrowed read-count and allocation/driver hazards above; simple truncation is not the only possible result.
8. **Slow playback rates are noisy, not choppy.** 8 kHz is the most common rate on the CD (176 of 486 files); it has an audible 4 kHz limit and no filtering on the early cards. That sounds "rough", not "chopped".

Under these **[estimate]** assumptions, bus stealing and low-event timer/music work look smaller than the file-read cost. They have **not** been experimentally ruled out as contributors on every machine: the external drivers, actual bus waits and interrupt workload are not measured (chapter 12).

### The player's "IBM PS/1 Model 2011 (286, 10 MHz, 1 MB)" setting **[estimate]**

The web player's **Run like a** menu has one machine built from a real one: an IBM PS/1 Model 2011, a 286 at 10 MHz with 1 MB, a small slow hard disk (about 80 ms to find a file, about 150 KB/s after that) and no disk cache. What the source supports, and what the player does with it:

- **Every play re-reads the file** (`SC:204`), and nothing is kept between plays except the buffer. With no cache a repeat costs the whole read again. The player charges the read every time: about 480 ms for a 60 KB sound, about 100 ms for a 3 KB blip. The game stops for that time, the screen holds still and the picture catches up afterward (the loop skips the ticks it missed).
- **The sound starts when the read ends.** `PlaySbVocFile` stops the old sound first, reads, and only then calls the driver. The player therefore starts the audio after the read time, not at once.
- **Memory.** DOS `new char[vocfilesize]` can fail, returning FALSE before playback (`SC:194-199`). The web preset chooses **145,000 bytes** of available voice heap and skips larger sounds (`engine/engine/slowPc.ts:152-162`, `engine/engine/slowPc.ts:196-198`); that is an **[estimate]**, not a DOS safe-size limit. The preset's ROM-DOS/conventional-memory budget is a historical assumption, not established by this allocation path, and does not remove the separate 16-bit read-count hazard.
- **Levels load from the same disk.** `loadscene` (`PG:4239`) opens and reads each named file of the scene (palette, map, three block sets, monsters, character, sound set, and the song when a card is present) while the screen is black, when that file is named (`PG:4244-4253`, `PG:4283-4289`); omitted slots can retain earlier data, so this is not a blanket reset of every asset. The web model charges each read 80 ms open and 150 bytes/ms (`engine/engine/slowPc.ts:152-162`, `engine/engine/slowPc.ts:208-212`): a level of nine files and 197 KB holds the black screen about 2 seconds (`9 × 80 ms + 197,445 / 150`). The game clock does not move meanwhile, because `playscene` sets `TimerCounter` back once the level is drawn (`PG:1404`). F6's `LoadGame` reads the level's files again, all but the map and character (`PG:1798-1806`); the save file it reads first (`PG:1760-1793`) is not charged, as the player keeps saves in its own format and the DOS file's size depends on the compiler's struct layout. The 286, 386 and 486 settings charge their own disks the same way (30 ms and 400 KB/s, 18 ms and 800 KB/s, 12 ms and 1.5 MB/s: about 0.76, 0.41 and 0.24 s for that level); only Today loads at once. The disk figures fit the 2011's 30 MB drive (IBM PS/1 Technical Reference 57F1970, p. 8-26: 19 ms average access, 3600 rpm, 33 sectors a track at a 4:1 interleave, so no more than about 247 KB/s); they were not timed on a real PS/1.
- **Disk reads freeze the game, not the music timer.** The four slow presets leave `readHoldsMusic: false`: the full estimated read cost still blocks gameplay and delays the VOC's start, while the resident CMF keeps advancing on the audio thread. Lewis's November 6, 2026 observation of Slow Computers in 86Box v6.0 (IBM PS/1 Model 2011, real PS/1 BIOS, XTA disk 921/2/33 with the generic 1989 timing, SB Pro 2 IRQ 7) reported perceptible gameplay pauses at digital-sound starts without background-music clipping. That is an observed configuration, not proof about every BIOS. The C loader has no explicit interrupt mask around the VOC read (`SC:164-212`); `NewTimer` calls `PlayIt` (`PG:4421-4445`) independently of the blocked game loop. An explicit custom `readHoldsMusic: true` still models omitted timer calls, which delay the sequence rather than skip ahead (`SBMUSIC.C:135-142`, `SBMUSIC.C:198-205`). Today, scene song stop/restart, user pauses and interrupt/FM processing costs are unchanged.
- **The music's cost is modeled, not measured.** The web assumes 4 register writes for note-on, 1 for note-off, 11 for an instrument change, and **0.03 ms per write** (`engine/engine/slowPcMusic.ts:19`, `engine/engine/slowPc.ts:170-172`). It charges the song's average modeled interrupt cost (`engine/engine/slowPcMusic.ts:79-88`, `engine/engine/scene.ts:657-662`). Those figures do not reveal the opaque DOS driver's write counts or prove that no real interrupt overruns.
- **Not modeled:** stutter inside a playing sound. The wrapper delegates playback to the external driver; its page handling and interruption behavior still need exact-driver evidence, not a blanket guarantee that a slow CPU cannot cut a sample.

### 10b.5 What a game maker can do (all of it works on DOS too)

- Keep each VOC under 64 KB (and the median under 12 KB: one second at 11 kHz). Prefer 11,111 Hz or 8,000 Hz over 22 kHz when a clip is spoken.
- **Never** put a digital sound on a block that is touched for several ticks (a healing floor, a score trail). Put it on a pickup that disappears (`touchbl` to an empty block) or on a sequence key.
- Put long voices in cut scenes and on scene changes; the stall does not matter between scenes.
- Use the speaker table for repeated game sounds and digital sound for voice (chapter 10: one name per slot decides).
- Leave a gap of at least two ticks between two digital sounds that should both be heard.
