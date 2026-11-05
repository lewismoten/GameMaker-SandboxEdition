# Patching the player

Game-Maker 3.0 writes a finished game as a copy of one program, `XFERPLAY.EXE`, renamed to the game's name, beside the game's data files (ch 16 and `UTILITY.C:255-316`: `CopyFile("xferplay.exe", "<game>.exe")`, a plain 64,000-byte copy loop with no seek and no patching). Every word the player prints on its own (the menu, the high-score heading, "Score:", "Game Saved!"), every color it picks for them, every box it draws and every wait it times lives in that one file. None of it is in the game's data. In the 1990s an author who wanted a different menu opened the copy of the player in a hex editor and overwrote bytes. This chapter says exactly which bytes, why that works, and how this port offers the same edits without a hex editor. Every claim here that a patched player _runs_ is **[not yet checked in DOSBox]**: the port checks the bytes against the stock file and against the C source, and has never started a patched `.EXE`.

`patchTable.ts` = `web/packages/engine/src/player/patchTable.ts`. A `0x` number is a file offset in the CD's `XFERPLAY.EXE`, counted from the first byte of the file (the MZ header included), not an address in the program's memory.

## 1. The line this chapter keeps

- **Patch your own copy of your own game's player.** The CD's player is the one this port knows byte for byte; a game you made with it is yours to customize.
- **Credits and copyright text are not settings.** RSD's About text, the copyright lines and the notices are marked `keep` in the patch map and are left out of the table on purpose. Nothing here shows how to remove or hide an author's credit.
- **Registration is not taught.** The registration check (`CHK.C`, `gmReg/`) is a different subject. Shareware authors were paid by it, so this chapter explains what the player's settings are and does not show how to get around a registration. It lists no offset that belongs to registration code. (The desk's pretend `GMCRACK.EXE` stays a labeled toy for this project's own games and is not a how-to.)
- **Do not pass on someone else's patched player.** It carries their changes, and in the 1990s sometimes their buyer's stamp (the "owner stamp" of ch 16).
- **DOS fidelity.** The table offers only settings that were read from the file and checked against `PLAYGAME.C`; there is no "write any byte here" box (`patchTable.ts:1-7`).

## 2. XFERPLAY and PLAYGAME

Both programs are built from one `PLAYGAME.C`. XFERPLAY is compiled with `-DTRANSFER=1` (`XFERPLAY.MAK:36,39`), PLAYGAME without it (ch 16, "PLAYGAME vs XFERPLAY"). The `#ifdef TRANSFER` sites (`PG:589`, `PG:665`, `PG:1092`, `PG:1937`) remove the game picker, the registration handshake with the editors and the designer warnings from the distribution player.

The patch table is written for **XFERPLAY.EXE**: 160,598 bytes, MD5 `fcaf47d50ececa0b59cd22b3fae3cda3`, the file at `cd/gm/xferplay.exe` and the one all 343 stock copies in the collection match. PLAYGAME.EXE (163,130 bytes) holds the same strings and immediates at _different offsets_; its code is 2,532 bytes longer and everything after the first difference has moved. An offset from this chapter must never be applied to PLAYGAME.EXE, to an early 3.00 build (160,784 bytes), or to a 1.0, 2.0 or 2.04 player. They are other programs.

## 3. What a patch is

An `.EXE` is a file. A patch is "go to offset X and replace N bytes with these". The menu word "Play" is the smallest example. `str.menu.play` is at `0x2575b`, four bytes, `50 6C 61 79`, and the byte after it (`0x2575f`) is `00`, the NUL that ends the string. The player prints whatever characters lie between the offset and the next NUL.

- Write `47 6F 21 21` and the menu says "Go!!". Same length, the string still ends where it did.
- Write a five-letter word and the fifth letter lands on the NUL and the next byte on the first letter of "Read Instructions" (`0x25760`). The word grows into its neighbor and the neighbor loses a letter. That is why a string never grows (`patchRules.ts:1-5`) and a shorter word is padded with spaces: GWrite draws a space as nothing and the NUL after it is never touched (`patchRules.ts:84-91`).
- Write a byte under 0x20 or over 0x7E and GPutChar draws something that is not in its ROM font; the table's text rule is 0x20-0x7E only (`patchRules.ts:29-40`).

Numbers are patched the same way, but they live in the _code_. A screen position such as `layout.menu.play.x` (80, at `0xb6be`) is the operand of a `push imm8` or `push imm16`: the compiler turned `GWrite(80, 120, ...)` into two pushes of constants. Changing the operand changes the constant. A one-byte operand is sign-extended, so it stops at 127 (`frameLimit`, `patchRules.ts:59-62`); a two-byte one is a little-endian word.

## 4. The settings, by group

130 entries (`PATCHES`, `patchTable.ts:92`), in six groups (`PatchGroup`, `patchTable.ts:10`). 35 are `caution` (they move or resize something the screen layout depends on, so the panel warns) and the rest `safe`. 129 are shown by the web player too; `str.save.failed` is DOS only (a web page cannot fail to save the way a disk can, `patchTable.ts:389`).

| group     | entries | what they change                                                                                                                              | where in the file                                             |
| --------- | ------: | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| words     |      38 | menu words, the "No game-specific..." lines, high-score and new-score text, the F2 status lines, save, load, drop and missing-file text       | strings at `0x25700-0x25e06`, and `0x268cb-0x26946`           |
| colors    |      34 | seven shared RGB colors, four missing-file colors, and 23 "which color does this screen use" choices                                          | RGB bytes at `0x13a67-0x1c0c0`, selectors at `0xaf84-0x1bf37` |
| frames    |       9 | eight `Box(x1,y1,x2,y2)` frames (status, drop, About, missing files) and the menu marker's width                                              | immediates at `0xaa90-0x13afc`                                |
| positions |      34 | x and y of the menu words, the title, the high-score table and the load and save headings                                                     | immediates at `0xafc0-0x1c00b`                                |
| times     |      12 | seconds the menu idles before the demo, the high-score table, About page 1, each message, and the default time of a .gif, .bkd, .fli and .txt | immediates at `0xafb6-0x13bea`                                |
| keys      |       3 | F5 (save), F6 (load) and F9 (joystick setup), each on or off                                                                                  | `DoFunKy`'s jump table at `0xcce8-0xccf0`                     |

### 4.1 The kinds of entry

The kind says how a value becomes bytes (`writePatch`, `patchRules.ts:84-109`). Counts are of the 130:

| kind     | count | what is written                                                                                                                              | rule (`patchProblem`, `patchRules.ts:29-57`)                                |
| -------- | ----: | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `text`   |    30 | the characters of a NUL-ended string, space-padded to the slot's length                                                                      | no longer than the slot, characters 0x20-0x7E                               |
| `format` |     8 | a printf string such as `Score:     %ld`                                                                                                     | as text, and the same `%` codes in the same order, and no stray `%`         |
| `number` |    47 | one immediate, or the same value in each of several immediates patched together (`border.marker.width` writes two)                           | a whole number from the entry's `min` to `max`                              |
| `rgb`    |    11 | three bytes, red then green then blue (listed red, green, blue; the three bytes are not next to each other and may run backward in the file) | each 0-63: the VGA DAC is six bits                                          |
| `select` |    23 | one word: the DGROUP address of one of seven color targets (`COLOR_TARGETS`, `patchTable.ts:19`), the push before `RGBdata::Match`           | one of `yellow`, `red`, `blue`, `purple`, `hsRed`, `hsBlue`, `hsGreen`      |
| `frame`  |     8 | four immediates (left, top, right, bottom)                                                                                                   | left and right 0-319, top and bottom 0-199, or 0-127 for a one-byte operand |
| `fkey`   |     3 | a word in the jump table: the key's own handler (on) or `FKEY_OFF` `0x28f9`, DoFunKy's "does nothing" target (off)                           | `on` or `off`                                                               |

Colors work in two steps, and the two are separate settings. The seven `color.rgb.*` entries redefine what "yellow", "red", "blue", "purple" and the three high-score colors _are_ (`63,63,0` is yellow); a `color.select.*` entry picks which of those seven a screen asks for. Change `color.rgb.blue` and every screen that uses blue changes at once; change `color.select.menu` and only the menu does.

### 4.2 One entry per kind, with its bytes

These rows are checked against `PATCHES` by a test (`patching.test.ts`), so the chapter cannot drift from the table.

| id                    | kind     | file offset(s)                | stock bytes                                     | meaning                            |
| --------------------- | -------- | ----------------------------- | ----------------------------------------------- | ---------------------------------- |
| `str.menu.play`       | `text`   | `0x2575b`                     | `50 6C 61 79` ("Play"), then `00`               | the menu's first choice            |
| `str.invent.score`    | `format` | `0x25b3c`                     | `Score:     %ld`, 14 bytes then `00`            | the F2 status "Score" line         |
| `layout.menu.play.x`  | `number` | `0xb6be`                      | `50` (80)                                       | x of "Play" in the menu            |
| `color.rgb.yellow`    | `rgb`    | `0x16336 0x1633b 0x16340`     | `3F 3F 00` (63, 63, 0)                          | the player's yellow                |
| `color.select.menu`   | `select` | `0xaf84`                      | `75 02` (`0x275`, "blue")                       | the color the menu words use       |
| `border.invent.outer` | `frame`  | `0xe04f 0xe04d 0xe04a 0xe047` | `0A`, `0A`, `36 01`, `BE 00` (10, 10, 310, 190) | the F2 status screen's outer frame |
| `table.fkeys.F5`      | `fkey`   | `0xcce8`                      | `B8 28` (`0x28b8`, F5's handler)                | F5 saves                           |

Each `rgb` entry has three offsets because the three components are not adjacent: each sits in its own instruction. The offsets of one value therefore need not be in order, or near each other. A `frame` is four immediates; the left and right edges may be 1 byte (`push imm8`) and the others 2 bytes, so the stock bytes depend on the edge: 10 fits one byte, 310 needs two. That is the reason the table records `size` per field (`ImmField`, `patchTable.ts:23`).

## 5. Applying a patch: size and MD5 first

`applyPlayerPatches(exe, patches, kept)` (`web/packages/archives/src/player/applyPatches.ts:36`) is the only writer the DOS export uses.

1. It refuses any file that is not exactly 160,598 bytes with MD5 `fcaf47d5...` (`applyPatches.ts:37-38`, constants at `:28-29`). A different player, a different build or a player somebody already patched all stop here with "This is not the Game-Maker 3.00 CD's XFERPLAY.EXE, so it can't be customized safely." This is the guard that keeps the table's offsets from landing in a program they were not read from.
2. It copies the file (`exe.slice()`); the input is never touched.
3. For each patch, it asks `patchProblem` whether the value obeys its kind's rule and throws, naming the entry, before anything is returned. Nothing is half-written.
4. It writes the value with `writePatch`, then the renamed file extensions, then any `kept` regions of an imported player that no setting explains, so an export of an imported game keeps the author's other bytes (`playerPreserve.ts`).

`readPlayerPatches(exe)` (`applyPatches.ts:72`) is the reverse. It reads every entry from a 160,598-byte player, keeps the ones that differ from stock and obey their rules, puts each entry's stock bytes back into a copy (`writeStock`) and compares that copy's MD5 with the stock MD5. If they match, every changed byte was a known setting (`explained: true`).

## 6. Telling a patched player

Three checks, cheapest first (`identifyPlayer`, `web/packages/archives/src/player/playerBuild.ts:98`):

1. **Size.** A patch that only overwrites keeps the length: a patched XFERPLAY 3.00 is still 160,598 bytes. A different size is another build (the builds' sizes are in ch 16), or a packed or re-linked file. A player squeezed with PKLITE or LZEXE cannot be compared at all, and is reported as such (`playerBuild.ts:93-96`).
2. **MD5.** The file's MD5 (with a buyer's owner field zeroed, for the builds that carry one) against each build's stock copy. A match is `stock: true`, `confidence: 'high'`.
3. **Which 128-byte blocks differ.** The build data holds a 16-bit CRC for each 128-byte block of every stock player (`playerBuildData.ts:7-10`). `changedBlocks` (`playerBuild.ts:75`) lists the blocks that differ, and `aboutChanged` (`playerBuild.ts:87`) says whether any is the About page's. The reasons it returns read like "12 of its 1,255 128-byte blocks differ from the stock copy".

A copy whose size matches but whose bytes do not is `stock: false`, with medium confidence, or high when its About text still carries the build's own version line in the right place. The reasons are for people; they are as sure as the bytes allow and no surer.

## 7. Two real 1990s examples

A collection of 1990s shareware games shows what authors really did. These are described from the files; no buyer, serial or studio address is repeated.

- **Builder** blanked every menu word, heading and foot line. The 3.00 player it ships differs from stock in nothing but table entries: every changed byte is a setting in section 4, and `readPlayerPatches` explains the whole file. It is the proof that the table matches what authors really edited.
- **Rodip** renamed its status words ("Score", "Lives" and the like). Again every changed byte is a table setting.

A group of other games share one third-party edit of 543 bytes outside the table: the About and order text replaced, and file extensions renamed so other copies of Game-Maker could not open the games' files. The renamed extensions are modeled (`fileExtensions.ts`); the replaced About text is not offered as a setting, in keeping with section 1. A few players of other builds differ from the usual copy and two are compressed; those are described only by what `identifyPlayer` can say.

## 8. How it was done in 1994, and why a hex editor

Nothing in Game-Maker 3.0 customized the player, so authors reached for general tools:

1. **Back up first.** `COPY XFERPLAY.EXE XFERPLAY.BAK`. A byte written wrong cannot be taken back, and a one-byte slip in code can hang the machine the next time the game starts. Note the size (`DIR`) before and after: an overwrite keeps it, and a size that changed means something other than an overwrite was done.
2. **Find the string or the number.** A hex editor's search finds `Play` once and shows the offset. A number is harder: the 80 in `layout.menu.play.x` is one byte among thousands, so a table of offsets (what `patchTable.ts` is) saves hours.
3. **Overwrite, never insert.** Typing into a hex editor's data column must be in overwrite mode. Insert mode moves every later byte by one and shifts the program's code away from its own addresses; the player no longer starts.
4. **Why not DOS's `DEBUG` program.** DOS's own `DEBUG` could do it in principle (`-L` loads the file, `-D` dumps it, `-E` enters bytes, `-W` writes it back), but DEBUG loads at most 64 KB into one segment and refuses larger files. A 160,598-byte player needs a hex editor that works on the file directly. DEBUG did fit the small patches of smaller programs. The desk's `HEXEDIT.EXE` is such an editor, and writes a `.BAK` before it saves.
5. **Check.** Run the game once, on a copy, and open every screen you changed: the menu, F2, the high scores. A word that is too long shows as its neighbor's damage, not as an error message.

The editor's **DOS player** panel (`web/src/editor/editors/integrator/dosPlayer/`) does the same work with the table: the same bytes, the length rule enforced as you type, and a copy it can re-read. Its Patch Lab strip shows each setting's file offset, stock bytes and new bytes, the changed ones marked, so a reader can see the patch this chapter describes.

## 9. Limits

- 160,598-byte XFERPLAY 3.00 only: size and MD5 are checked before any write (section 5).
- Strings never grow; shorter ones are space-padded; the NUL after one is never touched (section 3).
- Numbers keep their operand's range: 0-255 or -128..127 for one byte, 0-65,535 for two (section 3).
- `keep` and `unsafe` entries of the patch map (credits, copyright, file names, the menu item count, the scan-code table) are not offered (section 1).
- Not a reason to trust a patched `.EXE` that arrived from somewhere else. Run nothing you did not make.
