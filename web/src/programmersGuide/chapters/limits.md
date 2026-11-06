# Limits at a glance

One row per limit. Chapter numbers point to the reason. Cause tags: 16-bit, 64K, VGA, PIT, file, DOS, design. `PG` = `code/GM/PLAYGAME.C`. It is the book's one place for every number.

| Limit                     |                                                  Value | Cause        | Where                  |     Ch |
| ------------------------- | -----------------------------------------------------: | ------------ | ---------------------- | -----: |
| Screen                    |                                  320 x 200, 256 colors | VGA          | `GRAPH.H:15-16`        |      3 |
| Block size                |                 20 x 20 pixels (400 bytes; record 420) | VGA          | `BLOC.H:4, 35-53`      |   3, 5 |
| Play field                |                                         16 x 10 blocks | VGA          | `PG:66-67`             |      3 |
| Scroll step               |                                     4 pixels + 0-3 pan | VGA          | `PG:4020-4040`         |      3 |
| Background blocks         |              150 per file (151 allocated; 150 = empty) | 64K          | `BLOC.H:6`, `PG:1348`  |   2, 5 |
| Monster blocks            |                                                    100 | 64K          | `BLOC.H:7`             |   2, 6 |
| Hero blocks               |                              50 (51 = end of sequence) | 64K          | `BLOC.H:8`             |      7 |
| Map                       |                          100 x 100, wraps on both axes | design       | `MAP.H:9-10`           |      4 |
| Placed + live monsters    |                                                    200 | design       | `MAP.H:8`              |   4, 6 |
| Monster types             |                                                     64 | design       | `MON.H:6`              |      6 |
| Frames per monster        |                                  20 played (21 stored) | design       | `MON.H:7`              |      6 |
| Path corners              |                                   10 per path, 2 paths | design       | `MON.H:8`              |      6 |
| Monsters drawn per frame  |                                                     50 | DOS (memory) | `PG:80`                |      6 |
| Dirty rectangles per tick |                                                    170 | design       | `DIRTRECT.C:12`        |  5, 12 |
| Sequences                 |                                      20 (0-4 reserved) | design       | `CHAR.H:7-13`          |      7 |
| Frames per sequence       |                                                     10 | design       | `CHAR.H:8`             |      7 |
| Hero speed                |                            11 pixels per tick per axis | design       | `PG:65`                |      7 |
| Inventory                 |                                                     10 | design       | `CHAR.H:16`            |      7 |
| Held keys                 |                                                     20 | design       | `PG:64`                |  7, 12 |
| Counters                  |       30 (3 and 20-29 refusable; 5-19 = sequence uses) | design       | `CHAR.H:50`, `PG:3440` |      9 |
| Infinite                  |                          32,767 (max set value 32,766) | 16-bit       | `CHAR.H:14`            |      9 |
| Scenes                    | 231 before the 64 KB allocation wraps (header says 20) | 16-bit, 64K  | `PG:5168`              |      4 |
| Links per scene           |                                                     20 | design       | `GRATOR.H:29`          |      4 |
| File slots per scene      |                                            20 (9 used) | design       | `GRATOR.H:28`          |      4 |
| Scene name pool           |                                           65,520 bytes | 16-bit       | `PG:5173`              |  4, 13 |
| File name                 |                                8.3 (13 bytes with NUL) | DOS          | `GRATOR.H:27`          |      4 |
| Digital sound name        |                                 8 characters (9 bytes) | DOS          | `SOUND.H`              |     10 |
| Sound effects             |                30 (36 steps each, 145.67 Hz = 0.247 s) | PIT, design  | `SOUND.H:11-14`        |     10 |
| Digital sound size        |                      under 65,536 bytes, one at a time | 16-bit       | `SOUNDC.C:204`         |    10b |
| Music                     |           146 ticks a second; block under 65,536 bytes | PIT, 16-bit  | `SBMUSIC.C`            | 10, 13 |
| Palette                   |            256 entries of 6-bit R,G,B; 255 transparent | VGA, design  | `PALETTE.H`, `PG:58`   |     11 |
| Fade                      |                     65 display refreshes (about 0.9 s) | VGA          | `PALETTE.H:65`         |     11 |
| Game tick                 |                18.21 Hz (54.9 ms) = 8 timer interrupts | PIT          | `PG:4423-4430`         |     12 |
| Birth interval            |                                      1 to 16,383 ticks | 16-bit       | `PG:3281-3299`         |      5 |
| Block frame time          |                         1 to 32,767 ticks (30 minutes) | 16-bit       | `BLOC.H:47`            |      5 |
| Demo recording            |                                       1,000 key events | design       | `PG:216`               |     13 |
| High scores               |                                                     10 | design       | `HISCOREL.C`           |     13 |
| Memory a full game holds  |         about 443,000 bytes fixed + 30-120 KB per game | DOS          | chapter 4              |      4 |
| Patchable player          |     XFERPLAY 3.00 only: 160,598 bytes, MD5 `fcaf47d5…` | file         | `applyPatches.ts:37`   |     17 |
| Patched string            |             never longer than its slot, 0x20-0x7E only | file         | `patchRules.ts:29-40`  |     17 |
| Patched color level       |                                   0-63 (6-bit VGA DAC) | VGA          | `patchRules.ts:46`     |     17 |
