# Headless PLAYGAME audio capture

Runs the unmodified CD `cd/gm/playgame.exe` in **DOSBox-X**, with `core=normal`,
`cputype=286`, fixed cycles, VGA, Sound Blaster 2 / OPL2, and SDL's dummy video
and audio drivers. No display, X server, speakers, or manual input is needed.
The emulator itself records PCM WAV and raw OPL (`.dro`); dummy audio does not
replace that internal recording with silence. Python 3.9+ and Bash are required;
no Python packages are needed.

## Install and run

Verified on Linux with **DOSBox-X 2026.01.02 SDL2, commit 59915c1**, Ubuntu package
`2026.01.02+dfsg-2`. Neither DOSBox nor Staging was installed on the verification
host; Ubuntu offered DOSBox 0.74-3 and DOSBox-X. DOSBox-X was selected because
its CPU configuration explicitly accepts `286` and its `DX-CAPTURE /A /O` command
starts audio/OPL capture before launching a program. This harness is not portable
to plain DOSBox or Staging without changing its commands and configuration.

On a machine where package installation is authorized:

```sh
sudo apt-get install dosbox-x
```

The verification host had no passwordless sudo, so the package and missing runtime
libraries were downloaded and extracted in the task workspace, **not installed
system-wide**. To reproduce that non-root setup, from a disposable directory:

```sh
apt-get download dosbox-x libsdl2-net-2.0-0 libslirp0 libfluidsynth3 \
  libopusfile0 libspeexdsp1 libminizip1t64 libphysfs1 libinstpatch-1.0-2 libsdl3-0
for package in ./*.deb; do dpkg-deb -x "$package" root; done
export DOSBOX_X="$PWD/root/usr/bin/dosbox-x"
export LD_LIBRARY_PATH="$PWD/root/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

Those names match this Ubuntu host, not every distribution. Use `ldd "$DOSBOX_X"`
to identify any other missing dependencies. `DOSBOX_X` is an executable path, not
a shell command with arguments. The harness records its exact version in `run.json`.

From the repository root (output must be new or empty, outside the source game
folder; use a scratch location, not tracked source):

```sh
./tools/dosbox-286/run_playgame.sh baseline cd/gameware/donut/donut.gam 60 "$HOME/dos-audio/baseline"
./tools/dosbox-286/run_playgame.sh 286-6 cd/gameware/donut/donut.gam 60 "$HOME/dos-audio/slow"
./tools/dosbox-286/run_playgame.sh 1510 cd/gameware/donut 120 "$HOME/dos-audio/numeric"
python3 tools/dosbox-286/wav_stats.py "$HOME/dos-audio/slow/capture.wav" --window 0.1
```

Arguments: **cycles or preset**, **`.gam` file or single-game folder**, **captured
seconds (1–3600)**, **output directory**. Paths are resolved relative to the caller.
A folder containing several `.gam` files requires an explicit filename.
`--player /path/to/PLAYGAME.EXE` selects another compatible PLAYGAME build; alternate
versions/data compatibility have not been verified. XFERPLAY's filename-based
launch protocol is not supported by that option.

Each output contains:

- `capture.wav`: finalized, uncompressed 48 kHz stereo 16-bit PCM, untrimmed.
- `capture.dro`: DOSBox-X's raw OPL log, if FM writes occurred. It starts at the
  first note, **not necessarily at WAV time zero**.
- `stats.json`: normalized whole-file RMS and one-second RMS windows.
- `run.json`: executable version/path, CPU/cycles, commands, scripted keys, elapsed
  host time, staged-input SHA-256 hashes, and final WAV SHA-256.
- `dosbox.conf`, `dosbox.log`, and `game/`: exact generated configuration, emulator
  diagnostics, and private working copies. No original game/config file is edited.

The generated `CONFIG.DAT` is 512 bytes using `code/GM/JSTICK.H`'s 16-bit layout:
standard VGA, Sound Blaster, IRQ 7, port 220h, and `SNDBLAST.DRV`. This bypasses the
interactive hardware setup. A timed `AUTOTYPE` types the `.gam` filename into
PLAYGAME's picker (`PLAYGAME.C:692`); **PLAYGAME does not take a `.gam` command-line
argument**. Default typing begins eight emulated seconds after scheduling, with
0.2 seconds between keys. `--select-wait 15` adjusts that delay if another build
needs longer. The dot key is named `period` in AUTOTYPE.

## Cycle presets and limits

| Preset | Fixed cycles | Meaning |
| --- | ---: | --- |
| `286-6` | 1000 | Slowest point of the requested sweep, nominal “6 MHz” label only |
| `286-8` | 2000 | Middle point, nominal “8 MHz” label only |
| `286-12` | 3000 | Upper point, nominal “12 MHz” label only |
| `baseline` | 20000 | Fast fixed comparison, still using the 286 instruction model |

**These labels are not calibrated MHz equivalents.** The task suggested roughly
1000–1500 / 1500–2000 / 2500–3000 cycles for 6 / 8 / 12 MHz. The primary
[DOSBox-X CPU guide](https://dosbox-x.com/wiki/Guide%3ACPU-settings-in-DOSBox%E2%80%90X)
actually gives **750 for 286/8 MHz, 1510 for 286/12 MHz, and 3300 for 286/25 MHz**.
It explicitly says instruction mix matters and emulation is not cycle accurate.
Use numeric `750` and `1510` for that guide's reference points; an extrapolated
6 MHz value would be about `563` (750 × 6/8), **not a hardware measurement**. The
named presets preserve the requested sweep without claiming that disputed mapping
is established. A later measurement should include the lower numeric points before
claiming coverage of a real 6 MHz AT. `max` is deliberately rejected: its effective
speed changes with host load and is less reproducible than a fixed baseline.

The duration is **captured/emulated audio time, including startup**, not an exact
host-wall timeout and not time since music starts. The supervisor watches the
configured PCM byte rate, then sends SIGTERM; with `quit warning=false`, DOSBox-X
finalizes its own WAV/DRO and exits normally. Buffering/polling adds a small tail;
the script does not synthesize or repair headers or trim samples. A wall deadline
of `30 + 3 × requested seconds` prevents hangs; SIGKILL fallback is a failure.
Whole-file RMS must exceed 0.001 (full-scale normalized), which rejects the
near-zero dummy-mixer DC floor. A short run can correctly fail because the music
has not started. Use **120 seconds or more** for slow-CPU musical comparisons and
exclude startup explicitly. Do not interpret the entire leading silence as a music
pause. Host contention can stretch wall time; compare audio/DRO time, not wall time.

## Scripted interaction

Filename entry already reaches music without manual input. For later scenarios,
`--keys` schedules an additional DOSBox-X `ADDKEY` sequence immediately before
PLAYGAME launches. Delays are in **emulated milliseconds**, relative to that
scheduling point, not relative to music onset or WAV time zero. `pN` adds a delay;
`lN` sets the held-key duration. For example, this supplies two Enter presses:

```sh
./tools/dosbox-286/run_playgame.sh 2000 cd/gameware/donut/donut.gam 120 "$HOME/dos-audio/keys" \
  --keys 'p60000 enter p10000 enter'
```

Available key tokens: single lowercase letters/digits, `enter`, `space`, `escape`,
`up`, `down`, `left`, `right`, `f1` through `f12`; `pN` and `lN` take nonnegative
integers. A sequence such as `p60000 l3000 right p5000 l1 f3 p5000 f3` holds right,
then toggles F3 twice. Game-state effects depend on which screen is active; these
example navigation/F3 scenarios are **not the music measurements**. Inspect the
song onset/OPL log, adapt timing per scenario, and preserve the same schedule across
comparison runs. DOSBox-X built-in `HELP AUTOTYPE` and `HELP ADDKEY` document the
commands; [the tagged shell source](https://github.com/joncampbell123/dosbox-x/blob/dosbox-x-v2026.01.02/src/shell/shell_cmds.cpp)
implements `CMD_ADDKEY` and `CMD_DXCAPTURE` (`/A` = WAV, `/O` = OPL).

## Verification

```sh
python3 -m unittest discover -s tools/dosbox-286 -v
# Also runs two real, approximately minute-long emulator captures; choose a NEW output root:
DOSBOX_REAL_TESTS=1 DOSBOX_TEST_OUTPUT="$HOME/dos-audio/acceptance" \
  python3 -m unittest discover -s tools/dosbox-286 -v
bash -n tools/dosbox-286/run_playgame.sh
```

Actual acceptance captures on November 6, 2026, same unmodified Donut data and
PLAYGAME SHA-256 `49ed1c7898b05cd19813e1731f7694f52ee17d768f01e38991666fac86365d4b`:

| Setting | WAV seconds | Normalized RMS | First 1-second window above 0.001 | Host elapsed seconds |
| --- | ---: | ---: | ---: | ---: |
| baseline / 20000 | 60.089 | 0.053611 | 27 | 92.90 |
| 286-6 / 1000 | 60.138 | 0.022725 | 50 | 63.15 |

Both produced a finalized WAV and nonempty DRO with dummy video/audio, with
DOSBox-X exit status 0. These checks prove capture, **not stable tempo, lack of
pauses, a specific scene, or real-286 fidelity**. The later measurement task must
align musical passages and separate title/scene-load silence from in-song gaps.
DOSBox's DOS filesystem is not a real AT disk, ISA timings are approximate, and
Sound Blaster/OPL emulation is not a physical card.

Harness, tests, and documentation: Hermes Agent using OpenAI Codex **GPT-6.1 Sol**,
directed by Lewis Moten. DOSBox-X remains an external tool by the DOSBox-X Team;
no emulator code/binaries or new copies of archival data are bundled here.
