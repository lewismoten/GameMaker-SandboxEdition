const e=`# Player Patching Manual

## Game-Maker 3.0 — Notes by technical staff — 1994

### 1. Before you begin

A finished Game-Maker game carries a player program beside its data files. The Integrator copies XFERPLAY.EXE and gives the copy your game's name. Changing that copy can change the menu words, colors, frames, positions, waits, three function keys and certain movement constants. It does not change the maps or pictures.

This booklet catalogs the 139 documented player settings and the separate file-extension fields. It does not catalog arbitrary machine-code edits. Copyright notices, author credits, registration code, setup screens, startup messages, menu counts and keyboard scan-code tables are outside this patch plan. Leave them intact.

Read this booklet with a hexadecimal file editor that can open more than 64K. Work on a spare copy of your own game's player. Do not edit your master program disk. All numbers ending in h are hexadecimal; ranges and ordinary quantities are decimal. An offset counts bytes from the very first byte of the file, starting at zero. It includes the MZ executable header. It is not a segment:offset memory address.

**Verification limit:** the listed XFERPLAY stock bytes have been compared with the CD program and the player source. The proposed patched programs have not been run under DOS. Treat the worked changes as experiments until they pass the checks at the end of this booklet. A permitted number is not a promise that every game will work with it.

### 2. Identify the program

The main directory applies only to the CD's Game-Maker 3.00 XFERPLAY.EXE: **160,598 bytes**, MD5 checksum **fcaf47d50ececa0b59cd22b3fae3cda3**. A renamed copy is still this program. A different checksum needs investigation before any edit; it may already contain somebody else's work.

PLAYGAME.EXE is the designer's player, with a game picker and designer checks. The CD copy is 163,130 bytes. It comes from the same player source, but its addresses differ. Do not add 2,532 to an XFERPLAY offset: the extra code is scattered. Section 14 gives the separately checked PLAYGAME gameplay operands only. No PLAYGAME addresses for the other settings are established here. Earlier releases, other 3.00 builds and compressed executables need their own maps.

[diagram: fileOffsets]

### 3. Make a patch record

1. Make a working directory containing a complete spare game. Keep its data files with it. For LOAF.EXE, type \`COPY LOAF.EXE LOAF.BAK\`. Keep another untouched copy on a separate disk.
2. Use \`DIR LOAF.EXE\` to check the length. Calculate its MD5 with a checksum utility and compare all 32 digits with section 2. DOS COPY and DIR do not calculate MD5. Record the utility and checksum in your patch record.
3. Open the working EXE in overwrite mode. Go to the absolute file offset. Compare every original byte with the directory before typing. Stop on any disagreement; finding a familiar word somewhere else is not enough.
4. Record the setting, offset, old bytes and new bytes. Overwrite exactly the stated width. Never insert, delete, enlarge an instruction or shift a string terminator.
5. Save, close, reopen and read the bytes back. Check that the file remains 160,598 bytes. A binary comparison, such as \`FC /B LOAF.BAK LOAF.EXE\` where available, must show changes only at the recorded offsets.
6. Calculate and record the new checksum. A changed checksum is expected; it identifies this particular result. It is not proof of correct behavior or of a trustworthy program. Repeating the same edits on the same original should give the same new checksum.
7. Test the complete spare game. If it fails, restore the whole EXE with \`COPY LOAF.BAK LOAF.EXE\`. Confirm the original checksum before trying again.

Keep the backup under a different name from the executable. Start each new patch plan from the identified original, or maintain a complete cumulative byte record. Restoring one setting does not undo other edits. DOS DEBUG is a poor choice for this large file; its familiar single-segment editing recipes do not describe this file's absolute offsets.

### 4. Reading the directory

Each setting has a stable name, a screen and a description. Each field row gives the file offset, width, stock value, stock bytes and permitted replacement. The bytes column is in file order; multi-byte numbers are little-endian, low byte first. Values and limits are decimal. Every copy of a repeated number must change together. A field marked negative receives minus the chosen value, not a different choice.

**Safe** means a documented setting with a bounded encoding. **Caution** means the layout, function or format needs special checking. **Experimental** means it changes play throughout the game. All three still require a backup and a test. Frame fields are left, top, right, bottom, even when their offsets run backward. A frame must also have left less than right and top less than bottom; keep text, grids and selection markers inside it. The numeric bounds alone do not enforce that geometry.

The screen is 320 by 200 pixels: x = 0–319, y = 0–199. A one-byte push sign-extends its operand: 80h means -128, not 128. Thus several positions stop at 127 even though the screen is wider. Moving the word alone does not move its menu marker. Keep words, markers, slot rows and titles aligned and on screen; no automatic layout follows your edits.

[diagram: operands]

### 5. Words and format strings

Use printable ASCII bytes 20h–7Eh only, without a percent sign except the original format codes. The stock words may contain spaces at the end. A shorter replacement is padded with 20h spaces to fill the entire slot. Preserve the following 00h byte, the **NULL terminator**. Do not substitute a DOS end-of-file marker for it.

A format string takes values from the program. Keep each complete percent code unchanged and in its original order, including widths and the letter l in long numbers: \`%ld\` and \`%d\` are different. Keep all four \`%02ld\` codes in the elapsed-time line. Do not add a percent sign, even \`%%\`. Changing the argument format may read the wrong bytes from the stack. A long displayed number can still run outside its frame; test large scores and the longest names.

[diagram: textSlot]

**str.menu.play** — menu: Play. Safe. Stock: \`Play\`.

| Offset | Width | Stock bytes | Allowed                   |
| ------ | ----- | ----------- | ------------------------- |
| 2575Bh | 4     | 50 6C 61 79 | 0–4 characters; text rule |

**str.menu.instructions** — menu: Read Instructions. Safe. Stock: \`Read Instructions\`.

| Offset | Width | Stock bytes                                        | Allowed                    |
| ------ | ----- | -------------------------------------------------- | -------------------------- |
| 25760h | 17    | 52 65 61 64 20 49 6E 73 74 72 75 63 74 69 6F 6E 73 | 0–17 characters; text rule |

**str.menu.storyline** — menu: Read Storyline. Safe. Stock: \`Read Storyline\`.

| Offset | Width | Stock bytes                               | Allowed                    |
| ------ | ----- | ----------------------------------------- | -------------------------- |
| 25772h | 14    | 52 65 61 64 20 53 74 6F 72 79 6C 69 6E 65 | 0–14 characters; text rule |

**str.menu.credits** — menu: See Credits. Safe. Stock: \`See Credits\`.

| Offset | Width | Stock bytes                      | Allowed                    |
| ------ | ----- | -------------------------------- | -------------------------- |
| 25781h | 11    | 53 65 65 20 43 72 65 64 69 74 73 | 0–11 characters; text rule |

**str.menu.highScores** — menu: See Highest Scores. Safe. Stock: \`See Highest Scores\`.

| Offset | Width | Stock bytes                                           | Allowed                    |
| ------ | ----- | ----------------------------------------------------- | -------------------------- |
| 2578Dh | 18    | 53 65 65 20 48 69 67 68 65 73 74 20 53 63 6F 72 65 73 | 0–18 characters; text rule |

**str.menu.quit** — menu: Quit. Safe. Stock: \`Quit\`.

| Offset | Width | Stock bytes | Allowed                   |
| ------ | ----- | ----------- | ------------------------- |
| 257A0h | 4     | 51 75 69 74 | 0–4 characters; text rule |

**str.menu.noInstructions** — menu: No instructions. Safe. Stock: \`No game-specific instructions.\`

| Offset | Width | Stock bytes                                                                               | Allowed                    |
| ------ | ----- | ----------------------------------------------------------------------------------------- | -------------------------- |
| 25700h | 30    | 4E 6F 20 67 61 6D 65 2D 73 70 65 63 69 66 69 63 20 69 6E 73 74 72 75 63 74 69 6F 6E 73 2E | 0–30 characters; text rule |

**str.menu.noStoryline** — menu: No storyline. Safe. Stock: \`No game-specific storyline.\`

| Offset | Width | Stock bytes                                                                      | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------------- | -------------------------- |
| 2571Fh | 27    | 4E 6F 20 67 61 6D 65 2D 73 70 65 63 69 66 69 63 20 73 74 6F 72 79 6C 69 6E 65 2E | 0–27 characters; text rule |

**str.menu.noCredits** — menu: No credits. Safe. Stock: \`No game-specific credits given.\`

| Offset | Width | Stock bytes                                                                                  | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------------------------- | -------------------------- |
| 2573Bh | 31    | 4E 6F 20 67 61 6D 65 2D 73 70 65 63 69 66 69 63 20 63 72 65 64 69 74 73 20 67 69 76 65 6E 2E | 0–31 characters; text rule |

**str.hiscore.title** — hiscores: Heading. Safe. Stock: \`Top Ten Scores\`.

| Offset | Width | Stock bytes                               | Allowed                    |
| ------ | ----- | ----------------------------------------- | -------------------------- |
| 268CBh | 14    | 54 6F 70 20 54 65 6E 20 53 63 6F 72 65 73 | 0–14 characters; text rule |

**str.hiscore.latest** — hiscores: Your latest score. Caution. Stock: \`%10ld Your Latest Score\`.

| Offset | Width | Stock bytes                                                          | Allowed                      |
| ------ | ----- | -------------------------------------------------------------------- | ---------------------------- |
| 268E3h | 23    | 25 31 30 6C 64 20 59 6F 75 72 20 4C 61 74 65 73 74 20 53 63 6F 72 65 | 0–23 characters; format rule |

**str.hiscore.anyKey** — hiscores: Foot. Safe. Stock: \`Hit any key\`.

| Offset | Width | Stock bytes                      | Allowed                    |
| ------ | ----- | -------------------------------- | -------------------------- |
| 268FBh | 11    | 48 69 74 20 61 6E 79 20 6B 65 79 | 0–11 characters; text rule |

**str.hiscore.congrats** — newHiscore: Congratulations. Safe. Stock: \`Congratulations!\`

| Offset | Width | Stock bytes                                     | Allowed                    |
| ------ | ----- | ----------------------------------------------- | -------------------------- |
| 2690Fh | 16    | 43 6F 6E 67 72 61 74 75 6C 61 74 69 6F 6E 73 21 | 0–16 characters; text rule |

**str.hiscore.place** — newHiscore: Place line. Caution. Stock: \`You scored number %2d on the Top Ten!\`

| Offset | Width | Stock bytes                                                                                                    | Allowed                      |
| ------ | ----- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 26920h | 37    | 59 6F 75 20 73 63 6F 72 65 64 20 6E 75 6D 62 65 72 20 25 32 64 20 6F 6E 20 74 68 65 20 54 6F 70 20 54 65 6E 21 | 0–37 characters; format rule |

**str.hiscore.enterName** — newHiscore: Name prompt. Safe. Stock: \`Enter Your Name:\`

| Offset | Width | Stock bytes                                     | Allowed                    |
| ------ | ----- | ----------------------------------------------- | -------------------------- |
| 26946h | 16    | 45 6E 74 65 72 20 59 6F 75 72 20 4E 61 6D 65 3A | 0–16 characters; text rule |

**str.invent.score** — status: Score. Caution. Stock: \`Score:     %ld\`.

| Offset | Width | Stock bytes                               | Allowed                      |
| ------ | ----- | ----------------------------------------- | ---------------------------- |
| 25B3Ch | 14    | 53 63 6F 72 65 3A 20 20 20 20 20 25 6C 64 | 0–14 characters; format rule |

**str.invent.money** — status: Money. Caution. Stock: \`Money:     %d\`.

| Offset | Width | Stock bytes                            | Allowed                      |
| ------ | ----- | -------------------------------------- | ---------------------------- |
| 25B4Bh | 13    | 4D 6F 6E 65 79 3A 20 20 20 20 20 25 64 | 0–13 characters; format rule |

**str.invent.hitpoints** — status: Hitpoints. Caution. Stock: \`Hitpoints: %d\`.

| Offset | Width | Stock bytes                            | Allowed                      |
| ------ | ----- | -------------------------------------- | ---------------------------- |
| 25B59h | 13    | 48 69 74 70 6F 69 6E 74 73 3A 20 25 64 | 0–13 characters; format rule |

**str.invent.lives** — status: Lives. Caution. Stock: \`Lives:     %d\`.

| Offset | Width | Stock bytes                            | Allowed                      |
| ------ | ----- | -------------------------------------- | ---------------------------- |
| 25B67h | 13    | 4C 69 76 65 73 3A 20 20 20 20 20 25 64 | 0–13 characters; format rule |

**str.invent.time** — status: Elapsed time. Caution. Stock: \`Elapsed Time: %02ld:%02ld:%02ld.%02ld\`.

| Offset | Width | Stock bytes                                                                                                    | Allowed                      |
| ------ | ----- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 25B75h | 37    | 45 6C 61 70 73 65 64 20 54 69 6D 65 3A 20 25 30 32 6C 64 3A 25 30 32 6C 64 3A 25 30 32 6C 64 2E 25 30 32 6C 64 | 0–37 characters; format rule |

**str.load.title** — load: Heading (no load picture). Safe. Stock: \`Load Game\`.

| Offset | Width | Stock bytes                | Allowed                   |
| ------ | ----- | -------------------------- | ------------------------- |
| 25821h | 9     | 4C 6F 61 64 20 47 61 6D 65 | 0–9 characters; text rule |

**str.load.empty** — load: Empty slot. Safe. Stock: \`This game has not been saved!\`

| Offset | Width | Stock bytes                                                                            | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------------------- | -------------------------- |
| 2582Eh | 29    | 54 68 69 73 20 67 61 6D 65 20 68 61 73 20 6E 6F 74 20 62 65 65 6E 20 73 61 76 65 64 21 | 0–29 characters; text rule |

**str.load.done** — load: Loaded. Safe. Stock: \`Old Game Loaded!\`

| Offset | Width | Stock bytes                                     | Allowed                    |
| ------ | ----- | ----------------------------------------------- | -------------------------- |
| 2584Ch | 16    | 4F 6C 64 20 47 61 6D 65 20 4C 6F 61 64 65 64 21 | 0–16 characters; text rule |

**str.save.title** — save: Heading (no save picture). Safe. Stock: \`Save Game\`.

| Offset | Width | Stock bytes                | Allowed                   |
| ------ | ----- | -------------------------- | ------------------------- |
| 2585Fh | 9     | 53 61 76 65 20 47 61 6D 65 | 0–9 characters; text rule |

**str.save.marker** — save: Slot mark (no save picture). Safe. Stock: \`>\`.

| Offset | Width | Stock bytes | Allowed                   |
| ------ | ----- | ----------- | ------------------------- |
| 25869h | 1     | 3E          | 0–1 characters; text rule |

**str.save.done** — save: Saved. Safe. Stock: \`Game Saved!\`

| Offset | Width | Stock bytes                      | Allowed                    |
| ------ | ----- | -------------------------------- | -------------------------- |
| 25887h | 11    | 47 61 6D 65 20 53 61 76 65 64 21 | 0–11 characters; text rule |

**str.save.failed** — save: Could not save (DOS only). Safe. Stock: \`I cannot save your game!\`

| Offset | Width | Stock bytes                                                             | Allowed                    |
| ------ | ----- | ----------------------------------------------------------------------- | -------------------------- |
| 2586Eh | 24    | 49 20 63 61 6E 6E 6F 74 20 73 61 76 65 20 79 6F 75 72 20 67 61 6D 65 21 | 0–24 characters; text rule |

**str.drop.title** — drop: Heading. Safe. Stock: \`Choose object to drop\`.

| Offset | Width | Stock bytes                                                    | Allowed                    |
| ------ | ----- | -------------------------------------------------------------- | -------------------------- |
| 25D7Fh | 21    | 43 68 6F 6F 73 65 20 6F 62 6A 65 63 74 20 74 6F 20 64 72 6F 70 | 0–21 characters; text rule |

**str.drop.help1** — drop: Help line 1. Safe. Stock: \`Use arrow keys to select,\`.

| Offset | Width | Stock bytes                                                                | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------- | -------------------------- |
| 25D95h | 25    | 55 73 65 20 61 72 72 6F 77 20 6B 65 79 73 20 74 6F 20 73 65 6C 65 63 74 2C | 0–25 characters; text rule |

**str.drop.help2** — drop: Help line 2. Safe. Stock: \`<Enter> to accept, <ESC> \`.

| Offset | Width | Stock bytes                                                                | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------- | -------------------------- |
| 25DAFh | 25    | 3C 45 6E 74 65 72 3E 20 74 6F 20 61 63 63 65 70 74 2C 20 3C 45 53 43 3E 20 | 0–25 characters; text rule |

**str.drop.help3** — drop: Help line 3. Safe. Stock: \`to quit without dropping.\`

| Offset | Width | Stock bytes                                                                | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------- | -------------------------- |
| 25DC9h | 25    | 74 6F 20 71 75 69 74 20 77 69 74 68 6F 75 74 20 64 72 6F 70 70 69 6E 67 2E | 0–25 characters; text rule |

**str.help.none** — help: No help (F1). Safe. Stock: \`No game-specific help included.\`

| Offset | Width | Stock bytes                                                                                  | Allowed                    |
| ------ | ----- | -------------------------------------------------------------------------------------------- | -------------------------- |
| 25B1Ch | 31    | 4E 6F 20 67 61 6D 65 2D 73 70 65 63 69 66 69 63 20 68 65 6C 70 20 69 6E 63 6C 75 64 65 64 2E | 0–31 characters; text rule |

**str.text.more** — text: MORE.... Safe. Stock: \`MORE...\`

| Offset | Width | Stock bytes          | Allowed                   |
| ------ | ----- | -------------------- | ------------------------- |
| 25BD8h | 7     | 4D 4F 52 45 2E 2E 2E | 0–7 characters; text rule |

**str.text.missingTitle** — text: Missing file. Safe. Stock: \`Missing File:\`

| Offset | Width | Stock bytes                            | Allowed                    |
| ------ | ----- | -------------------------------------- | -------------------------- |
| 25B9Eh | 13    | 4D 69 73 73 69 6E 67 20 46 69 6C 65 3A | 0–13 characters; text rule |

**str.text.missingFile** — text: Missing file name line. Caution. Stock: \`The file %s is\`.

| Offset | Width | Stock bytes                               | Allowed                      |
| ------ | ----- | ----------------------------------------- | ---------------------------- |
| 25BACh | 14    | 54 68 65 20 66 69 6C 65 20 25 73 20 69 73 | 0–14 characters; format rule |

**str.text.missingTail** — text: Missing file, second line. Safe. Stock: \`missing or cannot be opened.\`

| Offset | Width | Stock bytes                                                                         | Allowed                    |
| ------ | ----- | ----------------------------------------------------------------------------------- | -------------------------- |
| 25BBBh | 28    | 6D 69 73 73 69 6E 67 20 6F 72 20 63 61 6E 6E 6F 74 20 62 65 20 6F 70 65 6E 65 64 2E | 0–28 characters; text rule |

**str.missing.title** — missing: Heading. Safe. Stock: \`I am missing these game files:\`

| Offset | Width | Stock bytes                                                                               | Allowed                    |
| ------ | ----- | ----------------------------------------------------------------------------------------- | -------------------------- |
| 25DE7h | 30    | 49 20 61 6D 20 6D 69 73 73 69 6E 67 20 74 68 65 73 65 20 67 61 6D 65 20 66 69 6C 65 73 3A | 0–30 characters; text rule |

**str.missing.anyKey** — missing: Foot. Safe. Stock: \`Hit any key...\`

| Offset | Width | Stock bytes                               | Allowed                    |
| ------ | ----- | ----------------------------------------- | -------------------------- |
| 25E06h | 14    | 48 69 74 20 61 6E 79 20 6B 65 79 2E 2E 2E | 0–14 characters; text rule |

### 6. Colors

RGB means red, green, blue, in that order. Each component is 0–63: six bits, not an eight-bit 0–255 level. Each byte is embedded in a separate instruction; do not write a contiguous RGB triplet. The four missing-file colors are fixed palette entries for that screen. The other seven are targets matched to the closest color in the current palette, so the visible result depends on that palette. Changing a target changes every screen selecting it.

A selector is a two-byte address of a color object, not a palette index and not a file offset. Choose only a listed target. Do not treat an arbitrary word as a color.

| Target  | Word  | Bytes |
| ------- | ----- | ----- |
| yellow  | 026Fh | 6F 02 |
| red     | 0272h | 72 02 |
| blue    | 0275h | 75 02 |
| purple  | 0278h | 78 02 |
| hsRed   | 15FAh | FA 15 |
| hsBlue  | 15FDh | FD 15 |
| hsGreen | 1600h | 00 16 |

[diagram: colors]

**color.rgb.yellow** — all: Yellow. Safe. Stock: 63 / 63 / 0.

About text, load and save slot names

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 16336h | 1     | 3F          | R 0–63  |
| 1633Bh | 1     | 3F          | G 0–63  |
| 16340h | 1     | 00          | B 0–63  |

**color.rgb.red** — all: Red. Safe. Stock: 63 / 10 / 10.

"No game-specific" lines, F1 no-help line, markers, missing-file text

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 16345h | 1     | 3F          | R 0–63  |
| 1634Ah | 1     | 0A          | G 0–63  |
| 1634Fh | 1     | 0A          | B 0–63  |

**color.rgb.blue** — all: Blue. Safe. Stock: 10 / 10 / 63.

Menu words and title, load/save words, status, drop picker

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 16354h | 1     | 0A          | R 0–63  |
| 16359h | 1     | 0A          | G 0–63  |
| 1635Eh | 1     | 3F          | B 0–63  |

**color.rgb.purple** — all: Purple. Safe. Stock: 50 / 10 / 50.

Text pages

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 16363h | 1     | 32          | R 0–63  |
| 16368h | 1     | 0A          | G 0–63  |
| 1636Dh | 1     | 32          | B 0–63  |

**color.rgb.hsRed** — all: High-score red. Safe. Stock: 63 / 10 / 10.

High-score heading, foot and prompts

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1C098h | 1     | 3F          | R 0–63  |
| 1C09Dh | 1     | 0A          | G 0–63  |
| 1C0A2h | 1     | 0A          | B 0–63  |

**color.rgb.hsBlue** — all: High-score blue. Safe. Stock: 10 / 10 / 63.

High-score rows and typed name

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1C0A7h | 1     | 0A          | R 0–63  |
| 1C0ACh | 1     | 0A          | G 0–63  |
| 1C0B1h | 1     | 3F          | B 0–63  |

**color.rgb.hsGreen** — all: Spare (high-score green). Safe. Stock: 10 / 63 / 10.

Unused in the stock player: free for any screen

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1C0B6h | 1     | 0A          | R 0–63  |
| 1C0BBh | 1     | 3F          | G 0–63  |
| 1C0C0h | 1     | 0A          | B 0–63  |

**color.select.menu** — menu: Menu words, title and marker. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0AF84h | 2     | 75 02       | Listed color target only |

**color.select.menuMessages** — menu: "No game-specific" lines. Safe. Stock: \`red\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0AF97h | 2     | 72 02       | Listed color target only |

**color.select.textPages** — text: Text pages. Safe. Stock: \`purple\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0C1ACh | 2     | 78 02       | Listed color target only |

**color.select.textMissing** — text: Missing-file text and MORE.... Safe. Stock: \`red\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0E2EFh | 2     | 72 02       | Listed color target only |

**color.select.helpNone** — help: F1 no-help line. Safe. Stock: \`red\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0DFFAh | 2     | 72 02       | Listed color target only |

**color.select.loadSlots** — load: Load: slot names. Safe. Stock: \`yellow\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0CD04h | 2     | 6F 02       | Listed color target only |

**color.select.loadMarker** — load: Load: marker. Safe. Stock: \`red\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0CD19h | 2     | 72 02       | Listed color target only |

**color.select.loadText** — load: Load: heading and messages. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0D08Eh | 2     | 75 02       | Listed color target only |

**color.select.loadTextPic** — load: Load: messages over the load picture. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0D06Fh | 2     | 75 02       | Listed color target only |

**color.select.saveSlots** — save: Save: slot names. Safe. Stock: \`yellow\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0CE07h | 2     | 6F 02       | Listed color target only |

**color.select.saveMarker** — save: Save: marker. Safe. Stock: \`red\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0CE1Ch | 2     | 72 02       | Listed color target only |

**color.select.saveText** — save: Save: heading, marks and messages. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0DA6Eh | 2     | 75 02       | Listed color target only |

**color.select.saveTextPic** — save: Save: messages over the save picture. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0DA42h | 2     | 75 02       | Listed color target only |

**color.select.status** — status: Status: frames, grid and words. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0E036h | 2     | 75 02       | Listed color target only |

**color.select.dropFrame** — drop: Drop: frames, grid and words. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0E9C7h | 2     | 75 02       | Listed color target only |

**color.select.dropCursor** — drop: Drop: selection box. Safe. Stock: \`red\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0E9B4h | 2     | 72 02       | Listed color target only |

**color.select.aboutFrame** — about: About: frames. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0DD25h | 2     | 75 02       | Listed color target only |

**color.select.aboutText** — about: About: words. Safe. Stock: \`yellow\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0DD38h | 2     | 6F 02       | Listed color target only |

**color.select.joyText** — play: F9: words. Safe. Stock: \`blue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 0E515h | 2     | 75 02       | Listed color target only |

**color.select.hsTitle** — hiscores: High scores: heading and foot. Safe. Stock: \`hsRed\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 1BCFEh | 2     | FA 15       | Listed color target only |

**color.select.hsRows** — hiscores: High scores: rows. Safe. Stock: \`hsBlue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 1BD11h | 2     | FD 15       | Listed color target only |

**color.select.hsPrompt** — newHiscore: New high score: Congratulations and prompt. Safe. Stock: \`hsRed\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 1BF24h | 2     | FA 15       | Listed color target only |

**color.select.hsName** — newHiscore: New high score: place line and name. Safe. Stock: \`hsBlue\`.

| Offset | Width | Stock bytes | Allowed                  |
| ------ | ----- | ----------- | ------------------------ |
| 1BF37h | 2     | FD 15       | Listed color target only |

**color.missing.1** — missing: Missing files: heading. Safe. Stock: 63 / 63 / 0.

A fixed palette entry this screen sets

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 13A6Bh | 1     | 3F          | R 0–63  |
| 13A69h | 1     | 3F          | G 0–63  |
| 13A67h | 1     | 00          | B 0–63  |

**color.missing.2** — missing: Missing files: file names. Safe. Stock: 63 / 0 / 33.

A fixed palette entry this screen sets

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 13A7Bh | 1     | 3F          | R 0–63  |
| 13A79h | 1     | 00          | G 0–63  |
| 13A77h | 1     | 21          | B 0–63  |

**color.missing.3** — missing: Missing files: foot. Safe. Stock: 0 / 58 / 58.

A fixed palette entry this screen sets

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 13A8Bh | 1     | 00          | R 0–63  |
| 13A89h | 1     | 3A          | G 0–63  |
| 13A87h | 1     | 3A          | B 0–63  |

**color.missing.4** — missing: Missing files: frames. Safe. Stock: 63 / 0 / 0.

A fixed palette entry this screen sets

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 13A9Bh | 1     | 3F          | R 0–63  |
| 13A99h | 1     | 00          | G 0–63  |
| 13A97h | 1     | 00          | B 0–63  |

### 7. Frames and marker width

Frame bounds do not relocate their contents. The marker-width setting is width minus one and has two copies. Keep the marker clear of neighboring words.

[diagram: frame]

**border.invent.outer** — status: Status (F2), outer frame. Safe. Stock: 10 / 10 / 310 / 190.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 0E04Fh | 1     | 0A          | Left 0–127   |
| 0E04Dh | 1     | 0A          | Top 0–127    |
| 0E04Ah | 2     | 36 01       | Right 0–319  |
| 0E047h | 2     | BE 00       | Bottom 0–199 |

**border.invent.inner** — status: Status (F2), inner frame. Safe. Stock: 15 / 15 / 305 / 185.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 0E064h | 1     | 0F          | Left 0–127   |
| 0E062h | 1     | 0F          | Top 0–127    |
| 0E05Fh | 2     | 31 01       | Right 0–319  |
| 0E05Ch | 2     | B9 00       | Bottom 0–199 |

**border.drop.outer** — drop: Drop picker, outer frame. Safe. Stock: 10 / 10 / 310 / 190.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 0E9E0h | 1     | 0A          | Left 0–127   |
| 0E9DEh | 1     | 0A          | Top 0–127    |
| 0E9DBh | 2     | 36 01       | Right 0–319  |
| 0E9D8h | 2     | BE 00       | Bottom 0–199 |

**border.drop.inner** — drop: Drop picker, inner frame. Safe. Stock: 15 / 15 / 305 / 185.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 0E9F5h | 1     | 0F          | Left 0–127   |
| 0E9F3h | 1     | 0F          | Top 0–127    |
| 0E9F0h | 2     | 31 01       | Right 0–319  |
| 0E9EDh | 2     | B9 00       | Bottom 0–199 |

**border.about.outer** — about: About (F10), outer frame. Safe. Stock: 10 / 10 / 310 / 190.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 0DD51h | 1     | 0A          | Left 0–127   |
| 0DD4Fh | 1     | 0A          | Top 0–127    |
| 0DD4Ch | 2     | 36 01       | Right 0–319  |
| 0DD49h | 2     | BE 00       | Bottom 0–199 |

**border.about.inner** — about: About (F10), inner frame. Safe. Stock: 15 / 15 / 305 / 185.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 0DD66h | 1     | 0F          | Left 0–127   |
| 0DD64h | 1     | 0F          | Top 0–127    |
| 0DD61h | 2     | 31 01       | Right 0–319  |
| 0DD5Eh | 2     | B9 00       | Bottom 0–199 |

**border.missing.outer** — missing: Missing files, outer frame. Safe. Stock: 10 / 10 / 310 / 190.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 13AE8h | 1     | 0A          | Left 0–127   |
| 13AE6h | 1     | 0A          | Top 0–127    |
| 13AE3h | 2     | 36 01       | Right 0–319  |
| 13AE0h | 2     | BE 00       | Bottom 0–199 |

**border.missing.inner** — missing: Missing files, inner frame. Safe. Stock: 15 / 15 / 305 / 185.

| Offset | Width | Stock bytes | Allowed      |
| ------ | ----- | ----------- | ------------ |
| 13AFCh | 1     | 0F          | Left 0–127   |
| 13AFAh | 1     | 0F          | Top 0–127    |
| 13AF7h | 2     | 31 01       | Right 0–319  |
| 13AF4h | 2     | B9 00       | Bottom 0–199 |

**border.marker.width** — menu: Menu marker width (minus 1). Caution. Stock: 5.

Every menu marker: main menu, load and save

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0AA90h | 2     | 05 00       | 0–40    |
| 0ABAEh | 2     | 05 00       | 0–40    |

### 8. Positions

Coordinates are pixels measured from the upper-left corner. Text begins at its x and y; changing a heading does not move the rows below it.

**layout.menu.play.x** — menu: "Play" x. Caution. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6BEh | 1     | 50          | 0–127   |

**layout.menu.play.y** — menu: "Play" y. Caution. Stock: 120.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6BCh | 1     | 78          | 0–127   |

**layout.menu.instructions.x** — menu: "Read Instructions" x. Caution. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6CFh | 1     | 50          | 0–127   |

**layout.menu.instructions.y** — menu: "Read Instructions" y. Caution. Stock: 128.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6CCh | 2     | 80 00       | 0–199   |

**layout.menu.storyline.x** — menu: "Read Storyline" x. Caution. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6E0h | 1     | 50          | 0–127   |

**layout.menu.storyline.y** — menu: "Read Storyline" y. Caution. Stock: 136.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6DDh | 2     | 88 00       | 0–199   |

**layout.menu.credits.x** — menu: "See Credits" x. Caution. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6F1h | 1     | 50          | 0–127   |

**layout.menu.credits.y** — menu: "See Credits" y. Caution. Stock: 144.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6EEh | 2     | 90 00       | 0–199   |

**layout.menu.highScores.x** — menu: "See Highest Scores" x. Caution. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B705h | 1     | 50          | 0–127   |

**layout.menu.highScores.y** — menu: "See Highest Scores" y. Caution. Stock: 152.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B702h | 2     | 98 00       | 0–199   |

**layout.menu.quit.x** — menu: "Quit" x. Caution. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B716h | 1     | 50          | 0–127   |

**layout.menu.quit.y** — menu: "Quit" y. Caution. Stock: 160.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B713h | 2     | A0 00       | 0–199   |

**layout.menu.titleX** — menu: Game name x. Safe. Stock: 96.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6AEh | 1     | 60          | 0–127   |

**layout.menu.titleY** — menu: Game name y. Safe. Stock: 104.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B6ACh | 1     | 68          | 0–127   |

**layout.menu.markerX** — menu: Marker x. Caution. Stock: 70.

Also where a click is read

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0AFC4h | 1     | 46          | 0–127   |

**layout.menu.firstY** — menu: Marker y (first choice). Caution. Stock: 121.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0AFC2h | 1     | 79          | 0–127   |

**layout.menu.spacing** — menu: Marker spacing. Caution. Stock: 8.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0AFC0h | 1     | 08          | 1–20    |

**layout.menu.noFile.x** — menu: "No game-specific" lines x. Safe. Stock: 40.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B362h | 1     | 28          | 0–127   |

**layout.menu.noFile.y** — menu: "No game-specific" lines y. Safe. Stock: 80.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B360h | 1     | 50          | 0–127   |

**layout.hiscore.title.x** — hiscores: Heading x. Safe. Stock: 104.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BD31h | 1     | 68          | 0–127   |

**layout.hiscore.title.y** — hiscores: Heading y. Safe. Stock: 0.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BD2Fh | 1     | 00          | 0–127   |

**layout.hiscore.anyKey.x** — hiscores: Foot x. Safe. Stock: 116.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BDFFh | 1     | 74          | 0–127   |

**layout.hiscore.anyKey.y** — hiscores: Foot y. Safe. Stock: 192.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BDFCh | 2     | C0 00       | 0–199   |

**layout.hiscore.firstRowY** — hiscores: First row y. Safe. Stock: 27.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BD42h | 2     | 1B 00       | 0–199   |

**layout.hiscore.rowSpacing** — hiscores: Row spacing (start). Caution. Stock: 22.

Shrinks by 2, 1, 2, 1... per row

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BD3Dh | 2     | 16 00       | 10–24   |

**layout.hiscore.rows** — hiscores: Rows shown. Caution. Stock: 10.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BDB8h | 1     | 0A          | 1–10    |

**layout.hiscore.congrats.x** — newHiscore: Congratulations x. Safe. Stock: 96.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BFBCh | 1     | 60          | 0–127   |

**layout.hiscore.congrats.y** — newHiscore: Congratulations y. Safe. Stock: 40.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BFBAh | 1     | 28          | 0–127   |

**layout.hiscore.enterName.x** — newHiscore: Name prompt x. Caution. Stock: 0.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1C00Bh | 1     | 00          | 0–127   |

**layout.hiscore.enterName.y** — newHiscore: Name prompt y. Caution. Stock: 120.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1C009h | 1     | 78          | 0–127   |

**layout.load.title.x** — load: Heading x. Safe. Stock: 124.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0D0B9h | 1     | 7C          | 0–127   |

**layout.load.title.y** — load: Heading y. Safe. Stock: 10.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0D0B7h | 1     | 0A          | 0–127   |

**layout.save.title.x** — save: Heading x. Safe. Stock: 124.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0DA99h | 1     | 7C          | 0–127   |

**layout.save.title.y** — save: Heading y. Safe. Stock: 10.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0DA97h | 1     | 0A          | 0–127   |

### 9. Waits and default display times

Waits are seconds. A signed one-byte -1 is FFh and waits for a key. The word value 65,535 is FF FF and requests the same wait in the default media times. Zero is a distinct value, not another spelling of -1. A slide-list duration may supply its own time instead of the default. The menu wait is the idle interval before a demo; check it with the game's recording present.

**timing.menu.idleSeconds** — menu: Menu idle before the demo. Safe. Stock: 30.

Seconds

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0AFB6h | 1     | 1E          | 1–127   |

**timing.menuNoFile** — menu: "No game-specific" lines. Safe. Stock: 10.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0B369h | 1     | 0A          | -1–127  |

**timing.highScores** — hiscores: High-score table. Safe. Stock: 30.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 1BE06h | 1     | 1E          | -1–127  |

**timing.helpNone** — help: F1 no-help line. Safe. Stock: 5.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0E01Bh | 1     | 05          | -1–127  |

**timing.loadMessage** — load: Load message. Safe. Stock: 2.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0D907h | 1     | 02          | -1–127  |

**timing.saveMessage** — save: Save message. Safe. Stock: 2.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0DCF6h | 1     | 02          | -1–127  |

**timing.missingFiles** — missing: Missing files. Safe. Stock: 20.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 13BEAh | 1     | 14          | -1–127  |

**timing.aboutPage1** — about: About page 1. Safe. Stock: 60.

Seconds; -1 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0DE98h | 1     | 3C          | -1–127  |

**timing.showGraphic.gif** — text: Default .gif time. Caution. Stock: 15.

Seconds; 65535 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0BE10h | 2     | 0F 00       | 0–65535 |

**timing.showGraphic.bkd** — text: Default .bkd time. Caution. Stock: 20.

Seconds; 65535 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0BECAh | 2     | 14 00       | 0–65535 |

**timing.showGraphic.fli** — text: Default .fli time. Caution. Stock: 0.

Seconds; 65535 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0BFF4h | 2     | 00 00       | 0–65535 |

**timing.showGraphic.txt** — text: Default .txt page time. Caution. Stock: 90.

Seconds; 65535 waits for a key

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0C192h | 2     | 5A 00       | 0–65535 |

### 10. Three function keys

Write the original handler word to enable the key, or F9 28 (28F9h) to disable it. These are jump-table destinations, not scan codes. Do not interchange the original handlers: only the listed on/off choices are covered. Disabling F5 or F6 prevents that key from saving or loading; it does not erase existing saves. Keep a usable route through the game.

[diagram: keyJump]

**table.fkeys.F5** — play: F5 saves. Caution. Stock: 10424.

| Offset | Width | Stock bytes | Allowed               |
| ------ | ----- | ----------- | --------------------- |
| 0CCE8h | 2     | B8 28       | On: 28B8h; off: 28F9h |

**table.fkeys.F6** — play: F6 loads. Caution. Stock: 10442.

| Offset | Width | Stock bytes | Allowed               |
| ------ | ----- | ----------- | --------------------- |
| 0CCEAh | 2     | CA 28       | On: 28CAh; off: 28F9h |

**table.fkeys.F9** — play: F9 joystick setup. Caution. Stock: 10468.

| Offset | Width | Stock bytes | Allowed               |
| ------ | ----- | ----------- | --------------------- |
| 0CCF0h | 2     | E4 28       | On: 28E4h; off: 28F9h |

### 11. Gameplay constants — experimental

Change every copy for one setting, including the negative copies. Top speed and gravity cap are independent compiled constants: changing top speed does not recalculate the cap. A tick here is the game clock, about 18.2 ticks per second, independent of CPU MHz. Slow machines may miss that schedule.

The speed ceiling stays below one 20-pixel block per move. Gravity cap 0 removes the accumulated pull. The attack test uses absolute block-coordinate differences strictly less than both reaches: stock 8 and 5 means differences of 0–7 across and 0–4 vertically. Setting either reach to 0 prevents this attack-range test from succeeding; it does not remove monsters or prevent other collisions. The test does not choose the shortest distance around a wrapping map.

Scroll speed 1–100 is a selected patch limit, not an overflow-proof bound. The DOS player multiplies distance by speed in 16-bit arithmetic before dividing and clamping displacement to 28 pixels. Large distances can overflow even at stock speed 40. Scroll smoothing must not be 0: with displacement remaining, its accumulator cannot advance. More ticks spread the move over longer time.

Fade length counts palette-update iterations with retrace-status polling, not guaranteed distinct screen refreshes. Zero skips the interpolation loop and installs the destination palette. **Inference from the signed-byte accumulators:** the largest intermediate can be steps + 62; keeping it at or below 127 gives a ceiling of 65. Do not increase it beyond the directory's limit. These are fades between palettes, not a flashing effect recipe.

The monster move interval was divided by 1 and compiled away; changing the surviving next-move addition alone would be incomplete. The 50-monster drawing limit also sizes a 20,000-byte buffer; changing just its comparison could overrun memory. The unused slow-scroll constant has no operand. The timer divisor also controls DOS timekeeping, sound and music; it is not a speed setting in this booklet.

[diagram: clamp]

**play.maxSpeed** — gameplay: Character top speed. Experimental. Stock: 11.

Pixels a move

| Offset | Width | Stock bytes | Allowed             |
| ------ | ----- | ----------- | ------------------- |
| 0F507h | 1     | 0B          | 1–19                |
| 0F50Dh | 2     | 0B 00       | 1–19                |
| 0F512h | 1     | F5          | 1–19; negative copy |
| 0F518h | 2     | F5 FF       | 1–19; negative copy |
| 0F51Dh | 1     | 0B          | 1–19                |
| 0F523h | 2     | 0B 00       | 1–19                |
| 0F528h | 1     | F5          | 1–19; negative copy |
| 0F52Eh | 2     | F5 FF       | 1–19; negative copy |

**play.gravityCap** — gameplay: Gravity top pull. Experimental. Stock: 44.

0 turns gravity blocks off

| Offset | Width | Stock bytes | Allowed              |
| ------ | ----- | ----------- | -------------------- |
| 12651h | 1     | 2C          | 0–127                |
| 12658h | 2     | 2C 00       | 0–127                |
| 1265Eh | 1     | D4          | 0–127; negative copy |
| 12665h | 2     | D4 FF       | 0–127; negative copy |
| 1266Bh | 1     | 2C          | 0–127                |
| 12672h | 2     | 2C 00       | 0–127                |
| 12678h | 1     | D4          | 0–127; negative copy |
| 1267Fh | 2     | D4 FF       | 0–127; negative copy |

**play.gravityTicks** — gameplay: Gravity step. Experimental. Stock: 1.

Game-clock ticks between pulls, about 18.2 per second.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 124F5h | 2     | 01 00       | 1–18    |

**play.attackX** — gameplay: Monster attack reach across. Experimental. Stock: 8.

Blocks; 0 never attacks

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0F851h | 2     | 08 00       | 0–100   |

**play.attackY** — gameplay: Monster attack reach up and down. Experimental. Stock: 5.

Blocks; 0 never attacks

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0F866h | 2     | 05 00       | 0–100   |

**play.scrollSpeedX** — gameplay: Scroll speed across. Experimental. Stock: 40.

At the screen edge; a move still stops at 28 pixels

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 12AAAh | 1     | 28          | 1–100   |
| 12AD7h | 1     | 28          | 1–100   |

**play.scrollSpeedY** — gameplay: Scroll speed up and down. Experimental. Stock: 40.

At the screen edge; a move still stops at 28 pixels

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 12B08h | 1     | 28          | 1–100   |
| 12B39h | 1     | 28          | 1–100   |

**play.scrollSteps** — gameplay: Scroll smoothing. Experimental. Stock: 6.

Timer ticks a scroll move is spread over

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 12B8Eh | 2     | 06 00       | 1–60    |
| 12BA0h | 2     | 06 00       | 1–60    |

**play.fadeSteps** — gameplay: Fade length. Experimental. Stock: 65.

Palette-update iterations; 0 installs the destination at once.

| Offset | Width | Stock bytes | Allowed |
| ------ | ----- | ----------- | ------- |
| 0BE71h | 1     | 41          | 0–65    |
| 0BF2Bh | 1     | 41          | 0–65    |
| 0C614h | 1     | 41          | 0–65    |
| 0C92Ah | 1     | 41          | 0–65    |
| 155D7h | 1     | 41          | 0–65    |
| 1A92Ch | 1     | 41          | 0–65    |

### 12. Renaming file extensions

This separate operation changes names, not file formats or encryption. The offsets below point to the dot in each four-character extension. Leave the dot and the NULL after the three letters untouched. Write exactly three lowercase characters starting one byte after each listed offset, in every copy. Allowed characters are letters a–z, digits 0–9 and \`_ - ~ ! @ # $ ^ & ( )\`. For command-line convenience, prefer letters and digits.

Do not take another Game-Maker file kind's extension or any of these reserved extensions: exe, com, bat, sys, drv, hlp, cfg, gmx, zip. Give each renamed kind its own extension. Renaming only the EXE's extension fields is incomplete: rename the matching data files and references inside the GAM and any slide lists, backdrops or other scripts that name them. Keep the master project with its original names. CONFIG.DAT keeps its name; the dat patch below affects SAVNAMES only. Text files the game never names keep .txt.

[diagram: extension]

| Kind             | Dot offsets                    | Stock four bytes |
| ---------------- | ------------------------------ | ---------------- |
| gam: Game file   | 256B6h                         | 2E 67 61 6D      |
| gif: Pictures    | 257B2h                         | 2E 67 69 66      |
| bkd: Backdrops   | 257B7h                         | 2E 62 6B 64      |
| fli: Animations  | 257BCh                         | 2E 66 6C 69      |
| txt: Text pages  | 257C1h                         | 2E 74 78 74      |
| lst: Slide lists | 257C6h                         | 2E 6C 73 74      |
| rec: Recordings  | 256FBh, 25673h, 256F5h, 257ADh | 2E 72 65 63      |
| voc: Voices      | 26048h                         | 2E 76 6F 63      |
| his: High scores | 268C3h, 26907h                 | 2E 68 69 73      |
| sav: Saved games | 257FBh, 2581Ch                 | 2E 73 61 76      |
| dat: Save names  | 257EBh, 25809h                 | 2E 64 61 74      |

Palettes (pal), maps (map), background blocks (bbl), monsters (mon), monster blocks (mbl), characters (chr), character blocks (cbl), sound sets (snd) and songs (cmf) have no corresponding EXE fields in this table: the game names their files in full. Renaming those requires changes to data-file references instead. Recording (rec), high-score (his), saved-game (sav) and save-name (dat) fields also affect names the player creates. Check new files as well as files distributed with the game.

### 13. Two Sandbox workshop copies

These are proposed patch plans for spare copies of Sandbox games, not descriptions of changes already shipped. Both use the CD player identified in section 2. If an existing copy fails that identification, make a fresh distribution from your own master rather than patching over an unknown player.

**Loaf #13 (Left in the Basket), LOAF.EXE.** Give the first menu choice the word Roll. At 2575Bh replace \`50 6C 61 79\` with \`52 6F 6C 6C\`. Preserve the 00 at 2575Fh. The next menu string starts at 25760h. No data file changes. Reopen the menu, select Roll and confirm that it starts play; walk back through Instructions, Storyline, Credits, High Scores and Quit to check their labels.

For the same workshop copy, move the word's x coordinate from 80 to 88: at 0B6BEh replace \`50\` with \`58\`. This moves the word only. Inspect its marker before keeping the change. To rename the F2 hitpoints line to Energy, at 25B59h overwrite the 13-byte slot with \`45 6E 65 72 67 79 3A 20 25 64 20 20 20\`, which reads \`Energy: %d\` followed by three spaces. Preserve the 00 at 25B66h. Check F2 with more than one digit displayed.

**Cleanse Me, O Loofah, But Leave My Soul, LOOFAH.EXE.** Try purple menu lettering: at 0AF84h replace \`75 02\` with \`78 02\`, selecting purple instead of blue. This does not change the palette or redefine purple. Inspect the menu against its actual background; the nearest palette color may differ from the intended target.

On a separate Loofah workshop copy, change the save confirmation wait from two seconds to five: at 0DCF6h replace \`02\` with \`05\`. Save with F5, read the confirmation, press a key to dismiss it, then load that save with F6. No movement constant is changed by this plan.

For an experimental Loaf trial, top speed 9 requires all eight copies: F507h \`09\`, F50Dh \`09 00\`, F512h \`F7\`, F518h \`F7 FF\`, F51Dh \`09\`, F523h \`09 00\`, F528h \`F7\`, F52Eh \`F7 FF\`. Gravity cap stays 44. Play every route and jumping section; a lower ceiling may make a necessary jump impossible. Keep this trial separate from the menu-only patch. No successful DOS playthrough is claimed here.

### 14. PLAYGAME gameplay operands

This is a reading and experimental patch appendix for the 163,130-byte CD PLAYGAME.EXE only. Identify it byte for byte against an untouched copy of that CD file; its own size and checksum belong in your record. These addresses are separately checked, not calculated by shifting the XFERPLAY directory. Use the same stock values and limits as section 11. The other directory entries have no verified PLAYGAME equivalents in this booklet; do not transplant them.

A minus sign before an offset means a negative copy. For the two clamp rows, widths alternate 1, 2, 1, 2, 1, 2, 1, 2 bytes. Scroll speeds and fade steps use one byte; gravity ticks, attack reaches and scroll smoothing use two.

| Setting      | PLAYGAME file offsets                                       |
| ------------ | ----------------------------------------------------------- |
| maxSpeed     | FD79h FD7Fh -FD84h -FD8Ah FD8Fh FD95h -FD9Ah -FDA0h         |
| gravityCap   | 12EC3h 12ECAh -12ED0h -12ED7h 12EDDh 12EE4h -12EEAh -12EF1h |
| gravityTicks | 12D67h                                                      |
| attackX      | 100C3h                                                      |
| attackY      | 100D8h                                                      |
| scrollSpeedX | 1331Ch 13349h                                               |
| scrollSpeedY | 1337Ah 133ABh                                               |
| scrollSteps  | 13400h 13412h                                               |
| fadeSteps    | C66Ah C724h CE0Dh D123h 15E49h 1B19Eh                       |

### 15. Check before making the disk

Start with the byte comparison and your checksum record. Then use an isolated DOS test copy. Open the main menu and all changed screens: F1 help, F2 status, the character’s drop sequence, F5 save, F6 load, F9 joystick setup, F10 About, the high-score table and new-score entry as applicable. Try empty and occupied save slots. Check the longest names, large counters and both picture and plain-background variants. Test missing-file messages only in an expendable copy with a data file temporarily moved aside; put it back afterward.

For waits, check both timeout and early key dismissal. For a renamed extension, start from a clean directory, play every scene, view pictures and text, hear sounds, run the demo, create a score and save, then quit and load again. A successful title screen alone proves very little.

For gameplay changes, complete the whole game with ordinary timing. Test gravity in every direction, monster approaches on both axes, screen edges and map wraps. A game that boots may still have an unreachable exit. If any route fails, restore the original and revise one setting at a time. Never distribute the workshop backup or another author's modified player.

Keep this record with the master: original filename, byte length, checksum, each changed offset and its before/after bytes, result checksum, and the screens and routes actually tested. That record is the way back.
`;export{e as default};
