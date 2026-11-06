# PLAYGAME measurement tools

These tools extend the capture harness on
`feature/headless-playgame-audio` (`1adcc3d4c48dcd072c3e542cba307336c8ad41ce`).
Integrate that dependency before running captures; this branch does not merge it.
The static predictions are on `feature/playgame-music-timing-research`
(`af1173054e22eabf1422d6589302c863ba0bc46e`).

Python requires NumPy; the measurement host used Python 3.14 and NumPy 2.3.5.
The harness itself remains standard-library-only. No emulator, package, archival
copy, or full WAV is bundled with this measurement code.

```sh
# Set DOSBOX_X and LD_LIBRARY_PATH as described in README.md first.
# A new directory OUTSIDE this checkout; four concurrent emulators at most.
python3 tools/dosbox-286/measure_scenarios.py /path/to/new-matrix \
  --scenarios menu gif sand wood loop --jobs 4
python3 tools/dosbox-286/measure_scenarios.py /path/to/controls \
  --scenarios stress toggle --jobs 2
python3 tools/dosbox-286/measure_scenarios.py /path/to/f3-controls \
  --scenarios f3 --jobs 2
# Supplemental lower-cycle menu checks (not calibrated hardware equivalents).
python3 tools/dosbox-286/measure_scenarios.py /path/to/lower-matrix \
  --scenarios menu --cycles 563 750 1510 --jobs 3
python3 -m unittest discover -s tools/dosbox-286 -p 'test_*measure*.py' -v

# Full-capture RMS gaps and the first matched 60-second musical passage.
python3 tools/dosbox-286/measure_audio.py /path/to/new-matrix/menu-1000-1 \
  --baseline /path/to/new-matrix/menu-20000-1
```

`measure_scenarios.py` makes private copies of Donut. Only the copied `.gam`
scene graph changes, except `stress` and `f3`, which also raise the copied character's
hit-point meter to 32767 to keep monster damage from ending the comparison.
Title/menu animation and demo are disabled, `gif` restores
an original GIF in the menu slot, `wood` starts in Wood Castle, and `loop`
places 20 self-links around the Sand Castle spawn. Engine and song bytes are
unchanged. The original game remains intact. These are **controlled test graphs**,
not claims to have completed the original levels.

| Capture  | Seconds, including startup | Input schedule (emulated time after ADDKEY)                             |
| -------- | -------------------------: | ----------------------------------------------------------------------- |
| `menu`   |                        150 | None; stationary menu with `gentle.cmf`                                 |
| `gif`    |                        150 | None; same music starts before the original menu GIF decodes            |
| `sand`   |                        270 | Enter at 90 s; right and Space held 165–225 s; F3 at 245 and 250 s      |
| `wood`   |                        210 | Enter at 90 s; wait in Wood Castle                                      |
| `loop`   |                       1400 | Enter at 90 s; repeated real self-linked scene loads                    |
| `stress` |                        240 | Protected-health Sand Castle; Enter at 90 s, right/Space held 165–225 s |
| `toggle` |                        210 | Original-health diagnostic; F3 at 170 and 175 s, each held 250 ms       |
| `f3`     |                        210 | Protected health; F3 at 170 and 175 s, each held 600 ms                 |

The protected `f3` run is the valid toggle control. Original-health `toggle`
runs can die before the keys arrive; they are retained as diagnostics, not
silently counted as successful toggle tests. `PLAYGAME.C`'s `SlowKeys` sets a
one-second typematic delay, so 600 ms spans slow rendering without a repeat.
The collector selects an off/on event around its scheduled timestamp, not the
second stop in the file (which might instead be a character death).

ADDKEY's `lN` changes release duration; it does **not** advance the delay clock.
Each key also advances that clock by a few milliseconds. The exact sequence is
preserved in each `run.json`. Space invokes Donut's original sequence 14 / sound
9 (`mu05.voc`); actual sound occurrence must be verified from the recording,
not inferred merely from scheduling a key.

The analyzer reports full-scale-normalized RMS over **both** channels in 10 ms
windows. A gap is RMS < 0.001 for at least 100 ms. Leading silence is startup,
not a music pause. Sustaining notes or release tails can bridge a pause in the
note sequence, so RMS silence and OPL stop-to-next-key-on gaps are separate metrics.
Natural musical rests are not automatically defects.

Tempo comes from rising OPL B0–B8 key-on bits, with A-register frequency/block
values and voice identity, plus rising rhythm bits. Unique identical eight-note
phrases are paired in order, then time is fitted against the baseline. A ratio
of 1 means equal speed; 0.5 means half speed. Fits need 20 phrases spanning 5 s
and reject residuals over 250 ms; a missing fit is **not** a stable-tempo result.
Segment seconds are elapsed times between the first/last matched phrase starts,
not BPM and not a full-song duration. Select corresponding passages explicitly:

```sh
python3 tools/dosbox-286/measure_audio.py /path/to/run \
  --baseline /path/to/baseline \
  --start 80 --end 140 --baseline-start 81 --baseline-end 141 \
  --wav-start 90 --wav-end 165
```

DRO times begin at its first FM key-on; WAV times begin at capture start. Do not
subtract one from the other without alignment. The decoder implements the
published DOSBox-X v2026.01.02 `RawHeader`/`Capture` file structure in
`src/hardware/adlib.cpp`. It rejects unsupported, truncated, or inconsistent
DROs by default. `--allow-rollover` additionally accepts the exact DOSBox-X
writer behavior when a changed-register write arrives after more than 30 s:
that delay is included in the old header but not encoded in its command stream,
and a new DRO can start at the next key-on. The unencoded interval is reported
separately; files are never rewritten or stitched into a falsely exact timeline.
Use `--dro-segment N` for a split capture's local time coordinate. The WAV hash
must match the successful harness record before analysis. The capture matrix
records every child exit status and fails if any capture fails.

`--score original.cmf` optionally compares nearest MIDI pitches decoded from OPL
against source CMF ticks at 8191/1193182 seconds per tick. This walks the original
`SBMUSIC.C` event rules; it is not a voice-allocator/cycle simulator.

Collect all successful status records and retain failures explicitly:

```sh
python3 tools/dosbox-286/summarize_measurements.py \
  /path/to/new-matrix /path/to/controls /path/to/f3-controls /path/to/lower-matrix > results.json
```

The collector hashes WAV/DRO bytes, emits timestamped PCM gaps and OPL stops,
fits quiet/motion/post-toggle passages separately, counts completed scene loops,
and reports censored no-write tails. It does not call sustaining FM tones
silence. `--partial` is for diagnostics only, not final completion evidence.
Stop detection accepts at least four descending zero B-register writes ending
at B0 within 20 ms: the library writes nine, but DOSBox-X omits already-zero
values. Stops involving fewer than four changing registers can be missed.
Early key-ons before an instrument reload are race **candidates**, not proof
that a particular FM voice audibly sustained through the whole gap.

Code and measurement text: Hermes Agent / OpenAI Codex GPT-6.1 Sol, directed by
Lewis Moten. NumPy (BSD) and DOSBox-X (DOSBox-X Team, GPL) remain external.
