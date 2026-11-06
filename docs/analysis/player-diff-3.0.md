# What the 3.0 player changed: 2.04 → 3.00 XFERPLAY, from the machine code

The stand-alone player that games ship with (XFERPLAY, renamed to the game's name) went from
version 2.04 to 3.00. This page says what changed between the two binaries, where, and how
sure each finding is. 2.04 is the newest earlier player held; no 2.05–2.99 build has turned
up ([inventory](player-diff/inventory.md)).

|                    | old                                                                                                           | new                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| build              | 2.04 (`Version 2.04`)                                                                                         | 3.00 XFERPLAY (`Version 3.00`)                    |
| copy compared      | the one 2.04 copy held, Breakout: The Rescue's `brkoutsw.exe` (sha256 `e91bfe75bb25a808…`, owner slot masked) | `cd/gm/xferplay.exe` (sha256 `404be3612012488e…`) |
| file / load image  | 119,074 / 112,930 bytes                                                                                       | 160,598 / 152,406 bytes                           |
| code region / data | 84,928 / 28,002 bytes                                                                                         | 144,064 / 8,342 bytes                             |
| functions found    | 413                                                                                                           | 604                                               |

Evidence used, besides the two binaries: the link maps in `code/GM` (`XFERPLAY.MAP` is
2.04's own; `PLAYGAME.MAP` is a nearby 3.0 PLAYGAME link), `XFERPLAY.LNK` (the 3.0
link list), two revisions of the player's source (`code/GM/PLAYGAME.BAK`, headed "Version: 2.04" with
a last note of Feb 21, 94, and `PLAYGAME.C`, which adds the Aug 8, 94 note), the
other `code/` sources. Optional local archive binaries are identified by the public
inventory labels; local folders and private research notes are not published.

**Confidence labels.** _Confirmed_: the machine code shows the change and a second,
independent source agrees (a MAP, the source revisions, a changelog line, the 3.0 documents).
_Speculative_: an inference, however likely, that the evidence does not settle. Each row
says which.

## Summary

The 3.0 player is a large rework of the same program, not a rewrite: 405 of 2.04's 413
functions are found again in 3.00 (98%), and 290 of them are byte-for-byte or address-only
the same. What changed, by subsystem:

| #   | change                                                                                                                                                                                                                                                                                                                     | where (2.04 → 3.00)                                                                                                                                                                  | class                                                 | confidence                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------- |
| 1   | New run-time: Borland's C++ exception handling, `new`/`delete`, RTTI and string-class run-time linked in (88 run-time functions, a new `_TEXTC` segment of 20, exception tables after C++ functions)                                                                                                                       | `_TEXT` 0000:0278–0000:8226, `_TEXTC` 1CCC                                                                                                                                           | other (toolchain/run-time)                            | confirmed; that it is Borland C++ 4.x: speculative   |
| 2   | Different code generation for unchanged source (no tail-merging, stack frames on leaf functions, boolean code, switch layout), plus `abs`/`sign` → own `Abs`/`Sign`                                                                                                                                                        | engine functions in `PLAYGAME_TEXT`, e.g. 03EF:372F → 0826:5614                                                                                                                      | noise (compiler, refactor)                            | confirmed                                            |
| 3   | Relinked layout: owner-stamp slot (`REGSPACE`/`serialnum`) dropped, entry point 0003:0004 → 0000:0000, the 20,000-byte `map[][]` far array moved in front of DGROUP, data offsets shifted                                                                                                                                  | MZ header; `PLAYGAME5_DATA` 1E4A                                                                                                                                                     | noise; the stamp slot removal is other (distribution) | confirmed                                            |
| 4   | New `.GAM` format and a flat game folder: `GameClass`/`SceneFiles` reader, scene links and file names per scene, no `gam\ blk\ pal\ snd\ map\ mon\ chr\ gif\` subfolders                                                                                                                                                   | `loadscene` 03EF:71F8 → 0826:92AD, `chklnk` 03EF:66A4 → 0826:86D7, loaders 03EF:762F–77AF, new 0826:BD91–C9CF                                                                        | feature (file format)                                 | confirmed                                            |
| 5   | Multimedia screens: GIF, BKD backdrop, FLI animation, text and `.lst` slide lists, with their own music, before/after levels and for title, menu, instructions, story, credits, death, win, high scores                                                                                                                    | new `ShowGraphic` 0826:1B4B, `CropScreen`/`UnCropScreen` 0826:14EE/151B, `PlaySong`/`StopSong` 0826:070A/06EA; new modules `FLI_TEXT` 1BA8, `vgaobj_TEXT` 1C41, `FILECLSS_TEXT` 1B4D | feature                                               | confirmed                                            |
| 6   | Title, menu and play loop rewritten around #4 and #5: no `GMTITLE.GIF` needed, menu screen from the game or a default, a graphic menu (`GVertMenu`)                                                                                                                                                                        | `DoGame` 03EF:02DC → 0826:09E1, `play` 03EF:09F6 → 0826:1548, `playscene` 03EF:0CB5 → 0826:2117, `main` 03EF:000E → 0826:0347                                                        | feature / behavior change                             | confirmed                                            |
| 7   | Keystroke recording and playback: every game recorded to `<game>.rec`, a demo played from the menu, a `.rec` file played from the command line, high-score games kept as `data<n>.rec`                                                                                                                                     | new 0826:000E–02AE (`Ascii`, `GetKey`, `Recording::*`), `InitHiScoreRec` 0826:0758; `NewTimer` ISR 03EF:7AD8 → 0826:9F48                                                             | feature                                               | confirmed                                            |
| 8   | Several named save slots (`SavNames.dat`, `game<n>.sav`) instead of one save                                                                                                                                                                                                                                               | `Load_Game` 03EF:1353 → `LoadGame` 0826:2D40, `Save_Game` 03EF:18EF → `SaveGame` 0826:3709, new `SelectGameToLoad`/`Save` 0826:2A94/2B96                                             | feature                                               | confirmed                                            |
| 9   | High-score table redone: separate show and check, "Your Latest Score", a background graphic, no error text on a failed write                                                                                                                                                                                               | `checkhi` 124D:0006 → `CheckHighScores` 19BF:0223, new `ShowHighScores` 19BF:0005                                                                                                    | behavior change                                       | confirmed                                            |
| 10  | Software-simulated scrolling for VGA cards without hardware scrolling (`SoftwareSim` video type, "Simulate" in the setup screen); hardware start-address paging (`viewwindow`) removed                                                                                                                                     | new `_SoftwareScroll` 1C8A:00B7; `DrawScroll` 03EF:6916 → 0826:8949; `force_vga` 11D3:000C → 1953:000B; `viewwindow` 11D3:06C4 removed                                               | feature                                               | confirmed                                            |
| 11  | `gm.cfg`: a static C++ object reads the working folder at start and writes `gm.cfg` back at exit                                                                                                                                                                                                                           | new `ConfigData` ctor/dtor 1781:000C/00D8                                                                                                                                            | feature / behavior change (writes a file)             | confirmed                                            |
| 12  | Sound: the `SOUND` environment variable is no longer read (only `BLASTER`); `FreeSoundSample` added; the unused `savesnd` shrank                                                                                                                                                                                           | `DetectCard` 0DE5:000B → 1546:0005; 1546:03EF added; `savesnd` 0DE5:070C (623 bytes) → `SaveSnd` 1546:070D (126)                                                                     | behavior change; `savesnd` noise                      | confirmed                                            |
| 13  | The file dialog's own DOS critical-error handler ("I can't access the disk!", Retry/Abort), installed while it scanned a directory, is gone                                                                                                                                                                                | 2.04 INT 24h handler at 0E7C:0A77 (231 bytes, undiscovered as a function), installed by the scan 0E7C:0B5E; not in 3.00                                                              | behavior change                                       | confirmed                                            |
| 14  | Text and dialogs: pixel-positioned text (`GWrite`) and RGB color matching (`RGBdata::Match`) replace character-cell text and `PalFindCol` on the player's screens; double-framed boxes; longer file-name buffers (31 → 51 or 81 bytes); menu title color 127 → 47; new `GetChoices`, `GetSaveFile`, `FindDirs`/`FindFiles` | `Display_File`, `Display_Invent`, `Joy_Config`, `DropBloc`, `GMabout`; `WINDIO_TEXT`; new `FINDFILE_TEXT` 1C63; new 189D:0005                                                        | behavior change (UI)                                  | confirmed                                            |
| 15  | Game rules: a limited sequence's counter is charged when the sequence starts, not when it ends; counters of sequences the new character lacks are kept from the previous character (sentinel −20000); out of memory for block-born monsters no longer quits                                                                | `movechars` 03EF:2FFF → 0826:4F56; `StartSceneInits` 03EF:800A → 0826:A4BD; `InitBirthArray` 03EF:7150 → 0826:91F8                                                                   | behavior change; the last a bug fix                   | confirmed                                            |
| 16  | Game clock: the timer interrupt counts `TimerCounter`; the play loop sets the game clock from it, so a pause or a replay can hold time                                                                                                                                                                                     | `NewTimer` ISR 03EF:7AD8 → 0826:9F48; `play` 0826:1548                                                                                                                               | behavior change                                       | confirmed (source); its effect on speed not measured |
| 17  | Keyboard: MicroChannel keyboard on/off routines (PIC mask) added; F1 help no longer reads `gmhelp.txt` in a shipped game                                                                                                                                                                                                   | new `_KeyBoardOff`/`_KeyBoardOn` 14C9:0004/000F; `HelpFiles` 03EF:1D69 → 0826:3CFB                                                                                                   | feature / behavior change                             | confirmed                                            |
| 18  | Smaller: `initdirty` grew (likely a guard); `drawbkd` loads from the game folder ("Error Opening Bkd %s!"); new `_GetCol`                                                                                                                                                                                                  | `DIRTRECT_TEXT` 0D77:0133 → 14D6:0137, `GIFC_TEXT` 1086:07DD → 17F8:07D5, svgaa 1C8A:03CD                                                                                            | behavior change (minor)                               | confirmed; the `initdirty` cause speculative         |
| 19  | One immediate in Creative Labs' Sound Blaster library code changed (0x258 → 0x252): the offset of its 10-byte interrupt stub, which sits 6 bytes lower in 3.00's segment frame                                                                                                                                             | `CT_TEXT` 13FC:01A5 → 1D8A:019F; stub 13FC:0258 / 1D8A:0252                                                                                                                          | noise (layout)                                        | confirmed                                            |
| 20  | Highlight colors changed while keeping old names: `DropBloc`'s `Yellow` is now red, the load and save screens' `Yellow` is blue                                                                                                                                                                                            | `DropBloc` 03EF:2787 → 0826:46DD, `LoadGame`, `SaveGame`                                                                                                                             | behavior change (UI); intent speculative              | confirmed (source); intent speculative               |

Nothing points at a packer: both files are plain, unpacked MZ executables linked by Borland
TLINK, with the same header mark (`0x1E = FB 50`) and the same `Borland C++ - Copyright 1991
Borland Intl.` startup banner.

## Match statistics

From `gmpdiff.py` (the baseline tool) and `attribute.py` (this page's module attribution);
counts are functions unless they say bytes.

| measure                                                                          | value                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| functions found, 2.04 / 3.00                                                     | 413 / 604                                                                                                                                                                                                                                                                                                        |
| matched                                                                          | 405: 98.1% of 2.04's, 67.1% of 3.00's                                                                                                                                                                                                                                                                            |
| by status                                                                        | identical 111, relocated 179, calls-differ 1, data-moved 15, constants 32, changed 67                                                                                                                                                                                                                            |
| unmatched                                                                        | 8 removed (2.04 only), 199 added (3.00 only)                                                                                                                                                                                                                                                                     |
| by match stage (final labels in `functions.tsv`)                                 | bytes 105, normalized text 178, strings 12, shape 40, call graph 66, address order 4                                                                                                                                                                                                                             |
| confidence                                                                       | high 335, medium 53, low 17                                                                                                                                                                                                                                                                                      |
| low-confidence matches checked by hand                                           | 17: 14 right (by strings, MAP order or source order); 1 wrong (`palfindcol` 1128:000D belongs with 189D:00B8, similarity 0.95, not 189D:0005); 2 successor pairs, not the same function (`saveany` 0E7C:1938 ↔ `GetSaveFile` 15BE:18EB; 2.04's directory scan 0E7C:0B5E ↔ `FindDirs` 1C63:000A)                  |
| added functions that were in 2.04 all along, unreached by the disassembler there | 6: 0826:A2D3 (`cleanup` by source order), `SlowKeys`/`FastKeys` 0826:A394/A3A6 (2.04: inside 03EF:7E58+187, same `B8 05 03 … CD 16` code at image 0xBDE9/0xBDF7), 1546:0430 (`ShutSbVocDriver` by MAP order; 2.04 0DE5:043C), 1546:05E3 (2.04 0DE5:05E2), 14D6:017E (`UnInitDirty` by MAP order; 2.04 0D77:0171) |
| so, really new functions                                                         | 193, of which 88 are compiler run-time and 20 the string class                                                                                                                                                                                                                                                   |
| 2.04's `playscene`                                                               | found as two overlapping "functions", 03EF:0CB5 and 03EF:0D85 (an inner entry); one source function                                                                                                                                                                                                              |
| MAP names placed                                                                 | 2.04: 253 from `XFERPLAY.MAP`, 1 more through a match; 3.00: 201 from `PLAYGAME.MAP`, 100 more through matches. The player's own functions are mostly `static`, so its MAP lists only 12                                                                                                                         |
| MAP-name agreement across confident matches                                      | 143 agree, 0 conflict                                                                                                                                                                                                                                                                                            |

The baseline summary's "Matched by stage" line gives norm 176 / call graph 68, while its own
`functions.tsv` (and this page's) labels 178 / 66; the matches are the same, two are counted
under a different stage. This page uses the per-function labels.

Match rate alone would read as "a third of 3.0 is new". By bytes, 3.00's code region grew by
59,136: 20,000 is the moved far array (#3), 20,352 the run-time and string class (`_TEXT`
+17,312, `_TEXTC` 3,040; #1), 5,072 the new FLI, VGA, file-class and directory modules (#5,
#14), 12,912 the player itself (`PLAYGAME_TEXT`), +848 the other modules together, and −48
the owner-stamp slot.

## Module accounting

A Borland large-model program gives each source module its own code segment, in link order.
2.04's 23 code segments line up one to one with `XFERPLAY.MAP`'s, every module has the MAP's
length within paragraph padding, and the MAP's `PLAYGAME_TEXT` publics sit at 2.04's exact
addresses (`_main` 03EF:000E, `minfo::chkhorizwalls` 03EF:372F, `screen(int)` 03EF:97AB):
`XFERPLAY.MAP` is 2.04's own link map. 3.00's 28 segments plus the far array line up with
`PLAYGAME.MAP`'s list, which is also `XFERPLAY.LNK`'s object order, but lengths differ by up
to 1,159 bytes (`PLAYGAME_TEXT`), so `PLAYGAME.MAP` is a nearby 3.0 link, not this one. Every byte of
both code regions is in one row below (`modules.tsv`).

| module (link order)         | 2.04 seg | 2.04 bytes | 3.00 seg | 3.00 bytes | functions 2.04 → 3.00 | ident./reloc. | data-moved/const./calls | changed | removed | added | outside functions 2.04 → 3.00 |
| --------------------------- | -------- | ---------: | -------- | ---------: | --------------------- | ------------: | ----------------------: | ------: | ------: | ----: | ----------------------------- |
| _TEXT (C run-time)          | 0003     |      16064 | 0000     |      33376 | 162 → 249             |           136 |                      24 |       1 |       1 |    88 | 1723 → 5359                   |
| PLAYGAME_TEXT (the player)  | 03EF     |      38848 | 0826     |      51760 | 92 → 128              |            34 |                       4 |      49 |       5 |    41 | 1331 → 2627                   |
| microcnl_TEXT               | 0D6B     |        192 | 14C9     |        208 | 1 → 3                 |             1 |                       0 |       0 |       0 |     2 | 175 → 175                     |
| DIRTRECT_TEXT               | 0D77     |        576 | 14D6     |        592 | 7 → 8                 |             5 |                       0 |       2 |       0 |     1 | 36 → 0                        |
| membloca_TEXT               | 0D9B     |        688 | 14FB     |        704 | 8 → 8                 |             8 |                       0 |       0 |       0 |     0 | 0 → 1                         |
| MOUSEFN_TEXT                | 0DC6     |        496 | 1527     |        496 | 7 → 7                 |             7 |                       0 |       0 |       0 |     0 | 2 → 2                         |
| SOUNDC_TEXT                 | 0DE5     |       2416 | 1546     |       1920 | 8 → 11                |             2 |                       1 |       4 |       1 |     4 | 137 → 0                       |
| WINDIO_TEXT                 | 0E7C     |       7296 | 15BE     |       7216 | 16 → 17               |             6 |                       6 |       3 |       0 |     2 | 380 → 149                     |
| GENC_TEXT                   | 1044     |       1056 | 1781     |       1904 | 10 → 16               |             4 |                       2 |       4 |       0 |     6 | 0 → 103                       |
| GIFC_TEXT                   | 1086     |       2592 | 17F8     |       2640 | 11 → 11               |             7 |                       3 |       1 |       0 |     0 | 14 → 19                       |
| PALC_TEXT                   | 1128     |       2736 | 189D     |       2912 | 9 → 10                |             8 |                       0 |       1 |       0 |     1 | 0 → 0                         |
| SVGAC_TEXT                  | 11D3     |       1952 | 1953     |       1728 | 14 → 13               |            11 |                       2 |       0 |       1 |     0 | 274 → 276                     |
| HISCOREL_TEXT               | 124D     |        896 | 19BF     |       1232 | 1 → 2                 |             0 |                       0 |       1 |       0 |     1 | 0 → 46                        |
| SBMUSIC_TEXT                | 1285     |       1248 | 1A0C     |       1248 | 9 → 9                 |             7 |                       2 |       0 |       0 |     0 | 492 → 496                     |
| JSTICKC_TEXT                | 12D3     |       1104 | 1A5A     |       1104 | 6 → 6                 |             3 |                       3 |       0 |       0 |     0 | 0 → 0                         |
| jsticka_TEXT                | 1318     |         80 | 1A9F     |         80 | 1 → 1                 |             1 |                       0 |       0 |       0 |     0 | 1 → 1                         |
| pala_TEXT                   | 131D     |        128 | 1AA4     |        128 | 4 → 4                 |             4 |                       0 |       0 |       0 |     0 | 0 → 0                         |
| scrnrout_TEXT               | 1325     |        976 | 1AAC     |        976 | 9 → 9                 |             9 |                       0 |       0 |       0 |     0 | 26 → 26                       |
| GRAPHC_TEXT                 | 1362     |       1472 | 1AE9     |       1472 | 6 → 6                 |             6 |                       0 |       0 |       0 |     0 | 0 → 0                         |
| bloca_TEXT                  | 13BE     |        128 | 1B45     |        128 | 2 → 2                 |             2 |                       0 |       0 |       0 |     0 | 0 → 0                         |
| FILECLSS_TEXT (new)         | —        |          — | 1B4D     |       1456 | 0 → 6                 |             0 |                       0 |       0 |       0 |     6 | — → 0                         |
| FLI_TEXT (new)              | —        |          — | 1BA8     |       2448 | 0 → 12                |             0 |                       0 |       0 |       0 |    12 | — → 571                       |
| vgaobj_TEXT (new)           | —        |          — | 1C41     |        544 | 0 → 12                |             0 |                       0 |       0 |       0 |    12 | — → 1                         |
| FINDFILE_TEXT (new)         | —        |          — | 1C63     |        624 | 0 → 2                 |             0 |                       0 |       1 |       0 |     1 | — → 0                         |
| svgaa_TEXT                  | 13C6     |        864 | 1C8A     |       1056 | 9 → 11                |             9 |                       0 |       0 |       0 |     2 | 25 → 26                       |
| _TEXTC (new, string class)  | —        |          — | 1CCC     |       3040 | 0 → 20                |             0 |                       0 |       0 |       0 |    20 | — → 796                       |
| CT_TEXT (SB library)        | 13FC     |        816 | 1D8A     |        816 | 19 → 19               |            18 |                       1 |       0 |       0 |     0 | 124 → 132                     |
| SBFM_MIDI_CODE (SB library) | 142F     |       2256 | 1DBD     |       2256 | 2 → 2                 |             2 |                       0 |       0 |       0 |     0 | 2073 → 2073                   |
| PLAYGAME5_DATA (far array)  | —        |          — | 1E4A     |      20000 | 0 → 0                 |             0 |                       0 |       0 |       0 |     0 | — → 20000                     |
| **total**                   |          |      84880 |          |     144064 | 413 → 604             |               |                         |         |         |       | 6813 → 32879                  |

2.04's other 48 code-region bytes, before its first segment, are the owner-stamp slot (#3).
Status counts are per 3.00 function (removed: per 2.04 function).

**Bytes outside functions.** The baseline counted 31,401 such bytes in 3.00 by summing
function sizes; counting the bytes no decoded instruction covers gives 32,879 (2.04: 6,813).
`gaps.tsv` lists every run with a kind, and every kind is explained:

| kind        | 2.04 bytes | 3.00 bytes | what it is                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ---------: | ---------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| zero        |         20 |     20,044 | 3.00: the zero-filled `map[MLEN][MWID]` far array (`PLAYGAME5_DATA`, `PLAYGAME.C` line 283), now before DGROUP (#3; in 2.04 it is the same 20,000 zero bytes after `_DATA`, image 0x16AE0); padding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| switch-body |      1,283 |      4,475 | case code after a `jmp cs:[bx+table]` whose table the disassembler did not bound; part of the function before it (3.00: `DoGame` 0826:0D82+1,484, `AskConfigData` 0826:B4F0+405, FLI 1BA8:05B6+472, run-time exception code 1,751; 2.04: old `DoGame` 03EF:05FF+545, `AskConfigData` 03EF:8F74+375; both: `SVGAC` 232 bytes at 11D3:022B / 1953:022A, `WINDIO` 131 at 0E7C:14B6 / 15BE:1469)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| prologue    |        437 |        382 | code reached only through a pointer: the timer interrupt `NewTimer` (2.04 03EF:7AD8+145, 3.00 0826:9F48+147), the MicroChannel keyboard handler (3.00 14C9:001A+174; 2.04's 175 bytes at 0D6B:0001 count as "other" because of a leading byte), Sound Blaster IRQ code in `CT_TEXT` (61, both), 2.04's critical-error handler 0E7C:0A77+231 (#13)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| eh-table    |          0 |      1,244 | Borland C++ exception and destructor tables placed after functions that build C++ objects (#1): `_TEXTC` 457, `PLAYGAME_TEXT` 372 (after the class code), `_TEXT` 359, FLI 56                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| jumptable   |         88 |         98 | switch tables the disassembler did bound                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| other       |      4,985 |      6,636 | in both builds: run-time internals of `_TEXT` (the same runs at the same sizes, e.g. 902 bytes at 0003:0D60 / 0000:139D, 303 at 0003:3CEB / 0000:7D7D, 164 at 0003:0AE7 / 0000:0E3E), the Sound Blaster MIDI driver's 2,068 bytes (`SBFM_MIDI_CODE`: the module is identical but for 2 of 2,256 bytes), `SBMUSIC`'s 492/496 bytes and the MicroChannel handler (2.04); 2.04 only: `cleanup`/`SlowKeys`/`FastKeys` (03EF:7E58+187) and switch tables whose cases were not reached (03EF:0887, 03EF:952A); 3.00 only: five more `_TEXT` runs (0000:09C0+157, 19FC+117, 5458+102, 79F2+136, 807C+237), not read one by one, the last three among the new exception-handling functions; switch tables (0826:139E for `DoGame`, 0826:BAEE, FLI 1BA8:07E6), C++ type and handler descriptors holding segment 0826 (0826:0323, 1B19, BFDB, C1A0; GENC 1781:06DB; `_TEXTC` 1CCC:019E, 339 bytes) and two small functions the disassembler missed (GENC 1781:0725+75, HISCOREL 19BF:04A2+46) |

So the unclassified 31,401 bytes the first attempt stopped at are: the moved far array
(20,000), code the disassembler did not reach but whose owner is known (switch bodies,
handlers), C++ exception tables, and run-time and driver data that is the same in both
builds.

## Details by subsystem

### 1. Compiler run-time (`_TEXT`, `_TEXTC`)

_Other: toolchain. Confirmed (module names); the compiler version is speculative._

- 136 of 2.04's 162 run-time functions are identical or relocated in 3.00; the 24
  data-moved/constants ones differ only in DGROUP offsets and code addresses (for example
  `_strtoul` 0003:33CF → 0000:3DE9 loads `0x33C0` → `0x3DDA`, the address of a table that
  moved). One changed: 0003:04A7 → 0000:04CC gains `pop cx; push cs; push cx`, turning a near
  return address into a far one; `__unixtodos` calls a different helper; `SPUSH@`
  (0003:05EB) went. Library-version noise.
- 88 run-time functions are new, and `_TEXTC` adds 20. By the object `PLAYGAME.MAP` places
  each in: `xx.cpp` 46 functions, 10,266 bytes (`_RaiseException` 0000:59CC,
  `__ExceptionHandler` 0000:667F, `__Global_unwind` 0000:5980, `Type_info::~Type_info`
  0000:74B7); `strings.cpp` 22 (20 of them `_TEXTC`); `xxv.cpp` 6; `new.cpp` 6; `xmsg.cpp`
  5; `xalloc.cpp` 4; `ctor3.cpp` 3; `ctor2.cpp` 2; `movmem.cas` 2; one each in `xxa.cpp`,
  `vnewf.cpp`, `newf.cpp`, `newarray.cpp`, `newfarry.cpp`, `delarray.cpp`, `memcmp.cas`,
  `tolower.c`, `cputype.asm`; a 48-byte function the table puts in `strcpy.cas` that is
  `strcmp` by its MAP length (0000:3C81); and two small ones at `c0.ASM` and `dosfattr.cas`
  (where the object table may be a few bytes off). The strings `xalloc`, `xmsg`,
  `Bad_cast`, `Bad_typeid`, `Type_info`, `<notype>`, `BCCxh1`, `Out of memory` and
  `lengtherror` are new with them.
- `_TEXTC` (1CCC, 20 functions) is Borland's `string` class (`string::~string()`
  1CCC:02F1, `TStringRef::check_freeboard()` 1CCC:0714, "String reference out of range").
  No 3.0 source in `code/` uses `string`; it is most likely pulled in by `xmsg`, whose
  message is a `string` (speculative).
- Why: 3.0's code allocates with `new`/`delete` (`PLAYGAME.C` `main`, `cleanup`, the new
  classes), and `GENC.C`'s `ConfigData` calls `set_new_handler(0)`. Exception handling,
  RTTI and the `string` class arrived with Borland C++ 4.0, which fits this run-time; the
  binaries carry no version number to confirm it, and both keep TLINK's `FB 50` mark and the
  1991 startup banner.

### 2. Code generation (noise)

_Noise. Confirmed: the source of these functions is the same in `PLAYGAME.BAK` and
`PLAYGAME.C` (`playgame-source.tsv`, column `source_change` = `same`)._

Of `PLAYGAME_TEXT`'s 49 changed matches, 13 have the same source in both revisions
(`playgame-source.tsv`, `source_change` = `same`) and 17 cannot be pinned to one source
function by the script (mostly the loader, keyboard and timer block, whose source is largely
unchanged too). Read side by side, their differences are compiler habits, not logic:

- 2.04 merges common tails, 3.00 does not. `DoBlockTouchChar` 03EF:5806 has 4 calls to
  `DoSound` (`push 0; jmp` to a shared `call`), 3.00's 0826:77FA has 9, one per source call;
  `moveallmons` 03EF:4337 → 0826:6283 duplicates two call sites the same way.
- 3.00 gives leaf functions a stack frame (`push bp; mov bp,sp; pop bp` added in 03EF:2B72,
  03EF:2C81, `chkmapbounds` 03EF:5686).
- One source refactor with the same arithmetic: `abs()`/`sign()` became the program's own
  `Abs()`/`Sign()`, so 2.04's inline `cwd; xor; sub` became `cmp; jle; neg`
  (`minfo::Bresenhams` 03EF:4F99 → 0826:6F22, `BresenhamScroll` 03EF:6E9D → 0826:8F2B,
  `ShiftEverything` 03EF:6F6C → 0826:900C).
- Switch arms and boolean results laid out differently (`minfo::ChkHorizWalls` 03EF:372F,
  `ChkVertWalls` 03EF:38E0, `ChkMonChr` 03EF:3BDF, `PicChkTouch` 03EF:4043, `MonPicNum`
  03EF:3B7E).

Whether this is the newer compiler of #1 or other switches is speculative.

### 3. Link layout and the owner-stamp slot

_Noise, except the stamp slot (other: distribution). Confirmed._

- 2.04 links `regspace.obj` first (`XFERPLAY.MAP`: segment `AAAA` at 0000:0000, 0x34 bytes,
  public `serialnum`, marked `idle`: nothing reads it). `REGSPACE.ASM` fills it with
  `abcd…xyz` twice, a placeholder that each transferred copy carries filled in (the baseline
  masks it as the owner stamp); it is why 2.04's entry is 0003:0004. 3.0's `XFERPLAY.LNK` has no `regspace.obj`, 3.00's entry is 0000:0000 and the
  baseline finds no stamp slot. 3.0 games no longer carry the maker's name in the player.
- `PLAYGAME5_DATA`, the 20,000-byte `map` array, is zero-filled in both; 2.04 places it after
  `_DATA` (image 0x16AE0), 3.00 before DGROUP (segment 1E4A). That moves 20,000 bytes from
  the baseline's "data" column to its "code region" column.
- The header grew from 6,144 to 8,192 bytes for 1,465 relocations (1,108); the minimum
  allocation fell from 1,957 to 1,857 paragraphs as `_BSS` shrank (0x79C0 → 0x73E4 in the
  MAPs).
- The 15 data-moved functions (`SBMUSIC`, `JSTICKC`, the run-time) and most of the 32
  constants ones differ only by DGROUP offsets that moved together.

### 4. `.GAM` format and game folder

_Feature (file format). Confirmed: `PLAYGAME.C`'s header ("Aug 8, 94 - … new grator
format"), the source of `GameClass::Load`, and the strings._

- 2.04 builds every file name from a subfolder and an extension: the strings `gam\`, `blk\`,
  `pal\`, `snd\`, `map\`, `mon\`, `chr\`, `gif\` and the extensions `.bbl .cbl .mbl .pal
.map .mon .chr .snd .cmf` are all gone from 3.00 (`.txt`, `.gif` and `.gam` remain once
  each, for `ShowGraphic` and the game file).
  `PLAYGAME.BAK` line 525 loads the game with `loadany(…,".gam","gam\\",
sizeof(integratorstruct)*MAXSCENES,…)`.
- 3.00 reads one `.GAM` holding a header, the scene table and a block of file names
  (`GameClass::Load`, `SceneFiles::Load`, `PLAYGAME.C` lines 5156–5194); file names come
  from `Game.File(scene, n)` under the working folder. `loadscene` 0826:92AD (2,147 bytes,
  was 1,079) and the four loaders 03EF:762F–77AF → 0826:9B10–9C42 (source: one argument
  instead of name, extension and folder) follow.
- The scene-link table changed shape: `chklnk` 03EF:66A4 → 0826:86D7 now indexes scenes by
  0x11B bytes instead of 0x14A and reads `From`/`To` at offsets 0x53–0x5B instead of
  0x6F–0x77 (source: `scns[].links[]` → `Game.scns[].links[]`, `MAXLINK` →
  `MAXSCENELINKS`).
- The 19 functions added after `Screen` (0826:BD91–C9CF) are the `GameClass`/`SceneFiles`
  code and out-of-line copies of inline class members (one holds `UnTitled`, the default
  scene name from `GRATOR.H`); their exception tables follow (0826:C332, C5E6, C6D5, C83D).
  Which is which, function by function: speculative.

### 5. Multimedia screens

_Feature. Confirmed: `PLAYGAME.C` header ("GIFs,FLIs between scene support"), the 3.0
specification sheet ("'slide show' style FLI animations, still pictures, text … before or
after all game levels"), new strings and modules._

- `ShowGraphic` (0826:1B4B, strings `.gif .bkd .fli .txt .lst`) shows one file by
  extension: a GIF or a backdrop, an FLI played, a text file, or a `.lst` list of
  files each with its own pause (`FileListClass`, `PLAYGAME.C` lines 1255–1320).
- New modules in `XFERPLAY.LNK`: `fli.obj` (`FLI_TEXT` 1BA8, 12 functions; `FLI::View`,
  run-length and color chunks; source `code/Image/FLI/FLI.CPP`; its debug format "New Frame:
  %d Size:%5lu Chunks:%u" ships in the binary), `vgaobj.obj` (1C41, 12 functions: the
  256-color VGA drawing object, palette writes to port 3C8h; `code/DRV/VGAOBJ.ASM`),
  `fileclss.obj` (1B4D, 6 functions: buffered `FileRead`/`FileWrite`;
  `code/DRV/FILECLSS.CPP`).
- `CropScreen`/`UnCropScreen` (0826:14EE/151B) program the CRTC (ports 3D4h/3D5h).
- `PlaySong`/`StopSong` (0826:070A/06EA) start and stop the song file the game names for a
  screen (2.04 built `.cmf` names itself; that string is gone).

### 6. Title, menu and play loop

_Feature and behavior change. Confirmed (source `DoGame`, `play`; strings)._

- 2.04's `DoGame` (03EF:02DC) required `GMTITLE.GIF` ("You are missing Game Maker's Title
  Screen (gmtitle.gif)!") and showed instructions, story and credits as text files.
  3.00's `DoGame` (0826:09E1) plays the game's title graphic and music, then a menu
  over the game's own menu screen or a default one, drawn by the new `GVertMenu` (0826:07EA);
  instructions, story, credits and the high-score background are `ShowGraphic` files, with
  "No game-specific …" fallbacks (now ending in a period).
- `play` (03EF:09F6 → 0826:1548) shows each scene's before and after graphics, a win
  graphic and song and a death graphic and song, and records high-score games (#7, #9).
  `playscene` (03EF:0CB5, whose inner part the disassembler also took for a function at
  03EF:0D85, matched to 0826:2117) runs one scene with the new link table (#4) and the
  counter carry-over (#15; it calls `StartSceneInits` at 0826:22F2).
- `main` (03EF:000E → 0826:0347) loads the game through `GameClass`, accepts a `.rec` file
  ("Playback with %s.") and still reports MicroChannel.
- The menu items' strings are the same (`GameMenu` 03EF:091D → 0826:1438, drawn in a
  passed color).

### 7. Recording and playback

_Feature. Confirmed: `#define RECORDER` is commented out in `PLAYGAME.BAK` and on in
`PLAYGAME.C` (line 95); `Recording` strings and code are only in 3.00._

- New: `Ascii`, `GetKey` and the `Recording` methods (0826:000E–02AE; six binary functions
  for seven source ones). Key reads that used `bioskey` now go through `GetKey`, which
  records them or feeds them from a recording (`getjoydat` 03EF:2649 → 0826:458F,
  `Display_File`, `PauseTimeKey`).
- Each game played from the menu is recorded to `<game>.rec`; a high score saves the
  recording as `data<n>.rec` (`play`, `%sdata%d.rec`); when the menu sits idle for 30
  seconds (`GVertMenu(…,30,…)`, choice 7) the game's demo file plays; a `.rec` argument plays
  a file. `InitHiScoreRec` (0826:0758, `data*.rec`)
  is linked but only called under `REPLAYHIGHSCORES`, which is off.
- Changelog cross-check: `code/GM/BUGDATA.TXT` lists 3.0-era test items "Increase Demo Time",
  "No demo... seems to play anyway", "Turn off demo on ESC", "Recording Play is recieving F6
  (load) key".

### 8. Save slots

_Feature. Confirmed (strings, source)._ `Load_Game` (03EF:1353, one `.sav`, "You have not saved
a game!") is replaced by `LoadGame` (0826:2D40, "This game has not been saved!") and
`SelectGameToLoad`/`SelectGameToSave` (0826:2A94/2B96), which list named slots from
`SavNames.dat` and use `game<n>.sav`; `SaveGame` 0826:3709 asks with the new `GetSaveFile`.

### 9. High scores

_Behavior change. Confirmed (strings; `HISCOREL.C` is 3.0's)._ 2.04's single `checkhi`
(124D:0006, 896 bytes; "Top Ten Scores", "Problem writing Top Score File") becomes
`CheckHighScores` (19BF:0223) and `ShowHighScores` (19BF:0005, "Top Ten Scores", and new
"Your Latest Score"), drawn with `GWrite` over the game's high-score graphic, waiting at most
30 seconds (`PauseTimeKey(30)`). The write-error message is gone. Both keep `<game>.his`.

### 10. Software-simulated scrolling

_Feature. Confirmed: `SVGA.H` inserts `SoftwareSim` before `NoType`, and the binary shows
the shift._

- `force_vga` (11D3:000C → 1953:000B) builds the chip-name table on the stack: 0xFC bytes →
  0x216 and `NoType` 12 → 13, exactly the source's 12×21-byte table → 13×41 with "be
  simulated in Software". The configuration default at 12D3:0398 → 1A5A:0396 changes
  0xC → 0xD and 11D3:034F → 1953:034E compares with 12 instead of 11, for the same reason.
- `DrawScroll` (03EF:6916 → 0826:8949) and `drawmap` (03EF:783A → 0826:9CAF) call the new
  `_SoftwareScroll` (1C8A:00B7) when the video type is 12; the setup screen lists
  "Simulate" (`PLAYGAME.C` line 4787).
- 2.04's `viewwindow` (11D3:06C4, sets the CRTC start address, registers 0Ch/0Dh, and Tseng
  register 33h, called from 8 places) is gone; `DropBloc` now sets `zeroaddon`/`zeropage`
  instead of calling it.

### 11. `gm.cfg`

_Feature and behavior change. Confirmed._ `GENC.C`'s global `ConfigData` object
(constructor 1781:000C, destructor 1781:00D8, both referencing `gm.cfg`) reads the working
folder from `gm.cfg` at start-up and writes it back when the player exits (in whatever folder
is current), then switches to text mode if the palette was changed. 2.04 has no `gm.cfg` string.

### 12. Sound

_Behavior change; the `savesnd` removal is noise. Confirmed._

- `DetectCard` 0DE5:000B → 1546:0005 lost its `getenv("SOUND")` call (the `SOUND` string is
  gone; `SOUNDC.C` line 39 has it commented out). Only `BLASTER` is read.
- `savesnd` (0DE5:070C, 623 bytes) became a 126-byte `SaveSnd` (1546:070D, by MAP order);
  both MAPs mark it `idle`, so the player never calls it either way. `FreeSoundSample`
  (1546:03EF, by MAP order) is new.
- A byte compare became a word compare (`mov al,[x]; cbw; cmp ax,1` → `cmp word [x],1`) in
  `initsbvocdriver` and `playsbvocfile`: a flag variable widened. Noise.

### 13. Critical-error handler

_Behavior change. Confirmed._ In 2.04 the file dialog's directory scan (`findfiles`,
0E7C:0B5E, "%s*.*") swapped in its own INT 24h handler, `NewCritError` (0E7C:0A77, 231
bytes, found only as gap code), so a missing floppy gave "I can't access the disk! Did you
remember to insert one?" with "(R)etry (A)bort" and "This directory doesn't exist!". In 3.0's
`WINDIO.C` that scan is commented out, `FINDFILE.CPP`'s `FindDirs`/`FindFiles` replace it
without a handler, and the handler survives only in the editor's `UTILITY.C`, which the
player does not link. The strings are gone from 3.00. What DOS then shows on such an error
was not tested (speculative: its own Abort/Retry/Fail).

### 14. Text, dialogs and files

_Behavior change (UI) and features. Confirmed by `WINDIO.BAK`/`WINDIO.C`,
`GENC.BAK`/`GENC.C` and the binary._

- Screens use pixel-positioned `GWrite` instead of character-cell `Gwritestr`, find colors with
  `RGBdata::Match` (189D:0005, new; `PalFindCol` 1128:000D → 189D:00B8 is nearly the same,
  similarity 0.95, and `PLAYGAME.MAP` marks it `idle`, unused) and draw double frames (`Display_Invent`, `Display_File`, `Joy_Config`,
  `DropBloc`). `Display_File` saves and restores the screen, waits with a time-out, and Esc
  skips the rest.
- File-name buffers grew from 31 bytes to 81 (`loadany`, `getstr`) or `MAXFILENAMELEN` = 51
  (`delany`); the stack frames show it: `loadany` 0x24 → 0x56, `getstr` 0x08 → 0x56,
  `delany` 0x66 → 0x86.
- The menu title color `PGMTITLECOL` is 47 (`GMGEN.H`); 2.04 pushes 127 where 3.00 pushes
  47 (`getfname` 0E7C:000B, `errorbox` 0E7C:0F36, `vertmenu` 0E7C:120D, `horizmenu`
  0E7C:13F5, 0E7C:1484).
- New `GetChoices` (15BE:000B) and `GetSaveFile` (15BE:18EB, which takes `saveany`'s match),
  both named by `PLAYGAME.MAP`'s order,
  and `FindDirs`/`FindFiles` in `FINDFILE.CPP` (1C63) replacing `getfname`'s own directory
  scan (0E7C:0B5E). `GENC` adds `FileExt`, `ParseFile`, `SetTextColors` (by MAP order);
  `PauseTimeKey` (1044:000A → 1781:019B) now also returns on a mouse button and reads keys
  through `GetKey`.

### 15–16. Game rules and timing

_Behavior changes. Confirmed by source; the machine code matches where shown._

- `movechars` (03EF:2FFF → 0826:4F56): the "decrement this sequence's counter" step moved
  from the sequence's last frame to its first. A limited move is paid for when it starts.
- `StartSceneInits` (03EF:800A → 0826:A4BD): counters of sequences the new character has no
  key for are set to −20000 and then filled from the previous character's values; 3.00 has
  `cmp/mov word [x], 0xB1E0` (−20000) at 0826:A50A and A58B, 2.04 has none.
- `InitBirthArray` (03EF:7150 → 0826:91F8): 2.04 showed "NOT ENOUGH MEMORY!" and quit;
  3.00 returns false and the scene runs without block-born monsters. Bug fix.
- `NewTimer` (found only as gap code: 03EF:7AD8 → 0826:9F48) counts `TimerCounter`; the
  play loop copies it into the game clock and a pause or menu wait resets it
  (`PLAYGAME.C` lines 1404–1455, 1663). The effect on game speed was not measured:
  speculative beyond the source.

### 17. Keyboard and help

_Confirmed._ `microcnl` gains `_KeyBoardOff`/`_KeyBoardOn` (14C9:0004/000F, `out 21h`,
masking IRQ 1). `HelpFiles` (03EF:1D69 → 0826:3CFB) no longer opens `gmhelp.txt`; the 3.0
`GMHELP.TXT` says "This help will not appear in a transferred game."

### 18–20. Smaller items

- `DIRTRECT`: `initdirty` (0D77:0133 → 14D6:0137) grew from 62 to 71 bytes; 3.0's
  `DIRTRECT.C` returns early when the buffer already exists, which fits (no older source to
  compare: speculative that this is the change). 14D6:017E is not new: 2.04 has the same code
  at 0D77:0171 (`uninitdirty`), where the disassembler missed it.
- `GIFC`: `drawbkd` (1086:07DD → 17F8:07D5) loads from the game folder ("Error Opening Bkd
  %s!" instead of "Error Opening %s!" under `gif\`). Confirmed.
- `svgaa`: new `_GetCol` (1C8A:03CD). Confirmed (MAP name).
- `CT_TEXT` 13FC:01A5 → 1D8A:019F (`sbcl.lib`'s `cardhere.ASM`): `mov dx,cs; mov ax,0x258`
  becomes `0x252`. That is the offset of a 10-byte interrupt stub, at 13FC:0258 in 2.04 and
  1D8A:0252 in 3.00: the whole module sits 6 bytes lower in its segment frame (its handler
  gap moves from 13FC:0057 to 1D8A:0051 the same way). Layout noise. Confirmed.
- Colors with old names: 2.04's `DropBloc` picked `Yellow=PalFindCol(60,60,0,…)`; 3.00's
  sets `Pixel Yellow = RGBRed.Match(colors)`, and `LoadGame`/`SaveGame` set `Yellow` from
  `RGBBlue` under a "bright yellow" comment. The pattern looks like a deliberate recolor
  that kept the names, not a bug; the intent is speculative.

## Cross-check against change notes

| source                      | what it says                                                                                                        | agrees with                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `code/GM/PLAYGAME.C` header | "Feb 21, 94 - MicroChannel kbd support added." / "Aug 8, 94 - GIFs,FLIs between scene support + new grator format." | MicroChannel is already in 2.04 (`_MicroChannel` 0D6B:00B0), so 2.04 was built after February 1994; #4, #5 |
| `code/GM/GMGEN.H`           | `GMVER "3.00"`, `PGMTITLECOL 47`                                                                                    | version string; #14                                                                                        |
| `code/GM/BUGDATA.TXT`       | demo, recording, directory-structure and help items                                                                 | #4, #7, #17                                                                                                |
| `code/GM/BUGLIST.TXT`       | "Version 1.06 Bug List"                                                                                             | nothing here (older)                                                                                       |
| 3.0 demo `GMHELP.TXT`       | "This help will not appear in a transferred game."                                                                  | #17                                                                                                        |

No 3.0 release notes listing player changes have been found.

## What the tools cannot see

- Machine-code equality says nothing about data the code reads; DGROUP changed with the new
  features (the baseline summary lists its strings).
- `PLAYGAME.BAK` is the nearest earlier source, not 2.04's exact source; `PLAYGAME.MAP` is not
  this 3.00 build's map. Findings that rest on them say so.
- Function identities in "one of" rows of `playgame-source.tsv` are not settled. In 2.04's
  loader, keyboard and timer block (03EF:762F–870D, 19 functions for 23 source functions,
  4 of which are gap code: `NewTimer`, `cleanup`, `SlowKeys`, `FastKeys`) this page names only
  what other evidence fixes: `DoSound` 03EF:7F13 (the target of `DoBlockTouchChar`'s sound
  calls), 03EF:7F83/7F95 (program the timer, ports 40h/43h: `SlowTimer`/`FastTimer` by
  source order), `StartSceneInits` 03EF:800A (its 3.00 partner holds the −20000 sentinel),
  `getmem` at 03EF:83A5 (`XFERPLAY.MAP`; inside the 50-byte function at 03EF:837B), and
  `AskConfigData` 03EF:870D (strings).
- Nothing was run; behavior described is read from code.

## Files

| file                                                                                 | what                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`player-diff-3.0/modules.tsv`](player-diff-3.0/modules.tsv)                         | each module on each side: segment, MAP length, span, functions by status, bytes outside functions by kind                                                                    |
| [`player-diff-3.0/functions.tsv`](player-diff-3.0/functions.tsv)                     | every function of both builds: module, MAP object, name and where it came from, status, partner, similarity, confidence, an other-side gap that holds the same code, strings |
| [`player-diff-3.0/gaps.tsv`](player-diff-3.0/gaps.tsv)                               | every run of code-region bytes outside functions, with its kind and the function before it                                                                                   |
| [`player-diff-3.0/playgame-source.tsv`](player-diff-3.0/playgame-source.tsv)         | `PLAYGAME_TEXT` functions attributed to `PLAYGAME.BAK`/`PLAYGAME.C` functions, with whether the source changed                                                               |
| [`player-diff/pairs/2.04__3.00-xfer/`](player-diff/pairs/2.04__3.00-xfer/summary.md) | the baseline report: match table, header, services, ports, data and strings                                                                                                  |

## Commands

From the repository root. The work folder must hold an inventory of the same optional
archive corpus: `uv run scripts/player-diff/gmpdiff.py all --reference "$CORPUS"`.
`CORPUS` is the directory containing `reference/archive/`; Deark must be available for
packed inputs. Without that corpus, the earlier-build comparisons cannot be reproduced.

```sh
# Baseline reports for every pair (reproduces docs/analysis/player-diff/ byte for byte).
# Run without --pair: names flow from PLAYGAME.MAP along builds.toml's pair order, so
# "diff --pair 2.04 3.00-xfer" alone leaves 3.00-xfer's name column empty.
DEARK=~/.cache/gm-player-diff/tools/deark/deark uv run scripts/player-diff/gmpdiff.py diff

# Module attribution, MAP names, gap classification and other-side gaps for this pair
uv run scripts/player-diff/attribute.py --pair 2.04 3.00-xfer \
    --old-map code/GM/XFERPLAY.MAP --new-map code/GM/PLAYGAME.MAP \
    --out docs/analysis/player-diff-3.0

# PLAYGAME_TEXT functions against the two source revisions
python3 scripts/player-diff/srcmap.py docs/analysis/player-diff-3.0/functions.tsv \
    --module PLAYGAME_TEXT --old 2.04 code/GM/PLAYGAME.BAK --new 3.00-xfer code/GM/PLAYGAME.C \
    --out docs/analysis/player-diff-3.0/playgame-source.tsv

# Reading one change: the normalized diff, then both listings
W=~/.cache/gm-player-diff
less $W/pairs/2.04__3.00-xfer/0761F_0D874.diff            # ChkHorizWalls
grep -n -A80 '^; ---- 03EF:5806' $W/listings/2.04.lst      # DoBlockTouchChar, 2.04
grep -n -A80 '^; ---- 0826:77FA' $W/listings/3.00-xfer.lst # and 3.00
```

Both scripts are deterministic: two runs give byte-identical outputs. Source comparisons
for single functions were read with `diff` on the two files after removing carriage returns.

`attribute.py` and the baseline both read MAP publics with `gmpd/mapfile.read_map`, which
keeps C++ names whose argument lists contain a space (`movewindow(unsigned char)`). Before
that fix the baseline dropped them, and its name columns missed 13 PLAYGAME.MAP names.
