# What the Game-Maker 2.02 player changed

This page compares the machine code of the 2.02 stand-alone player (XFERPLAY) with 2.00, the
newest earlier 2.x player held (no 2.01 is known). It accounts for every byte of the code
region that differs, not only the functions the tool matched.

- Old: 2.00, `BLINKY2.EXE` (full source label in [inventory.tsv](player-diff/inventory.tsv)), 154,980
  bytes, SHA-256 `48375bfed6986342…` (8 more copies are identical apart from the owner stamp).
- New: 2.02, `RICKY2.EXE` (full source label in [inventory.tsv](player-diff/inventory.tsv)),
  155,156 bytes, SHA-256 `c57bd17579c48d86…` (20 more copies are identical apart from the owner stamp).
- Inventory and function table: [`player-diff/pairs/2.00__2.02/`](player-diff/pairs/2.00__2.02/summary.md).
- Addresses are `segment:offset` in the load image, as the tool prints them. Segments after
  `03B4` sit 0xA to 0xC paragraphs later in 2.02, so the same function has a different address.

**Answer.** 2.02 is a maintenance release built with the same compiler and linker (Borland C++
©1991, TLINK 5.0). It has five changes that affect play, plus one change in library code
that the player never calls. Everything else that differs is relinking: the added code moves
later functions, jump tables, interrupt handlers and the data segment.
The binary evidence shows this is not merely a version-string change.

## Summary

| # | change | 2.00 → 2.02 address | class | confidence |
| --- | --- | --- | --- | --- |
| 1 | Saved games store the map view position (`mx`, `my`); restoring no longer re-centers the view on the character. The `.SAV` file gains 4 bytes at offset 4,679. | `Save_Game` 03B4:17A2 → 03B4:17FE; `Load_Game` 03B4:124F → 03B4:12A9 | bug fix, file-format change | high (code and source); the effect on play is an inference |
| 2 | Title menu: Esc now quits, and the menu counts its items 1–6 instead of 0–5. | `DoGame` 03B4:02B1 → 03B4:02B1 | new feature (behavior change) | high |
| 3 | Title menu: the buffer for the intro-music file name grows from 20 to 62 bytes. In 2.00 the path of the player's own folder could overflow it on the stack. | `DoGame` (local `out`, `[bp-0x26]` → `[bp-0x50]`) | bug fix (stack overflow) | high for the code; medium that it misbehaved in practice |
| 4 | `MoveViewScreen(0,0)` is called after `ViewWindow(0)` wherever the game resets the screen (5 places), and the title screen first calls `MoveWindow(0); ViewWindow(0)`. This resets the scroll registers and their cached values. | `play` 03B4:096C → 03B4:099C, `playscene` 03B4:0C0E → 03B4:0C4C, `DoFunKy` 03B4:0FD8 → 03B4:1024, `DropBloc` 03B4:2558 → 03B4:25E0, `loadscene` 03B4:7580 → 03B4:7616, `DoGame` | bug fix (display) | high for what the code does; medium for the symptom it fixed |
| 5 | The sprite-block drawer clears the high byte of its `char` rotation argument (`mov ah,0`). In 2.00, a sprite near the right edge could be drawn with the wrong rotation or flip once more than 170 dirty rectangles were queued. | `_BufDrawSpBlk` 0D87:0004 → 0D91:0008 | bug fix | high for the fix (source comment); the symptom is an inference |
| 6 | `horizmenu`: Esc (or Up) now selects and returns 0 (cancel). In 2.00, Esc and Up did nothing. | 0E59:13F9 → 0E63:13FF; case bodies in the gap 0E59:14DB → 0E63:14DD | library change, **dead code in the player** | high; it has no effect in the player (nothing calls it) |
| 7 | About text "Version 2.00" → "Version 2.02". | data 0977B (DGROUP) | version string | high |
| – | 94 *relocated*, 4 *constants*, 5 *data-moved* functions; 25 differing out-of-function gaps; header fields | see [Relinking noise](#relinking-noise) | compiler/relink noise | high |

No other differences exist. Nothing was added or removed, nothing is packed or protected
against tampering, and DOS/BIOS services, I/O ports, embedded files and the initialized data
are all unchanged apart from the version string.

### Size accounting

The image grows by 176 bytes, and every one is accounted for:

| where | bytes |
| --- | --- |
| `DoGame` 837 → 879 (two calls, 1-based menu, Esc case) | +42 |
| `play`, `playscene`, `DoFunKy`, `DropBloc`, `loadscene`: one `MoveViewScreen(0,0)` each (`push 0` ×3, far call, `add sp,6`) | +70 |
| `Save_Game` 482 → 526 (two `fwrite`) | +44 |
| `Load_Game` 1363 → 1365 (two `fread`: +32; re-centering removed: −30) | +2 |
| `_BufDrawSpBlk` 189 → 191 (`mov ah,0`) | +2 |
| `horizmenu` 506 → 518, plus its case bodies outside the function (+4) | +16 |
| `DoGame` case bodies outside the function (`lea` with a 16-bit displacement, longer `jmp`s) | +6 |
| alignment padding before the FM-music data in segment 13DE → 13E9 | −6 |
| **total** (code region 84,448 → 84,624; DGROUP paragraph 149E → 14A9) | **+176** |

There are 1,094 relocations in 2.00 and 1,105 in 2.02, an increase of 11. That is exactly the
number of new far calls: 2 in `DoGame`, 5 `MoveViewScreen` calls, 2 `fread` and 2 `fwrite`.

## The changes in detail

The function names come from the 2.04-era source in `code/GM/GM.ZIP` (`PLAYGAME.C`, `WINDIO.C`,
`SVGAC.C`, `SVGAA.ASM`, `MEMBLOCA.ASM`, `GENC.C`; newest file 1994-06-30), which already has
every 2.02 change, and from the strings each function uses. Each name was checked against
the call sequence in the binary. The excerpts are `inspect_pair.py side` output: `-` lines
are 2.00 only, `+` lines are 2.02 only, and other lines show both addresses.

### 1. Saved games keep the view position (bug fix, file-format change)

`Save_Game` (2.00 03B4:17A2, 2.02 03B4:17FE; "I cannot save your game!") gains two `fwrite`
calls of 2 bytes each, for the globals at DS:8F60 and DS:8F62. They come right after the
3,784-byte character record (DS:7422, `0xEC8`):

```text
  03B4:18D8 03B4:1934  push word ptr [bp - 2]
  03B4:18DB 03B4:1937  push word ptr [bp - 4]
+           03B4:193A  push 1
+           03B4:193C  push 2
+           03B4:193E  push ds
+           03B4:193F  push 0x8f60                  ; &mx
+           03B4:1942  lcall 3, 0x2531              ; fwrite
...
+           03B4:1955  push 0x8f62                  ; &my
+           03B4:1958  lcall 3, 0x2531              ; fwrite
```

`Load_Game` (2.00 03B4:124F, 2.02 03B4:12A9; "You have not saved a game!") reads them back at the same
place (`lcall 3, 0x2349`, `fread`, at 03B4:1440 and 03B4:1456). It also drops the code that
used to set the view from the character's map position:

```text
- 03B4:1720            mov ax, word ptr [0x8296]    ; chr.x[0]
- 03B4:1723            add ax, 0xfff8               ; - 8  (SCRNBLEN/2)
- 03B4:1726            mov word ptr [0x8f60], ax    ; mx
- 03B4:1729            mov ax, word ptr [0x829c]    ; chr.y[0]
- 03B4:172C            add ax, 0xfffb               ; - 5  (SCRNBWID/2)
- 03B4:172F            mov word ptr [0x8f62], ax    ; my
- 03B4:1732            cmp word ptr [0x8f60], 0
- 03B4:1737            jge 0x173e
- 03B4:1739            add word ptr [0x8f60], 0x64  ; + 100 (MLEN, map wraps)
- 03B4:173E            cmp word ptr [0x8f62], 0
- 03B4:1743            jge 0x174a
- 03B4:1745            add word ptr [0x8f62], 0x64  ; + 100 (MWID)
```

**Confirmed by source.** The 2.04-era `PLAYGAME.C` declares `int mx=0,my=0; // Screen
upperleft in the map[]`, adds `fwrite/fread((char *)&mx, sizeof(int), 1, fp)` after `chr`, and
keeps the 2.00 code commented out: `/* mx=chr.x[0]-(SCRNBLEN/2); … if (my<0) my+=MWID; */
// Commented out because mx,my are now saved and restored.` (`SCRNBLEN 16`, `SCRNBWID 10`,
`MLEN`/`MWID 100`; `char.h`: `int x[3],y[3]`, so `y[0]` is 6 bytes after `x[0]`, which
matches 0x8296 and 0x829C).

**Format.** Both builds write the same fields in this order: `prevscene`, `doscene`, `linkin`
(2 bytes each), the clock (4), `nxtchg` (150 × 4), `blkmap` (150), `ci` (135), `chr` (3,784). The
new `mx` and `my` follow at offset 4,679, then the monster info (200 × 53), monster map
(200 × 10), map (10,000 × 2), two count bytes and the block monsters (5 bytes each). Adding up
these sizes, a 2.00 save is 37,281 + 5n bytes and a 2.02 save is 37,285 + 5n bytes.

**Effect (inference).** In 2.00, a restored game was redrawn with the view centered on the
character, whatever the view had been when the game was saved. 2.02 restores the exact view.
The two formats are not interchangeable. 2.02 reading a 2.00 save would take its first 4
bytes of monster info as `mx` and `my` and read everything after them 4 bytes off. The
reverse is also true. No `.SAV` files from either build were available to test this.

### 2. Title menu: Esc quits, 1-based choices (new feature)

`DoGame` (03B4:02B1 in both; "GMtitle.gif", "You are missing Game Maker's Title Scree…"). In
2.00 the selection `si` ran from 0 to 5, only Enter (13) ended the loop, and choice 5 (the sixth
item) left the menu. In 2.02 the selection runs from 1 to 6, Esc (27) ends the loop with
choice 0, and both 0 and 6 leave:

```text
- 03B4:02BC            xor si, si                   ; choice = 0
+           03B4:02BC  mov si, 1                    ; choice = 1
...
  03B4:051D 03B4:0532  cmp ax, 0xd                  ; Enter
- 03B4:0520            je 0x56b                     ;   done = TRUE
- 03B4:0522            jmp 0x572
+           03B4:0535  je 0x587                     ;   done = TRUE
+           03B4:0537  cmp ax, 0x1b                 ; Esc
+           03B4:053A  je 0x58e                     ;   done = TRUE; choice = 0
+           03B4:053C  jmp 0x597
...
- 03B4:055B            or si, si                    ; wrap 0..5
+           03B4:0575  cmp si, 1                    ; wrap 1..6
  03B4:055D 03B4:0578  jge 0x57d
- 03B4:055F            mov si, 5
- 03B4:0562            cmp si, 5
+           03B4:057A  mov si, 6
+           03B4:057D  cmp si, 6
  03B4:0565 03B4:0580  jle 0x585
+           03B4:0582  mov si, 1
...
+           03B4:058E  mov word ptr [bp - 8], 1     ; Esc: done = TRUE
  03B4:0567 03B4:0593  xor si, si                   ;      choice = 0
...
  03B4:057B 03B4:05A0  mov bx, si
+           03B4:05A2  dec bx                       ; switch index = choice-1
  03B4:057D 03B4:05A3  cmp bx, 4
...
- 03B4:07AE            cmp si, 5                    ; leave on Quit
+           03B4:07DA  cmp si, 6                    ; leave on Quit
+           03B4:07DD  je 0x7e6
+           03B4:07DF  or si, si                    ; ... or on Esc (choice 0)
  03B4:07B1 03B4:07E1  je 0x7e6
```

The highlight bar does not move: 2.00 draws it at `si*8+0x79`, and 2.02 at `si*8+0x71` with `si` one
higher. The five actions in the case table are the same in both builds (03B4:0818 → 03B4:0848,
5 entries that map one to one). The 2.04-era source has the same logic: `int choice=1;`,
`if (choice<1) choice=6; if (choice>6) choice=1;`, `case 27: done=TRUE; choice=0;`.
**Confirmed.** In 2.00 the Esc key did nothing on this menu.

### 3. Title menu: intro-music file name no longer overflows (bug fix)

Also in `DoGame`, the stack frame grows from `enter 0x64` to `enter 0x8e`. The buffer passed
to `MakeFileName(out,"snd\\",scns[0].fnames[4],".cmf")` (`lcall 101C:0061`; 2.00 `1011:005B`)
before `InitMusic` moves from `[bp-0x26]` to `[bp-0x50]`. The other local buffer, `s`, moves
from `[bp-0x64]` to `[bp-0x8e]`.

```text
- 03B4:036A            lea ax, [bp - 0x26]
+           03B4:037F  lea ax, [bp - 0x50]
```

The `case 1` music restart in the out-of-function case bodies makes the same move
(03B4:05F9/0606 → 03B4:061F/062C). The `s` buffer used by cases 2–4 for `gam\*.txt` moves
from `[bp-0x64]` to `[bp-0x8e]` but stays 62 bytes.

In 2.00, `out` occupied `[bp-0x26]..[bp-0x13]`, which is 20 bytes. In 2.02 it occupies
`[bp-0x50]..[bp-0x13]`, which is 62 bytes, the size of `char out[MAXFILENAMELEN]` with
`MAXFILENAMELEN 61` (`GEN.H`). In the transfer player `MakeFileName` ignores its path
argument and writes `sprintf(out,"%s%s%s",gamepath,name,ext)` (`GENC.C`, the `TRANSFER`
branch; in the binary, 101C:0061 pushes DS:92E1 and the format "%s%s%s"). `gamepath` is the
folder part of `argv[0]` (`ParseFileName(argv[0],gamename,gamepath)`), and DOS gives
`argv[0]` as a full path. So the string is, for example, `C:\GAMES\RICKY2\` plus the song
name plus `.cmf`.

**Effect (inference, medium).** In 2.00, any such name longer than 19 characters overwrote
the locals above the buffer: the mouse values, then at 27 bytes the `TheGif` far pointer
(`[bp-0xc]`), and at 39 bytes the saved BP and return address. A non-NULL `TheGif` makes the
loop call `RestoreScrn` on a garbage pointer instead of drawing the intro screen. This happens
only when a Sound Blaster is found and scene 0 names intro music, and the outcome depends on
the path length. Nothing was run, so no crash was observed.

### 4. Screen resets also reset the scroll registers (bug fix, display)

`MoveViewScreen` (2.00 13A5:000E, 2.02 13B1:0004) is the first procedure in `SVGAA.ASM` (the
next one, at 13B1:009C, is `_GetROMFont`, named by the MAP). It waits for retrace and writes
the CRTC start address (ports 3D4h/3D5h, registers 0Ch/0Dh), the SVGA high start bits
(Tseng 33h, Trident) and the attribute controller's horizontal pel panning (3C0h, index 13h).
It also caches what it wrote in `OldAddr`, `OldHi` and `OldLit`, and skips any write whose
value matches the cache. `ViewWindow` (11B0:06C6, `SVGAC.C`) writes registers 0Ch/0Dh
directly, without updating that cache or the pel panning.

In 2.00, five functions reset the screen with `MoveWindow(0); ViewWindow(0)`, or the same two
calls in the other order. 2.02 adds `MoveViewScreen(0,0)` right after `ViewWindow(0)` in each:

```text
  03B4:0A75 03B4:0AA5  lcall 0x11b0, 0x6c6          -> 11A5:06C0|11B0:06C6   ViewWindow(0)
  03B4:0A7A 03B4:0AAA  add sp, 4
+           03B4:0AAD  push 0
+           03B4:0AAF  push 0
+           03B4:0AB1  push 0
+           03B4:0AB3  lcall 0x13b1, 4              -> 13A5:000E|13B1:0004   MoveViewScreen(0,0)
+           03B4:0AB8  add sp, 6
  03B4:0A7D 03B4:0ABB  cmp word ptr [0x9294], 1     ; if (curscene==1) // Game Won!
```

| function (source name) | 2.00 → 2.02 | evidence that it is that function |
| --- | --- | --- |
| `play` | 03B4:096C → 03B4:099C | `curscene==1` test right after the calls; ".txt" |
| `playscene` | 03B4:0C0E → 03B4:0C4C | `ViewWindow` before `MoveWindow` and the `scroll.*Stop` stores just before them, as in source |
| `DoFunKy` (function keys) | 03B4:0FD8 → 03B4:1024 | `Screen(0)`, `MoveWindow(0)`, `BoxFill(0,0,319,199,0)`, `ViewWindow(0)`, then `Screen(1)` |
| `DropBloc` | 03B4:2558 → 03B4:25E0 | "Choose object to drop" |
| `loadscene` (error path) | 03B4:7580 → 03B4:7616 | "map\\", the red-palette error screen, then `BoxFill(0,0,319,199,0)` |

`DoGame` also gains `MoveWindow(0); ViewWindow(0)` after `GraphMode()` (03B4:02D5–02E6, shown
in change 2). The 2.04-era source has every one of these calls (`PLAYGAME.C`: `play`,
`playscene`, `DoFunKy`, `DropBloc`, `loadscene`, `DoGame`). `MoveWindow` (11B0:0670) returns
early for `Paradise` and `Unknown` cards, masks the bank to 0–15 and calls `_SetPage`, as
`SVGAC.C` does.

**Effect (inference, medium).** After `ViewWindow(0)`, the hardware start address is 0 but
`MoveViewScreen` still holds the old address. If the next scroll targets that same address,
`MoveViewScreen` would skip the write, and the display would stay at the wrong start until
the address changed. The 0–3-pixel pel panning from smooth scrolling also stayed set, so
full-screen pages (function-key help, the drop menu, scene changes, game won/over, load
errors) could appear shifted by up to 3 pixels. 2.02 clears both. The calls are confirmed;
the symptom is reasoned from the code, not observed.

### 5. Sprite-block drawer clears AH (latent bug fix)

0D87:0004 → 0D91:0008 is `_BufDrawSpBlk(x, y, char rot, far blk)` from `MEMBLOCA.ASM`. It
draws a 20×20 block into the scratch buffer, skips color 255, and handles 8 rotations and
flips. 2.02 adds one instruction:

```text
  0D87:0025 0D91:0029  mov ax, word ptr [bp + 0xa]  ; ROT
+           0D91:002C  mov ah, 0
  0D87:0028 0D91:002E  cmp ax, 4
```

`MEMBLOCA.ASM` (2.04-era, file date 1993-11-26, and also in `code/GM/MEMBLOCA.ASM`) says why:
`mov ah,0 ; C may not clear high byte of ROT since it is a char`. There is one caller
(2.00 03B4:6ACE → 2.02 03B4:6B64, graded relocated). It first calls the dirty-rectangle routine
(0D63:0009 → 0D6D:000D) with `x, y, x+19, y+19`, then pushes `rot` with
`mov al,[bp+0xa]; push ax`, so AH is left over from that call:

- Normally the routine returns the clipped height `y2-y1+1`, which is 1 to 20, so AH = 0.
- If the block lies wholly above or below the screen, the clipped height is zero or
  negative (AH = FFh). The 2.00 code then takes the "less than 1" branch and draws the
  block unrotated.
- If the dirty list is already full (170 entries, `cmp [0xa276],0xaa`), the routine returns
  without touching AX, so AX is still `x+19` from the caller. For a block at x ≥ 237, AH = 1,
  and the 2.00 code takes the "greater than 6" branch, rotation/flip 7, whatever `rot` said.

**Confirmed:** the fix and its reason. **Inference:** in 2.00, a sprite near the right edge
could be drawn with the wrong rotation or flip in a busy frame, once more than 170 rectangles
had been queued. The off-screen case has no visible effect. None of this was observed in a
run.

### 6. `horizmenu`: Esc and Up cancel (library change, dead code in the player)

0E59:13F9 → 0E63:13FF is `horizmenu(int itemnum, int curitem, int y, ...)` from `WINDIO.C`
(varargs item positions, `moucur`/`setmoupos`/`moustats`, `drawcursor(...,0x7F)`). Its
scan-code switch (0x48–0x50) is outside the discovered function, so the change shows up in
two places:

```text
case table 0E59:166E → 0E63:1684, entry for scan code 72 (Up):
  2.00: 0x154E  jmp 0x1556                          ; break (nothing)
  2.02: 0x1550  mov byte ptr [bp-0xc], 0x1b         ; lowkey = 27 (Esc)
function body:
  0E59:1556 0E63:155C  cmp byte ptr [bp - 0xc], 0xd
+           0E63:1560  je 0x1568
+           0E63:1562  cmp byte ptr [bp - 0xc], 0x1b  ; Esc also selects
...
+           0E63:166C  cmp byte ptr [bp - 0xc], 0x1b
+           0E63:1670  jne 0x1676
+           0E63:1672  xor di, di                    ; Esc: return 0
+           0E63:1674  jmp 0x1677
+           0E63:1676  inc di                        ; else return item+1
- 0E59:1667            inc ax                        ; 2.00: always item+1
```

The start of the function also changes from `if (curitem==0) curitem=1;` to
`if (curitem==0) curitem++;`, which behaves the same. The 2.04-era `WINDIO.C` matches 2.02:
`case 72: lowkey = 27; // escape is the same as up arrow`, `if ((lowkey==13)||(lowkey==27))`,
`if (lowkey == 27) curitem=0; else curitem++;`.

**No effect in the player.** Neither build has a far call, a near call or a stored far pointer
to this function (all 64 KB of its segment were searched for each). It is linked in with
`WINDIO.C` but never called. The change matters to the editors that share `WINDIO.C` (for
example `MENU.C` calls `horizmenu`). For the player it is library noise. Confidence: high.

### 7. Version string

The initialized data (DGROUP to the end of the image, 64,388 bytes in both, relocations
masked) differs only in the 14-byte run at 0977B: `          Version 2.00   ` →
`          Version 2.02   `. The two other "strings" that differ (`-NYj`/`gNYj`,
`]EYW`/`kEYW`) are code bytes, near-call displacements that moved.

## Relinking noise

All of the following are explained by code moving. Each moved address was checked to map to
its counterpart through the matched functions (`inspect_pair.py maps`, all "maps").

**Functions graded relocated (94) and identical (298).** These have the same code, with
relocated segments and moved addresses only.

**Constants (4) and data-moved (5).** Each differs only by a pointer to code that moved:

| function 2.00 → 2.02 | grade | the differing value | what it points to |
| --- | --- | --- | --- |
| 03B4:000E → 03B4:000E ("ShowVideoMemory") | constants | far code pointer 03B4:81EA → 03B4:828E | a function that moved |
| 03B4:267E → 03B4:2714 | constants | `setvect(9, …)` handler 03B4:7E7F → 03B4:7F23 | keyboard interrupt handler (out-of-function code) |
| 0E59:0C02 → 0E63:0C08 ("%s*.*") | constants | far code pointer 0E59:0B16 → 0E63:0B1C | an interrupt handler ending in `iret` |
| 1253:0265 → 125F:025B | constants | sparse switch table 04B1 → 04A7 | the table that moved (values the same) |
| 0E59:0008 → 0E63:000E ("(E)xit.") | data-moved | sparse switch table 0B06 → 0B0C | the table that moved |
| 0E59:0D59 → 0E63:0D5F | data-moved | table 0ED5 → 0EDB | the table that moved |
| 11A5:0552 → 11B0:0558 ("ATI ULTRA") | data-moved | table 063C → 0642 | the table that moved |
| 1339:0000 → 1344:0006 | data-moved | table 02E8 → 02EE | the table that moved |
| 13DE:01A3 → 13E9:01A9 | data-moved | `mov dx,cs; mov ax,0x256` → `0x25c` | code in the same segment that moved |

The changed functions in change 4 (`play` and the others) also carry the `setvect` pointer
shifts (7DE4 → 7E88 for the timer handler, 7E7F → 7F23 for the keyboard handler) and longer
jump displacements. These are noise inside a changed function.

**Bytes outside functions.** The function finder does not reach code that is only reached
through a switch table whose bounds check sits in an earlier block (`cmp bx,4; jbe …; jmp
default` and then `shl bx,1; jmp cs:[bx+table]` in the next block). It also misses interrupt
handlers that start with `push ax`, jump tables, Borland's sparse switch tables (values
followed by targets, scanned with `mov cx,n; mov bx,table`) and padding. These bytes add up to
7,098 (2.00) and 7,102 (2.02) in 98 gaps. That is more than the summary's "bytes outside
functions" (4,480 and 4,484), because the summary adds up function sizes and some functions
share a tail; the gaps are what no function covers at all. They were compared on their own (`inspect_pair.py
gaps`):

- 72 of the gaps are byte-identical with relocations masked. The one unpaired gap is
  00000–00033, the 52-byte owner-stamp slot before the entry point. It is masked, and its
  contents are never printed.
- 13 differ only by relocated words and code addresses that map: jump tables at
  03B4:0818, 0FCC, 123B, 2927, 9904, 1050:06FA, 11A5:032D and 11A5:038B; the timer and
  keyboard handlers at 03B4:7DE4 (with `mov bp, DGROUP`, 149E → 14A9); and code at 0E59:046E,
  0E59:0DFC, 1253:03B4 and 1339:01D2.
- 12 needed reading by hand, because the checker decodes their tables as instructions:
  - 03B4:058C → 03B4:05B2, the `DoGame` case bodies: the buffer moves of change 3, `jmp`
    displacements and far-call offsets that map.
  - 0E59:14DB → 0E63:14DD and 0E59:166E → 0E63:1684, the `horizmenu` case bodies and their
    table: change 6.
  - Sparse switch tables whose values are the same and whose targets shifted by the same
    amount as the code: 0E59:0B06 (its handler's far calls 12FB:00C8, 0002, 019A, 0323, 0123 →
    1306:+6 map too), 0E59:0ED5, 11A5:063C, 1253:04B1 (targets −0x0A), 1339:02E8 and
    1339:0637 (8 targets, all +6).
  - 11A5:021C and 11A5:05A2: `mov ax, seg SVGAA; mov es:[0Ch]` → `es:[02h]`. This is the
    `_Vcard` variable at the start of the `SVGAA` code segment. The segment's paragraph base
    changed (13A5 → 13B1), but the linear address is still 2 bytes before `MoveViewScreen`
    in both builds (13A5C, 13B12).
  - 13DE:0328 → 13E9:032E: 8 leading zero bytes become 2, then 2,068 identical bytes of
    Creative's FM-music data. This is alignment padding.

**Header.** The file size and image size grow by 176, there are 11 more relocations, and
SS (2460 → 246B) and the DGROUP paragraph (149E → 14A9) move by 0xB paragraphs (176 bytes).
CS:IP (0003:0004), the 6,144-byte header, min/max allocation, the TLINK mark and the
compiler banner are unchanged.

## Cross-checks and what is not known

- **No changelog for 2.02 was found.** Searches of the repository (`code/`, `cd/`, `docs/`)
  and the reviewed input corpus turned up no 2.02 release notes. `code/GM/BUGLIST.TXT` is a "Version 1.06
  Bug List" (an internal number from the 1.x era), and none of its items describes these
  changes; it was not used as evidence.
- **Source corroboration.** `code/GM/GM.ZIP` holds the 2.04-era source (`GEN.H` `GMVER "2.04"`,
  `PLAYGAME.C` header "Version: 2.04"). Every 2.02 change above is in it, written the way the
  2.02 binary does it. Since 2.04 also has them, this confirms what the code does. Which build
  introduced each change is shown by the binaries, not the source.
- **Dating (inference).** The earliest zip date of a 2.02 player copy is 1993-12-30, and 2.00
  copies date from 1993-09-30. `MEMBLOCA.ASM`, which has the change 5 fix, is dated 1993-11-26.
  This fits 2.02 being built between October and December 1993. Zip dates show when a game
  was packed, not when the player was built.
- **Not run.** No player was executed. Every effect on play above is reasoned from the code.
  The `.SAV` incompatibility, the title-screen overflow and the display symptoms are
  inferences. A DOSBox run of each would confirm them.
- **Edited copies.** Two edited 2.02 copies exist: `JETDRIVE.EXE` (286 bytes differ) and
  Ballie's `BALLIE.DAT` (599 bytes). These are per-game patches, and this page does not
  cover them.

For this project's engine, DOS fidelity matters here (`AGENTS.md`). A 2.02 game restores the
saved view, while a 2.00 game re-centers it. Esc on a 2.02 title menu quits, while 2.00
ignores it. These are behavior notes; nothing in the engine was changed.

## Commands

Run from the repository root, after inventorying the optional local archive corpus with
`uv run scripts/player-diff/gmpdiff.py all --reference "$CORPUS"`. `CORPUS` is the
directory containing `reference/archive/`; Deark must be available for packed inputs:

```sh
# the baseline reports (inventory, every pair); reproduces docs/analysis/player-diff byte for byte
uv run scripts/player-diff/gmpdiff.py all --reference "$CORPUS"
git status --short docs/analysis/player-diff        # empty: nothing changed

# the matched functions that are not identical
grep -vE '^(identical|relocated)' docs/analysis/player-diff/pairs/2.00__2.02/functions.tsv

# each changed function side by side (old address, new address)
I="uv run scripts/player-diff/inspect_pair.py"
$I side 2.00 2.02 03B4:02B1 03B4:02B1      # DoGame (title menu)
$I side 2.00 2.02 03B4:124F 03B4:12A9      # Load_Game
$I side 2.00 2.02 03B4:17A2 03B4:17FE      # Save_Game
$I side 2.00 2.02 03B4:096C 03B4:099C      # play
$I side 2.00 2.02 03B4:0C0E 03B4:0C4C      # playscene
$I side 2.00 2.02 03B4:0FD8 03B4:1024      # DoFunKy
$I side 2.00 2.02 03B4:2558 03B4:25E0      # DropBloc
$I side 2.00 2.02 03B4:7580 03B4:7616      # loadscene
$I side 2.00 2.02 0D87:0004 0D91:0008      # _BufDrawSpBlk
$I side 2.00 2.02 0E59:13F9 0E63:13FF      # horizmenu

# bytes outside functions, and the moved code pointers
$I gaps 2.00 2.02
$I maps 2.00 2.02 03B4:81EA=03B4:828E 03B4:7DE4=03B4:7E88 03B4:7E7F=03B4:7F23 \
  0E59:0B06=0E63:0B0C 0E59:0B16=0E63:0B1C 0E59:0ED5=0E63:0EDB 11A5:063C=11B0:0642 \
  1253:04B1=125F:04A7 1339:02E8=1344:02EE 13DE:0256=13E9:025C 0E59:166E=0E63:1684 \
  12FB:00C8=1306:00CE 12FB:0002=1306:0008 12FB:019A=1306:01A0 12FB:0323=1306:0329 12FB:0123=1306:0129

# raw ranges read by hand (case bodies, the callees named above)
$I dis 2.00 03B4:0570 07A0 ; $I dis 2.02 03B4:05A0 0848
$I dis 2.00 0E59:14DB 1556 ; $I dis 2.02 0E63:14DD 155C
grep -n -A45 '^; ---- 13B1:0004' ~/.cache/gm-player-diff/listings/2.02.lst   # MoveViewScreen
grep -n -A36 '^; ---- 11B0:0670' ~/.cache/gm-player-diff/listings/2.02.lst   # MoveWindow
grep -n -A18 '^; ---- 101C:0061' ~/.cache/gm-player-diff/listings/2.02.lst   # MakeFileName

# the 2.04-era source used for names (read only)
unzip -o -q code/GM/GM.ZIP -d "$TMPDIR/gmzip"
grep -n "MoveViewScreen(0,0)\|Commented out because mx,my\|case 27:" "$TMPDIR/gmzip/PLAYGAME.C"
grep -n "C may not clear high byte" code/GM/MEMBLOCA.ASM
```

The search for callers of `horizmenu` (change 6) looked for the far call `9A FF 13 63 0E`,
the stored far pointer `FF 13 63 0E`, and every `E8` near call in segment 0E63 whose target is
13FF, and did the same for 2.00 (`9A F9 13 59 0E`, and 13F9 in 0E59). None was found.

This analysis and `inspect_pair.py` were written by Claude Opus 5.5 (Anthropic) for Lewis Moten.
