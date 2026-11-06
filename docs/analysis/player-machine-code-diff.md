# Game-Maker player machine-code diff: what 2.02 (and 1.04, 3.0) actually changed

This page consolidates three per-version analyses of the stand-alone Game-Maker player
(XFERPLAY, the EXE a transferred game ships as). It adds no new disassembly. Every claim
below is taken from one of these pages, and the "Source" column or the text says which:

| page                                       | pair             | branch it was written on                                                              |
| ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------- |
| [player-diff-1.04.md](player-diff-1.04.md) | 1.00-xfer → 1.04 | `feature/player-diff-1-04-sav-globals` (9e251e464; includes the gap pass and item 14) |
| [player-diff-2.02.md](player-diff-2.02.md) | 2.00 → 2.02      | `feature/player-diff-2-02` (b08d41f73)                                                |
| [player-diff-3.0.md](player-diff-3.0.md)   | 2.04 → 3.00-xfer | `feature/player-diff-3-0` (941dc1250)                                                 |

The baseline tooling, inventory and function-match tables are in
[`player-diff/`](player-diff/README.md) ([inventory](player-diff/inventory.md),
[pairs](player-diff/pairs.md)).

**Nothing was run.** None of the three analyses executed a player. Every statement about
what a change does to play is read from code, and each page labels such statements as
inferences. The confidence words below (high, medium, speculative) are the per-version
pages' own labels.

## What 2.02 actually changed

The 2.02 player differs from 2.00 (the newest earlier 2.x held; no 2.01 is known) by **+176
bytes and +11 relocations, every one accounted for**. It is a maintenance release built with
the same compiler and linker (Borland C++ 1991, TLINK 5.0). It has **five changes that
affect play**, one library change the player never calls, and a version string. Everything
else is relinking noise. The binary findings show that this is not merely a version-string
change.

| #   | change                                                                                                                                                                                                                                                                 | where (2.00 → 2.02)                                                                                                                | class                             | confidence                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Saved games store the map view** (`mx`, `my`). The `.SAV` file gains 4 bytes at offset 4,679, and restoring no longer re-centers the view on the character. 2.00 and 2.02 saves are not interchangeable (a 2.00 save is 37,281 + 5n bytes, a 2.02 save 37,285 + 5n). | `Save_Game` 03B4:17A2 → 17FE; `Load_Game` 03B4:124F → 12A9                                                                         | bug fix + file-format change      | high for code and source; the effect on play is an inference                                               |
| 2   | **Esc quits the title menu**, and the menu counts its items 1–6 instead of 0–5. In 2.00 Esc did nothing.                                                                                                                                                               | `DoGame` 03B4:02B1                                                                                                                 | new feature                       | high                                                                                                       |
| 3   | **Title-menu music path no longer overflows its stack buffer** (20 → 62 bytes). In 2.00 a long path to the player's own folder could overwrite the locals, the saved BP and the return address.                                                                        | `DoGame` local `out` `[bp-0x26]` → `[bp-0x50]`                                                                                     | bug fix                           | high for the code; medium that it misbehaved in practice (needs a Sound Blaster and a scene-0 intro song)  |
| 4   | **Screen resets also reset the scroll registers**: `MoveViewScreen(0,0)` after `ViewWindow(0)` in 5 places, plus `MoveWindow(0); ViewWindow(0)` at the title.                                                                                                          | `play` 03B4:096C → 099C, `playscene` 0C0E → 0C4C, `DoFunKy` 0FD8 → 1024, `DropBloc` 2558 → 25E0, `loadscene` 7580 → 7616, `DoGame` | bug fix (display)                 | high for what the code does; medium for the symptom (full-screen pages possibly shifted by up to 3 pixels) |
| 5   | **Sprite-block drawer clears AH** before using its `char` rotation. 2.00 could draw a sprite near the right edge with the wrong rotation or flip in a busy frame (more than 170 dirty rectangles queued).                                                              | `_BufDrawSpBlk` 0D87:0004 → 0D91:0008                                                                                              | bug fix                           | high for the fix (the source comment says why); the symptom is an inference                                |
| 6   | `horizmenu`: Esc and Up now cancel. **Dead code in the player**: no call or stored pointer to it exists in either build.                                                                                                                                               | 0E59:13F9 → 0E63:13FF and its case bodies                                                                                          | library change, no effect on play | high                                                                                                       |
| 7   | About text "Version 2.00" → "Version 2.02".                                                                                                                                                                                                                            | DGROUP 0977B                                                                                                                       | version string                    | high                                                                                                       |

What is **not** different: nothing was added or removed; no packer; DOS/BIOS services, I/O
ports, embedded files and initialized data are unchanged apart from the version string.
94 relocated, 4 constants and 5 data-moved functions, 25 differing out-of-function gaps and
the header fields are relinking noise (see [noise versus semantic changes](#noise-versus-semantic-changes)).

**Why this answer is trustworthy.** The 2.00 → 2.02 function table (298 identical, 94
relocated, 5 data-moved, 4 constants, 10 changed, 0 added, 0 removed) is only the part the
function finder reaches. The 2.02 page also compared the 98 gaps (code reached only through
switch tables, interrupt handlers, padding): 72 identical, 13 relocation-only, 12 read by
hand. That pass is what found change 6 and the `DoGame` case-body edits. The byte accounting
(+42 `DoGame`, +70 five `MoveViewScreen` calls, +44 `Save_Game`, +2 `Load_Game`, +2
`_BufDrawSpBlk`, +16 `horizmenu`, +6 `DoGame` case bodies, −6 alignment) sums to +176. The
2.04-era source in `code/GM/GM.ZIP` has each of these changes, which confirms what the code
does; which build introduced them is shown by the binaries, not the source.

Full evidence, side-by-side excerpts and commands: [player-diff-2.02.md](player-diff-2.02.md).

## Binary inventory and comparison pairs

All builds are 16-bit DOS MZ executables from Borland TLINK, unpacked and unprotected. A
build is recognized by its MZ load-image size; copies that differ only in the 52-byte owner
slot count as one build. Binaries are read, never run, and never committed. Source:
[inventory.md](player-diff/inventory.md).

| build     | version | program            | file bytes | image bytes | relocs | held as                                                                      |
| --------- | ------- | ------------------ | ---------: | ----------: | -----: | ---------------------------------------------------------------------------- |
| 1.00-xfer | 1.0     | stand-alone player |     82,803 |      78,194 |  1,035 | `DRIVEIN.EXE` (Big Bob's Drive-In); 1 canonical, 4 edited, 7 identical image |
| 1.00-play | 1.0     | editor's PLAYGAME  |     83,092 |      78,484 |  1,045 | Nebula sample CD                                                             |
| 1.04      | 1.04    | stand-alone player |     83,136 |      78,528 |  1,063 | `BCUDA1SW.EXE` (Barracuda: Secret Mission); 1 edited, 2 identical image      |
| 2.00      | 2.00    | stand-alone player |    154,980 |     148,836 |  1,094 | `BLINKY2.EXE`; 8 identical except owner stamp                                |
| 2.02      | 2.02    | stand-alone player |    155,156 |     149,012 |  1,105 | `RICKY2.EXE`; 20 identical except owner stamp, 4 edited                      |
| 2.04      | 2.04    | stand-alone player |    119,074 |     112,930 |  1,108 | `brkoutsw.exe` (Breakout: The Rescue), one copy                              |
| 3.00-xfer | 3.00    | stand-alone player |    160,598 |     152,406 |  1,465 | `cd/gm/xferplay.exe`; 27 edited, 343 identical image                         |
| 3.00-play | 3.00    | editor's PLAYGAME  |    163,130 |     154,938 |  1,519 | `cd/gm/playgame.exe`                                                         |
| 3.00-aj   | 3.00    | stand-alone player |    160,784 |     152,592 |  1,472 | `A-J.EXE` (A-J's Quest)                                                      |

Comparison pairs (the "required" ones answer the request; the rest are chain or control):

| old       | new       | role                                                                    | interpreted in                                                     |
| --------- | --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1.00-xfer | 1.04      | **required**: what 1.04 changed (no 1.01–1.03 held)                     | [1.04 page](player-diff-1.04.md)                                   |
| 2.00      | 2.02      | **required**: what 2.02 changed (no 2.01 held)                          | [2.02 page](player-diff-2.02.md)                                   |
| 2.04      | 3.00-xfer | **required**: what 3.0 changed (2.04 is the newest earlier player held) | [3.0 page](player-diff-3.0.md)                                     |
| 1.04      | 2.00      | chain                                                                   | **not interpreted** (baseline table only)                          |
| 2.02      | 2.04      | chain                                                                   | **not interpreted** (baseline table only)                          |
| 2.02      | 3.00-xfer | control                                                                 | **not interpreted**                                                |
| 1.00-xfer | 1.00-play | control                                                                 | **not interpreted**                                                |
| 3.00-xfer | 3.00-play | control                                                                 | **not interpreted** (used by the 3.0 page only to carry MAP names) |
| 3.00-xfer | 3.00-aj   | control                                                                 | **not interpreted**                                                |

Each diff therefore covers every change since the previous build _held_, not necessarily one
release. The baseline function counts for the three required pairs:

| pair             | old fns | new fns | identical | relocated | data-moved | constants | changed | removed | added |
| ---------------- | ------: | ------: | --------: | --------: | ---------: | --------: | ------: | ------: | ----: |
| 1.00-xfer → 1.04 |     355 |     359 |       120 |       132 |         43 |         9 |      47 |       4 |     8 |
| 2.00 → 2.02      |     411 |     411 |       298 |        94 |          5 |         4 |      10 |       0 |     0 |
| 2.04 → 3.00-xfer |     413 |     604 |       111 |       179 |         15 |        32 |      67 |       8 |   199 |

(`calls-differ` is 0, 0 and 1 for the three pairs.) These match
[pairs.md](player-diff/pairs.md).

## Methodology

- **Inventory and grouping.** `gmpdiff.py inventory` hashes every copy found in `cd/gm/`,
  `runtime/run/GM/` and an explicitly supplied optional local archive corpus, unpacks PKLITE copies with
  Deark, and groups copies by MZ image size (owner slot masked, never printed).
- **Function matching.** `gmpdiff.py diff` disassembles each EXE (Capstone), finds
  functions, and matches old to new in stages: identical bytes, normalized text, strings,
  shape, call graph, address order. Each match is graded _identical_, _relocated_,
  _calls-differ_, _data-moved_, _constants_ or _changed_, with a confidence (high, medium,
  low). Low-confidence matches are call-graph or order matches under 0.7 similarity.
- **Bytes outside functions.** The function finder misses switch-case bodies bounded in an
  earlier block, `push ax` interrupt handlers, jump tables, sparse switch tables and
  padding. The 2.02 page added `inspect_pair.py gaps` to compare every such gap; the 1.04
  re-check used it (and its new `UNPAIRED` and `dgroup` views); the 3.0 page added
  `attribute.py`, which attributes every function and every code-region byte to a link
  module using `XFERPLAY.MAP`/`PLAYGAME.MAP`.
- **Naming and cross-checks.** Names come from the 2.04-era source in `code/GM/GM.ZIP`
  (2.02 page), the 3.0 source in `code/GM` (1.04 and 3.0 pages), the link maps, and each
  function's strings. A match in the 3.0 source confirms a build's _structure_; it does not
  prove two builds were identical.
- **Labels.** _Confirmed_ = the code shows the change and an independent source agrees.
  _Speculative_ = an inference the evidence does not settle. "Effect on play" is almost
  always an inference.
- **Reproducing.** `uv run scripts/player-diff/gmpdiff.py all --reference "$CORPUS"`
  regenerates the baseline reports when `CORPUS` points to the same optional input corpus
  and Deark is available on `PATH` or via `--deark`. The corpus is not distributed here;
  without it only repository builds can be reproduced. Each per-version page ends with
  its own Commands block. `inspect_pair.py`, `attribute.py` and `srcmap.py` are in
  `scripts/player-diff/`; local source paths remain private.

## 1.04: what changed since 1.0

The old copy is 1.0 (no 1.01–1.03 held), so this covers every change from 1.0 to 1.04. The
image grows **+334 bytes** (78,194 → 78,528). 14 items; full detail in
[player-diff-1.04.md](player-diff-1.04.md).

| #   | change                                                                                                                                                                                                                                                                                                                                  | class                            | confidence                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Super VGA chip detection rewritten: BIOS-signature scan of the video ROM (eight vendor strings), Trident 8800/8900 split, shared chip setup                                                                                                                                                                                             | new feature + behavior change    | confirmed                                                                             |
| 2   | Chip-type renumbering ripples into bank-switch and mode code                                                                                                                                                                                                                                                                            | behavior change                  | confirmed (code); purpose medium                                                      |
| 3   | `ShowVideoMemory` and `FIND_BOARD` command-line diagnostics                                                                                                                                                                                                                                                                             | new feature                      | confirmed (3.0 source `PLAYGAME.C:604`)                                               |
| 4   | Mouse driver scales coordinates from the driver's real range; callers drop their ×8 pixel-to-cell maths (including `getfname`/`horizmenu` case bodies outside any function)                                                                                                                                                             | behavior change / likely bug fix | confirmed (code); motive speculative                                                  |
| 5   | Message box gets a timeout (`maxpause`, default 30000 ms); all 15 `errorbox` call sites (11 far, 4 near)                                                                                                                                                                                                                                | new feature                      | confirmed (3.0 source `WINDIO.C:517`)                                                 |
| 6   | Title screen named `gmtitle.gif`; a missing title now exits with code 4                                                                                                                                                                                                                                                                 | behavior change                  | confirmed                                                                             |
| 7   | Order screen text ("Order from your local computer store or: KD Software"); "Version 1.04"                                                                                                                                                                                                                                              | text change                      | confirmed                                                                             |
| 8   | Save-game _failure_ beeps 10 times → 2 (the save, not the load)                                                                                                                                                                                                                                                                         | behavior change                  | confirmed (code)                                                                      |
| 9   | Three dead library routines (1,299 bytes: CRTC scroll helpers, polygon edge-table builder) removed; no callers in 1.0                                                                                                                                                                                                                   | dead-code removal                | confirmed no callers; reason speculative                                              |
| 10  | Monster update loop and init touched (32-bit timestamps at record +0x28/+0x2e)                                                                                                                                                                                                                                                          | behavior change                  | **speculative**                                                                       |
| 11  | Sprite and text-box blit routines: colour nibble masks, clip limit, `cld` removal                                                                                                                                                                                                                                                       | behavior change / optimization   | medium (code); purpose speculative                                                    |
| 12  | Boolean tests compiled differently; register and `enter` frame changes                                                                                                                                                                                                                                                                  | compiler noise                   | confirmed                                                                             |
| 13  | Run-time, data-segment growth, relocation, layout                                                                                                                                                                                                                                                                                       | noise                            | confirmed                                                                             |
| 14  | After a restore, the scene loop continues from the restored scene: `curscene`/`oldscene` became globals (DGROUP 0x94/0x92) that the `.sav` reader sets. In 1.0 they were `play()` locals the reader could not reach, so leaving a restored scene by a link, or replaying after a lost life, used the scene played _before_ the restore. | behavior change / bug fix        | high (code; same structure as 3.0 `PLAYGAME.C:1081–1141, 1795–1796`); effect inferred |

Also in the `.sav` reader: the `fclose(NULL)` after a failed open was removed (high; harmless,
inferred). The `.SAV` layout did not change in 1.04.

**Bytes outside functions.** 72 gaps per build (5,361 → 5,351 bytes, reconciling to −10):
45 equal, 9 relocation-only, 16 read by hand (11 only DGROUP moves, 2 sparse tables, 1
padding, 2 real code: `getfname` and `horizmenu` case bodies, which are parts of items 4
and 5), plus unpaired gaps that are item 1's new switch tables, a dead `jmp` after the
removed `fclose(NULL)` and alignment padding. The 103-byte data region that the first
version left open is `_streams[20]` FILE self-pointers moving by +0x16E: not a change.

## 3.0: what changed since 2.04

3.0's predecessor here is **2.04**, the newest pre-3.0 player held. 405 of 2.04's 413
functions (98%) are found again in 3.00-xfer, which has 604 functions; 193 are really new
(88 compiler run-time, 20 string class). By bytes, the code region grows by 59,136: 20,000
is the moved zero-filled far array, 20,352 run-time and string class, 5,072 new FLI, VGA,
file-class and directory modules, 12,912 the player itself, +848 other modules, −48 the
owner-stamp slot. Full detail in [player-diff-3.0.md](player-diff-3.0.md) (20 findings, each
labelled confirmed or speculative; every function and every code-region byte is attributed
to a link module).

| #   | change                                                                                                                                                                                                           | class                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | New run-time: Borland C++ exception handling, `new`/`delete`, RTTI, string class (that it is Borland C++ 4.x is speculative)                                                                                     | toolchain                                           |
| 2   | Different code generation for unchanged source; `abs`/`sign` → own `Abs`/`Sign`                                                                                                                                  | noise                                               |
| 3   | Relinked layout: owner-stamp slot dropped, entry 0003:0004 → 0000:0000, 20,000-byte `map` array moved before DGROUP                                                                                              | noise (stamp slot removal is a distribution change) |
| 4   | **New `.GAM` format and a flat game folder** (no `gam\ blk\ pal\ snd\ map\ mon\ chr\ gif\` subfolders)                                                                                                           | feature, file format                                |
| 5   | **Multimedia screens**: GIF, BKD, FLI, text and `.lst` slide lists, with their own music, before/after each level and for title, menu, instructions, story, credits, death, win, high scores                     | feature                                             |
| 6   | Title, menu and play loop rewritten around 4 and 5; `GMTITLE.GIF` no longer required; graphic menu                                                                                                               | feature / behavior change                           |
| 7   | **Keystroke recording and playback**: every game recorded to `<game>.rec`; demo from the menu after 30 s idle; `.rec` on the command line; high scores kept as `data<n>.rec`                                     | feature                                             |
| 8   | **Several named save slots** (`SavNames.dat`, `game<n>.sav`) instead of one save                                                                                                                                 | feature                                             |
| 9   | High-score table redone ("Your Latest Score", background graphic, no write-error text)                                                                                                                           | behavior change                                     |
| 10  | **Software-simulated scrolling** for VGA cards without hardware scrolling; hardware start-address paging (`viewwindow`) removed                                                                                  | feature                                             |
| 11  | `gm.cfg`: read at start, written back at exit                                                                                                                                                                    | feature / behavior change (writes a file)           |
| 12  | `SOUND` environment variable no longer read (only `BLASTER`); `FreeSoundSample` added                                                                                                                            | behavior change                                     |
| 13  | The file dialog's own DOS critical-error handler ("I can't access the disk!", Retry/Abort) is gone                                                                                                               | behavior change                                     |
| 14  | Text and dialogs: pixel-positioned text, RGB colour matching, double-framed boxes, longer file-name buffers (31 → 51 or 81), menu title colour 127 → 47                                                          | behavior change (UI)                                |
| 15  | Game rules: a limited sequence's counter is charged when the sequence _starts_; counters for sequences the new character lacks are kept (sentinel −20000); out of memory for block-born monsters no longer quits | behavior change; last is a bug fix                  |
| 16  | Game clock driven by the timer interrupt's `TimerCounter` so pause and replay can hold time                                                                                                                      | behavior change (speed effect not measured)         |
| 17  | MicroChannel keyboard on/off routines; F1 help no longer reads `gmhelp.txt` in a shipped game                                                                                                                    | feature / behavior change                           |
| 18  | `initdirty` grew (cause speculative); `drawbkd` loads from the game folder; new `_GetCol`                                                                                                                        | minor                                               |
| 19  | One immediate in Creative Labs' Sound Blaster code changed (0x258 → 0x252) because its segment sits 6 bytes lower                                                                                                | noise                                               |
| 20  | Highlight colours changed while keeping old names (`DropBloc`'s `Yellow` is now red; load/save screens' `Yellow` is blue)                                                                                        | behavior change (UI); intent speculative            |

## Cross-version timeline of notable behavior changes

Order is the order of the version numbers, as the inventory lists predecessors; see open
question 1 on whether that is the order of the code. Rows marked † are inferences from code,
not observed runs. Dates are not release dates: the pages date builds only through zip
member dates and source file dates (see open question 6).

| build           | change that a player or game author could notice                                                                                              | page                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1.0 → **1.04**  | Super VGA detection by BIOS vendor-string scan (Trident 8800/8900 split)                                                                      | 1.04 #1                          |
|                 | `ShowVideoMemory` and `FIND_BOARD` command-line switches                                                                                      | 1.04 #3                          |
|                 | Mouse coordinates scaled from the driver's real range                                                                                         | 1.04 #4                          |
|                 | Message boxes time out after 30 s by default                                                                                                  | 1.04 #5                          |
|                 | Title graphic is `gmtitle.gif`; missing it exits with code 4                                                                                  | 1.04 #6                          |
|                 | Order-screen text; "Version 1.04"                                                                                                             | 1.04 #7                          |
|                 | Save-failure beeps 10 → 2                                                                                                                     | 1.04 #8                          |
|                 | Restore across scenes continues in the restored scene (†)                                                                                     | 1.04 #14                         |
| 1.04 → 2.00     | _not analyzed_ (167 changed, 92 removed, 144 added functions in the baseline table; 4,608- → 6,144-byte header; image 78,528 → 148,836 bytes) | [pairs.md](player-diff/pairs.md) |
| 2.00 → **2.02** | `.SAV` stores the map view; restore no longer re-centers (†); file format +4 bytes                                                            | 2.02 #1                          |
|                 | Esc quits the title menu                                                                                                                      | 2.02 #2                          |
|                 | Title music-path buffer overflow fixed                                                                                                        | 2.02 #3                          |
|                 | Scroll registers reset on screen resets (†)                                                                                                   | 2.02 #4                          |
|                 | Sprite drawer clears AH, fixing wrong rotation in busy frames (†)                                                                             | 2.02 #5                          |
| 2.02 → 2.04     | _not analyzed_ (271 changed, 41 removed, 43 added; 107 low-confidence matches; file 36 KB smaller)                                            | [pairs.md](player-diff/pairs.md) |
| 2.04 → **3.00** | New `.GAM` format, flat game folder                                                                                                           | 3.0 #4                           |
|                 | Multimedia screens (GIF, BKD, FLI, slide lists) and per-scene music                                                                           | 3.0 #5, #6                       |
|                 | Recording to `.rec`, demo playback                                                                                                            | 3.0 #7                           |
|                 | Named save slots                                                                                                                              | 3.0 #8                           |
|                 | High-score screen redone                                                                                                                      | 3.0 #9                           |
|                 | Software scrolling; hardware start-address paging removed                                                                                     | 3.0 #10                          |
|                 | `gm.cfg` written at exit                                                                                                                      | 3.0 #11                          |
|                 | Counter charging and carry-over rules changed                                                                                                 | 3.0 #15                          |
|                 | Game clock from timer counter (speed effect not measured)                                                                                     | 3.0 #16                          |
|                 | Help (F1) unavailable in shipped games; MicroChannel keyboard routines                                                                        | 3.0 #17                          |

Threads that run through several versions:

- **What a restore keeps.** 1.04 makes the scene loop follow the restored scene; 2.02 makes
  the saved file keep the map view; 3.0 replaces the single save with named slots. 1.04's
  `oldlink` is still not restored, and 3.0 has the same gap (1.04 page, item 14).
- **Title screen.** 1.04 renames the file to `gmtitle.gif` and exits with code 4 if it is
  missing; 2.02 makes Esc quit the menu; 3.0 no longer requires `GMTITLE.GIF` at all.
- **Scrolling.** 1.04 renumbers chip types around the bank-switch code; 2.02 resets the
  scroll registers on screen resets; 3.0 removes hardware start-address paging and adds a
  software fallback.
- **`horizmenu`.** Dead code in 1.0, 1.04, 2.00 and 2.02 (1.04 page, 2.02 page); both
  versions changed it anyway because it is linked from the shared `WINDIO.C`.

## Noise versus semantic changes

**Semantic (changes what the program does):**

| version | items                                                                                                                                                                                                                                                       |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.04    | 1 (VGA detection), 2 (chip renumbering, purpose medium), 3 (switches), 4 (mouse scaling), 5 (message-box timeout), 6 (title), 7 (text), 8 (save beeps), 14 (restore); 10 (monster loop) and 11 (blit masks) are probably semantic but speculative or medium |
| 2.02    | 1 (`.SAV` map view), 2 (Esc), 3 (buffer overflow), 4 (scroll registers), 5 (AH); 6 changes code but not play; 7 is a string                                                                                                                                 |
| 3.0     | 4–11, 13–18, 20 (features, file format, rules, UI); 12 (`SOUND` variable)                                                                                                                                                                                   |

**Noise (the code moved or was compiled differently; behavior is the same):**

| kind                                                                                                                                                                                                                                      | where it appears                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Relocated functions (same code, moved segments and addresses)                                                                                                                                                                             | 1.04: 132; 2.02: 94; 3.0: 179               |
| Data-moved and constants functions (differ only by a DGROUP offset or a moved code pointer)                                                                                                                                               | 1.04: 43 + 9; 2.02: 5 + 4; 3.0: 15 + 32     |
| DGROUP small-variable shifts (+4 from 0x92, +0xA from 0xA5), `_streams` self-pointers (+0x16E)                                                                                                                                            | 1.04                                        |
| Boolean-test temporaries, register choice, `enter` frame sizes, `cld`                                                                                                                                                                     | 1.04 #12, 3.0 #2                            |
| Relocated switch tables, interrupt-handler pointers, sparse-table targets, alignment padding                                                                                                                                              | all three                                   |
| Header and relocation count changes; segment base shifts (+0xA to +0xC paragraphs after the changed code)                                                                                                                                 | all three                                   |
| Tool artifacts: overlapping mis-decodes listed as added or removed functions (`0D04:02BF`, `0D04:0AE9`, `0000:3EDB`), a mis-paired gap, 2.04's `playscene` found as two functions, six "added" 3.00 functions that were in 2.04 all along | 1.04 "Tool artifacts"; 3.0 match statistics |
| New C++ run-time, exception tables, one Creative Labs immediate (0x258 → 0x252), moved far array                                                                                                                                          | 3.0 #1, #19, #3                             |
| Version strings                                                                                                                                                                                                                           | all three (a string, but visible)           |
| Owner-stamp slot (52 bytes) removed                                                                                                                                                                                                       | 3.0 #3 (distribution, not behavior)         |

## Contradictions between the per-version pages

No page contradicts another on a fact about the binaries. These are the conflicts and
corrections found while consolidating; each has a resolution.

| #   | where                            | what                                                                                                                                                                                                                                                                                                                                                                                                     | resolution                                                                                                                                                                                                                          |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | 1.04 page, earlier revisions     | Item 12 called `play`'s change "boolean temporaries" noise; item 8 called 04A1:1493 the _load_ failure; the 17 `errorbox` call sites; an undecoded 0x11AA region.                                                                                                                                                                                                                                        | Amended in the current page: item 14 (behavior change), item 8 (save), 15 call sites, `_streams` pointers. **Use `feature/player-diff-1-04-sav-globals`.** The older `feature/player-diff-1-04` and `…-1-04-gaps` copies are stale. |
| 3   | 3.0 page, match statistics       | The baseline summary's "matched by stage" says norm 176 / call graph 68; its own `functions.tsv` says 178 / 66.                                                                                                                                                                                                                                                                                          | Same matches, two counted under another stage; the 3.0 page uses the per-function labels. No effect on findings.                                                                                                                    |
| 4   | 2.02 page vs 3.0 page on source  | The 2.02 page calls the `PLAYGAME.C` in `code/GM/GM.ZIP` (header "Version 2.04", newest file 1994-06-30) "2.04-era" and says it already has every 2.02 change. The 3.0 page says 2.04's exact source is not held (`PLAYGAME.BAK`, last note Feb 21, 94, is the nearest) and uses `code/GM/PLAYGAME.C` (Aug 8, 94 note) as 3.0's. Neither page says whether the ZIP's `PLAYGAME.C` equals `PLAYGAME.BAK`. | **Unresolved**, low impact: the 2.02 findings rest mainly on the binaries; the source only corroborates.                                                                                                                            |
| 5   | 1.04 page and 3.0 page on source | The 1.04 page confirms its structural findings against the **3.0** source.                                                                                                                                                                                                                                                                                                                               | Labelled as structure only in the 1.04 caveats; 1.04 and 3.0 are not claimed identical.                                                                                                                                             |
| 6   | 2.02 page vs inventory on dates  | The 2.02 page dates 2.00 copies from 1993-09-30 and 2.02 copies from 1993-12-30 (earliest zip dates). The inventory's canonical-copy dates are 1994-12-07 (2.00) and 2026-11-02 (2.02, a repackaging date).                                                                                                                                                                                              | Different copies; the earliest-copy dates are the ones to use, and none is a build date. See open question 6.                                                                                                                       |

## Open questions and low-confidence items

1. **Is 1.04 a predecessor of 2.00?** The inventory lists 1.04 as 2.00's predecessor, but the
   1.04 → 2.00 baseline shows only 61 identical functions with 92 removed and 144 added,
   and the 1.04 copy's zip member date (1996-12-24) is later than the 2.00 copy's
   (1994-12-07). This report's reading, not a finding of any page: 1.04 may be a late build
   of a separate 1.x line. Nobody has checked. Until then the timeline's order is the order
   of the version numbers.
2. **1.04 → 2.00 and 2.02 → 2.04 are not interpreted.** So there is no answer to "when did
   the 1.04 restore-scene fix (item 14), the mouse scaling (item 4) or the message-box
   timeout (item 5) reach the 2.x line?", or "does 2.04 keep 2.02's `.SAV` change, Esc
   handling, `MoveViewScreen` resets and `mov ah,0`?". The 3.0 page compares only against
   2.04 and does not mention these. 2.02 → 2.04 is large: 271 changed functions, 107
   low-confidence matches, and a 36 KB smaller file.
3. **Nothing was run in DOSBox.** All effects on play are inferences: `.SAV`
   incompatibility between 2.00 and 2.02, the title-screen overflow outcome, the
   scroll-register symptom, the sprite rotation symptom, 1.04's restore-scene effect, 3.0's
   counter and clock changes.
4. **Speculative or medium 1.04 items**: monster timestamp loops (item 10), blit nibble
   masks and which chip they belong to (item 11), why the mouse scaling was added (item 4),
   what `FIND_BOARD` is for (item 3), the purpose of the chip-type renumbering (item 2).
   The 1.04 page's `BUGLIST.TXT` link to items 6 and 10 is unverified (that file is an
   internal "Version 1.06" bug list).
5. **Speculative 3.0 items**: that the toolchain is Borland C++ 4.x; the cause of
   `initdirty`'s growth; the intent of the colour changes (item 20); the effect of the
   timer-driven clock on speed (item 16). Function names in "one of" rows of
   `playgame-source.tsv` are not settled, and `PLAYGAME.MAP` is a nearby 3.0 link, not this
   build's map. One low-confidence match was found wrong (`palfindcol`) and two pairs are
   successors, not the same function.
6. **No dating evidence for builds.** Zip member dates date a game's packaging, not a link.
   Only inferences exist: 2.02 built roughly October–December 1993 (from `MEMBLOCA.ASM`
   dated 1993-11-26), and 2.04 built after February 1994 (MicroChannel support).
7. **No 1.01–1.03, 2.01, 2.03, 2.05+ players held.** Every "diff" spans the gap to the
   build held. No changelog for 1.01–1.04, 2.02 or 3.0 player changes exists in the
   repository or the reviewed input corpus.
8. **Control pairs are not interpreted.** In particular 3.00-xfer → 3.00-aj shows 49
   changed and 10 removed functions in the baseline, and 3.00-xfer → 3.00-play shows 6
   changed. The 3.0 page does not say whether the 3.00 player has more than one build.
   Edited copies of 2.02 (`JETDRIVE.EXE`, `BALLIE.DAT`) and other builds (676, 685, 543
   differing bytes in 1.00, 1.04, 3.00 copies) are per-game patches no page covers.
9. **Open leads from the pages:** 1.04's `oldlink` is not restored on a restore and 3.0
   has the same gap (effect inferred). Whether `horizmenu` is called in 3.0 is not stated
   (the 3.0 page lists it among the functions whose menu-title colour changed from 127 to 47, which says nothing about callers). The included shared `mapfile.read_map`
   parser now retains C++ names containing spaces; both attribution and baseline tooling use it.
10. **Tool limits** (from the 2.02 and 1.04 pages): `gmpdiff` misses switch-case bodies bounded
    in an earlier block, `push ax` interrupt handlers and sparse switch tables; `inspect_pair.py
gaps` pairs gaps by the k-th gap after the owning function, so a mis-decoded owner gives
    a wrong partner (now shown as UNPAIRED).

## Files

| file                                            | what                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| [player-diff-1.04.md](player-diff-1.04.md)      | 1.00-xfer → 1.04, 14 items, bytes outside functions                                  |
| [player-diff-2.02.md](player-diff-2.02.md)      | 2.00 → 2.02, 7 changes, byte accounting, relinking noise                             |
| [player-diff-3.0.md](player-diff-3.0.md)        | 2.04 → 3.00-xfer, 20 findings, module accounting                                     |
| [player-diff-3.0/](player-diff-3.0/modules.tsv) | `modules.tsv`, `functions.tsv`, `gaps.tsv`, `playgame-source.tsv`                    |
| [player-diff/](player-diff/README.md)           | baseline tooling output: inventory, pairs, per-pair `functions.tsv` and `summary.md` |
| `scripts/player-diff/`                          | `gmpdiff.py`, `inspect_pair.py`, `attribute.py`, `srcmap.py`, tests                  |
