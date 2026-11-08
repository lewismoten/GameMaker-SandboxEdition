# The utility architecture

Game-Maker is a family of separate DOS programs. Only the small GM launcher stays in memory while another program runs. Files on disk carry the work from one editor to the next; there is no shared in-memory project object between utilities.

| Number | Letter | Program  | Job and files                                            |
| -----: | :----: | -------- | -------------------------------------------------------- |
|      — |   —    | GM       | Launch programs and choose the next one                  |
|      0 |   A    | (quit)   | Leave Game-Maker and return to DOS                       |
|      1 |   B    | UTILITY  | Copy a game's files and its transfer player              |
|      2 |   C    | PALCHOS  | Read and write PAL colors                                |
|      3 |   D    | BLOCEDIT | Read and write BBL, MBL and CBL blocks                   |
|      4 |   E    | MONEDIT  | Read and write MON behavior; preview MBL pictures        |
|      5 |   F    | MAPMAKER | Read and write MAP placement; read blocks and monsters   |
|      6 |   G    | CHAREDIT | Read and write CHR sequences; read CBL pictures          |
|      7 |   H    | IMAGE    | Read GIF pictures; extract PAL, BBL and BKD data         |
|      8 |   I    | SNDEDIT  | Read and write SND effects; convert CMF timing           |
|      9 |   J    | GRATOR   | Read and write GAM scenes and file-name references       |
|     10 |   K    | PLAYGAME | Read the game; write recordings, scores and saves        |
|     11 |   L    | MENU     | Show the menus and return the number of the next program |

Numbers come from GM's program table, 16 bytes per name (`code/GM/GM.ASM:26-37`); the selection letter is `'A'` plus the number (`code/GM/GM.ASM:41`, defaulting to `'A'+10`, PLAYGAME).

GM → MENU → utility → GM → MENU, until a zero exit code returns to DOS.

The command tail carries the exact, case-sensitive word `cOoL`, then a letter identifying the preceding selection. GM builds a seven-byte tail: the four letters, a space, the selection letter and a carriage return. MENU uses the selection to reopen the appropriate menu. The program table assigns 1 to UTILITY, 2 to PALCHOS, through 9 to GRATOR, 10 to PLAYGAME and 11 to MENU. Zero means quit.

A utility checks `cOoL` to recognize a launch under Game-Maker. Without it, the utility requests restoration of the DOS text display when it ends. Returning 11 hands control back to GM, which launches MENU; returning zero ends the launcher. The token preserves the managed display transition; the exit code supplies the next destination. A utility started directly at the DOS prompt has no waiting GM launcher to interpret its return code.

**Follow one piece of data.** BLOCEDIT saves a block at index 10 in a BBL. MAPMAKER writes that index into a MAP cell. GRATOR puts both file names into a scene. PLAYGAME resolves those names, loads the two files and draws the cell using color indexes from the scene's PAL. Changing the palette can change the picture without changing a single pixel byte in the BBL.

---

## 18.1 Launch protocol audit

`code/GM/GM.ASM:26-41` fixes the program table and seven-byte command tail. `code/GM/GM.ASM:47-63` executes with DOS interrupt 21h, AX=4B00h and reads the child status with AH=4Dh. `code/GM/GM.ASM:74-81` sets the parameter block and releases excess memory; `code/GM/GM.ASM:93-127` runs the dispatch loop. The selection character is stored immediately after the token and space, before CR, so it is part of the same tail.

`code/GM/GMGEN.H:24` defines OKMSG; `code/GM/GMGEN.H:57-61` defines the numeric QuitCodes. `code/GM/MENU.C:49-54` decodes the previous selection; `code/GM/MENU.C:72-81` and `code/GM/MENU.C:94-104` return the chosen program number. `code/GM/PALCHOS.C:99` and `code/GM/PALCHOS.C:175` demonstrate the token check and menu return. `code/GM/GENC.C:40` defaults RestorePal to false; `code/GM/GENC.C:72-89` writes GM.CFG and restores text mode only when requested. The supplied source therefore does **not** support the stronger claim that the token itself selects a return destination. A directly invoked utility still exits with a numeric status; only GM interprets it as a dispatch request. [not yet checked in DOSBox]

## 18.2 File boundaries and ownership

The tools communicate through disk files. Resource writers: `code/GM/PALCHOS.C:162`, `code/GM/BLOCC.C:73-87`, `code/GM/MONEDIT.C:201-204`, `code/GM/MAPC.C:41-53`, `code/GM/CHAREDIT.C:213-216`, `code/GM/IMAGE.C:185-204`, `code/GM/SOUNDC.C:370-381`, `code/GM/GRATOR.C:1395-1414`. Several save paths are behind CRIPPLEWARE conditionals (`code/GM/BLOCC.C:77-86`, `code/GM/SOUNDC.C:373-380`): these describe the full tools' file layouts, not a claim that every source build enables saving.

The engine package is a reimplementation in one host process, not a chain of DOS executables. Its format readers/writers explicitly serialize these records (`engine/formats/game.ts:1-24`, `engine/formats/blocks.ts:72-122`). The booklet's launcher flow describes DOS rather than how the web editor is packaged.
