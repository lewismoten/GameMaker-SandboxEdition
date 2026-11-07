# Game-Maker player, editor and XFERGAME versions: how the program grew (1.0 → 3.0)

This chapter compares the original shareware releases, the original CD (`cd/`), the 3.0 source `code/GM` (with its `GM.ZIP` 2.04 snapshot) and the March 1995 3.0 demo. No program was run; the comparison reads file headers, segment layout, strings, byte differences between same-size copies and a few disassembled slices. Sources are cited as `FILE:line` (source) or `@offset` (binary file offset).

Players carry 1990s owners' names and serials. This chapter says **owner stamp** and copies no name, serial or address. Inferences are marked **[inference]**. Confidence is high unless marked otherwise.

## 1. Timeline

| version                  | date clues                                                                                                                                                              |                                                                                                                player size (bytes) | compiler / runtime                                                                                                            | notable added (+) / removed (−)                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0**                  | kit files dated 1992-03-22…31; banner "Version 1.0"; source headers "GameMaker V1.05 … Copyright 1991" (`MON.H:1-2`, `MAP.H`)                                           | XFERPLAY 82,802 (kit); **82,803** in shipped games (= XFERPLAY + one 0xFF); PLAYGAME 83,092 (menu build, never shipped with games) | Borland C++ ©1991 (`@12FF4`), standard c0, large model, TLINK stamp 30h, header 288 paragraphs                                | Baseline: **PC speaker only**, VGA chipset table, external `joysetup.exe`, per-component data files, KD Software order screen, owner stamp in the data segment (`@13099`)                                                                                                                |
| **1.04**                 | no internal date; source `ABOUT.HLP` row 15 "Version 1.04"; internal "V1.06" in 1992-93 (`CHK.C:251`, `BUGLIST.TXT:2`, `cd/gm/gogm.bat:3` "June 23, 1993")              |                                                                                                                             83,136 | same as 1.0                                                                                                                   | + Trident 8800/8900 identification, `ShowVideoMemory` debug switch, `FIND_BOARD`, title names `gmtitle.gif`; order text routed to dealers; owner-stamp slot moves to `@13084` and gains a 0xDC marker                                                                                    |
| **2.00**                 | 2.0 demo `DEMO.BAT` 1992-11-16; `GM_SPEC.TXT` 1993-05-26; `GENINPUT.HPP`/`TIMER.HPP` "GAME-MAKER V2.0", created June 1, 1992; `BYTENUMS.H` "Aug 11,92" (stamp location) |                                                                                                                            154,980 | BC++ ©1991 + Creative "FM-Music Functions … 1990" library (`@15910`), TLINK stamp 50h, header 384 paragraphs, CS:IP 0003:0004 | + **Sound Blaster** (CMF music, VOC, `sndblast.drv`, `BLASTER`), config screen (`config.dat/.hlp`, VGA chip choice), save/load game, disk-error dialogs, missing-files list, owner stamp moved to a dedicated segment at file 0x1800; − `joysetup.exe`, `gamemake.opt`, `gam\*.txt` help |
| **2.02**                 | none internal                                                                                                                                                           |                                                                                                                            155,156 | same as 2.00                                                                                                                  | Only the version string changes; code +176 B (bug fix [inference])                                                                                                                                                                                                                       |
| **2.04**                 | `GM.ZIP:GEN.H:17-18` GMVER "2.04", newest files 1994-06-30; `PLAYGAME.C:5` "Feb 21, 94 – MicroChannel kbd support added"; `STARTUP.ASM` 03-07-94 (`code/GM/FILES`)      |                                                                                                              **119,074** (smaller) | custom startup (`startupl.obj`: "GM:Abnormal program termination." `@16401`) + BC++ 3.1 RTL                                   | + MicroChannel detection, errno message table, more mouse code (int 33h, low confidence); file shrinks by 36 KB alongside stored-zero/layout differences (§3.4); exact cause [inference]                                                                                                                 |
| **3.00 early** (A-J.EXE) | after "Aug 8, 94" (`PLAYGAME.C:6`)                                                                                                                                      |                                                                                                                            160,784 | BC++ 4.x C++ library + custom startup, header 512 paragraphs                                                                  | + FLI, `.lst` slide lists, GIF/BKD between scenes, `.rec` recorder, numbered saves, `gm.cfg`, single-file `.gam`; still carries an empty owner-stamp placeholder (`@0x2000`)                                                                                                             |
| **3.0 XFERPLAY**         | `INSTALL.CPP:88-89` "August 24,1994 Version 3.00"; all 343 stock copies identical                                                                                       |                                                                                                                            160,598 | custom startup (©1991 string from the author's own c0) + BC++ 4.x library                                                     | − owner stamp segment (CS:IP back to 0000:0000), − keyboard ASCII tables, − "insert a disk" errors; + "be simulated in Software" VGA, "This game has not been saved!", "(A)bort Save (R)etry"                                                                                            |
| **3.0 PLAYGAME**         | dated 1994-09-03 15:25 (byte-identical copy in the March 1995 demo)                                                                                                     |                                                                                                                            163,130 | standard BC++ 4.x `c0l.obj`, "Copyright **1994**" (`@25B4A`), "NULL CHECK"                                                    | the same player as XFERPLAY plus the game-picker menu, `.gam` load-failure box, level-design warning, general F1 help (§4)                                                                                                                                                                  |

**Packers.** No player or Game-Maker editor is packed. There is no PKLITE, LZEXE, EXEPACK or DIET signature, entropy is 5.0–6.9 bits/byte, and no image has overlay bytes. The only packed file is the third-party 1988 GIF converter `CVTGIF.EXE` (EXEPACK) in the 1.00 kit. PKLITE-packed games in the collection (FIGHTER.EXE, YUFEX.EXE) were packed by their authors [inference]. The 3.0 install floppies use LHarc `.lzh` archives (`FLOPINST.CPP:26,196`).

**Memory model.** Every build is large model: `bcc -ml -1 -O2`, `tasm /ml /jP286N`, `tlink /s/c` (`MAKERS.MAK:1-9`). It targets 80186/286 instructions with no floating point. SS:SP is always DGROUP:0080.

### Editors and the launcher ("GAMEMAKR")

| install               | launcher                                                                                                                                                                                     | editors (bytes)                                                                                                                                                  | compiler                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1.00 (1992-03-22…31)  | GM.EXE 43,146: C menu (Play/Design/Utilities/About/Quit/Help) with the Utilities submenu (Backup, Restore, **Transfer**, Joystick) built in; reads `playgame.reg`                            | PALCHOS 43,106; BLOCEDIT 57,160; MONEDIT 61,334; MAPMAKER 47,724; CHAREDIT 66,590; IMAGE 50,698; SNDEDIT 56,178; GRATOR 74,380; JOYSETUP 29,500; JOYDIAGS 30,776 | BC++ ©1991, standard c0                                   |
| 2.0 demo              | none: a GIF slideshow of editor screenshots (`DEMO.BAT`, third-party MSC viewer CGIF.EXE) plus one game with a stamped 2.00 player                                                           | **no editor binaries exist in the collection**                                                                                                                      | n/a                                                       |
| 3.0 CD                | gm.exe 1,147-byte assembly EXEC loop (`GM.ASM:26-40`; INT 21h 4B00h, then 4Dh return code picks the next tool) + MENU.EXE 52,448 + **UTILITY.EXE 61,780** (Backup/Restore/Transfer/Joystick) | PALCHOS 78,912; BLOCEDIT 107,960; MONEDIT 96,436; MAPMAKER 89,690; CHAREDIT 104,798; IMAGE 84,614; SNDEDIT 99,072; GRATOR 116,800                                | BC++ 3.1 (C++ compile) + custom `startupl` ("GM:" errors) |
| 3.0 demo (1995-03-04) | the same 11 DOS tools at slightly different sizes + GMWIN.EXE 545,312 (Visual Basic 3 Windows menu, 1994-10-24)                                                                              | all saves disabled except Maps; Transfer compiled out; no XFERPLAY shipped                                                                                       | as CD                                                     |

"GAMEMAKR" is only the 1995 demo zip's name. No GAMEMAKR.EXE exists.

## 2. XFERGAME, XFERPLAY and PLAYGAME

**XFERGAME.EXE never existed as a file.** No zip, `cd/` or `code/` contains it. The 1995 demo `README.TXT:270-271` uses the name as a module label: "XFERGAME For creating standalone games (not on this demonstration disk)". The step is a menu item:

- **1.00:** GM.EXE → Utilities → Transfer. Code `@0x4C9B–0x4D3F` does `sprintf("%s%s.exe")`, then `fopen("xferplay.exe","rb")`, then a `while(!feof) fputc(fgetc())` loop. It copies the .GAM's component files by fixed extension (.PAL .MAP .BBL .MON .MBL .CHR .CBL .SND), the start/end .BKD/.TXT, `%s.his`, `gmtitle.gif` and `gam\gmhelp.txt`, and rewrites the .BKD's GIF path.
- **3.0:** UTILITY.EXE `transfer_em()` (`UTILITY.C:255-316`). It copies **every file in the game area** (`FindFiles("*.*")`), plus `config.hlp` and `sndblast.drv`. It then `CopyFile("xferplay.exe", "<game>.exe")`: a 64,000-byte fread/fwrite loop (`@0x86FF/0x8719`) with no seek and no patching. Finally it writes `config.bat` containing `<game> configure`. The older per-extension routine survives unused as `OLDtransfer_em()` (`UTILITY.C:620-725`).

So **a transferred game's EXE is XFERPLAY renamed**, and the player finds its data from its own name: `ParseFileName(argv[0])` + ".gam" (`PLAYGAME.C:666-669`). That explains why every 3.0 game EXE is exactly 160,598 bytes, and every 1.0 game EXE is 82,803 bytes: the 1.0 `feof` loop appends one 0xFF to **every** file it copies. The same extra byte appears on most transferred data in the 1.0 folder: .PAL 769 (11 files) vs 768 (4), .MON 19,201 (14) vs 19,200 (4), .MAP 22,001 (57) vs 22,000 (4). The .GAM files are almost all an exact 6,600 bytes (11 of 12), which suggests Transfer rewrote the .GAM rather than copying it [inference]. The 3.0 block copy adds no byte (`UTILITY.C:319-381` writes only the count read), yet a few 3.0-folder files are also 1 byte longer than the record total; those are probably 1.0 data carried forward [inference]. [1.0 mechanism: inference; the byte itself is measured] The retained older copy routine copies the `.gam` too (`UTILITY.C:668-672`); it is not proof of what the 1.0 Transfer did.

**Owner stamping is separate from Transfer.** The registration tools `insertstr("a:xferplay.exe", final, 0x1800, 34)` (`REGIST.C:125-148`, `BYTENUMS.H:2-3`, `MKDSK.CPP:126-127`) personalised the _distribution disk's_ XFERPLAY at install time, so every game a buyer transferred carried that buyer's owner stamp. All 26 stamped players in the collection decode to valid serials (values withheld). In 3.0 the stamp segment is gone and the 343 stock copies are byte-identical. That suggests 3.0 stopped tracing games back to buyers [inference].

### PLAYGAME vs XFERPLAY (the 2,532-byte difference)

Both are compiled from one `PLAYGAME.C`. XFERPLAY uses `-DTRANSFER=1 -oxferplay.obj` and `gencxfer.obj` (`XFERPLAY.MAK:36,39`), and links `startupl.obj`. PLAYGAME links Borland's `c0l.obj`. The headers are equal (8,192 B), so the whole difference lies in the load image (154,938 vs 152,406). Relocations are 1,519 vs 1,465.

| `#ifdef TRANSFER` site | PLAYGAME only                                                                                                                                                                                                                                                                        | XFERPLAY                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `PLAYGAME.C:589-598`   | CHKREG check: restores text mode unless launched with GM's `cOoL` password (present in every CD EXE except XFERPLAY)                                                                                                                                                                 | always restores the palette/text mode                                                            |
| `PLAYGAME.C:665-746`   | menu "PLAYGAME V3.00" / author credit / "Copyright(C) 1994"; Play / Configure / Quit; "Enter game to play:" `*.gam` picker; **"Incorrect Data File Version (You are running Game-Maker Version 3.00) … load this game into the integrator, and then save it."**; returns to MENU.EXE | loads `<argv0>.gam`; "You are missing %s! I can't do anything without it!"; plays once and quits |
| `PLAYGAME.C:1092-1120` | designer warning when the start link equals the game-won link, moving it by 10 blocks ("Still Confused? Read the Owner's Manual Section 4.8.2.")                                                                                                                                     | omitted                                                                                          |
| `PLAYGAME.C:1937-1944` | F1 shows general `gmhelp.txt` before the game's help                                                                                                                                                                                                                                 | game help only; `cd/gm/gmhelp.txt:14-15` says "This help will not appear in a transferred game." |

A literal scan of the linked sources against both CD binaries finds 197 literals in both, **20 only in PLAYGAME (799 B)** and 1 only in XFERPLAY (53 B). The source confirms different startup inputs: `c0l.obj` in PLAYGAME (`code/GM/PLAYGAME.LNK:1`) and `startupl.obj` in XFERPLAY (`code/GM/XFERPLAY.LNK:1`), as well as the conditional code above. Attributing the rest of the 2,532 B between that code and the runtimes remains [inference; not split further]; the link lists do not quantify either contribution.

**The two roles.** PLAYGAME's non-TRANSFER branch chooses among games and presents the authoring menu (`PG:665-745`), warns designers about matching start/win links (`PG:1092-1120`) and shows general Game-Maker help (`PG:1934-1946`). The registration-handshake branch is conditional on `CHKREG` (`PG:589-598`), which is commented out in this source (`GMGEN.H:19-24`). XFERPLAY's TRANSFER branch opens its own name plus `.gam`, plays once and quits (`PG:665-678`). Those operational differences are source-defined; the interpretation that this split was chosen to hide the authoring scaffolding from end users remains **[inference]**. The two-build scheme already exists in the surveyed 1.0 binaries, where PLAYGAME (83,092) is +290 B over XFERPLAY; attributing that entire difference to its menu and "gm.exe" return is also **[inference]**.

## 3. Per-pair diffs

### 3.1 1.0 → 1.04 (+334 B)

- **Appears:** "Trident 8800 VGA chip detected!", "Trident ID - Unknown Hardware chip version - assuming 8900!" (`SVGAC.C:80-132`); `ShowVideoMemory` (a debug switch left in, `PLAYGAME.C:604`); `FIND_BOARD`; "(gmtitle.gif)" in the title message; the order screen changes from "Order from KD Software … $89 … plus $4 shipping" to "Order from your local computer store or: KD Software … About $89".
- **Changes:** owner-stamp slot `@13099` → `@13084`, with a 0xDC marker and a new name encoding.
- **Disappears:** nothing visible.

### 3.2 1.04 → 2.00 (+71,844 B): the big release

- **Sound:** 1.x has no Sound Blaster/AdLib string and only a PIT channel-2 speaker setup (`B0 B6 E6 43`). 2.00 links Creative's FM library (`sbcl.lib`, `@15910`) and adds "Sound Blaster", "Sound Blaster Found!", `BLASTER`, "Port Interrupt", "Sound Driver", `sndblast.drv` (Creative CT-VOICE driver, 2,493 B, identical in 2.0 and 3.0), `.cmf` music and `.voc` speech.
- **Sound file format:** `.snd` grows from **2,160 B** (30 sounds × 36 16-bit frequencies) in every 1.0/1.04 game to **2,430 B** (the same + 30 × 9-byte names, which point to a VOC or are blank for the speaker; `SOUND.H:11,30-33`) in every 2.x game. The 3.0 archive still contains 2,160-byte files from older games.
- **Config:** "VGA Chip Type", "Sound And Music", "Forcing Super VGA to %s", `config.dat`/`config.hlp`; selectable chip list Auto-Detect / Standard VGA / Paradise / Trident 8800 / 8900 / Tseng ET3000 / ET4000 / ATI Wonder (+"ATI VGAWONDER", "ATI ULTRA", "Pixel Engineering" BIOS IDs).
- **Game state:** "Game Saved!", "I cannot save your game!", "Old Game Loaded!", "You have not saved a game!", disk-error dialogs, "I am missing these game files:", "Code Too LARGE, memory error 1" (GIF decoder).
- **Disappears:** `joysetup.exe` (calibration moved inside the player), `gamemake.opt`, `gam\%s.txt` help. The order screen adds "Call for the latest price!".
- **Layout:** header 288 → 384 paragraphs so the REGSPACE segment (`REGSPACE.ASM:5-8`) lands at file 0x1800; CS:IP becomes 0003:0004. About **53 KB of the growth is stored zeros** (DGROUP region 92 % zero, runs of 35,812 and 17,060 B) rather than code. Real code grows 73.2 → 84.4 KB.
- **.GAM:** still the old fixed-size 6,600-byte file (20 scenes × 330-byte `integratorstruct`, no version field; `GM.ZIP:GRATOR.H`). The first word is scene 0's `gametype` (1 = start); the second is its x position in the integrator window, 94 in every 1.x game and 157 in most 2.x games. That suggests the 2.0 integrator places the start scene differently [inference].

### 3.3 2.00 → 2.02 (+176 B)

- **Appears:** "Version 2.02". Code +176 B (main segment +160, another +16), relocations +11.
- **Disappears:** nothing. A bug-fix release [inference, medium].

### 3.4 2.02 → 2.04 (−36,082 B)

- **Appears:** "MicroChannel Bus Detected!" (`PLAYGAME.C:651`, log "Feb 21, 94"); the full C errno text table; the author's custom startup "GM:Abnormal program termination.", "GM:Data seg must be < 64k.", "GM:Heap must be < 64k."; more int 33h mouse calls (byte-pattern count 1 → 8, low confidence).
- **Help:** general `gmhelp` is under `#ifndef TRANSFER` in the current source (`PG:1934-1946`). Dating that change to 2.04 remains [inference from presence bits: in 1.0–2.02 and 3.0 PLAYGAME, absent from 2.04 and 3.0 XFERPLAY]. The `GM.ZIP` 2.04 snapshot's `PLAYGAME.C` still calls `Display_File` for `gam\\gmhelp.txt` without that guard around the call (member lines 1421-1428); binary string presence alone does not establish the source transition.
- **Size:** the binary survey reports less stored zero data: in-file DGROUP data drops 64,388 → 7,968 B + a 20,034-B zero far segment, and minalloc rises 0012h → 07A5h (288 B → 31,312 B BSS). The load footprint is about the same (149,300 vs 144,242 B), and code _grows_ by 304 B. The custom startup's segment order (BSS last) is the likely cause [inference, medium], not established by the surviving link lists alone (`code/GM/PLAYGAME.LNK:1-29`, `code/GM/XFERPLAY.LNK:1-29`).

### 3.5 2.04 → 3.00 early build (+41,710 B)

- **Appears:**
  - FLI player ("New Frame: %d Size:%5lu Chunks:%u" debug print left in, `FLI.CPP:233`) and `.fli`.
  - `.lst` slide lists.
  - GIF/BKD graphics between scenes ("Error Opening Gif/Bkd %s!").
  - Keyboard **recorder** (`#define RECORDER`, "Recording *", "%sdata%d.rec", "Playback with %s.") with `.rec` = 3-byte `{delta, scancode}` events, capped at `RECLEN 1000`.
  - **Numbered save slots** "%sgame%d.sav" (an old single save before that).
  - `gm.cfg`.
  - "Video Driver".
  - Top-Ten high scores ("You scored number %2d on the Top Ten!", `.his` 10 × 34 B).
  - "No game-specific help included." / "credits given.".
  - The BC++ 4 C++ library (string, xmsg, xalloc, Bad_typeid) and C++ classes `FileListClass`, `ConfigData`, `SceneFiles`.
- **The new .GAM:** a "GM" tag + version word **0x012C = 300** (`GMGEN.H:22-23` `VERSION 300`), 250 bytes of "RSD" fill (`GMGEN.H:80-98`), then a scene table and a **file-name string pool** (`GameClass::Load`). Scene files are stored with full names instead of fixed extensions, so 3.0 has none of the `.pal .map .bbl…` extension table. Limits are `SCENEFILES 20`, `MAXSCENELINKS 20`, `SCENEDESCLEN 20`, `SCENEFILENAMELEN 13`, replacing `OLDMAXSCENES 20` / `OLDMAXLINK 20` / `OLDLASTFNAME 10` (`GRATOR.H:17-30`). Every 3.0-folder .gam (385) starts `47 4D 2C 01`. Two 1.0-folder games and one 2.02 game also start that way, so they were evidently re-saved in 3.0 [inference about provenance, not just format]. Despite the "Incorrect Data File Version" box, the source validates only the two `GM` bytes, not the version word (`GMGEN.H:80-108`, `PG:5156-5170`); the box is PLAYGAME's failure message for `Game.Load` (`PG:695-699`). XFERPLAY has a missing-file message for load failure instead (`PG:665-674`).
- **Unchanged record sizes:** block 420 B (`.bbl` 150 → 63,000, `.mbl` 100 → 42,000, `.cbl` 50 → 21,000), monster 300 B (`.mon` 64 → 19,200; `LASTMON 64`, `LASTSL 20` frames, `MAXMARCH 10` path corners), character 3,784 B (`.chr` ×2 = 7,568), map 100×100×2 + 200×10 = 22,000, palette 768. These sizes are identical in every version's games, so 1.0 data loads in 3.0 once the .GAM is converted by the integrator.
- **Disappears:** "This directory doesn't exist!", "%s*.*" (`WINDIO.C:419-422`).
- **Layout:** header 512 paragraphs, so 0x1800 is now header padding. A-J.EXE still has an unpatched 52-byte `abc…z` placeholder at 0x2000, which an install tool aimed at 0x1800 would miss. That may be why the stamp was dropped [inference].

### 3.6 3.00 early → 3.0 stock XFERPLAY (−186 B)

- **Disappears:** the REGSPACE segment (CS:IP 0003:0004 → 0000:0000), the keyboard ASCII tables ("qwertyuiop[]", "asdfghjkl;'`"…), "insert a disk" errors; "You are missing %s.gam!" becomes "You are missing %s!".
- **Appears:** "be simulated in Software" (`SVGAC.C:39`, VGA list gains "Simulate", `PLAYGAME.C:4787` vs `PLAYBACK.C:4261`), "This game has not been saved!", "(A)bort Save (R)etry", "Sorry...Out of Memory!".

### 3.7 Editors 1.00 → 3.00 (2.0 editors not found; GM_SPEC.TXT lists the same eight tools plus CMF and Sound Blaster)

- **Palette:** + Move/Copy mode, colour numbers, unsaved-change prompts.
- **Block:** + "Character Touches Block", "Create Monster" / "Pick Monster to Birth", inventory objects, block→block change. The 1.00 options (gravity, pick-up, counter/score/lives changes, timed change "18 counts in one second") remain.
- **Monster:** "MONSTER MAKER Version 1.0" → multi-leg paths ("Next Leg", "At Speed: %3d", "Relative to Character/Monster"); "player" wording becomes "character".
- **Character:** + 8 directions, Momentum / No Momentum, once-per-keystroke vs auto-repeat, initial inventory, VOC sounds.
- **Sound:** + ".VOC Speech File", "Convert a CMF File".
- **Integrator:** + **game areas** (one directory per game), graphic + song for title / menu / storyline / game won / game lost, high-score / load / save backgrounds, Demo Recording, level intro / exit graphics.
- **Map, Image:** essentially unchanged.
- **Utilities:** move from GM.EXE + JOYSETUP + JOYDIAGS into UTILITY.EXE. The 1.00 tools all refuse to run standalone ("This program must be run under Game-Maker!"); in 3.0 only MENU.EXE keeps that check, with GM.ASM passing `cOoL` (`GM.ASM:40`).

### Constant across all versions

- **Joystick:** in-game calibration text ("Move joystick all the way Left…", "This machine does not have a game port installed!").
- **VGA chip detection table:** Standard / ChipTech / Genoa / Paradise / Trident / Tseng / Video7, ATI BIOS signature, "COMPAQ".
- **Keys** (3.0 `gmhelp.txt`): F1 help, F3 music, F4 sound, F5/F6 save/restore, F8/F9 joystick, F10 about.

## 4. Development-history clues

- **Version banners vs reality:**
  - The CD's `about.hlp` still says "Version 2.00"; the source `ABOUT.HLP` says "Version 1.04" with "$89".
  - `PLAYGAME.C:3-4` header reads "Last Edited: July 8, 1993 … Version: 2.04" while the file is 3.00 code.
  - "V1.06" was used internally in 1992-93 (registration program, bug list, `gogm.bat`) and was never a public player version in the collection.
  - The format headers say v1.05 (1991).
  - Version labels disagree in the available source: the PLAYGAME comment says 2.04 (`PG:5-7`), the operative macros say 3.00/300 (`GMGEN.H:22-23`), and `MON.H:1` still says V1.05. That coexistence is source-visible; how each release acquired stale help or banners remains [inference].
- **Dated changelog lines** (`PLAYGAME.C:3-7`): created June 20, 1991; MicroChannel keyboard Feb 21 '94; GIFs/FLIs between scenes + new integrator format Aug 8 '94.
- **Other dates:** stamp location `BYTENUMS.H` Aug 11 '92; video drivers 05/26/94 (`DRV/*.ASM:3`); install banner Aug 24 1994; PLAYGAME build 1994-09-03; demo tools 1995-03-04.
- **Copyright years:** source headers 1991; Borland runtime ©1991 everywhere except 3.0 PLAYGAME/INSTALL (©1994 = BC++ 4.x); CD menu "Copyright (C) 1991-1994"; the 1.0 PLAYGAME banner says "Copyright(C) 1990".
- **Author credit:** the PLAYGAME menu credit changes between the 1.0 and 3.00 banners (two different members of the author family); the source headers and video drivers carry a third family name. Names are deliberately not reproduced here.
- **Debug strings left in:**
  - `ShowVideoMemory` (1.04+).
  - The FLI frame trace (3.0).
  - "Code Too LARGE, memory error 1".
  - The published source is the **CRIPPLEWARE** demo configuration (`GMGEN.H:37`; `StdCrippleMsg` "only allows Maps to be saved"), while the CD binaries were built without it and with CHKREG on, although the 2014 source comments CHKREG out.
  - None of the `code/GM/*.MAP` files matches a shipped binary; `XFERPLAY.MAP` matches the 2.04 layout.
- **Unused or unfinished fields:**
  - The monster record's `fly` ("Whether or not gravity has an effect on a monster"), `jump` and `stick` ("Not currently used") are serialized (`MON.H:23-26`), but no editor writes them and no player reads them. They are zero in all 52,066 archive monster records (see `2026-11-05-ignored-fields.md`).
  - `fly` is described as a gravity switch and `jump`/`stick` as "Not currently used" (`MON.H:21-26`); the checked-in movement path uses marches, wall checks and contact instead (`PG:2970-3122`). That does not establish a development plan. Monster gravity was planned but never built in any release remains [inference].
  - The `.gam` 3.0 header's 250-byte "RSD" fill and the 11-byte `extra[]` in the old scene record are reserved space.
- **Third-party edits:** several players in the collection have length-preserving hex edits of text (About screens, re-branded extensions `.gam→.z0g`, renamed HUD labels). They explain "no version string" players and are not Game-Maker versions.

## 5. What it tells us

1. **Game-Maker grew in three steps, not six.** 1.0/1.04 is a PC-speaker, VGA, per-file engine (1991-92). 2.x (built 1992-93, refined to 2.04 in mid-1994) adds Sound Blaster, configuration and save games without changing data formats except `.snd`. 3.0 (Aug–Sep 1994) is a C++ rebuild with a new self-describing `.gam`, FLI/GIF cut-scenes, a demo recorder and multi-slot saves. Treating 1.04, 2.02 and 2.04 as maintenance releases is [inference] from their smaller visible changes, not proof of each release's purpose.
2. **The record formats were frozen from 1991.** Blocks 420, monsters 300, characters 3,784, maps 22,000 and palettes 768 never change. Only the `.snd` file (2.00) and the `.gam` container (3.0) changed. The `.gam` is the only file with a version number, and only from 3.0. [measured across all games in the collection]
3. **XFERGAME is a feature, not a program.** "Transfer" copies a prebuilt XFERPLAY under the game's name and the player identifies its game from `argv[0]`. Up to 2.x, the distributed XFERPLAY was personalised at install time with an owner stamp; 3.0 dropped the stamp, so every 3.0 game ships an identical player.
4. **XFERPLAY omits authoring scaffolding**: the menu and load-failure box (`PG:665-745`), designer warning (`PG:1092-1120`) and general help (`PG:1934-1946`); the handshake is separately conditional on `CHKREG` (`PG:589-598`). The link lists also select different startup objects (`code/GM/PLAYGAME.LNK:1`, `code/GM/XFERPLAY.LNK:1`). How much the startup contributes to the 2,532 B remains [inference].
5. **The 2.04 "shrink" and the 2.00 "bloat" include different stored-zero layouts**, according to the binary measurements above. Attributing their sizes to linker layout rather than features remains [measured; cause inferred]; the present link lists do not reconstruct those historical links.
6. **Development was messier than the release numbers suggest** [inference]. Source-visible label mismatches are listed in §4 (`PG:5-7`, `GMGEN.H:22-23`, `MON.H:1`); the broader account of compiler versions and mixed source/MAP snapshots depends on the historical binary survey, not those labels alone.

## Gaps

- No 2.x editors and no 2.x XFERPLAY kit survive in the collection. 2.x editor features are inferred from `GM_SPEC.TXT` and the 3.0 editors.
- Feature claims rest on strings, literal scans and source; no function-level disassembly diff was done.
- The 1.0 owner-stamp name encoding was not decoded (it does not need to be).
- int 33h and port byte-pattern counts are low confidence.
