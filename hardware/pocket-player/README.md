# Pocket Player

Firmware for two boards: the ESP32-3248S035 (3.5 inch, 480 by 320, ST7796, GT911 capacitive touch) and the smaller ESP32-2432S028 (2.8 inch, 320 by 240, resistive touch; see "The 2.8 inch board" below). The rest of this README describes the first board unless it says otherwise. It plays **all 106 Starters (the 99 lessons and the 7 Graduations)** from the games' real DOS files, packed small into LittleFS (`web/scripts/pocketData.ts`), with a game list, touch controls for fingers and a stylus, a settings screen and a status strip. It plays each game's **PC speaker sounds** (no Sound Blaster clips or music yet).

The flashed firmware binaries' third-party notices are in [`web/public/pocket/fw/NOTICES.txt`](../../web/public/pocket/fw/NOTICES.txt). Keep that file with the firmware image set when redistributing it.

The play rules are `src/gmcore.h`, a port of the web engine's character, touch, scroll, block-effect and scene code (itself from `code/GM/PLAYGAME.C`) with no board code in it, so the same file runs in the Mac test. Monsters (`src/gmmon.h`, a port of the web engine's `monsters.ts`) are in. **Sound** is queued by the core as events and played by `src/speaker.h` (see Sound below). Not ported: Sound Blaster .VOC clips, FM music, the joystick. The Sandbox games with more than 12 levels or 16 links are left out; the others go on a microSD card (see below) (`npx vite-node scripts/pocketData.ts --list --series any` says why for each).

Files: `src/gmcore.h` (play loop), `src/gmcards.h` (the pictures and text pages between levels, no board code), `src/gmmon.h` (monsters), `src/gmcfg.h` (a game's `.cfg` and the level file loader), `src/controls.h` (touch controls model), `src/pcspeaker.h` (the PC speaker tune player, no board code), `src/speaker.h` (GPIO 26 and the task that drives it), `src/gt911.h` (touch chip, up to 5 fingers with ids and sizes), `src/gt911report.h` (I²C reports, host-tested for interrupted reads), `src/picker.h` (bounded titles and search), `src/picker_draw.h` (rows, icons and keyboard shared with host renders), `src/screen.h` (play viewport), `src/main.cpp` (files, panel, screens, drawing), `src/btnicon.h` (which picture a key's button shows: the shot or item it throws or uses), `host/hosttest.cpp`, `host/controlstest.cpp`, `host/cardstest.cpp` (Mac tests) and `host/iconsdump.cpp` (lists the picture each button gets; `web/scripts/pocketIconsShot.py` draws them). The controls are drawn into each band of the picture before it is pushed once (`drawControls` in `main.cpp`), so they never blink; a button shows its key's name big and under it the picture or the game's label, wrapped to two lines, shrunk, then cut with "...".

## Phase 1 picker, display and input updates (November 6, 2026)

The picker appears after reading the small `games.txt` indexes. One-file card games are discovered afterward, eight directory names per UI loop; only `.GMP` candidates are opened. The old scan opened every loose asset before showing anything. A trailing `...` in the title means discovery is still running. Discovery releases its directory and the card mount before play or Settings; if interrupted, it resumes with a fresh scan and skips already listed ids. The existing 128-game limit remains. No cache file is written.

Serial boot timing is in milliseconds since reset: `BOOT ... start`, `card-probe elapsed=`, `list-loaded`, `picker-ready`, and `card-discovery elapsed= entries= games=`. Compare `picker-ready` on the same card before judging a speed improvement; host tests cannot measure an SD controller. No new board measurements were taken in the sandbox.

The bottom buttons are left/right arrows, a spyglass (case-insensitive substring search of titles) and a smaller gear for Settings. Search offers letters, digits, Space, Del, Clear and Done. Clear then Done restores every title. Titles occupy one line with an ellipsis, have no level counts, and the entire list area clears on every page change. New packers preserve up to 95 title characters for search; older files with shortened titles still work.

Both boards have Settings pages with More and a Display entry. On the 3.5 inch board Display offers **Smaller picture**; its ST7796 geometry and GT911 coordinate mapping are fixed, so it has no resistive calibration or panel-driver guessing step. The 2.8 inch board retains Calibrate and offers Panel setup inside Display. Smaller picture uses at most three quarters of the usual width at the top right (top left with left-handed controls), preserving the aspect ratio and shrinking further when needed to clear the entire pad plus its 14 px touch slop. Controls keep their usual positions and sizes. It saves immediately in NVS as `pocket/smaller`, survives a firmware-only reflash, and affects play only; cards stay full size.

Display setup now has three steps: Mirror, Landscape, Colors, then touch calibration. The separate UP step was removed: a half-turn cannot turn a sideways arrow upright. Landscape cycles six choices: both software quarter turns and the wide-panel mode, then the same three with both mirror bits toggled for the opposite mounting direction. Saved setups, including the old calibration-resume stage, still read.

A short GT911 I²C read now keeps the last complete contact report and retries without acknowledging the incomplete packet. Holding a direction remains one key-down until release, using DOS sequence repeat rather than simulated repeated taps. The controls host check includes ten-second Up and both upward-diagonal holds. `V 1` also prints `seq`, `frame`, `sugar`, `gx`, `gy`: in A Fly Named Carl, fresh air spends sugar and empty sugar makes Carl sink, so capture those fields together with `up` when checking the couch report. Actual thumb behavior and the reported couch failure still need a board check.

## The 2.8 inch board (ESP32-2432S028, "Cheap Yellow Display")

Two of these were identified on 2026-11-05 (printed "ESP32 2432S028" on the back): both an ESP32-D0WD-V3 (revision 3.1, dual core, 240 MHz), 4 MB flash (manufacturer 5E, device 4016), **no PSRAM**, an XPT2046 resistive touch chip on its own pins (an idle read shows pressure near 0 and the interrupt line high), no I2C touch chip (a scan finds nothing), the display on the HSPI pins and the microSD slot on VSPI. One of them (`/dev/cu.usbserial-120` at the time) had a 64 GB card in it. The display driver is the one thing a read could not settle: the panel's ID registers do not read back cleanly over the board's MISO line, so the firmware has an ILI9341 driver (the usual one), the same with inverted colors, and an ST7789 driver (the "2 USB" revision), and the **display setup** screen (below) steps through them (it restarts). If the picture is garbled or the colors are inverted, hold the BOOT button for 2 seconds on the game list: it does the same step with no touch needed.

Build and flash it (env `cyd-2432s028`; the first board's is `esp32-3248s035`, and each build writes its own folder under `.pio/build/`):

```sh
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player -e cyd-2432s028 -t upload --upload-port /dev/cu.usbserial-XXXX
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player -e cyd-2432s028 -t uploadfs --upload-port /dev/cu.usbserial-XXXX   # the Starters, once
```

Everything but the layout is the same program (`-DPOCKET_CYD28` in `platformio.ini` picks the board in `src/board.h`, `src/screen.h`, `src/controls.h` and `src/main.cpp`). The game is drawn at 1x (320 by 200) with a 40 px status strip below it; the controls are drawn over the game at about two thirds of the big board's size, the list shows four games a page, and Settings has two pages (More). The first board's play layout is unchanged (`scr::SMALL` is false there). The card, the speaker (GPIO 26) and the RGB LED (kept off) are as on the first board; the card uses the same pins.

**Touch.** `src/xpt2046.h` reads the chip by bit-banging its pins (CLK 25, MOSI 32, MISO 39, CS 33, IRQ 36), so it shares no bus with the display or the card. A touch needs the interrupt line low and a pressure of at least 350 on two reads in a row; it ends after two reads without. `controls.h`'s 60 ms grace (held input) and the 3-tick minimum press sit on top of that, as on the first board. The status strip's last number is the pressure divided by 40.

**Display setup (the first thing the 2.8 inch board does).** These boards come with their picture mirrored, turned or in the wrong colors, so nothing on the first screens needs reading or touching in a particular place. Every step has two controls, drawn on the screen as they work: the boxed icon is the **BOOT button** (the step's action) and **OK** is a **tap anywhere** on the glass. White on black, big. Three steps:

1. **Mirror.** The word MIRROR? and a big R. BOOT mirrors the picture left to right; when they read right, tap.
2. **Orient.** A wide LANDSCAPE frame on the edge of the 320 by 240 picture. BOOT tries six mounting choices in turn (a software quarter turn, the other quarter turn, then the glass run 320 by 240 as it is, for a glass wired the other way round, which clears its whole memory when the shape changes), then repeats those three half a turn around; when the frame fills the screen and the word reads right, tap.
3. **Colors.** RED, GREEN and BLUE written in those colors on black, a white patch and a black one. BOOT steps the four color modes (plain, inverted, red and blue swapped, both) with no restart; when the words have their own colors, tap.

Then the touch calibration (below): three crosses, one at a time, which settle any touch wiring.

If the picture is garbage or blank (the wrong display driver), **hold BOOT for about two seconds**: the board switches to the other driver and restarts into step 1.

**Third way (soft 3).** A photo of board C on the software turn showed the picture 240 columns wide and clipped with stale pixels in the 80 columns the program never cleared, so that glass appears to be 320 by 240 at turn 0 (the row/column exchange then gives it the portrait shape). Landscape therefore also offers the panel configured 320 by 240 with no software turn (`soft=3` in the record; the same even rotations for the mirror bits). The board and firmware label in the corner is the short form ("C fw 4d8759e") in white at twice the font size.

**Why Landscape turns the picture in software.** Board C (the second 2.8 inch board) drew the 320 by 240 picture as if the panel were portrait: mirrored, clipped at 240 columns and with the bottom of the glass empty, while the program had asked for a landscape turn. The appears-to-be cause: this glass ignores the display chip's row/column exchange (the MV bit of MADCTL, which LovyanGFX sets for every landscape turn), so the hardware can mirror and flip but not turn a quarter. That is inferred from the photos, not read from the chip (the panel's ID registers do not read back). So the setup runs the panel in a portrait turn (the four mirror variants, rotations 0, 6, 4 and 2, which never use the exchange) and turns the picture a quarter in software (`src/softgfx.h`): shapes and text map through a rotation, the status text is drawn glyph by glyph from `src/softfont.h`, and each band of the game picture is transposed before it is pushed. It works on any glass; the 3.5 inch board and a setup saved by the older flow (record without `soft`) keep the hardware landscape turns untouched.

Saving is per chip: the board's chip id (its ESP32 efuse MAC, in `S st`) keys the setup: driver and colors (`panel`), the mirror bits (`turn`), the quarter turn (`soft`: 0 an old hardware landscape setup, 1 or 2 the two software quarter turns) and the touch calibration. It goes to the chip's own flash (NVS) and, when a microSD card is in, to `/pocket/boards/<chip id>.cfg` (the only file this feature writes). The card's file is read only by a chip whose flash never held a setup, so a card moved between boards carries every board's setup and an erased board finds its own, while a setup in progress is never replaced by an older file. To open the setup later: press BOOT briefly on the game list, tap the top-left of the list's title bar, or Settings, Display. To go back to the first start: `S forget nvs` over serial and restart.

How it works (`src/setupflow.h`, `src/setupdraw.h`): Mirror and Colors draw inside a 240 by 240 square, and Landscape draws the whole 320 by 240. Each redraw clears the whole panel first. `host/setuptest.cpp` (run by `pocketControlsCheck.ts`) checks what BOOT and OK do in each step, that the four mirror states are four even rotations, that the two software turns cover the panel exactly once and are half a turn apart, that exactly one color mode reads right for each of the four color faults, and the saved record (old records still read). `host/setupshots.cpp` draws every step, through the same SoftGfx, into a physical 240 by 320 buffer that mirrors like the glass, checks nothing is clipped and a game band lands transposed, and writes montages to look at.

Serial (115200) for testing without seeing the screen: `S st` prints the state (chip, state 0/1/3, `live=` the step, mirror bits, quarter turn and color mode in progress, panel, turn, soft, the touch calibration, the NVS values and the card's file), `S tap RX RY` is a tap (any position is OK on steps 1 to 3; on the calibration it is a raw touch, 0..4095), `S boot` is a short BOOT, `S skip` finishes with what is set, `S open` opens the setup from the game list, `S forget nvs` clears this chip's saved setup (for a true first start) and `S forget card` its own card file. A script that plays a pretend user over serial: `web/scripts/pocketSetupDrive.py PORT MIRROR ORIENT COLORS [WIRING]` (needs `S forget nvs` and a restart first).

**Not yet seen by a person:** the drawing (the screens above, and the software turn on a real glass) was checked in a host frame buffer and by serial, not by eye on the board.

**Calibrate (under a minute).** Display setup above ends with this. To redo only the calibration: Settings, Calibrate. Tap the cross at the top left, the top right, then the bottom left, pressing firmly and lifting. The screen then shows a dot that follows your finger: Done saves it (NVS key `pocket/cal`, it survives a reflash of the program), Redo starts over. The BOOT button cancels at any point. Taps that don't line up (two on one spot, the wrong corner) are refused and you tap again. `src/touchcal.h` works out swapped and flipped axes from the three taps; `host/touchcaltest.cpp` (run by `pocketControlsCheck.ts`) checks all eight wirings and three ranges.

**Not yet checked by a person.** What a finger does (calibration, the pad and buttons, how firm a press has to be), and how the picture and colors look on each panel. Settings, Display is the knob if colors are wrong.

## Flash it from the browser

1. Open **/pocket/index.html** on the site (or on your dev server, http://localhost:5173/pocket/index.html) in desktop Chrome or Edge.
2. Under "Which board?", pick the 3.5 inch (ESP32-3248S035) or the 2.8 inch (ESP32-2432S028) board. Each has its own manifest (`manifest-35.json`, `manifest-28.json`) and images (`fw/esp32-3248s035/`, `fw/cyd-2432s028/`).
3. Plug the board in with a USB cable that carries data, click Install, pick the serial port, click Install again, wait a minute or two. This replaces everything on the board, including the settings, and uses a new partition table (1 MB for the program, 3 MB for LittleFS).

The install window can also offer "Connect to Wi-Fi" (Improv Wi-Fi over the same USB cable) when the firmware speaks Improv. This firmware does not yet, so that step does not appear.

## What to try (and what to report back)

The board shows a list of games, five to a page (arrows, search and Settings along the bottom). Tap a game to play it. A MENU chip in the top-left corner pauses (Resume, Restart game, Games, Settings).

1. **Colors and touch position.** Tap through the list. Does a tap land on the row you touched? Settings shows `raw x,y screen x,y size` under your finger. If it is mirrored or swapped, tell me which way (one line in `GT911::toScreen`, `src/gt911.h`).
2. **First Steps** (first in the list). Walk with your left thumb on the round pad, jump with the right one on the Space circle. Slide a held thumb from the left side of the pad to the right side: the hero should turn around without stopping on the way. Does the pad feel too big, too small, too touchy in the middle? (Settings: Pad size, Pad dead zone.)
3. **Two fingers.** On Keys and Doors, Beat the Clock or Momentum: hold right on the pad and tap Space with the other thumb. Run and jump.
4. **A ladder game.** First Steps level 2 (the pad's up and down arrows), Swim, Slippery and Bouncy (up and down are shown only on games that use them).
5. **A stylus.** Only a _capacitive_ stylus works. The GT911 is a capacitive touch chip, so a plain plastic stick or a pen cap registers as nothing (a stylus with a rubber or mesh tip, or a bare fingertip, does). With a stylus, turn on **Stylus (taps latch)** in Settings: a short tap on the right of the pad keeps the hero walking right after you lift, so you can tap Space with the same stylus; a tap in the middle of the pad (or on the other side) stops him. A drag still steers while held.
6. **Left-handed.** Settings, Hand: Left. The pad and buttons trade sides.
7. **Palm rejection.** Settings, Palm rejection: Size (drops contacts the chip reports as big), Size+near (also drops a contact that lands within 70 px of one already held). The thresholds are guesses. The status strip's last number is the contact size of the most recent touch; rest a palm, then a fingertip, and tell me both numbers.
8. **Health and Hearts, Watch Your Step, Switches** (damage and restarts) and **Countdown, Gusts** (timed blocks).
9. **Monsters.** The 17 Starters about foes and bosses are in the list now: Meet the Monsters, Throw It (hold the throw key and watch the shot fly), Many Weapons, Boss Hits, Boss Phases, Flock, Follower, Searchlight, Short Lived, Things That Grow, Who Wins, Popups, The Show (Scripted), Horizon, And Gate, Take the Wheel and Your First Game. Does a crowd of monsters slow the picture (the screen redraws whole when more than a few move)? Do solid monsters push the hero the way they do in the browser?
10. **Sound.** Settings, Sound: tap to step Off, Low, Medium, High; each step beeps a short rising blip. Then play First Steps: jump, pick things up, get hurt, beat a monster in Meet the Monsters. Tell me whether you hear anything, which volume is clear without a buzz, and whether the sound is a clean tone or crackles while the picture redraws. Pause (MENU) should silence a tune at once. The duty values for Low and Medium (10 and 40 of 255) are guesses.
11. **Between levels.** Play First Steps (two levels): walk to the door at the end of level 1. The picture should fade to black in about a second, then a card for level 2 (a picture for the climb) appears for three seconds, or until you tap, then fades out and the level fades in. Fall off the edge on purpose: the same fade out, the level's card again, the level fades in (that was a life). Lose every life: a lost card ("OOPS!"), then its text page, a tap, and the list. Finish the last level: a won card, its text page, a tap, the list. A text longer than 16 lines ends its page with MORE... and a tap turns it. Tell me how the fade looks (steps visible? too slow?) and whether a tap while a card shows moves on at once.
12. The status strip: `HP`, `Lives`, `Score`, money and the game's own counters (Keys carried); on the right `lv N fps tick-ms draw-ms size` while Status numbers is on. Does anything stutter? Tell me the fps while the view scrolls.

Report: which games feel wrong, any picture glitch, the pad numbers that felt right (size and dead zone), and the palm and fingertip sizes.

## The microSD card

The board's slot (TF_CS 5, TF_SPI_SCLK 18, TF_SPI_MISO 19, TF_SPI_MOSI 23, from rzeldent's `esp32-3248S035C.json`, re-read on 2026-11-05; `src/board.h`) holds more games than the 3 MB LittleFS can. Games on the card follow the Starters in the picker with a yellow **SD** tag. With no card, or a card with no `/pocket` folder, the board behaves exactly as without the slot (the serial line `microSD: no card` is the only sign).

**To try it**

1. Format a card FAT32 (cards over 32 GB come exFAT: use the Disk Utility "MS-DOS (FAT)" format with the MBR scheme, or `diskutil eraseDisk FAT32 POCKET MBR /dev/diskN`; 2 to 32 GB cards are the safe size).
2. Build the card's files: `cd web && npx vite-node scripts/pocketData.ts --out /Volumes/POCKET` (this writes `/Volumes/POCKET/pocket/`, 15 games, about 7 MB: every public game that is not a Starter and passes the packer: four Sandbox games (Sandcastle Knight, In The Year 2000! and the first two Teddy games) and eleven Bizarre games). It deletes only `pocket/` on the card.
3. Put the card in the slot (power off first) and power on. The list should show 121 games with SD on the last 15.
4. No card reader at hand: with a blank FAT32 card in the board and the board on its game list, `~/.platformio/penv/bin/python web/scripts/pocketSdWrite.py /dev/cu.usbserial-XXXX /tmp/pocketcard/pocket` (after `pocketData.ts --out /tmp/pocketcard`) writes the files through the USB cable, about 10 KB/s (about 20 minutes for the 15 games), then resets the board.

**One game, one file (from the site).** On the site, a game's Download button has **Pocket Player (microSD)**: it saves `NAME.GMP` (an 8.3 name from the game's id). To copy it to the card:

1. Put the card in your computer (FAT32, as in step 1 above).
2. Make a folder named `pocket` at the top of the card if there isn't one, and copy `NAME.GMP` into it. Nothing else to edit: the board lists every `.GMP` in `/pocket`.
3. Eject the card, put it in the board with the power off, power on. The game is on the list with the SD tag.

Or without a card reader: `pocketSdWrite.py PORT <folder with the .GMP>` as in step 4. From the command line, `npx vite-node scripts/pocketData.ts --gmp /Volumes/POCKET [--only id,id]` writes the same kind of file for the repository's games (it adds or replaces `.GMP` files and deletes nothing). The site's download plays PC speaker sounds only (no Sound Blaster clips or music) and says when a level may be too big for the board's memory.

A `.GMP` is a bundle in the `small.pak` format (`src/gmsmall.h`, written by `web/src/export/pocketFile.ts`): `game.txt` (`GMP 1`, then `id|title|levels`, then `version <v>` when known), `<id>.cfg`, `cards.pak` (the `.cfg`'s card offsets count from this entry) and the packed files. The firmware lists only format 1, skips a `.GMP` whose id is already listed, and reads the game's files, `.cfg` lines and cards straight from the bundle (`readGameFile`, `cfgOpen`, `readPak` in `main.cpp`). The Mac checks take a `.GMP` as the data folder: `pocketHostCheck.ts <id> --data /path/NAME.GMP` and `pocketCardsCheck.ts <id> --data /path/NAME.GMP` (with `font.bin` beside it).

On the card: every file is in `/pocket/`. A game's `<file>.cfg` and `<file>.pak` use an 8 character name (the hash of its id, so no long file names are needed); the game list is `/pocket/games.txt` (`id|title|levels|file`); the picture, map and block files are named by content and shared by the games. The firmware reads them with the same code as LittleFS (`readFileIn` and `selectGame` in `main.cpp`); `gmcore.h` and `gmcards.h` did not change (`gmcfg.h` loads the map and the biggest files first and reads the `cbln` line). The play loop's host check and the cards check (`pocketCardsCheck.ts --data <dir>`, and `pocketHostCheck.ts --data <dir>` with the card's files) pass on the packed card games (15 of 15 tick for tick).

**Memory (what the board check showed).** A mounted card holds about 33 KB of heap and splits the free blocks, and the heap's one long free stretch is only 110 KB (the rest of the 240 KB is in pieces under 26 KB), so a big level needs care. The firmware (1) mounts the card only while it reads (the Starters play with the heap they always had; with the card in, idle free heap is 241,696 B, largest block 110,580), (2) frees the buffers a new card level replaces, then reads that level's compressed files together with the heap emptiest, unmounts, and inflates from those, (3) loads the map first and the biggest buffers (blocks, monster pictures, hero blocks) before the small ones, and (4) on a card the packer cuts each level's hero blocks after the last one a frame shows (`cbln` lines in the `.cfg`). With that, all 15 card games load and show their cards. The tightest is a Sandbox game whose blocks, monster pictures and hero blocks add up to about 108 KB; a level over about 110 KB of those three could not load, so the packer's levels-and-links limit is not the only one.

The level table is not held in memory: a level's files, start, scroll limits and links are found by reading the game's `.cfg` line by line when the level is entered, so a game can have 128 levels and 24 links on a level (the card build packs seven more Sandbox games this way; logic, realm, sleuth and tuneup stay off until their host checks match the engine). Not yet on the card: Sound Blaster clips and music. The card is read at 20 MHz; a level loads in well under a second.

## Between levels

What PLAYGAME and the web engine (`web/packages/engine/src/engine/game.ts` `play`, `scene.ts` `playScene`, `showGraphic.ts`) show around play, for the Starters, in order:

1. Start (menu, Play): the first level's intro card (scene slot 9, a `.lst` of pictures such as `walk.gif 3`), then the level fades in. The title (`title.lst`: a `.fli` and `title.gif`), the menu and the story (`story.lst`) come before Play and are not part of a play; the board goes straight to the intro.
2. A level ends in a link: the screen fades to black (`FadeTo`, 65 steps at the VGA retrace, 65/70 s), the level's exit card (slot 10, none in the Starters but one), the next level's intro card, the next level fades in.
3. A death with a life left: fade out, the same level's intro card again, fade in, one life less. A death with none left: fade out, the lost cards (scene 1 slot 2: `lostpic.gif 5` then `lost.gif` with `lost.txt` over it, waiting for a key), the high scores, the menu.
4. The last link (game won): fade out, the last level's exit card, the won cards (scene 1 slot 0: `wonpic.gif 6`, then `won.gif` with `won.txt`, waiting for a key), the high scores, the menu.

A `.lst` is a slide list: `name seconds` per line, the seconds being how long to wait for a key (0: go on at once, none: wait for a key). Each picture is drawn on black, then the palette fades in; a `.txt` is written over the picture before it, 8 by 8 glyphs from column 5 and row 5, 16 lines a page with MORE... when more follows, in the palette color nearest RGB(50,10,50). A key or a click ends a wait; Esc leaves.

The board (`src/main.cpp`, `src/gmcards.h`) does all of it except: the title, menu, story and credits screens (not part of a play), the high scores (the board keeps none; the list comes next), and the Esc key (the MENU chip pauses). `.fli` animations play (Pictures and Cartoons has one, `bloom.fli`, as level 1's exit card): the frames sit one by one in `cards.pak`, so the board unpacks one frame at a time into a 64 KB canvas and draws it, each held for the file's own speed in 1/70 s; a touch ends it. It draws at 1.5 times like the game. The fade is by the clock like the engine's, not by a fixed 65 frames: the panel redraws about 10 to 15 times in the 0.93 s, so the steps are visible. A touch moves on wherever the engine waits for a key. When the packed game has no cards the screen just fades.

- Packing: `pocketData.ts` writes `card <where> g|t <file> <seconds> ...` lines into each `.cfg` (see `src/gmcards.h`): a picture is its 768 palette bytes then 64000 indices, deflated like the other files (3 KB for a typical Starter card, 326 distinct pictures in all, and the games share them); a text page is its text, already cut to the 31 character lines, with its two palette colors worked out then. `data/font.bin` is the 8 by 8 font (95 glyphs).
- Memory: a card takes one 64 KB block on the heap while it shows. The level's big buffers (blocks, hero files, monsters, sounds) are freed first and load again when the next level starts (the first level's intro shows before its files load), because a loaded game fragments the heap below 64 KB (a card that can't be allocated is still skipped). The serial self-test with `cards` frees them the same way.
- The play loop does not change: `gmcore.h` has a `hold` switch, set by the board, that stops `tick()` at a death or a link (the old level is still there to fade out) until `finish()` enters the next. Without it (the Mac host check, the serial self-test) the tick does both as before, so the tick-for-tick comparison is untouched.
- Frames: a `card <where> f <table> <seconds> <speed> <frames>` line; the table lists each frame's pak offset and length. The decoder (`fliApply` in `gmcards.h`) handles the FLI chunks COLOR, LC, BLACK, BRUN and COPY, which is all the Starters' animations use; the packer leaves out an animation with any other chunk or size.
- Check on the Mac: `cd web && npx vite-node scripts/pocketCardsCheck.ts` compares every card and text page of every packed game with what the engine draws on its own `Screen` (pixels, palette, wait seconds).

## Sound

The amplifier and its 2-pin speaker connector are on **GPIO 26**, the ESP32's DAC2: rzeldent's board definition for this board (`esp32-3248S035C.json` in https://github.com/rzeldent/platformio-espressif32-sunton) sets `SPEAK=26` and lists "Speaker: JST1.25 2p". The two community tables `board.h` cites don't list the speaker, so that is the one source; whether the amplifier is populated on your unit only a board can tell. The firmware does not use the DAC: a LEDC channel on pin 26 makes a square wave, as the PC speaker did.

- Each level packs its `.snd` tunes (30 effects of 36 frequencies, 2,160 bytes) as a `snd` line in the game's `.cfg`. Every Starter shares the same few sets, so they add about 2 KB in all. The `.voc` names that follow the tunes in the file are not packed.
- The core (`gmcore.h`) raises the same effects the web engine does (help, kill, money, life, score, other counters, the hurt and move sequences' own sounds) into a small queue and changes nothing else in the play. `main.cpp` plays the last one started in a tick; a new effect cuts the one playing.
- `pcspeaker.h` steps one frequency per 1/145.6 s (frequencies under 20 Hz are silent, as Borland's `sound()`); a small task on core 0 polls every millisecond so a slow picture frame doesn't stretch a tune.
- Settings, Sound: Off, Low, Medium, High (the duty of the square wave: 10, 40 or 128 of 255). It is saved with the other settings. The tune stops when you pause or leave a game.
- Not ported: Sound Blaster clips and music. A game whose effects are spoken clips plays the PC speaker version here, as the web player does with no Sound Blaster.

## The controls

Right-handed layout (left-handed mirrors it). 480 by 320 px is about 6.5 px per mm, so a 9 mm finger target is about 58 px.

```
 +--------------------------------------------------------------------+
 | [ MENU ]                                                  [ KEYS ] |  chips, 60 x 52 px; KEYS only if the game
 |   .--------- key tiles (when KEYS is open): 72 x 56 px ----------.  |  uses keys beyond arrows, Space, Enter
 |                                                                    |
 |                        the game (320x200 at 1.5x)                  |
 |                                                                    |
 |        ^                                              ( Enter )    |  Enter: 60 px circle, only if used
 |      .-----.                                                       |
 |    < | ( ) | >                                       ( Space )     |  Space: 68 px circle (labeled with the
 |      '-----'                                                       |   game's own name for it, e.g. Jump)
 |        v                                                           |
 |  pad: round, 128 to 180 px across; dead zone 36 to 72 px across    |
 | HP 3  Lives 2  Score 120  Keys carried 1            lv1 18fps ...  |  status strip, 20 px
 +--------------------------------------------------------------------+
```

- **Pad:** one round zone, not four buttons. The direction is where the finger is, so a finger can slide from left to right and the keys change over (the old one is released first, so both are never down). A dead zone in the middle (small 18 px, medium 26, large 36 radius) presses nothing. Left and right win within 27 degrees of level, up and down within 27 degrees of straight, and in between both keys are down (a diagonal). A direction already held stays held to about 35 degrees, and the dead zone is 20 % smaller to come back to than to leave, so a thumb doesn't flicker. A finger that began on the pad stays on the pad however far it slides. Only the arrows a game uses are drawn, and a game with no ladders sends left and right for any thumb position. **Diagonals:** when a game binds diagonal keys (from its `key` lines: the number pad's 7 9 1 3, else Q E, and Z C only when labeled "down"), each corner that has one gets a 30 degree wedge centered on the diagonal (30 to 60 degrees, kept to 25 to 65 once held) that sends that game's key alone instead of two arrows; those keys are no tiles. A corner with no diagonal key keeps the two-arrow behavior (`host/controlstest.cpp` checks it).
- **Action keys:** Space and Enter come from the game's `controls.json`; a game that doesn't use one doesn't get the circle. Other keys it lists (Ctrl, Alt, letters) go in the **KEYS** menu, a row of 72 by 56 px tiles under the chips (the Starters use none, so you won't see this until a bigger game does). The letters listed beside the arrows (A, D, W, S) are the arrows.
- **Two fingers:** the board reads five contacts with ids; the pad owns one finger, each button takes any other. Every key stays down at least 3 game ticks (165 ms) so a quick tap still registers.
- **Stylus and finger:** the same screen works for both; Stylus mode only adds the tap latch described above (tap under 300 ms and under 10 px moves = tap; anything else is a drag).
- **Palm rejection:** off by default (see item 7).
- **Settings** (saved in LittleFS): Hand, Stylus, Pad size (radius 64, 76, 90 px), Pad dead zone, Palm rejection, Status numbers, Sound (off, low, medium, high).

## Games, memory and size

106 games, all matching the engine tick for tick on the Mac (list in the host check output), the ones with monsters included. No Sandbox game is packed.

- Program: 450 KB of the 1 MB partition. Static RAM: 108 KB of 320 KB (the world now holds 200 monster slots and the monster layer of the map, about 30 KB more); a running game holds the 10 KB map, its blocks (up to 63 KB), the hero files (28 KB), and for a level with monsters the 10 KB monster layer, the monster records and their pictures (the largest level, Take the Wheel, is 114 KB in all).
- **small.pak** (`src/gmsmall.h`): the Starters' small files (each game's `.cfg`, the shared `.b .m .p .r .c .o .k .s` files) are one LittleFS file, because LittleFS gives each file a 4 KB block: the Starters' separate files overflowed the 752 blocks in the partition; with `small.pak` and `cards.pak` the 106 Starters take 586 blocks (2026-11-06), leaving 166 free (about 5.5 blocks per Starter) (the 1 MB program slot is half full, so the partition table is unchanged). It is `GMS1`, a count, entries sorted by name (name[32], offset, length), then the data; the firmware finds a name by binary search reading flash entry by entry (nothing in RAM) and streams a `.cfg` from it line by line. `cards.pak`, `font.bin` and `games.txt` stay separate files; the microSD card layout is unchanged. The Mac tests read the same `small.pak` with the same code (`host/stdiolines.h`).
- A level whose hero slots are blank (Choose Your Hero's third level) is written `-` for the hero files in the `.cfg`; the firmware keeps the last hero's files (`heroCbl`, `heroChr` in `gmcfg.h`), as the engine keeps the previous scene's hero.
- Game data: the 106 games take about 2.3 MB of the 3 MB LittleFS partition (1.6 MB of it the cards in one `cards.pak`, avoiding LittleFS's 4 KB block per separate file). Files are named by content, so the many games that share the hero files and palettes store them once; maps, blocks (cut after the last block the maps use) and hero files are deflated and unpacked with the ROM's miniz.

## Check the play loop on the Mac

`cd web && npx vite-node scripts/pocketHostCheck.ts [id ...]` replays each packed game's committed `walkthrough.json` on the engine's headless player, builds `host/hosttest.cpp` (needs `c++` and zlib), replays the same keys through `gmcore.h` on the same packed files, and compares position, sequence and frame, scroll, score, hit points, lives, counters and a hash of the 312 by 196 picture on every tick. One line per game; exit 1 if any differs.

It also compares the sound schedule: the engine's PC speaker effects (tick, effect number, hash of its 36 frequencies) must be the board code's queue, event for event, and the tone player is timed against the 1/145.6 s steps (a `Z` line from the host test). Nobody has heard the board; this proves what is asked to play, and when, not the pin.

`cd web && npx vite-node scripts/pocketControlsCheck.ts` runs the touch-event replay of the controls (32 scenarios: slides, two fingers, taps, stylus latch, palm rejection, left-handed layout, the key menu, minimum target sizes).

After rebuilding a game: `cd web && npx vite-node scripts/pocketData.ts` repacks `data/` (it also writes `games.txt`).

## Check the board itself (serial self-test)

The host check cannot see stack, heap or DRAM limits, so the firmware has a serial self-test. On the game list only, `T <index> <ticks>` or `T all <ticks>` (115200 baud, a line ending in newline) loads each game the way a tap does, runs it with no input and drawing every tick, then prints one line per game: `ST id=... ok=1 free=... largest=... min=... stack=...` (free heap, largest block, lowest free heap since boot, loop-task stack high-water mark in bytes), then `ST done n=...` and returns to the list. Normal play never reads the serial port.

With the board plugged in and on the list (not mid-game, and nobody using it):

`~/.platformio/penv/bin/python web/scripts/pocketBoardCheck.py /dev/cu.usbserial-XXXX --ticks 300`

Add `--cards` (serial: `T all 300 cards`) to also load and draw every card of each game with the game loaded, no waiting: a second table (`SC` lines) of cards shown, failed, milliseconds, free heap, largest block and the heap low-water mark, and the lowest of all.

It prints a table and exits 1 on a failed load, a stack high-water under 1024 bytes, or a board that stops answering (a crash shows as a missing `ST done`).

## Colors check (on the Mac)

`cd web && npx vite-node scripts/pocketColorCheck.ts out.png` repeats the firmware's color math on First Steps' files, models the panel reading the pushed bytes, and writes the engine's own render, the current firmware and the old one side by side. It exits 1 if a color is off by more than 565 rounding allows. pushImage sends each 16 bit value low byte first and the ST7796 reads it high byte first, so the buffer holds byte-swapped RGB565 (`panel565` in `src/main.cpp`).

## Rebuild

PlatformIO's core CLI lives in a venv (`~/.platformio/penv`). From the repository root:

```sh
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player                 # firmware
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player -t buildfs      # LittleFS image from data/
```

Then copy `bootloader.bin`, `partitions.bin`, `firmware.bin` and `littlefs.bin` from `hardware/pocket-player/.pio/build/<env>/` into `web/public/pocket/fw/<env>/` (build both envs; each needs its own `-e <env>` and `-t buildfs`). The offsets in the two manifests in `web/public/pocket/` match `partitions.csv`: bootloader 0x1000, partitions 0x8000, firmware 0x10000, LittleFS 0x110000 (3 MB).

The browser installer covers both boards (see "Flash it from the browser"); `pio` as above is the other way.

## What only a board can tell

Whether the touch orientation guess is right, whether the pad sizes and dead zones feel good under a thumb, what size numbers a fingertip and a palm give (so the palm threshold of 160 is a guess), how a capacitive stylus behaves on the glass, the frame rate while scrolling, whether the picker's rows are easy to hit, and whether the new `rom/miniz.h` decoder links and runs on the board (it compiles and links; the Mac test uses zlib for the same bytes).

## Pins (board.h)

Display SPI: SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, backlight 27. GT911 (I2C): SDA 33, SCL 32, INT 21, RST 25. XPT2046 shares the display bus: CS 33, IRQ 36. Speaker: GPIO 26 (`src/speaker.h`). Sources are in `src/board.h`, `src/speaker.h` and NOTICE.md.

## Filming the boards

`web/scripts/pocketShowcase.py` runs a 3 to 5 minute demo on boards A, B and C at once, each showing a different screen and a double-size banner of what is being tested (`S2 <text>` on Serial: 20 px bar, 21 characters on 320 px, 34 on 480 px; the slim `S` banner stays the default). Board A runs the firmware self-test game by game, B plays games with made-up fingers on the pad (`I x y`) and goes back to the list through MENU and "Back to list", C loads games from its card and checks their level cards. `L` on the game list prints `L <index> <id> <on card>` for every game (the script uses it).

```sh
~/.platformio/penv/bin/python web/scripts/pocketShowcase.py --countdown 5 --minutes 4
```

`--dry-run` prints the plan only. It stops if any board's lock folder is taken, never writes to a card and never touches the saved display setup. Ctrl-C ends it cleanly.

## Held-input trace

For a live check of the touch path over USB (serial 115200): `V 1` prints every new GT911 report (`R ms n= id= x= y= size=`) and, each game tick, the keys the game holds (`K ms tick= up= down= left= right= space= pad= n=`); `V 0` stops it. `G <index>` starts a game from the list; `I x y` holds a made-up finger at that screen point (no chip involved, so it shows what the controls and the loop do with a steady touch) and `I off` lifts it. `web/scripts/pocketHeldTrace.py <port> <index|-> [x y] [seconds]` runs it and summarizes ticks with Up down, tick gaps, report gaps and zero-point reports; with `-` and no x y it just listens while someone holds the screen.

Firmware and board id (`src/fwid.h`, `fwid.py`): every build carries its short git hash (a `+` when the tree had uncommitted changes), date and PlatformIO env, baked in at build time. Serial prints `FW board=C git=1a2b3c4 date=2026-11-05 env=cyd-2432s028` at boot and for the command `FW`. The board's name (1 to 4 letters or digits; the same letters as `pocketStatus.py`: A, B, C) is kept in NVS (`bid`) and set with `ID set C`; until then it is the last 4 hex digits of the chip id. A small gray "Board C fw 1a2b3c4 2026-11-05" is drawn in the top left corner of every setup step and in the title bar of Settings and the game list (a short "C fw 1a2b3c4" when the title is long; left out on the 3.5 inch list, whose title fills the bar). It is separate from the temporary banner badge (`ID <x>`).

Test banner: `S <text>` on Serial (any screen, game included) shows a slim yellow bar with a small robot and up to 40 characters at the top edge, between the MENU and KEYS chips (`src/banner.h`; drawn into the game's bands with the controls, so it does not flicker); `S off` clears it. `ID <x>` (1 to 3 characters) adds a bold board badge at the left of the bar, and shows the bar with the robot alone when no text is set; `ID off` removes it (RAM only: gone after a reset). It also clears when a real finger touches the screen (a made-up `I` finger does not) and after 2 minutes with no serial traffic. `web/scripts/pocketStatus.py <port> "<text>"|off` sends it; the other `pocket*.py` scripts that open the port do it themselves, with the board's letter from the table in `pocketStatus.py`: **A** = /dev/cu.usbserial-1140 (3.5" 480x320, GT911 touch), **B** = usbserial-1130 and **C** = usbserial-120 (2.8" 320x240, ESP32-2432S028). A flash can't show one (the chip is in its bootloader): show "Flashing new firmware" first.

The touch model (`controls.h`) lets a finger the chip stops reporting keep pressing for 60 ms, and a new contact within 70 px of it takes its place, so a dropped frame or a re-numbered thumb does not release a held direction.
