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

A block is **20 x 20** pixels. 320 / 20 is 16 and 200 / 20 is 10, so the playing screen is **16 blocks across and 10 down**, with no pixels left over, and no status bar. Your hero is two blocks tall (40 pixels).
[diagram: screen]

Twenty pixels is the smallest block that still draws a face you can recognize; 16 would leave a fraction of a row at the bottom.

**Scrolling.** The screen scrolls by moving the start of the picture in video memory, 4 pixels at a time, and pans the last 0 to 3 pixels with a VGA register. Only the new strip at the edge is redrawn.
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
If you leave a file slot empty, the scene uses what the last scene loaded: a song, a sound set or a hero can carry over from scene to scene that way.

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
Background blocks draw every pixel, so there color 255 is just a color. Put a clear blue, a red and a yellow in every scene's palette: PLAYGAME picks the nearest one for the inventory box and its messages.

A fade takes **65 screen refreshes**, about a second.

---

### 10. Time

The game runs at **18.2 ticks a second**, one tick every 55 milliseconds, the same rate as the PC's own clock. Everything that moves is counted in ticks: a hero's frame pause, a monster's step, a block's change time.
Keys are looked at once a tick, so a key press is noticed within one tick (about 1/18 of a second).

Eight of the timer chip's 146 steps make one tick, and PLAYGAME uses all three at once for the clock, the speaker and the music. That is why the music and the game never drift apart.

---

### 11. If your game runs slowly on a 286

- A 286 can keep full speed with about **ten monsters** on the screen. Twenty is a full tick of work. The limit of 50 is a safety, not a goal.
- Scrolling through a crowded screen is the hardest case. Put crowds where the screen does not scroll.
- A digitized sound stops the game for the time it takes to read it. Put long sounds at the start and end of scenes.
- Do not put a digitized sound on a block that the hero stands on for a long time; the sound would start over each tick.
- If you still need more speed, use a 386 or 486, or set the video type to match your card instead of Simulate.

**Sizes by machine.** The disk matters more than the processor. PLAYGAME reads a digitized sound from the disk every time it plays it, and the game and its music stand still until the read is done;
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

If a file is a different size, it is not a Game-Maker file of that kind. A `.CHR` file holds two heroes' worth of space; the game uses the first.

---

### 13. Limits at a glance

| Thing                            | Limit                            |
| -------------------------------- | -------------------------------- |
| Screen                           | 320 x 200, 256 colors            |
| Block                            | 20 x 20 pixels                   |
| Playing screen                   | 16 x 10 blocks                   |
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

### 14. Words used in this booklet

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
