# GAME-MAKER 3.0

## Technical Reference and Limits

Notes by technical staff
1994
---

### Before you begin

This booklet is for the person who wants to know how big a Game-Maker game can be, and why. The manual tells you how to use each editor. This booklet tells you what each editor's files can hold,
and the reason for each number, so that you can plan a game before you build it and not find out at the last screen.

Most of the numbers come from three facts about the machine: the PC reads memory in pieces of 64K, the VGA screen is 320 pixels wide and 200 high, and the timer chip counts in one small, fixed step.
When a number looks strange, one of those three is usually the reason.

---

### 1. What you need

| Part     | Minimum                   | Better                                        |
| -------- | ------------------------- | --------------------------------------------- |
| Computer | 286                       | 386 or 486                                    |
| Display  | VGA                       | VGA with a fast bus                           |
| Memory   | 640K with about 540K free | the same; free memory matters more than speed |
| Sound    | PC speaker                | Sound Blaster (music and digitized sounds)    |
| Disk     | a hard disk               | a hard disk                                   |

[diagram: memory]

**Memory.** PLAYGAME holds about 420K before it loads a single scene: the program and its data (181K, with room for the map), the screen buffer (64K), the three block files (62K, 41K and 21K),
the monster tables (50K) and the Sound Blaster voice driver (2.5K), which PLAYGAME loads itself. Each scene then adds its song, sounds and scene list, and room for the longest digitized sound it plays:
usually 20K to 120K more. The music needs no driver; PLAYGAME plays songs on the FM chip itself.

Outside PLAYGAME, DOS 5 or 6 takes about 20K when CONFIG.SYS says DOS=HIGH (about 60K when it doesn't), and a mouse driver 15K to 25K. That leaves roughly 60K to 160K free on a 640K machine. If PLAYGAME
says "NOT ENOUGH MEMORY", remove resident programs before you shrink your game.

---

### 2. The screen

The screen is **320 x 200**, 256 colors, because that is the largest VGA mode that gives each pixel its own byte and lets the program draw directly to memory.

A block is **20 x 20** pixels. 320 / 20 is 16 and 200 / 20 is 10, so the screen holds **16 blocks across and 10 down**, and there is no status bar. Your hero is two blocks tall (40 pixels).

While you play, PLAYGAME shows only **312 x 196** of it. The last 8 pixels on the right and the last 4 rows at the bottom are left as the border color, color 0 of the palette, so the edge where the screen scrolls in new pictures stays out of sight. A playing screen shows a little under 16 x 10 blocks. Pictures and menus use the full 320 x 200.
[diagram: screen]

Keep anything important, such as a sign, a sprite's face or a score, out of the right-most 8 pixels and the bottom 4. Design full-screen pictures for 320 x 200.

Twenty pixels is the smallest block that still draws a face you can recognize; 16 would leave a fraction of a row at the bottom.

**Scrolling.** The screen scrolls by moving the start of the picture in video memory, 4 pixels at a time, and pans the last 0 to 3 pixels with a VGA register. Only the new strip at the edge is redrawn, and the hidden border strip keeps that drawing out of sight.
That is why scrolling is smooth on a 286 and why scroll speeds come in steps of 4.

[diagram: scrolling]

If your display shows garbage when it scrolls, choose **Simulate** in the PLAYGAME setup menu. Simulate works on every VGA but copies the whole screen each tick; it is slower on a 286.

---

### 3. Block files

| File                |  Blocks | Why                                                                                                              |
| ------------------- | ------: | ---------------------------------------------------------------------------------------------------------------- |
| Background (`.BBL`) | **150** | the file is held in one piece of memory, and a piece is 64K. 150 blocks of 420 bytes is 63,000 bytes, which fits |
| Monster (`.MBL`)    | **100** | the same rule, with fewer pictures needed                                                                        |
| Hero (`.CBL`)       |  **50** | the same rule                                                                                                    |

[diagram: pieces]

Block number 150 means "no block". It is not a picture you can draw. A block takes 420 bytes: 400 pixels for the picture, and 20 for what it does (solid sides, score, hit points, counter, timers).

**Animation.** A block can turn into another block after a time. Every place on the map that holds the same block number changes at the same moment. To make cells that change at different moments, use different
members of the same ring. A frame can last from 1 tick to about 30 minutes.

**Monsters from blocks.** A block can give birth to a monster every so many ticks, up to about 15 minutes apart. Blocks up to half a screen beyond the picture still give birth, so a birthing row can sit just out of sight.

---

### 4. Maps and scenes

A map is **100 x 100 blocks**, and it wraps: walk off one edge and you come back at the opposite one. A map file is 22,000 bytes: 20,000 for the blocks and 2,000 for the 200 monsters you can place.
A larger map would fit in memory, but each extra 10,000 blocks costs 20K of the memory your monsters, sounds and music need; 100 x 100 was the largest round number that left room on a 640K machine.

A scene has up to **20 files** (the manual lists the nine that an adventure scene uses) and up to **20 links** to other scenes. A link fires when your hero touches its block, even partly.
File names are DOS names: 8 letters, a dot and 3 letters. A game can hold well over 20 scenes; the practical limit is 231.
A blank file slot skips that resource loader. Supply a complete set of files for each adventure scene rather than relying on the state left by another scene.

---

### 5. Monsters

| Thing                     |                                Limit | Why                                                                                                    |
| ------------------------- | -----------------------------------: | ------------------------------------------------------------------------------------------------------ |
| Monster types in a game   |                               **64** | a round number; the file is 19,200 bytes                                                               |
| Monsters placed on a map  |                              **200** | a round number; also the most that can be alive at once, so births count against it                    |
| Pictures in one animation |                               **20** |                                                                                                        |
| Turns in a path           | **10**, and 10 when the hero is near |                                                                                                        |
| Monsters drawn at once    |                               **50** | each one needs a 20 x 20 patch of memory to remember the picture behind it: 50 patches is 20,000 bytes |

A monster beyond the 50th is still alive and still hurts you; it simply is not drawn. A monster draws only when its block is on the screen. A monster that is not on the screen cannot touch your hero.
A path's speed is in pixels per tick; there is no limit, but a fast monster can step across a thin wall.

**Power.** Your hero has power 100. A monster weaker than 100 is destroyed when it touches him. When two monsters meet, the stronger one destroys the weaker; two of the same power pass through each other.
A monster born when another dies (the becomes setting) takes its place, so a short chain of changes can make a creature that grows, flashes, then vanishes.

**Lifetime.** A monster can be set to live a fixed number of ticks, to end after its path, or to end when it is hit. A fixed lifetime is exact to the tick.

---

### 6. The hero

A hero has **20 sequences** of up to **10 frames**. Sequences 1 to 5 are the standard ones (standing, dying, hurt, picking up, dropping); the rest you assign to keys. A sequence can be limited to a number of uses,
and the number 32,767 means unlimited. A frame can fire a monster instead of moving: choose the monster in the top block and the special block in the bottom one. The monster appears in the hero's column, in the row the frame's
height selects, so ten keys can fire into ten different rows.

The hero moves at most **11 pixels per tick** in each direction, a little over half a block. That keeps him from passing through a one-block wall between two checks. He carries up to **10 things**.

---

### 7. Counters

There are **30 counters**. The first few are special (hit points to start, lives to start, money). Counters 5 through 19 count the uses of sequences 5 through 19. Counters 20 through 29 are free for your own use:
keys, coins, fuel, anything you like. A block changes a counter by an amount you choose when the hero touches it. A block that would take a money counter or one of counters 20 to 29 down to nothing is **refused**:
the hero is simply turned away, which makes a lock.

Money is stored one higher than it is shown. That is how "none" can be refused without losing the counter. Counters count from 0 to 32,766; 32,767 means _never changes_.

---

### 8. Sound

**The speaker.** Each of the 30 sound effects is a row of **36 steps**. A step lasts 1/146 of a second (the timer chip runs at 146 steps per second), so an effect lasts a quarter of a second. A step is a pitch from about 64 to
8,192 cycles a second, or silence. The speaker can only be on or off, so there is no volume.

**Digitized sounds.** If a sound has a digitized name and the Sound Blaster is present, PLAYGAME loads that `.VOC` file from the disk at the moment the sound is played and plays it. Keep these files **under 64K**, and the shorter the
better: a one-second sound at 11 kHz is about 11K and loads in a fraction of a tick on a hard disk. Only one digitized sound plays at a time; a new one replaces the one playing. Use digitized sounds for voices and pickups, and the speaker for
sounds that repeat.

**Music.** A song is a `.CMF` file made for **146 steps a second**, which is exactly eight times the game's own tick. The Sound Blaster's FM chip plays up to nine notes at once.

---

### 9. Colors

The VGA offers **256 colors out of 262,144**: each of red, green and blue has 64 levels. A scene has one palette of 256 colors, 768 bytes. **Color 255 is clear.** A hero or monster pixel of color 255 shows what is behind it and never touches anything.
Background blocks draw every pixel, so there color 255 is just a color. Put a clear blue, a red and a yellow in every scene's palette: PLAYGAME picks the nearest one for the inventory box and its messages. Text pages print in the purple nearest to 50,10,50.
Screens without a picture (the status screen, saving, loading, high scores and text pages) fill with color 0 of the palette, so pick color 0 with care.

A fade takes **65 screen refreshes**, about a second.

---

### 10. Time

The game runs at **18.2 ticks a second**, one tick every 55 milliseconds, the same rate as the PC's own clock. Everything that moves is counted in ticks: a hero's frame pause, a monster's step, a block's change time.
Keys are looked at once a tick, so a key press is noticed within one tick (about 1/18 of a second).

Eight of the timer chip's 146 steps make one tick, and PLAYGAME uses all three at once for the clock, the speaker and the music. That is why the music and the game never drift apart.

---

### 11. If your game runs slowly on a 286

- A 286 keeps full speed with up to about **19 monsters** on a still screen (14 on a slower 10 MHz 286), and fewer while it scrolls. Twenty is a full tick of work. The limit of 50 is a safety, not a goal.
- Scrolling through a crowded screen is the hardest case. Put crowds where the screen does not scroll.
- A digitized sound stops the game for the time it takes to read it. Put long sounds at the start and end of scenes.
- Do not put a digitized sound on a block that the hero stands on for a long time; the sound would start over each tick.
- If you still need more speed, use a 386 or 486, or set the video type to match your card instead of Simulate.

**Sizes by machine.** The disk matters more than the processor. PLAYGAME reads a digitized sound from the disk every time it plays it, and the game stands still until the read is done;
a slow processor only shows when more monsters are on the screen than the table allows. A scene change is slow too, but the screen is black and the clock waits, so it costs no play.

| Measure                                  | 286, slow disk | 286 or 386SX |    386DX |      486 |
| ---------------------------------------- | -------------: | -----------: | -------: | -------: |
| Pause to read a one-second sound (11K)   |        3 ticks |       1 tick |   ½ tick |   ⅓ tick |
| Largest sound for a pause under 2 ticks  |             4K |          30K |      64K |      64K |
| Monsters on a still screen at full speed |             14 |           19 |       50 |       50 |
| Changing scenes (nine files, 170K)       |      2 seconds |     ¾ second | ⅓ second | ¼ second |

---

### 12. File sizes

| File                     |  Bytes |     | File                  |  Bytes |
| ------------------------ | -----: | --- | --------------------- | -----: |
| `.PAL` palette           |    768 |     | `.MBL` monster blocks | 42,000 |
| `.MAP` map               | 22,000 |     | `.CHR` hero           |  7,568 |
| `.BBL` background blocks | 63,000 |     | `.CBL` hero blocks    | 21,000 |
| `.MON` monsters          | 19,200 |     | `.SND` sounds         |  2,430 |

These are the full record counts for 3.00 output; older speaker-only sound sets can be shorter. A `.CHR` file holds two heroes' worth of space; the game uses the first.

---

### 13. The programs behind the editors

Game-Maker is a family of separate DOS programs. Only the small GM launcher stays in memory while another program runs. Files on disk carry the work from one editor to the next; there is no shared in-memory project object between utilities.

| Program   | Job and files                                          |
| --------- | ------------------------------------------------------ |
| GM / MENU | Launch programs and choose the next one                |
| PALCHOS   | Read and write PAL colors                              |
| BLOCEDIT  | Read and write BBL, MBL and CBL blocks                 |
| MONEDIT   | Read and write MON behavior; preview MBL pictures      |
| MAPMAKER  | Read and write MAP placement; read blocks and monsters |
| CHAREDIT  | Read and write CHR sequences; read CBL pictures        |
| IMAGE     | Read GIF pictures; extract PAL, BBL and BKD data       |
| SNDEDIT   | Read and write SND effects; convert CMF timing         |
| GRATOR    | Read and write GAM scenes and file-name references     |
| UTILITY   | Copy a game's files and its transfer player            |
| PLAYGAME  | Read the game; write recordings, scores and saves      |

[diagram: architecture]

The command tail carries the exact, case-sensitive word `cOoL`, then a letter identifying the preceding selection. GM builds a seven-byte tail: the four letters, a space, the selection letter and a carriage return. MENU uses the selection to reopen the appropriate menu. The program table assigns 1 to UTILITY, 2 to PALCHOS, through 9 to GRATOR, 10 to PLAYGAME and 11 to MENU. Zero means quit.

A utility checks `cOoL` to recognize a launch under Game-Maker. Without it, the utility requests restoration of the DOS text display when it ends. Returning 11 hands control back to GM, which launches MENU; returning zero ends the launcher. The token preserves the managed display transition; the exit code supplies the next destination. A utility started directly at the DOS prompt has no waiting GM launcher to interpret its return code.

**Follow one piece of data.** BLOCEDIT saves a block at index 10 in a BBL. MAPMAKER writes that index into a MAP cell. GRATOR puts both file names into a scene. PLAYGAME resolves those names, loads the two files and draws the cell using color indexes from the scene's PAL. Changing the palette can change the picture without changing a single pixel byte in the BBL.

---

### 14. Reading a byte layout

The following plates describe the 3.00 disk files. Offsets start at zero and are decimal unless followed by `h`, which means hexadecimal. `u8`, `u16` and `u32` mean unsigned integers of one, two and four bytes; `i8`, `i16` and `i32` are signed integers of those sizes. Multi-byte numbers are little endian: `2C 01` is 300, and `FF FF` is -1 as an i16 or 65,535 as a u16. There is no automatic padding between fields in these game records.

A record-relative offset must be added to the record's base. Indexes start at zero. A NUL is a zero byte ending a string; an LF is byte 10 and a CR byte 13. Reserved bytes still occupy space and should survive an edit, even where the player gives them no meaning. The plates show field boundaries rather than lengths to scale.

The worked examples use the installed TUTOR files unless another supplied file is named. They are byte readings, not instructions to replace the examples' artwork. A file's name and extension are external to its contents: most Game-Maker records have no signature, version or count. The scene's file slot tells the reader what to expect.

---

### 15. PAL: the scene's colors

PALCHOS writes palettes. IMAGE also saves a palette extracted from a GIF. The editors and PLAYGAME read them. A PAL is exactly 768 bytes, with no header, file names or indexes of other files: it is 256 consecutive RGB triples, each component from 0 to 63.

[diagram: pal]

A BBL, MBL or CBL pixel is a one-byte index into this table. The GAM adventure scene names the palette in file slot 0. Sharing pictures across scenes requires compatible color positions, not merely the same collection of colors. Sprite pixel 255 means transparent; background pixel 255 remains an ordinary palette lookup.

**Worked example.** HUES.PAL begins `00 00 00 00 00 07`. Color 0 is black. Color 1 starts at byte 3 and is RGB (0,0,7), a dark blue. A pixel byte 1 selects that triple. Color 255 begins at byte 765, leaving the final three bytes inside the 768-byte file.

---

### 16. MAP: cells and placed monsters

MAPMAKER writes and reads MAP files; PLAYGAME loads them from adventure slot 1. Each file contains exactly 10,000 two-byte cells followed by 200 ten-byte placement records. There is no header or palette. The world is 100 columns by 100 rows and wraps at its edges.

[diagram: map]

The first byte of a cell selects BBL block 0 through 149 from adventure slot 2. The second selects a placement record, not a MON type. That placement's first byte selects type 0 through 63 from slot 3's MON. The type in turn selects pictures in slot 4's MBL. Thus changing the order of MON records changes what an unchanged map places.

**Worked example.** TUTOR.MAP is 22,000 bytes. Cell (5,5) starts at 2 × (500 + 5) = 1,010 and contains `00 C8`: BBL block 0, with no monster placement (C8h = 200). Placement 0 starts at byte 20,000 and begins `40 00 00 00 FF FF FF FF 00 00`: type 64 means unused, and its x and y words are both -1. The coordinate words are map cells, not screen pixels.

---

### 17. BBL: pictures with behavior

BLOCEDIT reads and writes background sets; IMAGE can extract them from GIF pictures. MAPMAKER previews them and PLAYGAME loads them from adventure slot 2. A BBL has 150 consecutive 420-byte records, totaling 63,000 bytes, without a header. Pictures occupy the first 400 bytes of every record, so metadata is interleaved with pictures rather than collected at the end of the file.

[diagram: block]

The map selects a record by index. Each pixel selects a color in the scene's PAL. Next and touched block fields select other records in the same BBL; a birth field selects a type in the scene's MON. The counter field selects a hero counter, not a sound effect. The player chooses event sounds from SND separately. Index 150 means no background block where a field accepts that sentinel. Timers count game ticks; all cells with one block number share its animation state.

**Worked example.** In TUTOR.BBL, block 10 starts at 4,200. Its tail has next block 8 at byte 4,611, interval `02 00` at 4,612, and touched block 10 at 4,614. It changes to block 8 after two ticks and keeps its own block number on touch. Block 10's first pixel is at 4,200, its last at 4,599; neither belongs to that tail.

---

### 18. CBL and MBL: the sprite libraries

BLOCEDIT reads and writes all three block-set kinds. CHAREDIT reads CBL pictures; MONEDIT reads MBL pictures. PLAYGAME reads CBL from adventure slot 6 and MBL from slot 4. The extension determines the count: 50 records for CBL, 100 for MBL. Both use the complete 420-byte record shown for BBL, including its 20-byte behavior tail.

[diagram: sprites]

CHR frames select CBL pictures by index; MON animation pairs select MBL pictures by index. A sprite pixel of 255 is clear. The files embed neither a palette nor their partner CHR or MON file name. Keep the GAM scene's files together as a compatible set. Picture 50 is absent for a character; picture 100 ends a monster's picture list. Those sentinels do not allocate an extra record on disk.

Do not discard the tail as picture padding. In particular, an MBL picture's score, hit-point and counter fields participate in contact with the hero. Background animation, births and pickup behavior should be designed in the BBL.

**CBL example.** PENGUIN.CBL is 21,000 bytes. Its first 32 bytes are FFh, so that part of picture 0 is transparent. Picture 8 starts at 8 × 420 = 3,360; the hero example below selects it as the lower picture.

**MBL example.** PENGUIN.MBL is 42,000 bytes. Byte 19 is CFh (207), surrounded by FFh pixels. It is the rightmost pixel of picture 0's first row and selects palette color 207. Picture 1 begins at 420, not at 400.

---

### 19. CHR: the hero's program

CHAREDIT writes two character records in a CHR file, 7,568 bytes altogether. PLAYGAME loads the first from adventure slot 5. The second occupies real disk space but is not a second active player. Each record begins with 20 sequences of 185 bytes. The saved positions and current sequence are followed by ten inventory indexes and thirty signed counters.

[diagram: chr]

Inventory entries and sequence ties select BBL blocks. A sequence's sound selects an SND effect; 30 means none. Its keyboard word combines a PC scan code in the high byte and an ASCII value in the low byte. The standard sequences occupy indexes 0 through 4; key sequences generally use 5 through 19. A counter value of 32,767 means unlimited.

[diagram: sequence]

Each sequence has ten 17-byte frames, then fifteen bytes of controls. The top and bottom picture numbers normally address CBL records. The orientation word carries the top orientation in its low nibble and the bottom in its high nibble. Each orientation is 0 through 7. Pause is in 18.2 Hz game ticks; x and y are signed pixel movements, with the hero's final velocity limited to 11 per axis per tick.

[diagram: frame]

**Worked example.** PENGUIN.CHR frame 0 begins `00 00 00 00 00 00 32 00 08 00 07 00`. It moves (0,0), has orientation 0, omits the top picture (50), shows CBL picture 8 below, and waits seven ticks. Its sequence's byte 172 is 1Eh (30, no sound), and byte 174 is 96h (150, no inventory tie). At byte 3,724 the first counter is `64 00` (100); at 3,726 the next is `02 00` (2). The end marker is bottom picture 51; bottom picture 100 instead fires the MON type stored in the top field.

---

### 20. MON: the monster types

MONEDIT writes MON sets and reads their partner MBL for previews. PLAYGAME loads 64 types from adventure slot 3. The file has no header: 64 × 300 = 19,200 bytes. MAP placements and BBL births select types by index. A type's picture pairs select MBL pictures and give their durations in game ticks.

[diagram: mon]

The file stores 21 picture pairs but the player shows at most 20. Picture 100 means no further picture. Normal and attack paths each contain ten corners; each corner holds signed x and y deltas in blocks, speed in pixels per tick and orientation. A zero speed ends a path. The attack mode chooses whether the second path is used. A becomes value of 64 means no successor type.

Power is an unsigned byte; the hero's power is 100. Lifetime -2 means never end, -1 end after the path, 0 end when killed, and positive values specify ticks. Positive chase values below 64 move toward the hero; negative ones move away. Several saved fields are editor preview or reserved state; the record must still retain their bytes.

**Worked example.** PENGUIN.MON type 0 starts with four zero words, then `B4 00`: power 180 and a zero thru byte. Its first picture pair at byte 10 is `64 00 05 00`: picture 100, duration five. The sentinel makes this type pictureless. At offsets 122, 124 and 126 are 0, 10 and -9: no attack path, ten-tick lifetime, and movement away from the hero. A nonzero power does not guarantee a visible picture.

---

### 21. GAM: the scene graph and its dependencies

GRATOR writes the integrator file. PLAYGAME reads it to find the start, ending and adventure scenes. A 3.00 GAM has a 256-byte identification header, a six-byte scene-count header, N 283-byte scenes and a length-prefixed name pool. The signature is GM. Older games use 330-byte scenes with names inline; do not apply the 3.00 offsets to them.

[diagram: gam]

Each scene contains twenty file pointers and twenty links, even if some are unused. A pointer is a byte offset into the shared pool of NUL-terminated names; it is not a disk address. Zero selects the pool's empty string. Links use scene indexes, so reordering records requires updating the links. The practical scene limit is 231 for the player's single-segment scene array; the reader clamps the name pool to 65,520 bytes. The editor initially allocates 10,000 name bytes, a separate constraint from that reader ceiling.

[diagram: scene]

**Adventure slots 0 through 10:** PAL, MAP, BBL, MON, MBL, CHR, CBL, SND, CMF, entrance graphic, exit graphic. Remaining slots are reserved. **Start scene slots 0 through 11:** title graphic, title song, menu graphic, menu song, story graphic, story song, instructions, beginning credits, high-score backdrop, load backdrop, save backdrop, demo REC. **End scene slots 0 through 3:** won graphic, won song, lost graphic, lost song. Scene 0 is the start and scene 1 is the end record. A graphic slot can name GIF, BKD, FLI, TXT or LST; slide images and their music are separate dependencies.

A link stores a destination scene and source and destination map cells. Its source cell triggers the transition and its destination cell places the hero on arrival. Scroll bytes are zero for still, 255 for following the hero, or a constant speed; the style byte selects normal, centered or snap scrolling. Integrator diagram x,y positions only arrange boxes in the editor.

**Worked example.** TUTOR.GAM is 6,263 bytes, begins `47 4D 2C 01 00 08`, and has counts (20,20,20) at byte 256. Its pool length word is at 262 + 20 × 283 = 5,922; the length is 339, giving 5,922 + 2 + 339 = 6,263. Scene 2 begins at 828. Its map pointer at 828 + 45 is 42, selecting `tutor.map` at absolute byte 5,924 + 42 = 5,966. Its first link at 911 goes to scene 3 from cell (96,11), arriving at (90,18).

---

### 22. SND: speaker effects and digital names

SNDEDIT writes a set of thirty effects; PLAYGAME loads it from adventure slot 7. An effect is a row of 36 unsigned frequency words, followed elsewhere in the same file by a nine-byte digital name. The normal file is 2,430 bytes. Older speaker-only files can end at 2,160 bytes; their missing digital names are treated as empty.

[diagram: snd]

A CHR sequence directly selects an effect number. Block and monster contact uses the player's event assignments: slots 0 through 8 cover hit points up, monster killed, counter additions and subtractions. Every speaker step lasts about 1/146 second; 36 steps make roughly a quarter second. Zero hertz is silence. The speaker produces one tone at a time.

For effect e, the digital name lives at 2,160 + 9e. It holds at most eight characters plus NUL, without an extension. PLAYGAME adds `.VOC` in the game's working directory. An empty name or one beginning with a space selects the speaker. With digital sound enabled and a usable name, the VOC supplies the samples; it does not replace the frequency row on disk. Only one digital effect plays at once.

**Worked example.** SOUNDS1.SND begins `62 00` repeatedly: the first steps of effect 0 are 98 Hz. Its digital entry at 2,160 is `exclnt` followed by three zero bytes. Entry 1 at 2,169 is `dead` followed by five zeros. Playing effect 1 selects DEAD.VOC; entry 5 selects BEBEEP.VOC. The same slot number joins the two tables without storing any VOC sample inside SND.

---

### 23. VOC: sampled effects

VOC is imported sound, recorded or converted with an external audio tool; SNDEDIT assigns its name and can audition it. Game-Maker does not record a VOC. PLAYGAME reads it through the Sound Blaster voice driver. The standard header is 26 bytes, followed by typed blocks. Each nonzero type has a three-byte payload length; type zero is the one-byte terminator.

[diagram: voc]

Type 1 gives a time constant, codec and sample bytes. For uncompressed eight-bit mono sound, the rate is 1,000,000 / (256 - time constant). Type 2 continues samples, type 3 adds silence and types 6 and 7 bracket a repeat. Newer VOC variants need corresponding driver support; a decoder's ability to read a block does not establish that every DOS driver can play it. Keep the whole file under 65,535 bytes for the DOS allocation and read path. The DOS player takes its first-block offset from the low byte of the header field, so the usual 26-byte header is the safest choice.

**Worked example.** DEAD.VOC is 9,217 bytes. Byte 20 begins `1A 00`, selecting block offset 26. There the bytes are `01 E2 23 00 D3 00`: type 1, length 23E2h = 9,186, time constant D3h = 211 and codec 0. Samples start at 32. The rate is about 22,222 Hz, and the payload holds 9,184 samples, about 0.413 second. Its next block is at 26 + 4 + 9,186 = 9,216: the final zero terminator.

---

### 24. CMF: FM instruments and timed events

A music program creates the original CMF. SNDEDIT's converter writes a new CMF timed for Game-Maker: it rescales the tick division and event delays to 146 ticks per second. PLAYGAME reads CMF names from GAM song slots. A song contains FM instrument definitions and a MIDI-like event stream, not sampled sound or references to VOC files.

[diagram: cmf]

Each instrument occupies sixteen bytes: eleven FM register values and five reserved bytes. The header points to the instrument and event blocks independently, allowing descriptive strings between them. A MIDI program change selects an instrument index; note events select pitch and velocity on a channel. Each event begins with a variable-length delay in seven-bit groups, high bit meaning another byte follows. Running status can reuse the previous channel command. End-of-track is FFh 2Fh 00h after its delay.

The DOS player requires the clock field to be 146 and uses the FM chip's nine voices. Keep the event block under 65,536 bytes and its file offsets representable by the header's sixteen-bit fields. The web writer caps its instrument table at 128; the DOS loader does not validate that same ceiling.

**Worked example.** GMSONG1.CMF is 5,952 bytes. The header gives instrument offset 40, music offset 216, eleven instruments, 73 ticks per beat and 146 ticks per second. Eleven × 16 = 176, exactly the distance from 40 to 216. Instrument 3 starts at 88. The event stream occupies 5,736 bytes, from 216 to the end. The GAM slot names the whole song; its program changes index the embedded instruments.

---

### 25. BKD, LST and TXT: pictures and slides

IMAGE writes a BKD to select a 320 × 200 window of a GIF. Its normal output is two coordinate words followed by a forty-byte GIF-name field, 44 bytes total. PLAYGAME reads a shorter prefix: the words and a line of at most 39 name bytes. The GIF itself holds the indexed picture and its palette; neither is embedded in BKD.

[diagram: bkd]

**Worked example.** The supplied PEACH.BKD is thirteen bytes: four zeros, then `peach.gif`. Its words choose window (0,0), and its remaining nine bytes name the external picture. This is a real short file, rather than IMAGE's full 44-byte output. Use a normal terminated name when writing a new file.

An LST is a text-authored sequence of graphic names with optional pause seconds. A TXT is text-authored page content. The original IMAGE and GRATOR do not write these text formats; the web editor can write slide lists. PLAYGAME reads both from graphic slots, including entrance, exit, title, story and credits. Do not serialize the in-memory FileEntry structure into an LST.

[diagram: scripts]

**LST example.** TUTOR.LST is 48 bytes. Its first line is `gm3a.fli` followed by CR LF at bytes 8 and 9. The third line is `backgrnd.fli 0`: a picture name and a zero pause; the fourth is `tutor.txt`. A final 1Ah marks DOS text EOF. The DOS reader allocates 100 list entries and keeps at most fifteen name characters per entry; stay below that allocation and use DOS 8.3 names.

**TXT example.** TUTOR.TXT is a separate 1,607-byte text file named by that list. It begins with CR LF at bytes 0 and 1, followed by byte 54h, the letter T, at offset 2. There is no count or binary header. The display reads at most 31 characters at a time into a 32-byte buffer, so keep authored lines short. TXT holds CP437 text bytes; CR LF ends a physical line and 1Ah can end DOS text. Imported GIF and FLI pictures remain external media, not files generated by Game-Maker's editors.

---

### 26. REC and HIS: play creates files too

PLAYGAME writes REC demonstrations and reads them from the start scene's demo slot. No header or event count is stored: file length divided by three gives the number of records. Each record is an elapsed game-tick count and a PC scan code. Bit 7 means release. The recorder holds at most 1,000 events; a delay can span 65,535 ticks.

[diagram: rec]

**REC example.** TUTOR's DEMO.REC is 1,536 bytes, or 512 events. Its first six bytes are `19 00 4D 0D 00 CD`: wait 25 game ticks, press Right (4Dh), wait thirteen more ticks, release Right (CDh). These are elapsed times, not absolute clock readings. The GAM supplies the game and scene context; REC does not contain either name.

PLAYGAME also writes a ten-rank HIS table under the game's name. Each rank is a signed 32-bit score followed by thirty name bytes, 340 bytes in all, with no signature. The working directory and game stem associate the table with the game; the file itself contains no GAM pointer. A score fits a signed long, and a normal name leaves room for its terminating NUL.

**HIS example.** SAMPLE.HIS begins `50 00 00 00`: score 80 at rank 0. Its next thirty bytes are zero, an empty name. Rank 1 starts at 34 with `41 00 00 00`, score 65, then the name `GAS` and a NUL at byte 41. Score sorting is separate from the record layout.

---

### 27. Configuration and saved play

The utilities share GM.CFG so they can reopen the working directory. It is a 51-byte NUL-terminated directory field written by the common startup/shutdown code. PLAYGAME setup reads and writes CONFIG.DAT for joystick, display and sound choices. These files configure the installed tools rather than define game content.

[diagram: config]

**Worked examples.** The installed GM.CFG is 51 bytes and begins `SAMPLE` followed by a backslash and NUL. The supplied CONFIG.DAT is 500 bytes: at offset 20 it has `0D 00` (video enum 13, automatic detection), at 22 `01 00` (Sound Blaster), at 24 `07 00` (IRQ 7), at 26 `20 02` (port 0220h), and at 28 the driver path. Paths have fifty characters plus NUL in GM.CFG and forty plus NUL in CONFIG.DAT. These are local installation settings; they do not use the GAM name pool.

PLAYGAME's save menu writes ten 21-byte labels to SAVNAMES.DAT, and live state to GAME0.SAV through GAME9.SAV. Slot number, not a stored pointer, joins each label to its save. A label has twenty characters plus NUL. Saves retain the current map after touches, monster state, hero state, animation clocks, scene indexes and recorder state; they still depend on the matching GAM and assets.

[diagram: saves]

The save's first 761 bytes have explicit scalar and array sizes. What follows includes native compiler objects and far pointers. **Inferred layout:** with byte packing and the expected pointer widths, the fixed state is about 37,685 bytes before spawners and recording data. This is not a guaranteed interchange size. Loading re-reads the scene's assets and restores saved live cells; editing the original MAP does not replace those saved cells. No binary DOS save was available for a worked byte example. Do not mistake a same-named file from a different player for this native layout.

---

### 28. Transfer files and imported media

UTILITY's transfer command copies XFERPLAY.EXE under the game's stem, copies the selected dependencies and writes CONFIG.BAT. It does not pack all the scene data into the executable. The batch line is the game stem, a space, `configure`, then a DOS newline; running it opens that transferred player's setup.

[diagram: transfer]

**Worked executable example.** The supplied XFERPLAY.EXE begins MZ. It is 160,598 bytes long. The word at offset 8 is 512 paragraphs, so the load image begins at 8,192; the word at offset 24 is 62, the relocation-table offset. The player's private settings belong to its particular build; changing a byte in a different build at the same address is not a format conversion. A batch file has no header or fixed count: read the command as text, not as an integrator record.

GIF pictures, FLI animation and VOC recordings are imported media. CMF conversion changes an imported song's timing; IMAGE extracts game data from GIF rather than writing a new GIF. HLP help files and the Sound Blaster driver are supplied inputs; transfer copies them unchanged. Build, installation and registration tools can also copy executables or write administrative text, but those outputs are not game-resource layouts. This distinction keeps a list of game formats from implying that the editors author every file they can open.

---

### 29. Limits at a glance

| Thing                            | Limit                            |
| -------------------------------- | -------------------------------- |
| Screen                           | 320 x 200, 256 colors            |
| Shown while playing              | 312 x 196 pixels                 |
| Block                            | 20 x 20 pixels                   |
| Playing screen                   | a little under 16 x 10 blocks    |
| Background, monster, hero blocks | 150, 100, 50                     |
| Map                              | 100 x 100 blocks, wraps          |
| Monsters placed / alive          | 200                              |
| Monster types                    | 64                               |
| Monsters drawn at once           | 50                               |
| Pictures per monster             | 20                               |
| Turns in a monster's path        | 10, and 10 when the hero is near |
| Hero sequences / frames          | 20 / 10                          |
| Hero speed                       | 11 pixels per tick               |
| Things carried                   | 10                               |
| Counters                         | 30                               |
| Links per scene                  | 20                               |
| Files per scene                  | 20                               |
| Speaker effect                   | 36 steps, a quarter second       |
| Digitized sound                  | under 64K, one at a time         |
| Music                            | 146 steps a second               |
| Colors                           | 256 of 262,144                   |
| Tick                             | 18.2 a second                    |

---

### 30. Words used in this booklet

| Word             | What it means                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Block            | a picture 20 x 20 pixels, with the settings that say what it does                                      |
| Digitized sound  | a recorded sound in a `.VOC` file, played by the Sound Blaster                                         |
| Palette          | the 256 colors a scene can show                                                                        |
| Piece of memory  | 64K, the most the PC can reach in one step; a file that must sit in one piece can be no larger         |
| Pixel            | one dot on the screen; 320 x 200 of them make the picture                                              |
| Resident program | a program that stays in memory after it starts, such as a mouse driver, and so takes memory from games |
| Scene            | one level of a game: its map, its blocks, its monsters, its song and its links                         |
| Tick             | one step of the game, 1/18.2 of a second                                                               |

Keep this booklet with your manual. When a game will not fit, the answer is usually on one of these pages.
