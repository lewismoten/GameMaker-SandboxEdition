# What the Game-Maker 1.04 player changed

Machine-code comparison of the stand-alone player (XFERPLAY, the EXE a transferred game is) from
**1.0** (`1.00-xfer`) to **1.04**. Tooling and the full match tables are in
[`player-diff/`](player-diff/README.md); this page interprets
[`player-diff/pairs/1.00-xfer__1.04/`](player-diff/pairs/1.00-xfer__1.04/summary.md).

## Caveats

- **The predecessor is 1.0, not 1.03.** No 1.01–1.03 player is held, so this covers every change
  between 1.0 and 1.04, not necessarily one release.
- The "old" copy is a 1.0 *game* EXE (82,803 bytes = XFERPLAY + one 0xFF byte that 1.0's Transfer
  appended; the header's `overlay_bytes 1`). The 1.04 copy has no trailing byte. Image sizes
  (78,194 → 78,528, **+334 bytes**) are the fair comparison.
- The tool's function finder overlaps and mis-decodes some code (see "Tool artifacts"). Statuses
  compare code only. The 1.04 build's own source is not held; the **3.0 source in `code/GM/`** is
  the nearest, and is used for cross-checks. A match there confirms the *structure* in 1.04 (the
  binary shows it independently); it does not prove 1.04 and 3.0 were identical.
- Nothing was run. Everything is static: Capstone listings, the tool's per-function diffs, and
  strings read from DGROUP (file offset = DGROUP paragraph × 16 + 0x1200).
- The function report only covers code the function finder reached. The bytes outside every
  function (switch-case bodies, jump tables, interrupt handlers, padding) were compared
  separately and every differing gap is accounted for in
  [Bytes outside functions](#bytes-outside-functions). That pass found no new kind of change,
  but it adds call sites to items 4 and 5, corrects one row of item 12, and decodes the data
  region item 13 had left open.
- Addresses are `segment:offset` inside each EXE's own image (old DGROUP 11DF, new 11DD). Owner
  stamps, addresses and phone numbers in the binaries are not reproduced.

## Summary

| # | change | kind | old → new | confidence |
|---|---|---|---|---|
| 1 | Super VGA chip detection rewritten: BIOS-signature scan of the video ROM, Trident 8800 vs 8900 split, shared chip setup | new feature + behavior change | `1073:*` → `105E:*` (8 changed, 3 added) | confirmed |
| 2 | Chip-type renumbering ripples into bank-switch and mode code (`_SetPage`, `_SetTridentStart`, mode set/restore) | behavior change | `1197:02EE`, `03BC` → `1192:0300`, `03D6`; `1073:0373`, `03D0` → `105E:0480`, `04D9` | confirmed (code); purpose medium |
| 3 | `ShowVideoMemory` and `FIND_BOARD` command-line diagnostics | new feature | `04A1:0069` → `04A5:0009`; new `04A5:8269`, `82D2`, `0000:34B0` | confirmed (also in 3.0 source) |
| 4 | Mouse driver scales coordinates from the driver's real range (text 80×25, graphics 320×200); callers drop their ×8 pixel→cell maths | behavior change / likely bug fix | `0CA0:*` → `0CDA:*`; `0E94:0A94`, `0ADA` → `0EC6:0588`, `0613`; callers in `0CC3`/`0F63`/`1157`, including `getfname`'s and `horizmenu`'s case bodies outside any function | confirmed (code); motive speculative |
| 5 | Message box gets a timeout (`maxpause`, default 30000 ms) | new feature | `0CC3:1088` → `0D04:1011`; all 15 call sites (11 far, 4 near) | confirmed (3.0 source `WINDIO.C:517`) |
| 6 | Title screen named `gmtitle.gif`; missing-title now exits with code 4 | behavior change | `04A1:020C` → `04A5:0215`; strings | confirmed |
| 7 | Order screen text: "Order from KD Software" → "Order from your local computer store or: KD Software"; "Version 1.04" | text change | `04A1:15F0` → `04A5:161F`; data | confirmed |
| 8 | Save-game failure beeps 10 times → 2 (*amended:* the save, not the load) | behavior change | `04A1:1493` → `04A5:14C2` | confirmed (code) |
| 9 | Three dead library routines (CRTC scroll helpers, polygon edge-table builder) dropped | dead-code removal / relink | `0E94:0386`, `042F`, `06C9` → none | confirmed no callers in 1.0; reason speculative |
| 10 | Monster update loop and monster init touched (32-bit timestamps at record +0x28/+0x2e) | behavior change | `04A1:3AB9` → `04A5:3AE0`; `04A1:7975` → `04A5:7BD3` | speculative |
| 11 | Sprite/text-box blit routines: colour nibble masks, clip limit, `cld` removal | behavior change / optimization | `1197:007C`, `0154`; `1157:01A4` | medium (code); purpose speculative |
| 12 | Boolean tests compiled without the old `&` temporaries; register and `enter` frame changes | compiler/relink noise | several (table below) | confirmed |
| 13 | RTL, data-segment growth, relocation and layout shifts | compiler/relink noise | 120 identical, 132 relocated, 43 data-moved, 9 constants | confirmed |
| 14 | After a restore, the scene loop continues from the restored scene. `curscene`/`oldscene` become globals (DGROUP `0x94`/`0x92`) that the `.sav` reader sets; in 1.0 they were `play()` locals the reader could not reach, so the next scene (or the replay after a lost life) came from the scene played *before* the restore | behavior change / bug fix | `play` `04A1:080B` → `04A5:081E`; `.sav` reader `04A1:0E9C` → `04A5:0EC9` | high (code; same structure as 3.0 `PLAYGAME.C:1081–1141, 1795–1796`); effect on play inferred, not run |
| – | Bytes outside functions: 72 gaps per build, every differing one read | 2 parts of items 4/5, the rest noise | see [Bytes outside functions](#bytes-outside-functions) | high |
| – | Packer | none: no packer in either build | | confirmed |

Function counts for the pair (from `summary.md`): identical 120, relocated 132, data-moved 43,
constants 9, **changed 47**, removed 4, added 8. Section 12 and 13 explain the rest; every
changed, removed and added function appears below. Item 14 was found later, in two functions
item 12 had first called noise.

## Detail

### 1. Super VGA detection rewrite (`1073` → `105E`, SVGAC.C)

Old 1.0 tried four detectors one after another (`1073:0264` Tseng, `02F9` ATI, `01A3` Paradise
`VGA=`, `022A` Trident) and fell back to "No super Vga card detected! Assuming standard vga."
(`1073:00E9`, 186 bytes). In 1.04 that dispatcher (`105E:0126`, 121 bytes) tries Paradise
(`105E:0317`), then Trident (`105E:0373`), then the new scanner `105E:019F`, then the same fallback.

- **New `105E:019F` (265 bytes, added):** scans 256 bytes of the video BIOS at `C000:0000` for
  each of eight vendor strings, copied from the table at DGROUP `0xD67` (`761295520`, `ChipTech`,
  `Genoa`, `Paradise`, `Trident`, `Tseng`, `Video7`, `Digital`), using the new `0000:34B0`
  (case-insensitive bounded compare, 68 bytes: `cmp al,'a'…'z'; sub al,0x20`, i.e. `strnicmp`).
  A jump table at `105E:02A8` maps the match to a handler: 0 ATI → `105E:0425`; 1, 2, 6 →
  `105E:046A` (type 0, standard); 3 and 7 (Paradise, Digital) → `105E:03D6`; 4 Trident →
  `105E:0373`; 5 Tseng → `105E:02B8`.
- **New `105E:03D6` (79 bytes) and `105E:046A` (22 bytes):** `03D6` sets video type 4 and unlocks
  Paradise registers (`out 3CE,0F / 3CF,05 / 3CE,0B / in 3CF …`). This block was inline in the old
  Paradise detector `1073:01A3` (`1073:01F1–0220`); the new `105E:0317` calls it. `046A` sets type 0.
- **Trident split:** old table (`DGROUP 0xC26`, 21-byte entries) has `Trident`; the new one
  (`0xC80`, 11 entries) has `Trident8800` and `Trident8900`. `105E:0373` (99 bytes, was 58)
  probes `3C4/3C5`, prints "Trident 8800 VGA chip detected!" (type 5) or "Trident 8900 VGA chip
  detected!" (type 6); `105E:019F` prints "Trident ID - Unknown Hardware chip version - assuming
  8900!" if the ID is unrecognised. ATI (`105E:0425`, 122 → 69 bytes) now reads the port from
  `C000:0010` here; the old forced-type function did it inline (`1073:0008`: `mov [bp-2],0xC000`).
- **Type numbering (old → new):** Standard 0, ATI 1, ChipTech 2, Genoa 3, Paradise 4,
  Trident 5 → 8800 = 5, 8900 = 6, Tseng3000 6 → 7, Tseng4000 7 → 8, Video7 8 → 9, VESA 9 → 10.
- **Forced chip by name (`1073:0008` → `105E:000F`, 225 → 259):** matches the argument against the
  table (loop bound 9 → 10) and sets the type. The old code finished with a 3-way switch (cases 0,
  1, 5 only; Trident handled by an inline `out dx,ax` with 0xBE); the new one is a 10-way jump
  table (`105E:0112`) calling the shared per-chip routines. So in 1.0 forcing other chips by name
  did not run any chip-specific set-up; in 1.04 it does *(code is confirmed; the user-visible
  effect is inferred)*.
- **Cross-check:** 3.0 `code/GM/SVGAC.C` `TextID_VGA()` (lines 100–140) has the same 256-byte
  scan, the same vendor list (3.0 adds `Pixel Engineering` as a ninth), `case 7: case 3:` Paradise,
  the Trident 8800/8900 branches and the same messages (`SVGAC.C:80,106,134`).

Evidence (new `105E:0126`, annotated): `call 0x317` (Paradise) → `call 0x373` (Trident) → `call 0x19f`
(BIOS scan) → `push 0xe27 ; "No super Vga card detected! Assuming standard vga."`.

Classification: **new feature** (detects ChipTech, Genoa, Video7, Digital, Trident 8800/8900) and
**behavior change** (detector order). Confirmed.

### 2. Chip-type knock-on changes

| old | new | what | evidence |
|---|---|---|---|
| `1197:02EE` `_SetPage` (200 B) | `1192:0300` (208 B) | bank-select switch: every case value +1 from case 2 up (matches the renumbering); one handler's bank mask `and al,7` → `and al,0xF` | diff: `cmp w[cs:G],0x2…0x8` → `0x3…0x9`; `and al,0x7` → `0xf` |
| `1197:03BC` `_SetTridentStart` (60 → 71) | `1192:03D6` | new branch: `cmp w[cs:G],5; je …; or ah,0x80` — Trident 8900 (type 6) sets bit 7, 8800 (type 5) does not | diff `+cmp w[cs:G], 0x5 / +je / +or ah, 0x80` |
| `1073:0373` (93 → 89) | `105E:0480` | restore-mode helper; `and b[bp+6],0x10` → `0xf` | diff |
| `1073:03D0` (266 → 279) | `105E:04D9` | mode set/restore; compare `7` → `8` (Tseng 4000 index), extra test of type 6 | diff `cmp w[es:G],0x7 → 0x8`, `+cmp w[es:G],0x6` |

Classification: behavior change driven by item 1. The mask changes are plausibly Trident 8900's
wider bank field; speculative as to which chip.

### 3. `ShowVideoMemory` and `FIND_BOARD` switches (`04A1:0069` → `04A5:0009`, program entry)

New code at the top of main compares `argv[1]` (when `argc==2`) with two strings using `0x341F`
(`stricmp`) and `0x33C6`:

- `ShowVideoMemory` (`DGROUP 0x104`) → new `04A5:8269` (105 bytes), which prints the video ROM
  (`C000:0000` onward) 80 bytes per row, 24 rows per screen, until Esc; `04A5:82D2` (29 bytes,
  a 0x50-byte copy) is its helper. Source: `PLAYGAME.C:604` (`ShowVidMem()`).
- `FIND_BOARD` (`DGROUP 0x130`) → `105E:0126` (the detector in item 1, printing what it found).
  The 3.0 source has no `FIND_BOARD`; the string exists only in the 1.04 binary here.
  Interpretation (a support diagnostic for reporting video cards) is **speculative**.
- `04A1:0069` also gains an extra argument (`push 0x7530`) to the "NOT ENOUGH MEMORY!" box (item
  5), and calls the text-mode setup `0EC6:0613` first (item 4).

Classification: **new feature** (diagnostics). Confirmed.

### 4. Mouse coordinate scaling

- **`0CA0:0007` → `0CDA:0003` (79 → 149 bytes), mouse init** (`int 33h`, AX=0): when a mouse is
  found it now saves two globals (x/y scale at `0x904`/`0x906`), sets both to 1, positions the
  cursor at (1000,1000) through the new wrapper `0CDA:00EC`, reads the position back through
  `0CDA:013F` into `0x8F8`/`0x8FA` (the driver clamped it to its real maximum), then restores the
  scale.
- **`0CA0:00AA` → `0CDA:00EC` (59 → 83), set position:** now `pos × scale + scale/2`
  (`imul w[0x904]; shr dx,1; add`).
- **`0CA0:00E5` → `0CDA:013F` (74 → 86), get position:** now `pos / scale` (`div w[0x904]`).
- **`0CA0:012F` → `0CDA:0195` (157 → 177), set min/max range (`int 33h` AX=7/8):** ranges multiplied
  by the scale and the min/max order is normalised.
- **`0E94:0ADA` → `0EC6:0613` (70 → 139), text-mode setup (mode 3):** after the mode set, reads the
  mouse extent and stores `scaleX = maxX/79`, `scaleY = maxY/24` (minimum 1). **`0E94:0A94` →
  `0EC6:0588`** does the same for mode 13h with `/319` and `/199`. The 3.0 source's `NEWMOUSE.ASM`
  and `OLDMOUSE.ASM` are the later mouse work, but it was not compared further.
- **Callers drop their pixel maths.** 1.0 multiplied or divided every mouse coordinate by 8 in the
  menus (`shl ax,3`, `idiv 8`, "+4" cell centring) and used pixel constants (`push 0x190`,
  `0x280` = 400, 640). 1.04 passes cell coordinates (`push 0x18`, `0x4f` = 24, 79). Functions:
  `0CC3:0000` → `0D04:000A` (2602 → 2509), `0CC3:12B9` → `0D04:1248`, `0CC3:1513` → `0D04:1462`,
  `0CC3:1088` → `0D04:1011`, `0CC3:1903` → `0D04:1820` (drops `shl ax,3`) and `0CC3:18AF` →
  `0D04:17CE` (constants 400/640 → 24/79).
- **The same change in case bodies the function finder missed** (see
  [Bytes outside functions](#bytes-outside-functions)):
  - `getfname`'s key switch (`WINDIO.C:115`; old `0CC3:03CE`–`0729` → new `0D04:03B8`–`06EC`).
    It has three `setmoupos(xf,oy)` calls (Up, Down, and after the "file does not exist" box),
    and 1.0 passed `x*8+4, y*8+4` at each of them (`shl ax,3; add ax,4`). 1.04 passes the cell
    (`push word ptr [bp-0x3e]`).
  - `horizmenu`'s Left/Right case bodies (old `0CC3:1611`, new `0D04:1556`;
    `setmoupos(lens[i+1]-1,y)` and `setmoupos(lens[i]+1,y)`, `WINDIO.C:700,706`) drop
    `shl ax,3` twice each. `horizmenu` (`0CC3:1513` → `0D04:1462`) has no callers in either
    build: no far call, stored far pointer or near call reaches it. So this part is dead code
    in the player, as it still is in 2.02 ([player-diff-2.02.md](player-diff-2.02.md), change 6).

Classification: **behavior change**, probably a **bug fix** for mice whose driver range is not the
assumed 640×200 *(motive speculative; the code is confirmed)*.

### 5. Message box timeout (`0CC3:1088` → `0D04:1011`)

`errorbox` gains a fifth argument (stack `bp+0xe`) and loops comparing a clock reading against
`start + arg` while polling the mouse and keyboard. Every caller pushes `0x7530` (30000) before
the call and uses `add sp,0xa` instead of `add sp,8`. 3.0 `WINDIO.H:20`:
`int errorbox(char *l,char *l1,unsigned int maxpause=30000);` (`WINDIO.C:517`, with
`time_t curtime, starttime`). That is the same signature, confirmed. Callers touched: `04A1:0069`,
`0CC3:0D95`, `0CC3:19C7`, `0CC3:1A74`, `0CC3:1C33`, `0F63:000D`, `0F63:0888`, `10D4:0004`
and `0CC3:0000` (`add sp,8` → `add sp,0xa` in each). Classification: **new feature**.

*Amended:* a byte search of both code regions finds **15 call sites in each build**: 11 far
(`9A 88 10 C3 0C` → `9A 11 10 04 0D`) and 4 near (`push cs; call`, from `0CC3:1A26`, `1B60`,
`1BBE`, `1C8F` → `0D04:1934`, `1A71`, `1AD2`, `1BA6`). All 15 push `0x7530` in 1.04 and none
does in 1.0. The "17" above counted overlapping mis-decoded copies of the same code. One far
call site, `0CC3:0697` → `0D04:0667`, sits outside every discovered function: it is
`getfname`'s "Sorry, the file does not exist!" / "(R)eenter name (E)xit" box (`WINDIO.C:312`).
In 1.04 its `je +3; jmp far` pair becomes a short `jne`, because the body shrank.

### 6. Title screen (`04A1:020C` → `04A5:0215`, 486 → 496)

String change `You are missing Game Maker's Title Screen!\n` → `… (gmtitle.gif)!\n`, and the
missing-title path now calls `exit(4)` (`push 4; lcall 0x82EF` — a `+push 0x4 / +lcall F / +pop cx`
in the diff). `1.04` pairs with Transfer copying `gmtitle.gif` (the 3.0-era BUGLIST lists
"Transfer - GMTITLE.GIF" as fixed; speculative link). Classification: behavior change. Confirmed.

### 7. Order screen and version text (`04A1:15F0` → `04A5:161F`, 529 → 548; data)

| old | new |
|---|---|
| `          Version 1.0    ` | `          Version 1.04   ` |
| `Order from KD Software:` | `Order from your local` + `computer store or:` + ` KD Software` |
| `KD Price:  $89 Game-Maker` / `Visa/MC` / `plus $4 shipping (USA)` | `KD Price:  About $89` / `Visa/MC` / `plus shipping` (padding differs) |

Two address/phone lines each are redacted in both builds. The function draws one more line.
Classification: text
change, **no logic**. Confirmed.

### 8. Save-game failure beeps (`04A1:1493` → `04A5:14C2`, constants)

`for (i = 0; i < 10; i++) beep(7)` became `i < 2` (`cmp si,0xa` → `cmp si,0x2`; `push 7; lcall
0x1869`) on the path taken when the `.sav` open returns null. Classification: behavior change.
Confirmed (code); reason (less noisy failure) is an inference.

*Amended:* this is the **save** routine, not the load. It opens `<name>.sav` with `"wb"` (old
DGROUP `0x2AE`), writes with `0000:120B` (the reader uses `0000:1025`), and its caller passes
`playscene`'s three scene arguments by value (`04A1:0B4C`–`0B55`), where the reader gets their
addresses (item 14). High confidence.

### 9. Removed code (`0E94`, 3 functions, 1,299 bytes)

| old | size | what | callers |
|---|---|---|---|
| `0E94:0386` | 169 | CRTC (`3D4/3D5`) reg 0x11 unprotect, reg 4, wait for vertical retrace (`3DA` bit 3) | none |
| `0E94:042F` | 159 | CRTC regs 0x0C/0x0D start-address pan by flags (±1, ±0x140 …) | none |
| `0E94:06C9` | 971 | two 200-entry int tables filled with 321 and 0, a `farmalloc` of `2*(n+1)`: scan-line edge tables (polygon fill) | none |

I searched the old listing for near and far calls to all three: nothing. They sit between the
matched neighbours (`0E94:02CD+185 = 0386`, `0E94:05A9+288 = 06C9`) and the new image has nothing in
those gaps (`0EC6:02D4+185 = 038D`, `0EC6:0468+288 = 0588`), so this is genuine removal. It
explains the drop in `int 21h` and port counts in the summary (DOS and I/O ports tables). It
fits a recompile that no longer pulled in an unused library module [speculative]. The function
names/purposes come from reading the code; no symbols exist. Classification: **dead-code removal
/ relink**. Confirmed that it is unreferenced; purpose medium.

`0000:3EDB` (512 bytes) listed as removed is an overlapping mis-decode inside the matched C
runtime function `0000:3ECB`/`0000:3F0F` (528 bytes, constants-only change; see below).

### 10. Monster loop (`04A1:3AB9` → `04A5:3AE0`, 3460 → 4003; `04A1:7975` → `04A5:7BD3`, 1666 → 1686)

The engine's monster record is 0x34 bytes. Both builds already hold 32-bit timestamps in it
(`+0x28/+0x2A`, `+0x2E/+0x30`; 9 references in the old loop, 11 in the new) compared against the
tick counter (`0x10B0`/`0x10B2`). New in 1.04: the loop loads the record's 16-bit field `+0x17`,
increments it, and compares the timestamp against it as 32-bit (`cdq; cmp es:[bx+0x2a],dx; cmp
es:[bx+0x28],ax`), and one branch stores `tick + 0x186A0`. The init code (`04A1:7975`) gains a
`tick + 10` store for two timestamps. The 3.0 source `class minfo` (`PLAYGAME.C:130–137`) has
`NextAni`, `NextMove`, `BirthTime` (all `ulongi`) and the clock test at `PLAYGAME.C:2997`. I
cannot tell from the binary which field is which, nor what 1.04 fixed. The internal BUGLIST
(`code/GM/BUGLIST.TXT`: "Restore game timer problem", "Mon erases to Upper Left after restore")
is for a version labelled 1.06; the link is **speculative**. Classification: behavior change,
**low confidence**.

### 11. Blit and text-box routines

- `1197:007C`, `1197:0154` (212 → 220 bytes each; the same routine drawing to two targets):
  colour values are now masked to a nibble (`and dl,0xf; and dh,0xf; and al,0xf`), the clip
  limit moves `0xE6FF` → `0xE6DC`, a `movsb` moves before a test. The `mov dx,0x140` that the tool
  shows as a string is just 320 (screen width) coinciding with a string offset.
- `1157:01A4` → `1154:019C` (359 → 337): text-box draw. `cld` removed; `mul 80` →
  `sub/dec/shl` addressing; new `cmp al,0; je` skip for a zero border character before `stosb`.

Classification: behavior change or optimization; the nibble masks look like a fix for colour
indices above 15 *(speculative)*.

### 12. Compiler / relink noise in changed functions

Same behavior, different code. Evidence is the diff pattern named.

| function | pattern |
|---|---|
| `04A1:2B05` → `04A5:2B54`, `04A1:63F0` → `04A5:6636`, `04A1:6FC3`/`7039` | `mov ax,1 / xor ax,ax / push / test` boolean temporaries (a non-short-circuit `&`) replaced by direct branches; `or ax,w[bp-2]` → `or ax,dx`. *Amended:* `04A1:080B` → `04A5:081E` was listed here too, but neither version has that pattern; it is `play()`, a behavior change (item 14) |
| `0E94:0C18` → `0EC6:0796` (131 → 138) | register assignment swaps (`si`/`di`), `inc di` → `inc w[]` |
| `04A1:5468` → `04A5:56AE` | one `jge` → `jg` (sub-case boundary); identical otherwise; unexplained, low |
| `04A1:77FC` → `04A5:7A4D` (125 → 138) | frees the same eight far buffers; frame gains a dead 4-byte local (`'M',1,0`) |
| `04A1:0E9C` → `04A5:0EC9` (1524 → 1529) | `.sav` reader (opens `<name>.sav` with `"rb"`). *Amended:* two separate edits, not one call replaced. (a) On the open-failure path, 1.0 called `0000:0799` with the NULL `FILE*` and then jumped to the exit. `0000:0799` is Borland `fclose` (it first checks `fp->token`, at `+0x12`, against `fp`), so 1.0 ran `fclose(NULL)`. That check reads the vector-table word at `0000:0012`, which is normally non-zero, so the call returns EOF and does nothing else. The call is removed in 1.04, along with an unreachable duplicate `jmp` after it (the 3-byte old gap `04A1:0EE6`). The removal is high confidence; "harmless" is an inference. (b) 1.04 copies two values just read from the file into **new globals at DGROUP `0x92`/`0x94`**. *Decoded:* they are `oldscene` and `curscene`, the scene loop's state in `play()` (`04A5:081E`), and this is a behavior change, not noise. See item 14 (high) |
| `04A1:1B73` → `04A5:1BB5` | "Missing File:" path gains a trailing call (`+push w[bp-2]…lcall F`); possibly a freed buffer; low |
| `04A1:63F0` → `04A5:6636` (low-confidence match) | compares now go through a 7-entry array filled by a new near call (`04A5:632A`); intent unclear |

The string hint `FIND_BOARD`/`You are missing %s.gam!` on a handful of these (`push 0x130`,
`mov dx,0x140`) is an immediate that happens to equal a string offset in the other build. Not a
change.

### 13. Layout, data and strings

- **Header** (from `summary.md`): file 82,803 → 83,136, image 78,194 → 78,528, relocations
  1,035 → 1,063, SS 2158 → 216D, DGROUP paragraph 11DF → 11DD, version string `1.0` → `1.04`; the
  same Borland C++ 1991 / TLINK, large model, no overlay, **no packer** in either. The segment
  layout shifts (`0CC3` → `0D04`, `0E94` → `0EC6`, `1073` → `105E`, `1197` → `1192`), which is
  why 132 functions are *relocated* and 43 *data-moved* (same instructions, DGROUP offsets
  shifted, 0x136C → 0x14DA in `0000:0000`).
- **Data** (4,994 → 5,360 bytes): 5 inserts, 2 deletes, 32 replaces. The inserts and replaces are
  the string differences below plus the shifted pointer tables (e.g. old `0x106A…` →
  new `0x11D8…`, word-for-word +0x16E). *Amended:* the region `summary.md` lists as old
  `0x11AA`, 103 bytes → new `0x1354`, 43 bytes, is decoded. It is not a change, only a misalignment
  of the report's content-defined chunks inside Borland's stream table. Old `0x1058`–`0x11E7`
  (new `0x11C6`–`0x1355`) is `_streams[20]`, twenty 20-byte `FILE` records. Each record's
  `token` word (`+0x12`) holds the record's own address (`fclose` checks it, see item 12),
  so all 20 tokens move by +0x16E with the table (old `0x106A` = `0x1058`, new `0x11D8` =
  `0x11C6`, and so on). A byte alignment of the two data segments shows those 40 bytes as the
  only differences in the 400-byte table. Old `0x11AA`–`0x1210` against new `0x1318`–`0x137E`
  differs only in 4 token words. The two rows after it are also pointer moves:
  `0x12D6`/`0x12DA` hold BSS pointers `0xF786`/`0xF78A` → `0xF8F4`/`0xF8F8` (+0x16E), and
  `0x137A`/`0x1380` hold code offsets `0000:4659`/`477E` → `0000:469D`/`47C2`. Those map
  (`inspect_pair.py maps`), and appear to be run-time startup/exit table entries (priority
  0x10). High confidence.
- **Small-variable shifts at the start of DGROUP** (needed to read the gaps below): 1.04 inserts
  two words at `0x92`/`0x94` (`oldscene`/`curscene`, item 14), so old `0x92`–`0xA3` move +4.
  It also inserts 6 more bytes, so old `0xA5`–`0xA9` move +0xA. The new bytes `0xA9`–`0xAE`
  are not referenced by any
  absolute operand in the 1.04 listing; their use is unknown. These variables are zero-filled,
  so a byte alignment cannot place them. The evidence is the matching reference counts in the
  two listings: old `[0xa3]` 2 / `[0xa6]` 23 / `[0xa9]` 13 against new `[0xa7]` 2 / `[0xb0]` 23 /
  `[0xb3]` 13. The bytes `0xA5` and `0xA8` are used only by the interrupt handlers outside the
  functions. They sit right before `0xA6` and between `0xA6` and `0xA9`, so they can only be
  new `0xAF` and `0xB2`. Medium-high confidence.
- **Strings only in 1.04:** `Trident 8800/8900 VGA chip detected!`, `Trident ID – Unknown Hardware
  chip version – assuming 8900!`, `ShowVideoMemory`, `FIND_BOARD`, `Trident8800`, `Trident8900`,
  vendor names (`ChipTech`, `Genoa`, `Paradise`, `Video7`, `Digital`), `You are missing Game
  Maker's Title Screen (gmtitle.gif)!`, the order-screen lines, `Version 1.04`. **Only in 1.0:**
  `Trident VGA detected!`, `You are missing Game Maker's Title Screen!`, `Version 1.0`, the
  old order lines. The other new fragments (`!AtD`, `%APR`, `hivj`, `YYh0u`, `uuh0u`,
  `ijklmnopqrstuvwxyz`) are code and table bytes, not text.
- **DOS services:** `int 21h` AH=29h 6 → 4, 3Eh 5 → 3, 3Fh 3 → 2, 42h 6 → 5, 48h/49h 2 → 1,
  4Ah 6 → 4; in/out port instructions 52 → 25. These follow from item 9 and the removal of dead
  C-runtime paths (`0000:3EDB` region, `0000:313C` constants).
- **Embedded files, imports, resources:** none (MZ has no import table or resources); no embedded
  files found in either.

### 14. A restored game carries into the scene loop (`play` `04A1:080B` → `04A5:081E`; `.sav` reader `04A1:0E9C` → `04A5:0EC9`)

**What the functions are** (structure matched against 3.0 `code/GM/PLAYGAME.C`; high):

- `04A1:080B` / `04A5:081E` is `play(int curlink)` (`PLAYGAME.C:1081`), the loop that runs one
  scene after another. It has one caller in each build, a case body of the title menu outside
  every discovered function: `push 0; lcall 04A1:080B` at `04A1:0402`, and `push 0;
  lcall 04A5:081E` at `04A5:0415`. That is `play(0)`. A byte search finds no other far call,
  stored far pointer or near call.
- `04A1:09CD` / `04A5:09FA` is `playscene(dosc, prev, link)` (`PLAYGAME.C:1330`). The tool
  rates it *data-moved*, so it is the same code in both builds. It returns the link taken. It
  returns `0x15` when the character died with lives left (`dec [0x8684]`, `04A1:0CCC`–`0CD6`),
  and `play` then plays the scene again. It returns `0x14` to end the game.
- Its function-key switch calls the `.sav` reader with the addresses of its own three arguments
  (`lea [bp+6]`, `[bp+8]`, `[bp+0xa]`; `04A1:0B5F`–`0B6E`, `04A5:0B8C`–`0B9B`). The reader
  reads `prevscene`, then `doscene`, then `linkin` through those pointers, then loads the scene's
  files using `*dosc`. `playscene` goes on with the restored scene: it passes `[bp+6]` to
  `04A1:63F0`, apparently `chklnk(doscene)` (`PLAYGAME.C:1525`; `push [bp+6]` at
  `04A1:0BB4`). This is the same in both builds.
  The save routine (item 8) gets the same three values, by value.

**What changed in `play`** (side diff, high):

| state | 1.0 | 1.04 | 3.0 source |
|---|---|---|---|
| `curscene` | register `di` | DGROUP word `0x94` | global `curscene` (`PLAYGAME.C:344`) |
| `oldscene` | local `[bp-2]` | DGROUP word `0x92` | global `oldscene` (`:343`) |
| `oldlink` | local `[bp-4]` | register `di` | local |
| first scene | `di = [0x1719]`, which is `Game.scns[0].links[0].ToScene` (`0x16A6 + 0x6F + 4`) | `[0x94] = [si*10 + 0x1887]`, which is `Game.scns[0].links[curlink].ToScene` | `:1091`, as 1.04 |

The 1.04 reader adds `les bx,[bp+0xa]; mov ax,es:[bx]; mov [0x92],ax` and `les bx,[bp+6];
mov ax,es:[bx]; mov [0x94],ax` (`04A5:0FC3`–`0FEA`). Those are 3.0's `oldscene = prevscene;
curscene = doscene;` (`PLAYGAME.C:1795–1796`). The rest of `play` is relinking. The frame
loses the two word locals (`enter 0x44` → `0x40`, `[bp-5]` → `[bp-1]`), DGROUP offsets move,
and `push cs; call 04A1:0005` becomes `lcall 04A5:82EF`, which is the same 100-byte function
placed at the end of the segment. A byte search of the whole 1.04 code region (gaps included)
finds 14 absolute operands at `0x92`/`0x94`: 12 in `play` and 2 in the reader. Nothing else
uses them.

**Effect** (inferred from the code; nothing was run). After `playscene` returns link `L`, `play`
sets `oldscene = curscene` and `curscene = Game.scns[oldscene].links[L].ToScene`. If it got
`0x15`, it plays `curscene` again. Suppose the player restores, inside scene C, a game saved in
another scene R:

- **1.0:** `play` still holds C, because the reader could only write `playscene`'s copies. The
  game goes on in R, but when the player leaves R by link `L` the next scene is
  `Game.scns[C].links[L].ToScene`. That is C's link `L`, not R's. The next `playscene` also gets
  `prev = C`, so the entry position comes from C's link too. Losing a life in R replays C, not R.
- **1.04:** `play` sees R, so the exit follows R's link and a lost life replays R.
- Restoring a game saved in the scene being played behaves the same in both.

Not changed: the `.SAV` layout (the writer is constants-only; the reader reads the same three
ints in the same order), the first scene (the only caller passes 0, so `links[curlink]` is
`links[0]`) and the loop bounds (`cmp 0x14`, `cmp 1`). One gap remains, and 3.0 has it too.
`oldlink` is not restored, so a life lost right after a restore replays R from
`Game.scns[prevscene].links[oldlink]`, with the `oldlink` that `play` held before the restore
(`mov si,di`; 3.0 `curlink=oldlink`). That may not be R's entry *(inferred)*. 2.02 later changes
what a restore keeps again ([player-diff-2.02.md](player-diff-2.02.md) change 1: the view
position, a file-format change). 1.04's change is in the loop state, not the file.

Classification: **behavior change, bug fix** (restore across scenes). High confidence for the
code and the 3.0 correspondence. The effect on play is an inference from the code; it was not
tested in DOSBox.

### Tool artifacts (not changes)

| listed as | really |
|---|---|
| added `0D04:02BF`, `0D04:0AE9` (1,816/1,814 B) | overlapping mis-decodes inside the large menu function `0D04:000A…` (first bytes `c8 9a ec 00 da 0c` are a `lcall 0CDA:00EC`); the string hint comes from the same body |
| removed `0000:3EDB`, `0E94:0386` partly | `3EDB` is inside `0000:3ECB`; `0386` is real (item 9) |
| changed `04A1:5338` → `04A5:557E` ("constants") | code with the display-width global moved `0x95D6` → `0x9744`; the `enter` opcode is a mis-decode |
| `inspect_pair.py gaps`: old gap `0CC3:03CE` (859 B) paired with new `0D04:0D0B` (16 B) | wrong partner. Gaps are paired by the matched function before them. In 1.0 the case bodies follow `0CC3:0339`, an overlapping decode that starts inside `getfname` and is matched to `0D04:0BD3`; in 1.04 they follow the unmatched mis-decode `0D04:02BF`. The real partners are `0CC3:03CE` ↔ `0D04:03B8` and `0CC3:0D85` ↔ `0D04:0D0B`, which the tool now lists as UNPAIRED |

## Bytes outside functions

The function report compares only what the function finder reached. It misses switch-case
bodies whose bounds check sits in an earlier block than `jmp cs:[bx+table]`. It also misses
Borland sparse switch tables (`mov cx,n; mov bx,table`, then n values followed by n targets),
jump tables, interrupt handlers that start with `push ax`, and padding. Those bytes were
compared on their own with `inspect_pair.py gaps`, which pairs each gap with the k-th gap
after the same matched function. Every differing gap was then read by hand.

**Accounting.** 1.0 has 72 gaps (5,361 bytes) and 1.04 has 72 (5,351 bytes). The tool pairs
68. One of those pairings is wrong (see Tool artifacts), and three gaps on each side are
unpaired, one of them only because its owner is a mis-decode. With the pairing corrected there
are 70 pairs and 2 + 2 unpaired gaps:

| class | count | gaps (old → new) | what | confidence |
|---|---|---|---|---|
| byte-identical (relocations masked) | 45 | 44 from the tool; plus `0000:40DB` → `0000:411F` (12 zero bytes after the mis-decoded `0000:3EDB`/`3F0F`, +0x44 like the code around it) | – | high |
| relocated words / mapped targets only | 9 | jump tables `0000:3C4A`, `04A1:05A2`, `04A1:0CE6`, `04A1:0E88`, `04A1:24D1`, `04A1:6715`, `0CC3:1803`, `0F63:07CA`; code `0CC3:0F2C` | noise | high |
| DGROUP offsets moved, nothing else | 11 | `0000:1A6F`, `21A9`, `254B`, `2942`, `2967`, `3884`, `4653` (C run-time: `_streams` at 0x1058 and other run-time variables); `04A1:03E6` (the title's help/storyline/credits case bodies: strings +0x33, far calls that map); `04A1:64F1` (seven `lcall [0xF63C]` → `[0xF7AA]`); `04A1:7418` (the timer handler, which counts ticks, chains the BIOS every 8th tick and plays the note queue, and the keyboard handler `in al,60h`); `1197:0000` (a second tick-count handler) | noise | high; medium-high for the two byte variables `0xA5`, `0xA8` (item 13) |
| sparse switch tables, values equal, targets shifted with the code | 2 | `0CC3:0D85` → `0D04:0D0B` (`getfname` keys 0, 8, 0x0D, 0x1B; targets `03CE/0624/0652/064A` → `03B8/05F4/0622/061A`); `0CC3:0FD0` → `0D04:0F59` (same keys, `0CC3:0EB5`; targets map) | noise | high |
| padding | 1 | `1197:047E` → `1192:04A3`: 2 → 13 zero bytes before DGROUP (paragraph alignment) | noise | high |
| **code changes** | 2 | `0CC3:03CE` (859 B) → `0D04:03B8` (820 B), `getfname`'s case bodies; `0CC3:1611` (184 B) → `0D04:1556` (170 B), `horizmenu`'s case bodies | items 4 and 5 | high |
| unpaired, old only | 2 | `04A1:0EE6` (3 B): an unreachable `jmp 0x148F` after the `fclose(NULL)` that 1.04 removed (item 12); `114C:0003` (1 B): a zero byte that word-aligns `114C:0004` after `1109:0408`, which 1.04's relinked `1106:0401` does not need (it ends on even `1148:000C`) | removal; padding | high |
| unpaired, new only | 2 | `105E:0112` (20 B): 10 near targets, all inside `105E:000F` (item 1's forced-chip switch); `105E:02A8` (16 B): 8 targets inside `105E:019F` (item 1's vendor switch; Paradise and Digital share `0252`, calling `03D6`) | part of item 1 | high |

The bytes reconcile: −39 (`getfname` bodies) −14 (`horizmenu` bodies) +11 (padding) −3 −1
(old-only) +20 +16 (new-only tables) = −10 = 5,351 − 5,361.

**How the 16 residual pairs were read.**

- *DGROUP moves.* Each changed operand was checked with `inspect_pair.py dgroup`. That covers
  65 offsets: inside the initialized data by a byte alignment of the two data segments
  (strings such as `"Sorry, the file does not exist!"` 0x911 → 0x96B and the `.txt`/`gam\`
  pieces +0x33), past it by the data segment's growth, +0x16E (4,994 → 5,360 bytes). The four
  zero-filled variables `0xA5`, `0xA6`, `0xA8` and `0xA9` cannot be aligned, so they were
  placed by reference counts (item 13). As a separate check, 39 of the 69 old → new pairs
  also occur, as the same pair, in instructions of matched functions. The
  self-modifying `mov cs:[0x4657], ds` in `0000:4653` moves with its code (+0x44, `maps`).
- *`getfname` case bodies.* With jump and far-call targets masked, the two ranges differ only
  in these places. Three mouse positions no longer scale pixels to cells
  (`mov ax,[bp-0x3e]; shl ax,3; add ax,4; push ax` → `push word ptr [bp-0x3e]`, and
  `shl ax,3; add ax,4` dropped from the x value; −13 bytes each, −39 in all), which is item 4.
  The `errorbox` call gains `push 0x7530` and `add sp,0xa`. Its `je +3; jmp near` (5 bytes)
  becomes a 2-byte `jne`, and the 3-byte push takes up the difference. That is item 5. Three
  string pushes move +0x5A ("rb" and
  the two box lines). All 37 jumps whose displacement differs land on aligned instructions,
  and the table targets shift by exactly the bytes removed before them (−0x16 from code
  before the gap, then −0x1A after two mouse edits). The far calls map: `0CA0:00AA` →
  `0CDA:00EC` (set mouse position) and `0CC3:1088` → `0D04:1011` (`errorbox`).
- *`horizmenu` case bodies.* The Right-arrow and Left-arrow bodies each drop two `shl ax,3`
  (x = `lens[i±…]`, y = the row), and their `setmoupos` call goes to `0CDA:00EC`. That is
  item 4, in a function nothing calls.

Nothing in the gaps is a new kind of change. The out-of-function pass adds two `setmoupos`
call groups and one `errorbox` site to items 4 and 5. It confirms item 1's two new switch
tables, and it corrects item 12's description of the `.sav` reader.

## Cross-checks

| source | what it says | verdict |
|---|---|---|
| `code/GM/SVGAC.C:80,100–140` (3.0) | vendor table, 256-byte scan, Trident 8800/8900, Digital = Paradise | confirms item 1 structure |
| `code/GM/PLAYGAME.C:604` | `ShowVideoMemory` switch | confirms item 3 |
| `code/GM/WINDIO.H:20`, `WINDIO.C:517` | `errorbox(…, maxpause=30000)` | confirms item 5 |
| `code/GM/BUGLIST.TXT` (internal "Version 1.06") | monster/restore timers, Transfer gmtitle | possible context for 6 and 10; unverified |


No changelog for 1.01–1.04 was found in the reviewed inputs; the confirmed/speculative
labels come from the code and the 3.0 source only.

## Commands

From the repository root, after inventorying the optional local archive corpus with
`uv run scripts/player-diff/gmpdiff.py all --reference "$CORPUS"` (`CORPUS` is the
directory containing `reference/archive/`; Deark must be available to unpack packed inputs):

```sh
DEARK=~/.cache/gm-player-diff/tools/deark uv run scripts/player-diff/gmpdiff.py diff --pair 1.00-xfer 1.04
# work folder ~/.cache/gm-player-diff: bin/, listings/<build>.lst, pairs/1.00-xfer__1.04/<oldlin>_<newlin>.diff
W=~/.cache/gm-player-diff
grep -n -A80 '^; ---- 105E:019F' $W/listings/1.04.lst        # a function in the new build
cat $W/pairs/1.00-xfer__1.04/10738_105EF.diff                # its diff (lin = segment*16+offset)
# strings: file offset = DGROUP paragraph*16 + 0x1200 (new 0x11DD, old 0x11DF)
python3 - <<'E'
import json, os
from pathlib import Path
w=Path(os.environ.get('GMPD_WORK', Path.home()/'.cache/gm-player-diff'))
c=json.loads((w/'canonical.json').read_text())['1.04']
b=(w/c['cached']).read_bytes()
base=0x11DD*16+0x1200; print([b[base+0xd67+i*21:][:21].split(b'\0')[0] for i in range(8)])
E
grep -n -E 'lcall 0xe94, 0x(386|42f|6c9)|call 0x(386|42f|6c9)' $W/listings/1.00-xfer.lst   # no callers (item 9)
```

Bytes outside functions (branch `feature/player-diff-1-04-gaps`, which adds `UNPAIRED` gaps
and the `dgroup` check to `inspect_pair.py`):

```sh
uv run scripts/player-diff/gmpdiff.py all --reference "$CORPUS"
git status --short docs/analysis/player-diff        # empty: the reports reproduce byte for byte
I="uv run scripts/player-diff/inspect_pair.py"
$I gaps 1.00-xfer 1.04                              # 44 equal, 9 RELOC-ONLY, 15 RESIDUAL, 4+4 UNPAIRED

# the two code changes: case bodies with jump/far-call targets masked
N='s/^(j[a-z]+|lcall) .*/\1 T/'
diff <($I dis 1.00-xfer 0CC3:03CE 0729 | cut -c27- | sed -E "$N") \
     <($I dis 1.04      0D04:03B8 06EC | cut -c27- | sed -E "$N")    # getfname: 3 mouse edits, errorbox, strings
diff <($I dis 1.00-xfer 0CC3:1611 16C9 | cut -c27- | sed -E "$N") \
     <($I dis 1.04      0D04:1556 1600 | cut -c27- | sed -E "$N")    # horizmenu: 4 x shl ax,3

# code pointers and far-call targets that moved
$I maps 1.00-xfer 1.04 0000:4657=0000:469B 0000:4659=0000:469D 0000:477E=0000:47C2 \
  0CC3:0F6D=0D04:0EF6 0CC3:0F2C=0D04:0EB5 0CC3:0F61=0D04:0EEA 0CC3:0F5A=0D04:0EE3 \
  0CA0:00AA=0CDA:00EC 0CC3:1088=0D04:1011

# every DGROUP operand that differs in a residual gap (65 map; A5 A6 A8 A9 are zero-filled)
$I dgroup 1.00-xfer 1.04 98=9C 9A=9E 9C=A0 A0=A4 A1=A5 A5=AF A6=B0 A8=B2 A9=B3 \
  18C=1BF 1AB=1DE 1B0=1E3 1B5=1E8 1D4=207 1D9=20C 1DE=211 1FD=230 202=235 90E=968 911=96B 931=98B \
  F42=10B0 F44=10B2 1058=11C6 105A=11C8 105C=11CA 106C=11DA 106E=11DC 1070=11DE 1236=13A4 \
  1237=13A5 123A=13A8 123B=13A9 124E=13BC 12F0=145E 1358=14C6 135A=14C8 135C=14CA 135E=14CC \
  1360=14CE 1362=14D0 1364=14D2 1366=14D4 1368=14D6 136A=14D8 136C=14DA 13A6=1514 16C5=1833 \
  16CF=183D 16D9=1847 8686=87F4 8688=87F6 8694=8802 86D0=883E 880C=897A 880E=897C 8811=897F \
  95DA=9748 95E0=974E 95E2=9750 95E3=9751 A4F2=A660 B050=B1BE B051=B1BF B053=B1C1 B2A0=B40E \
  B361=B4CF B365=B4D3 F63C=F7AA
W=${GMPD_WORK:-~/.cache/gm-player-diff}
for b in 1.00-xfer 1.04; do grep -oE '\[0x(9[0-9a-f]|a[0-9a-f]|b[0-9a-f])\]' $W/listings/$b.lst | sort | uniq -c | tr '\n' ' '; echo; done

# the sparse tables and the unpaired gaps (words: values, then targets; see the heredoc below)
grep -n 'mov bx, 0xd85\|mov bx, 0xfd0' $W/listings/1.00-xfer.lst; grep -n 'mov bx, 0xd0b\|mov bx, 0xf59' $W/listings/1.04.lst
grep -n -B8 -A3 '^04A1:0EE3' $W/listings/1.00-xfer.lst          # fclose(NULL) and the dead jmp at 0EE6
grep -n -A12 '^; ---- 0000:0799' $W/listings/1.00-xfer.lst      # fclose: token check at +0x12
grep -n -A70 '^; ---- 105E:019F' $W/listings/1.04.lst | grep -A40 'cs:\[bx + 0x2a8\]'
```

The `_streams` tokens and the raw tables were checked with the same work folder:

```sh
uv run python - <<'E'
import json, struct, os
W = os.path.expanduser(os.environ.get("GMPD_WORK", "~/.cache/gm-player-diff"))
c = json.load(open(f"{W}/canonical.json"))
img = {b: open(f"{W}/{c[b]['cached']}", "rb").read()[0x1200:] for b in c}   # load image (header 0x1200)
for b, dg, base in (("1.00-xfer", 0x11DF, 0x1058), ("1.04", 0x11DD, 0x11C6)):
    print(b, all(struct.unpack_from("<H", img[b], dg * 16 + base + 20 * k + 0x12)[0] == base + 20 * k
                 for k in range(20)))                                 # True: token == own address
lin = lambda a: int(a[:4], 16) * 16 + int(a[5:], 16)
for b, a, n in (("1.00-xfer", "0CC3:0D85", 8), ("1.04", "0D04:0D0B", 8), ("1.00-xfer", "0CC3:0FD0", 8),
                ("1.04", "0D04:0F59", 8), ("1.04", "105E:0112", 10), ("1.04", "105E:02A8", 8),
                ("1.00-xfer", "04A1:0EE6", 0), ("1.00-xfer", "114C:0003", 0)):
    print(b, a, [f"{w:04X}" for w in struct.unpack_from(f"<{n}H", img[b], lin(a))],
          img[b][lin(a):lin(a) + 3].hex(" "))
E
```

Item 14 and the item 8 correction (branch `feature/player-diff-1-04-sav-globals`, same work
folder). The `side` view prints the new build's text on lines it aligns as equal, so read the
old operand from the old listing (e.g. the reader's `push 0x298` is `push 0x265` in 1.0; both
are `".sav"`).

```sh
I="uv run scripts/player-diff/inspect_pair.py"; W=~/.cache/gm-player-diff
$I side 1.00-xfer 1.04 04A1:080B 04A5:081E          # play(): di/[bp-2] -> [0x94]/[0x92], first scene
$I side 1.00-xfer 1.04 04A1:0E9C 04A5:0EC9 | grep -B3 -A3 '0x9[24]\]'   # reader: two new stores
$I dis 1.00-xfer 04A1:03FD 040A; $I dis 1.04 04A5:0410 041D   # the only caller: push 0; lcall play
grep -n -B12 -A1 'lcall 0x4a1, 0xe9c' $W/listings/1.00-xfer.lst   # &dosc,&prev,&link from playscene
grep -n -A12 '^04A1:0CB6' $W/listings/1.00-xfer.lst               # playscene returns 0x15 / 0x14
grep -n '^04A1:0BB4' $W/listings/1.00-xfer.lst                    # push [bp+6] after the key switch
grep -n -A45 '^; ---- 04A1:1493' $W/listings/1.00-xfer.lst | grep -E 'push 0x2a|lcall 0, 0x120b'  # save: ".sav", "wb"
grep -E '04A1:(080B|09CD|0E9C|1493)' docs/analysis/player-diff/pairs/1.00-xfer__1.04/functions.tsv | cut -f1-2
uv run python - <<'E'
import json, os, struct
W = os.path.expanduser("~/.cache/gm-player-diff"); c = json.load(open(f"{W}/canonical.json"))["1.04"]
m = open(f"{W}/{c['cached']}", "rb").read()[0x1200:]
for v in (0x92, 0x94):   # absolute [disp16] operands anywhere in the code region, gaps included
    hits = [i for i in range(1, 0x11DD * 16 - 1) if m[i:i + 2] == struct.pack("<H", v)
            and ((m[i - 1] & 0xC7) == 0x06 or m[i - 1] in (0xA0, 0xA1, 0xA2, 0xA3))]
    print(hex(v), [f"04A5:{h - 0x4A50:04X}" for h in hits])   # 5 + 9, all in 081E-08DC or 0FCA/0FEB
E
grep -n -E 'curscene|oldscene' code/GM/PLAYGAME.C | sed -n '1,40p'   # 343-344, 1081-1141, 1795-1796
```

Old: `DRIVEIN.EXE` (sha256 `9325207c…`); new: `BCUDA1SW.EXE` (sha256 `8e9f2e66…`).
Full public source labels and checksums are in [the inventory](player-diff/inventory.tsv).
Not committed: the corpus binaries and full listings.
