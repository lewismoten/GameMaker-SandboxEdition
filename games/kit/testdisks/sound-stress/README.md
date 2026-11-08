# Sound-stress TEST disk

Developer diagnostic only. It is **not** a Starter, secret game or catalog game. No
`about.json`, public asset, course/hero/cast entry or normal game-build registration
is added. Keep this builder nested below `games/kit/testdisks/`; never move its
output into a top-level game or `web/public`. Generated `disk/` is Git-ignored.

## Build and check

From the repository root, install dependencies normally if needed, then:

```sh
npm run heavy -- npm run build:packages
cd web
npm run heavy -- ../node_modules/.bin/vite-node ../games/kit/testdisks/sound-stress/build.ts
npm run heavy -- ../node_modules/.bin/vite-node ../games/kit/testdisks/sound-stress/check.ts --out /private/path/sound-stress-evidence
GM_SKIP_GAME_BUILD=1 npm run heavy -- ../node_modules/.bin/vitest run test/soundStress.test.ts test/soundStressFloppy.test.ts test/testDiskIsolation.test.ts test/buildGames.test.mjs
```

`build.ts --out <owned-directory>` replaces that directory's native files; do not
point it at a folder containing anything else. `check.ts` checks the default local
disk, makes two independent builds and compares every byte, walks both rooms and
renders two loops with the engine's software OPL2. Its optional evidence directory
receives real gameplay frames and a software-OPL WAV, **not PS/1 recordings**.

To build the one required floppy (Python, mounting and privileged tools not needed):

```sh
# From web/. Choose a NEW private filename; existing files are never overwritten.
npm run heavy -- ../node_modules/.bin/vite-node ../games/kit/testdisks/sound-stress/image.ts --out /private/path/.for-lewis/86box/SOUNDTST.img
# Optional independent filesystem check on Linux:
fsck.fat -n -v /private/path/.for-lewis/86box/SOUNDTST.img
```

This is a raw 1,474,560-byte **data** image, not a boot disk or DMG: FAT12, 512-byte
sectors/clusters, media F0, 18 sectors/track, two heads, two 9-sector FATs and 224
root entries (the `newfs_msdos -f 1440` geometry). All resources fit on one disk;
no split or installer is needed. `image.ts` uses the existing DOS export and the
unmodified `cd/gm/xferplay.exe` renamed `SOUNDTST.EXE`, `SNDBLAST.DRV`,
`CONFIG.BAT`/`CONFIG.HLP` and export notices. The installer task's API was not
available on this base, so no unfinished sibling branch is required.

## PS/1 in 86Box

1. Boot the PS/1's existing DOS hard disk **without the diagnostic in A:**; insert
   SOUNDTST.img only after reaching DOS. Set A: to 3.5-inch 1.44 MB.
2. Install manually (the commands write only a new `C:\SOUNDTST` directory):

   ```dos
   C:
   MD \SOUNDTST
   CD \SOUNDTST
   COPY A:\*.*
   CONFIG
   SOUNDTST
   ```

   Or run `A:` then `CONFIG` and `SOUNDTST` from the floppy for a comparison. Keep
   separate saved configurations/results for floppy versus hard disk.
3. Choose Sound Blaster in CONFIG, with address/interrupt matching the actual
   emulated card. The private PS/1 example uses SB Pro 2 A220 **I5** D1; the DOS
   export's generic instructions say IRQ 7. Neither number substitutes for checking
   the card. FM music alone does not prove a correct digital-sound IRQ. Ensure music
   and effects are enabled; F3/F4 toggle them.
4. Select Play. Left/right walks, Space jumps. F1 opens listening/recording notes.
   The far-right door swaps rooms; returning to a room restores its unused pads.

## Reproduce the stress cases

- **Full band:** stand still for at least two loops (about 84 seconds total). The
  32-bar CMF uses nine distinct kit patches: piano, bass, strings, brass, lead,
  bell, organ, pad and pluck. Channels 0–3 make dense held chords; 4–8 run fast
  sixteenths. Both rooms reference the exact same `band.cmf`; entering a new room
  restarts it rather than promising phase continuity across scene loads.
- **Band + effects:** gold pads play once and turn gray. Each group has three
  copies: nominal 0.25 s at local columns 12/14/16, 1 s at 22/24/26, 5 s at
  32/34/36, then the 64-KiB boundary at 42/44/46. Wait on a group's first pad for
  the tail; cross copies quickly to test replacement. Return through both doors
  to repeat. A used pad does not trigger again until the room reloads.
- **Score with a long VOC:** the green score pad at column 38 follows the last
  5-second pad immediately; no need to cross the boundary group. A second score
  pad is at 56. For long-to-short replacement, trigger column 32 and turn left
  across unused 1-second pads before its five-second tail ends. Also try score
  first, then a VOC. Record order and waits, not just which files played.
- **Listen for:** held/skipped FM notes during synchronous VOC reads; FM dropping
  voices or changing timing during playback; one VOC cutting another; score
  interaction; seams at the 32-bar loop and room transitions. Source behavior is
  one digital voice, not a mixer. Score is the original PC-speaker effect (SND 5),
  not an extra VOC/mixer voice. Do not count simulator results as audible DOS proof.
- **Record:** follow the private `.for-lewis/86box/README.md` BlackHole/ffmpeg note.
  Save a quiet full-band baseline and one recording per pad order. Include 86Box
  version, PS/1 CPU/memory, HDD speed profile, media source, card/port/IRQ/DMA and
  F3/F4 state. On a Mac, use BlackHole plus speakers if monitoring while recording.

## Engine limits and intentional boundary probe

OPL2 supports **nine melodic voices OR six melodic plus five rhythm drums**; the
latter share physical channels 6–8. It is not sixteen melodic voices. This disk
uses the nine-melodic option. Compare `code/GM/SBMUSIC.C`'s note dispatch and
rhythm controller with `web/packages/engine/src/audio/{cmfPlayer,opl}.ts`; the
legacy C comment saying sixteen channels describes MIDI slots, not hardware
polyphony. Creative's omitted library sources are not restored. The header clock
is 146; actual DOS PIT timing is about 145.67 Hz. The loop contains exactly 6,144
music ticks, with a final neutral event preserving the complete last bar.

Samples request 11025 Hz, encoded/decoded as 10989 Hz, so nominal lengths round
slightly upward. Total sizes: 2,789 / 11,058 / 55,158 / **65,536** bytes. The last
contains 65,503 PCM samples plus 33 bytes overhead. It deliberately exceeds the
DOS editor's 65,535-byte total-file cap. `SOUNDC.C` casts the read size to 16 bits,
so this exact boundary wraps to zero. A stale sample, silence, failed load or other
DOS failure is diagnostic evidence, **not promised supported playback**. Save
before trying it; first establish the three under-limit controls. Browser decoding
of this file does not establish DOS safety. No original engine behavior is changed.

## Verification boundaries

Automated checks cover deterministic bytes, serialized CMF/events, real headless
engine movement/sound triggers, software OPL2, FAT12 directory/FAT-chain readback,
and shallow catalog/Pocket/MCP/build discovery with positive controls. Generated
catalog assets and HTTP routes are checked, not just the absence of a link.
Hardware timing, physical PS/1 playback, the Mac audio routing and an audible
judgment require live recordings; report those separately from the automated checks.

Code, test music and diagnostic text: Hermes OpenAI Codex GPT-6.1 Sol, directed by
Lewis Moten. Kit artwork and presets retain their existing project credits.
