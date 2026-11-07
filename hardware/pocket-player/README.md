# Pocket Player

Firmware for two boards: the ESP32-3248S035 (3.5 inch, 480 by 320, ST7796, GT911 capacitive touch) and the smaller ESP32-2432S028 (2.8 inch, 320 by 240, resistive touch; see "The 2.8 inch board" below). The rest of this README describes the first board unless it says otherwise. It plays **all 106 Starters (the 99 lessons and the 7 Graduations)** from the games' real DOS files, packed small into LittleFS (`web/scripts/pocketData.ts`), with a category library, touch controls for fingers and a stylus, a settings screen and a status strip. It plays each game's **PC speaker sounds** (no Sound Blaster clips or music yet).

The flashed firmware binaries' third-party notices are in [`web/public/pocket/fw/NOTICES.txt`](../../web/public/pocket/fw/NOTICES.txt). Keep that file with the firmware image set when redistributing it.

The play rules are `src/gmcore.h`, a port of the web engine's character, touch, scroll, block-effect and scene code (itself from `code/GM/PLAYGAME.C`) with no board code in it, so the same file runs in the Mac test. Monsters (`src/gmmon.h`, a port of the web engine's `monsters.ts`) are in. **Sound** is queued by the core as events and played by `src/speaker.h` (see Sound below). Not ported: Sound Blaster .VOC clips, FM music, the joystick. The Sandbox games with more than 12 levels or 16 links are left out; the others go on a microSD card (see below) (`npx vite-node scripts/pocketData.ts --list --series any` says why for each).

Card drawing (`src/carddraw.h`) clears the full panel to palette 0 between scenes and when a text page uses a different picture, keeps the status-strip margin at palette 0 for pictures and fades, and bounds the final band to the remaining image rows. `host/carddrawtest.cpp`, run at both board sizes by `pocketControlsCheck.ts`, checks a text page after a level, palette byte order and margins. Consecutive text pages on the same packed scene picture (including its palette) restore only the previous text rectangle and draw the new text region; host checks compare these framebuffers byte for byte with full redraws, including MORE and empty pages.

Files: `src/gmcore.h` (play loop), `src/gmcards.h` (the pictures and text pages between levels, no board code), `src/gmmon.h` (monsters), `src/gmcfg.h` (a game's `.cfg` and the level file loader), `src/library.h` (bounded optional metadata and compact catalog/cache records), `src/picker_draw.h` (six-slot geometry and rendering), `src/favorites.h` (Recently played and Favorites lists and their NVS form), `src/controls.h` (touch controls model), `src/pcspeaker.h` (the PC speaker tune player, no board code), `src/speaker.h` (GPIO 26 and the task that drives it), `src/gt911.h` (touch chip, up to 5 fingers with ids and sizes), `src/gt911report.h` (I²C reports, host-tested for interrupted reads), `src/picker.h` (bounded titles and search), `src/picker_draw.h` (rows, icons and keyboard shared with host renders), `src/screen.h` (play viewport), `src/main.cpp` (files, panel, screens, drawing), `src/btnicon.h` (which picture a key's button shows: the shot or item it throws or uses), `host/hosttest.cpp`, `host/controlstest.cpp`, `host/cardstest.cpp` (Mac tests) and `host/iconsdump.cpp` (lists the picture each button gets; `web/scripts/pocketIconsShot.py` draws them). The controls are drawn into each band of the picture before it is pushed once (`drawControls` in `main.cpp`), so they never blink; a button shows its key's name big and under it the picture or the game's label, wrapped to two lines, shrunk, then cut with "...".

## Display and input updates (November 6, 2026)

The Phase 1 row picker has been replaced by the [library browser](#library-browser-library-metadata-version-1).
The display and input changes below remain.

Typing in Search redraws only the edited suffix and caret, leaving the keyboard and title in place. Results appear after Done. Host frame-buffer checks compare edits, deletion, Clear and a full 24-character query with fresh renders at both screen sizes, and reject any write outside the text field. The 3.5 inch board's Settings also says that touch needs no calibration.

Settings has four tabs (see **Settings** under Touch controls below); its Display tab offers **Smaller picture** on both boards. The 3.5 inch board's ST7796 geometry and GT911 coordinate mapping are fixed, so it has no resistive calibration or panel-driver guessing step. The 2.8 inch board keeps Calibrate (Controls tab) and offers Panel setup (Display tab). Smaller picture uses at most three quarters of the usual width at the top right (top left with left-handed controls), preserving the aspect ratio and shrinking further when needed to clear the entire pad plus its 14 px touch slop. Controls keep their usual positions and sizes. It saves immediately in NVS as `pocket/smaller`, survives a firmware-only reflash, and affects play only; cards stay full size.

Display setup now has three steps: Mirror, Landscape, Colors, then touch calibration. The separate UP step was removed: a half-turn cannot turn a sideways arrow upright. Landscape cycles six choices: both software quarter turns and the wide-panel mode, then the same three with both mirror bits toggled for the opposite mounting direction. Saved setups, including the old calibration-resume stage, still read.

A short GT911 I²C read now keeps the last complete contact report and retries without acknowledging the incomplete packet. Holding a direction remains one key-down until release, using DOS sequence repeat rather than simulated repeated taps. The controls host check includes ten-second Up and both upward-diagonal holds. `V 1` also prints `seq`, `frame`, `sugar`, `gx`, `gy`: in A Fly Named Carl, fresh air spends sugar and empty sugar makes Carl sink, so capture those fields together with `up` when checking the couch report. Actual thumb behavior and the reported couch failure still need a board check.

## The 2.8 inch board (ESP32-2432S028, "Cheap Yellow Display")

Two of these were identified on 2026-11-05 (printed "ESP32 2432S028" on the back): both an ESP32-D0WD-V3 (revision 3.1, dual core, 240 MHz), 4 MB flash (manufacturer 5E, device 4016), **no PSRAM**, an XPT2046 resistive touch chip on its own pins (an idle read shows pressure near 0 and the interrupt line high), no I2C touch chip (a scan finds nothing), the display on the HSPI pins and the microSD slot on VSPI. One of them (`/dev/cu.usbserial-120` at the time) had a 64 GB card in it. The display driver is the one thing a read could not settle: the panel's ID registers do not read back cleanly over the board's MISO line, so the firmware has an ILI9341 driver (the usual one), the same with inverted colors, and an ST7789 driver (the "2 USB" revision), and the **display setup** screen (below) steps through them (it restarts). If the picture is garbled or the colors are inverted, hold the BOOT button for 2 seconds on the game list: it does the same step with no touch needed.

Build and flash it (env `cyd-2432s028`; the first board's is `esp32-3248s035`, and each build writes its own folder under `.pio/build/`):

```sh
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player -e cyd-2432s028 -t upload --upload-port /dev/cu.usbserial-XXXX
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player -e cyd-2432s028 -t uploadfs --upload-port /dev/cu.usbserial-XXXX   # the Starters, once
```

Everything but the layout is the same program (`-DPOCKET_CYD28` in `platformio.ini` picks the board in `src/board.h`, `src/screen.h`, `src/controls.h` and `src/main.cpp`). The game is drawn at 1x (320 by 200) with a 40 px status strip below it; the controls are drawn over the game at about two thirds of the big board's size, and the list shows four games a page. The first board's play layout is unchanged (`scr::SMALL` is false there). The card, the speaker (GPIO 26) and the RGB LED (a status light; see Pressed buttons below) are as on the first board; the card uses the same pins.

**Touch.** `src/xpt2046.h` reads the chip by bit-banging its pins (CLK 25, MOSI 32, MISO 39, CS 33, IRQ 36), so it shares no bus with the display or the card. A touch needs the interrupt line low and a pressure of at least 350 on two reads in a row; it ends after two reads without. `controls.h`'s 60 ms grace (held input) and the 3-tick minimum press sit on top of that, as on the first board. The status strip's last number is the pressure divided by 40.

**Display setup (the first thing the 2.8 inch board does).** These boards come with their picture mirrored, turned or in the wrong colors, so nothing on the first screens needs reading or touching in a particular place. Every step has two controls, drawn on the screen as they work: the boxed icon is the **BOOT button** (the step's action) and **OK** is a **tap anywhere** on the glass. White on black, big. Three steps:

1. **Mirror.** The word MIRROR? and a big R. BOOT mirrors the picture left to right; when they read right, tap.
2. **Orient.** A wide LANDSCAPE frame on the edge of the 320 by 240 picture. BOOT tries six mounting choices in turn (a software quarter turn, the other quarter turn, then the glass run 320 by 240 as it is, for a glass wired the other way round, which clears its whole memory when the shape changes), then repeats those three half a turn around; when the frame fills the screen and the word reads right, tap.
3. **Colors.** RED, GREEN and BLUE written in those colors on black, a white patch and a black one. BOOT steps the four color modes (plain, inverted, red and blue swapped, both) with no restart; when the words have their own colors, tap.

Then the touch calibration (below): three crosses, one at a time, which settle any touch wiring.

If the picture is garbage or blank (the wrong display driver), **hold BOOT for about two seconds**: the board switches to the other driver and restarts into step 1.

**Third way (soft 3).** A photo of board C on the software turn showed the picture 240 columns wide and clipped with stale pixels in the 80 columns the program never cleared, so that glass appears to be 320 by 240 at turn 0 (the row/column exchange then gives it the portrait shape). Landscape therefore also offers the panel configured 320 by 240 with no software turn (`soft=3` in the record; the same even rotations for the mirror bits). The board and firmware label in the corner is the short form ("C fw 4d8759e") in white at twice the font size.

**Why Landscape turns the picture in software.** Board C (the second 2.8 inch board) drew the 320 by 240 picture as if the panel were portrait: mirrored, clipped at 240 columns and with the bottom of the glass empty, while the program had asked for a landscape turn. The appears-to-be cause: this glass ignores the display chip's row/column exchange (the MV bit of MADCTL, which LovyanGFX sets for every landscape turn), so the hardware can mirror and flip but not turn a quarter. That is inferred from the photos, not read from the chip (the panel's ID registers do not read back). So the setup runs the panel in a portrait turn (the four mirror variants, rotations 0, 6, 4 and 2, which never use the exchange) and turns the picture a quarter in software (`src/softgfx.h`): shapes and text map through a rotation, the status text is drawn glyph by glyph from `src/softfont.h`, and each band of the game picture is transposed before it is pushed. It works on any glass; the 3.5 inch board and a setup saved by the older flow (record without `soft`) keep the hardware landscape turns untouched.

Saving is per chip: the board's chip id (its ESP32 efuse MAC, in `S st`) keys the setup: driver and colors (`panel`), the mirror bits (`turn`), the quarter turn (`soft`: 0 an old hardware landscape setup, 1 or 2 the two software quarter turns) and the touch calibration. It goes to the chip's own flash (NVS) and, when a microSD card is in, to `/pocket/boards/<chip id>.cfg` (the only file this feature writes). The card's file is read only by a chip whose flash never held a setup, so a card moved between boards carries every board's setup and an erased board finds its own, while a setup in progress is never replaced by an older file. To open the setup later: press BOOT briefly on the game list, tap the top-left of the list's title bar, or Settings, Display, Panel setup. To go back to the first start: `S forget nvs` over serial and restart.

**A faint picture on one 2.8 inch board.** Every 2.8 inch board runs the same image and drives its backlight the same way (GPIO 21, LEDC at 44.1 kHz, duty 255 of 255 at Brightness 100%; 15% only after the idle dim), so when one looks fainter than another at 100%, the cause is that board's saved display mode or its hardware. To tell which:

1. Compare the modes. Over serial (115200) the boot line reads `display mode ILI inv turn 2 soft 1` (or `S st` prints `panel=N`: bit 1 ST7789, 2 inverted, 4 red/blue swapped); a card holds the same in `/pocket/boards/<chip id>.cfg`. If the two boards differ in the driver (`ILI` against `ST`), the fainter one may be running the other glass's start-up settings (gamma and panel voltages differ between the ILI9341 and the ST7789): open Panel setup, hold BOOT 2 seconds to switch the driver, redo the three steps and compare again. A board that needed the third Orient choice (the glass run 320 by 240) is the likelier ST7789 ("2 USB") revision.
2. Check the backlight follows. Settings, Display, Brightness 25% then 100%: if the faint board barely changes, its backlight is not on GPIO 21's PWM (a different revision), which firmware can't raise.
3. Same driver and a backlight that follows: the glass or its backlight LEDs differ, a panel difference no setting can make up.

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

The board shows categories and six game thumbnails per page. Select a game, then tap it again to play; the header has Search and Settings. A MENU chip in the top-left corner pauses: Resume, Restart level, Restart game, How to play, Settings and Quit to library, in two columns under the game's title and level. **Restart level** enters the level again as it was entered (score, hit points, lives, counters, what the hero carries, the monster seed; `gmcore.h` `EntryState`), with its intro cards, and costs no life. **How to play** lists the keys the game uses with its own labels (`controls.json`, packed as the `.cfg`'s `key` lines); a letter that stands for an arrow (A for Left) is left out when the arrow is listed. Any tap goes back to the menu.

**Pressed buttons, clicks, LED, brightness and idle (`src/pressrect.h`, `src/idle.h`, `src/statusled.h`; `host/idletest.cpp`).** Every button in the library, Settings (Back, tabs, chips), Details and the pause menu shows a pressed look on touch-down (a yellow frame; the pause buttons turn yellow) and acts when the finger lifts on it; sliding more than 8 px off cancels, a very short tap still shows the look for 80 ms, and a finger already down when a screen opens presses nothing. Settings has **Brightness** (25, 50, 75, 100 %, NVS `pocket/bright`, through the backlight PWM), **Button clicks** (off by default; a two-step tick through the speaker queue at the current volume, only in menus, NVS `pocket/clicks`) and, on the 2.8 inch board, **Status LED** (NVS `pocket/led`: dim green on LEDC channel 6 while a game loads or the card is read, three red blinks after a load or card error, otherwise off). **Idle:** in the library or paused the backlight dims to 15 % after 60 s with no touch and goes off after 3 minutes; in a game, 3 minutes with no touch pauses it first (a held finger counts), then the same timers run. Any touch, any serial byte or BOOT is activity. The touch that wakes the screen is swallowed until the finger lifts, so it presses nothing. With the screen off the loop polls touch at about 20 Hz. Building with `-DPOCKET_LIGHT_SLEEP` instead puts the CPU into 250 ms light-sleep naps while the screen is off (woken early by the touch interrupt or a serial byte) and sends the panel's sleep command; it compiles but is not proved on either board.

**Continue.** Each level entry writes the game's uid and its `EntryState` to NVS (`pocket/resume`, 240 bytes, during the fade, never mid-tick); a win or a game over clears it, and starting another game replaces it. While there is one, the home page's first tile is **Continue**: the game's title picture and "Level n"; a tap starts that level as Restart level would. A card game with the card out shows "Put the card back to continue" instead. A point the game no longer loads is dropped. PLAYGAME had no restart: its function keys were F1 help, F2 status, F3 music, F4 sound, F5 save, F6 load, F8 and F9 joystick, F10 about, and Esc quits (`code/GM/PLAYGAME.C`, `DoFunKy` and the function-key switch before its call), so both are board conveniences; DOS saves are untouched.

**Recently played and Favorites (`src/favorites.h`; `host/favoritestest.cpp`).** The home page's first page is Continue, **Recently played** (shown once a game on the board has been played), **Favorites** (once a game is starred; with its games on a card that is out, it says so), then the categories that hold a game: Starters, Sandbox, Bizarre, then My games, Imported, CD and Good on touch. A category with no game (Sandbox and Bizarre with no card in, say) is left off, and so is an empty stage, CD shelf or Imported collection inside one; a card's games add theirs as the scan finds them. Both are virtual categories over the installed games, newest first. Star or unstar a game with the middle button of Details (Back, Favorite, Play) or the star at the right of the pause menu's title line; starred games carry a small yellow star on their tiles. NVS holds the lists, written only when a game launches and on a star tap, never in play: `pocket/recent`, the last 8 games played (140 bytes), and `pocket/pins`, up to 32 favorites (at most 524 bytes). Each is `"RCT1"` or `"PIN1"`, a count byte, three zero bytes, that many 16-byte game uids (newest first) and a CRC-32 of what precedes it; a malformed record reads as an empty list. A game that is not installed (a card game with the card out) stays in its list and is only left out of the page until it is back, so it still counts toward the 32: a full list says "Favorites are full (32): unstar one first", and a refused NVS write says "Changes not saved". The lists live in the catalog while the library is open (about 640 bytes) and are freed with it for play; a pause reads and writes NVS through a short-lived buffer. They are the library journal's seed: the journal (ratings, play counts, Most played, export) should import these two records once and then own them, so the two never disagree.

1. **Colors and touch position.** Tap through the list. Does a tap land on the tile you touched? Settings, Card shows `raw x,y > screen x,y size` for your finger on its bottom line. If it is mirrored or swapped, tell me which way (one line in `GT911::toScreen`, `src/gt911.h`).
2. **First Steps** (first in the list). Walk with your left thumb on the round pad, jump with the right one on the Space circle. Slide a held thumb from the left side of the pad to the right side: the hero should turn around without stopping on the way. Does the pad feel too big, too small, too touchy in the middle? (Settings, Controls: Pad size, Dead zone, Pad position, Jump button; the preview there lights what your thumb presses.)
3. **Two fingers.** On Keys and Doors, Beat the Clock or Momentum: hold right on the pad and tap Space with the other thumb. Run and jump.
4. **A ladder game.** First Steps level 2 (the pad's up and down arrows), Swim, Slippery and Bouncy (up and down are shown only on games that use them).
5. **A stylus.** Only a _capacitive_ stylus works. The GT911 is a capacitive touch chip, so a plain plastic stick or a pen cap registers as nothing (a stylus with a rubber or mesh tip, or a bare fingertip, does). With a stylus, turn on **Stylus latch** in Settings, Controls: a short tap on the right of the pad keeps the hero walking right after you lift, so you can tap Space with the same stylus; a tap in the middle of the pad (or on the other side) stops him. A drag still steers while held.
6. **Left-handed.** Settings, Hand: Left. The pad and buttons trade sides.
7. **Palm rejection.** Settings, Controls, Palm reject: Size (drops contacts the chip reports as big), Near (also drops a contact that lands within 70 px of one already held). The thresholds are guesses. The status strip's last number is the contact size of the most recent touch; rest a palm, then a fingertip, and tell me both numbers.
8. **Health and Hearts, Watch Your Step, Switches** (damage and restarts) and **Countdown, Gusts** (timed blocks).
9. **Monsters.** The 17 Starters about foes and bosses are in the list now: Meet the Monsters, Throw It (hold the throw key and watch the shot fly), Many Weapons, Boss Hits, Boss Phases, Flock, Follower, Searchlight, Short Lived, Things That Grow, Who Wins, Popups, The Show (Scripted), Horizon, And Gate, Take the Wheel and Your First Game. Does a crowd of monsters slow the picture (the screen redraws whole when more than a few move)? Do solid monsters push the hero the way they do in the browser?
10. **Sound.** Sound starts Off on a board with no saved settings (most 2.8 inch boards have no speaker, and Off skips the tune work); a board that saved a volume keeps it. Settings, Sound: tap Off, Low, Medium or High; each choice beeps a short rising blip. Then play First Steps: jump, pick things up, get hurt, beat a monster in Meet the Monsters. Tell me whether you hear anything, which volume is clear without a buzz, and whether the sound is a clean tone or crackles while the picture redraws. Pause (MENU) should silence a tune at once. The duty values for Low and Medium (10 and 40 of 255) are guesses.
11. **Between levels.** Play First Steps (two levels): walk to the door at the end of level 1. The picture should fade to black in about a second, then a card for level 2 (a picture for the climb) appears for three seconds, or until you tap, then fades out and the level fades in. Fall off the edge on purpose: the same fade out, the level's card again, the level fades in (that was a life). Lose every life: a lost card ("OOPS!"), then its text page, a tap, and the list. Finish the last level: a won card, its text page, a tap, the list. A text longer than 16 lines ends its page with MORE... and a tap turns it. Tell me how the fade looks (steps visible? too slow?) and whether a tap while a card shows moves on at once.
12. The status strip: `HP`, `Lives`, `Score`, money and the game's own counters (Keys carried); on the right `lv N fps tick-ms draw-ms size` while Status numbers is on. Does anything stutter? Tell me the fps while the view scrolls.

Report: which games feel wrong, any picture glitch, the pad numbers that felt right (size and dead zone), and the palm and fingertip sizes.

## The microSD card

The board's slot (TF_CS 5, TF_SPI_SCLK 18, TF_SPI_MISO 19, TF_SPI_MOSI 23, from rzeldent's `esp32-3248S035C.json`, re-read on 2026-11-05; `src/board.h`) holds more games than the 3 MB LittleFS can. Games on the card follow the Starters in the picker with a yellow **SD** tag. With no card, or a card with no `/pocket` folder, the board behaves exactly as without the slot (the serial line `microSD: no card` is the only sign).

**To try it**

1. Format a card FAT32 (cards over 32 GB come exFAT: use the Disk Utility "MS-DOS (FAT)" format with the MBR scheme, or `diskutil eraseDisk FAT32 POCKET MBR /dev/diskN`; 2 to 32 GB cards are the safe size).
2. Load the library onto the card: `cd web && npx vite-node scripts/pocketData.ts --gmp /Volumes/POCKET` writes every public game that is not a Starter and passes the packer, one `.GMP` file each, into `/Volumes/POCKET/pocket/` (22 games, about 12 MB on 2026-11-07: ten Sandbox games (Virus Blaster, KEEP IT BRIEF!, Depth Perception, Maximus, Sandcastle Knight, Snowbound, In The Year 2000! and the three Teddy games) and twelve Bizarre games; four more Sandbox games wait on their host checks (`CARD_HOLD` in `pocketData.ts`)). It adds or replaces those files and deletes nothing, so `.GMP` downloads and the boards' saved display setups (`pocket/boards/`) stay. The older loose layout, `--out /Volumes/POCKET` (the same 22 games as about 1,400 shared files, about 16 MB), replaces its own files and also keeps `boards/` and `.GMP` files. Use one layout per card: a game in both is listed once.
3. Put the card in the slot (power off first) and power on. The home page gains Sandbox and Bizarre (categories with no game are left off), and the list shows 128 games with SD on the 22.
4. No card reader at hand: with a blank FAT32 card in the board and the board on its game list, `~/.platformio/penv/bin/python web/scripts/pocketSdWrite.py /dev/cu.usbserial-XXXX /tmp/pocketcard/pocket` (after `pocketData.ts --gmp /tmp/pocketcard`) writes the files through the USB cable, about 10 KB/s (about 20 minutes a 12 MB library, so a card reader is much quicker), then resets the board.

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
- **Boards B/C (resistive touch):** only one point is available. A held pad contact rechecks its position every poll; sliding onto Space keeps the last direction and presses Space, and sliding back steers again. Space has 6 px of exit hysteresis in addition to the pad’s sector hysteresis. A contact starting on Space can slide onto the pad too. In games whose Space action is labeled Jump or Hop, the upper-left and upper-right pad wedges send Left + Jump or Right + Jump. Slide back to the horizontal arrow to keep walking and release Jump without lifting (after the minimum press). Curved arrows arc up and over to the left and right to mark these jump wedges, in white when idle and yellow with a black outline when held. The separate Jump button stays in its usual place. Games with their own diagonal keys keep those bindings; Carl still flies diagonally with its own keys.
- **Sticky direction:** Settings, Controls, Sticky direction (off by default) is saved in NVS (`pocket/sticky`) and survives a firmware-only reflash. Tap Left or Right to keep walking after lifting; tap the same direction again or the pad center to stop, or the opposite direction to switch. Jump can then be tapped separately. Holding or dragging still works normally. Leaving or restarting play clears the held direction. Available on both board sizes, independently of Stylus mode.
- **Two fingers (board A, GT911):** the board reads five contacts with ids; the pad owns one finger, each button takes any other. Every key stays down at least 3 game ticks (165 ms) so a quick tap still registers.
- **Stylus and finger:** the same screen works for both; Stylus mode only adds the tap latch described above (tap under 300 ms and under 10 px moves = tap; anything else is a drag).
- **Palm rejection:** off by default (see item 7).
- **Settings (`src/settingsdraw.h`; `host/settingstest.cpp`).** A bar with Back and four tabs: **Controls** (Hand, Pad size (radius 64, 76, 90 px), Dead zone, Pad position, Jump button, then on More: Stylus latch, Sticky direction, Palm reject and, on the 2.8 inch board, Calibrate), **Display** (Brightness, Smaller picture, Status numbers; on the 2.8 inch board also Status LED and Panel setup), **Sound** (Sound, Button clicks) and **Card** (games built in and on the card, the card's free space, built-in free space, Rescan card, and a touch readout on the bottom line). Every value is a row of chips with the chosen one yellow, so nothing changes blind. Controls shows a **live preview**: the game view at half size (two fifths on the 3.5 inch board) with the pad, Jump (Space), Enter and MENU where a game puts them; it redraws as Hand, Pad size, Dead zone, Pad position or Jump button changes, and a finger on it goes through the real controls model, so the arrows, jump arcs and buttons it presses light up and the line under it names them (otherwise that line explains the row changed last). **Pad position: Raised** lifts the pad 30 px (20 on the 2.8 inch board) for a thumb that rests higher. **Jump button: Near pad** puts Space up and out from the pad at about 35 degrees, past both touch slops, so one thumb can rock between them (on the 2.8 inch board a held thumb can slide onto it and keep its direction); it shrinks the Smaller picture further, so it is offered, not the default. The Card tab measures the card's free space when opened from the game list (FatFs normally reads the card's stored free count; a card without one may take a few seconds), never under a paused game, and Rescan waits for the game list. Changes are saved once, on Back (and before Calibrate, Panel setup or Rescan): `/settings.txt` in LittleFS keeps the old lines (`lefty`, `stylus`, `pad`, `dead`, `palm`, `debug`, `sound`) and adds `raised` and `jumpnear` after them, names that share no prefix with the old ones, which older firmware read by their first letters: it skips them, and its own save drops them (Low, Corner). Brightness, clicks, LED, Smaller picture and Sticky direction stay in NVS.

## Games, memory and size

106 games, all matching the engine tick for tick on the Mac (list in the host check output), the ones with monsters included. No Sandbox game is packed.

- Program: 450 KB of the 1 MB partition. Static RAM: 108 KB of 320 KB (the world now holds 200 monster slots and the monster layer of the map, about 30 KB more); a running game holds the 10 KB map, its blocks (up to 63 KB), the hero files (28 KB), and for a level with monsters the 10 KB monster layer, the monster records and their pictures (the largest level, Take the Wheel, is 114 KB in all).
- **small.pak** (`src/gmsmall.h`): the Starters' small files (each game's `.cfg`, the shared `.b .m .p .r .c .o .k .s` files) are one LittleFS file, because LittleFS gives each file a 4 KB block: the Starters' separate files overflowed the 752 blocks in the partition; with `small.pak` and `cards.pak` the 106 Starters take 586 blocks (2026-11-06), leaving 166 free (about 5.5 blocks per Starter) (the 1 MB program slot is half full, so the partition table is unchanged). It is `GMS1`, a count, entries sorted by name (name[32], offset, length), then the data; the firmware finds a name by binary search reading flash entry by entry (nothing in RAM) and streams a `.cfg` from it line by line. `cards.pak`, `font.bin` and `games.txt` stay separate files; the microSD card layout is unchanged. The Mac tests read the same `small.pak` with the same code (`host/stdiolines.h`).
- A level whose hero slots are blank (Choose Your Hero's third level) is written `-` for the hero files in the `.cfg`; the firmware keeps the last hero's files (`heroCbl`, `heroChr` in `gmcfg.h`), as the engine keeps the previous scene's hero.
- Game data: the 106 games take about 2.3 MB of the 3 MB LittleFS partition (1.6 MB of it the cards in one `cards.pak`, avoiding LittleFS's 4 KB block per separate file). Files are named by content, so the many games that share the hero files and palettes store them once; maps, blocks (cut after the last block the maps use) and hero files are deflated and unpacked with the ROM's miniz.

## Check the play loop on the Mac

`cd web && npx vite-node scripts/pocketHostCheck.ts [id ...]` replays each packed game's committed `walkthrough.json` on the engine's headless player, builds `host/hosttest.cpp` (needs `c++` and zlib), replays the same keys through `gmcore.h` on the same packed files, and compares position, sequence and frame, scroll, score, hit points, lives, counters and a hash of the 312 by 196 picture on every tick. One line per game; exit 1 if any differs.

With `--resume` it also checks Continue and Restart level on the same keys (`hosttest ... resume`): at every level change the entry state goes through bytes, as NVS keeps it, into a fresh world, which plays the rest of the walkthrough and must match the continuous run tick for tick to the win; and 60 ticks into each level Restart level must give back the entry's state and again match to the end. To include a card game, write it with `pocketData.ts --out <dir> --only <id>`, copy its `<file>.cfg` to `<id>.cfg` there and pass `--data <dir>/pocket`.

It also compares the sound schedule: the engine's PC speaker effects (tick, effect number, hash of its 36 frequencies) must be the board code's queue, event for event, and the tone player is timed against the 1/145.6 s steps (a `Z` line from the host test). Nobody has heard the board; this proves what is asked to play, and when, not the pin.

`cd web && npx vite-node scripts/pocketControlsCheck.ts` runs the touch-event replay of the controls (scenarios for both board sizes: slides, two fingers, taps, stylus latch, palm rejection, left-handed layout, the key menu, minimum target sizes).

The same command also renders real play frames (`host/playshots.cpp`): three Starters' levels through `gmcore.h`, with the overlay code the board runs (`src/overlaydraw.h`, moved out of `main.cpp`) on top, at 480 by 320 and 320 by 240: both hands, the three pad sizes, Smaller picture on and off, the pause menu and How to play. It compares a hash of the pictures with the one in the script and writes PNGs to `GM_PLAYSHOTS_OUT` (default a temp folder). After a deliberate change to the overlay, look at the PNGs and paste the new hashes. Text uses the 6 by 8 bitmap font, so words differ a little from the board's.

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

Whether the touch orientation guess is right, whether the pad sizes and dead zones feel good under a thumb, what size numbers a fingertip and a palm give (so the palm threshold of 160 is a guess), how a capacitive stylus behaves on the glass, the frame rate while scrolling, whether the picker's tiles are easy to hit, and whether the new `rom/miniz.h` decoder links and runs on the board (it compiles and links; the Mac test uses zlib for the same bytes).

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

For builds without git access, set `POCKET_FW_ID` to an explicit build label (for example, `POCKET_FW_ID=jump-arcs`); `fwid.py` then skips all git commands.

Firmware and board id (`src/fwid.h`, `fwid.py`): every build carries its short git hash (a `+` when the tree had uncommitted changes), date and PlatformIO env, baked in at build time. Serial prints `FW board=C git=1a2b3c4 date=2026-11-05 env=cyd-2432s028` at boot and for the command `FW`. The board's name (1 to 4 letters or digits; the same letters as `pocketStatus.py`: A, B, C) is kept in NVS (`bid`) and set with `ID set C`; until then it is the last 4 hex digits of the chip id. A small gray "Board C fw 1a2b3c4 2026-11-05" is drawn in the top left corner of every setup step and in the title bar of Settings and the game list (a short "C fw 1a2b3c4" when the title is long; left out on the 3.5 inch list, whose title fills the bar). It is separate from the temporary banner badge (`ID <x>`).

Test banner: `S <text>` on Serial (any screen, game included) shows a slim yellow bar with a small robot and up to 40 characters at the top edge, between the MENU and KEYS chips (`src/banner.h`; drawn into the game's bands with the controls, so it does not flicker); `S off` clears it. `ID <x>` (1 to 3 characters) adds a bold board badge at the left of the bar, and shows the bar with the robot alone when no text is set; `ID off` removes it (RAM only: gone after a reset). It also clears when a real finger touches the screen (a made-up `I` finger does not) and after 2 minutes with no serial traffic. `web/scripts/pocketStatus.py <port> "<text>"|off` sends it; the other `pocket*.py` scripts that open the port do it themselves, with the board's letter from the table in `pocketStatus.py`: **A** = /dev/cu.usbserial-1140 (3.5" 480x320, GT911 touch), **B** = usbserial-1130 and **C** = usbserial-120 (2.8" 320x240, ESP32-2432S028). A flash can't show one (the chip is in its bootloader): show "Flashing new firmware" first.

The touch model (`controls.h`) lets a finger the chip stops reporting keep pressing for 60 ms, and a new contact within 70 px of it takes its place, so a dropped frame or a re-numbered thumb does not release a held direction.

## Library browser (library metadata version 1)

The library opens on categories, six tiles per page on both boards. Starters has the site's
six numbered stages, followed by Graduations and Other. Sandbox, Bizarre, My games,
Imported collections and CD (Gameware / Shareware) keep the site's classification. Empty
categories remain reachable. Good on touch is an additional view of installed games with
an advisory recorded-route score of at least 85, highest first. This score does not promise
that a game is easy to play on hardware.

Boot shows the Sandbox logo first (the last full frame of the Sandbox sting, 160 by 100 at 2x or 3x, `src/splash.h`), then the picker replaces it as soon as the list is loaded: no added wait. Category tiles carry a 16 by 16 icon above the name (`src/icons_data.h`, drawn in code); both are generated by `cd web && npx vite-node scripts/pocketArt.ts [--preview <dir>]`. A game's tile shows its title screen (the title graphic, or the menu screen when it has none; `web/src/export/pocketThumbnail.ts` boxes it down to 96 by 60, then to 256 colors).

Tap a game once to select it and again to play, or select Details for its full title and Play.
The picture's outlined name is the source DOS `.GAM` basename. Back returns to the parent;
the spyglass searches human titles, initially across All games, with a This category toggle.
The search header's back arrow cancels changes. Done keeps the query; empty results offer
Clear. Selection, page, category and query return after play. The gear opens Settings.
On the CYD, Panel setup is still in Settings → Display and on a short BOOT press.
The agent banner is kept off library navigation.

`GMP 1` and the `GMS1` container are unchanged. A GMP may additionally carry `library.json`
(`gmp-library`, version 1, UTF-8 without BOM, at most 1,024 bytes) and `thumb.pth`.
Metadata holds `uid`, human `title` (128 UTF-8 bytes), validated `dosName`, one or two stable
category segments, source `gamCrc32`, optional `course`, imported `categoryLabel`, thumbnail
name and optional `touchScore`. Unknown keys are ignored. Missing, corrupt or future
metadata uses the legacy title, Imported → Unsorted and no preview; unsupported gameplay
versions are still rejected. Conflicting UIDs are reported, keeping the first installed copy.
Distinct legacy GMP filenames with the same truncated game id remain distinct games.

Catalog identities are `catalog:<id>`. Personal projects receive a `project:<UUID>` in the
companion, preserved by game-file backups; copies use My games even when copied from a
published game. Export options accept a chosen imported collection slug/label; the current
site download uses Unsorted for imports without a chosen collection. No private import path
is exported. Long browser download names and packer filename collisions get deterministic
hash suffixes. Incremental `--gmp` writes also protect other UIDs already on the card.

Flash and loose-card packs have streaming `library.jsonl`, headed by
`{"schema":"gmp-library-index","version":1}`, with storage, id, safe locator and preview
entry names. They retain `games.txt` for old firmware. Previews share one `thumbs.pak` with
identical payloads deduplicated. Title/menu pictures use the site's indexed title renderer,
falling back to the first playable level; unreadable pictures get a labeled No preview tile.
PTH1 stores 96×60 indices and 256 RGB565 colors (6,284 raw bytes), wrapped in the existing
raw-length + deflate format. The large board enlarges to 144×90. The board draws one row
at a time, never a whole-page framebuffer.

The packer optionally reads the maintainer's `.for-lewis/research/pocket/cyd-friendly.json`;
`--scores <file>` overrides it. Missing scores omit Good on touch. Secret games are filtered
before preview generation, indexing and counts. Build gates cap compressed thumbnails at
384 KiB and the flash index at 64 KiB. The 512-game catalog uses 41,904 bytes, including
filters and 24 imported collection labels; preview scratch is 6,572 bytes. Compressed preview
input reuses the existing game band; decompression reuses the engine's existing ROM inflater.
The entire catalog and all preview buffers are released before a normal game launch. Excess
games/collections produce a visible limit message (extra collections fall under Unsorted).

Card discovery reads bounded gameplay headers and metadata, never game assets. Disposable
`/pocket/LIBRARY.CCH` cache rows use basename/size/mtime and CRC32. Bad rows are ignored,
removed files are not listed, and replacements are read again. Named imported collections
are reclassified from metadata each scan. A completed directory scan replaces the cache;
interrupted `LIBRARY.NEW` files are ignored. Rescan discards both cache files and probes the
card again. Returning from play rebuilds the released catalog from cache rows after checking
the directory stamp and each target's size/mtime; a changed directory or bad target triggers
a new directory scan. Gameplay never requires the cache. Card write failures do not block browsing.

Host checks: `cd web && npx vite-node scripts/pocketControlsCheck.ts` includes `host/librarytest.cpp`
for both exact layouts, real packed previews, touch gaps, partial/empty pages, clipped DOS
names, metadata/cache corruption, UTF-8 bounds and memory limits. To retain the renders,
compile that host test with `-std=c++17 -I hardware/pocket-player/src -lz`, then run
`librarytest hardware/pocket-player/data <output-directory>`; it writes PPM files convertible
to PNG. `src/export/pocketLibrary.test.ts` checks package compatibility, stages, identity,
collisions, secret exclusion and generated preview/index budgets.

Set `POCKET_BUILD_ID=<label>` for PlatformIO builds that must not invoke git; otherwise the
existing build-id hook reads git. No board is needed to build firmware or LittleFS.

Measured host build, Saturday, November 7, 2026 (before board testing):

| Environment    | Firmware file | Static RAM | Application headroom |
| -------------- | ------------: | ---------: | -------------------: |
| ESP32-3248S035 |     541,840 B |  100,840 B |            506,736 B |
| CYD-2432S028   |     543,280 B |  112,200 B |            505,296 B |

Both filesystem images are 3,080,192 bytes. Their six source files total 2,545,021 bytes,
including 29,232 bytes of metadata and 137,679 bytes of compressed previews. There are
507,904 bytes of fully erased blocks, a conservative free-space floor that leaves the
128 KiB personal-data reserve and 64 KiB headroom intact. Firmware growth over the served
binaries at the start of this task is below 64 KiB on each board.

Next: personal lists, counted/recent launches, ratings, the power-failure-safe journal and
explicit portable snapshot/import UI (design section 3). Before release, boards must verify
real touch, SD removal/full-card behavior, tight-level heap and largest block, and reset,
cold/warm discovery, page and search timings. Serial `BOOT` / `LIB` lines report the latter;
host tests cannot establish those hardware timings.

The pad drawing is shared by `src/paddraw.h` and `host/paddrawtest.cpp`. `web/scripts/pocketControlsCheck.ts` checks its framebuffer snapshots on both boards, all three sizes, both hands, idle/held states and both software turns. To inspect it, compile the host test with `-DPOCKET_CYD28 -I hardware/pocket-player/src` and pass an output PPM path: rows are small, medium and large; columns are right-handed idle/held, then left-handed idle/held.
