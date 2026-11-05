# Pocket Player

Firmware for the ESP32-3248S035 board (3.5 inch, 480 by 320, ST7796, GT911 capacitive touch). It plays **69 of the Starter games** from the games' real DOS files, packed small into LittleFS (`web/scripts/pocketData.ts`), with a game list, touch controls for fingers and a stylus, a settings screen and a status strip. It plays each game's **PC speaker sounds** (no Sound Blaster clips or music yet).

The flashed firmware binaries' third-party notices are in [`web/public/pocket/fw/NOTICES.txt`](../../web/public/pocket/fw/NOTICES.txt). Keep that file with the firmware image set when redistributing it.

The play rules are `src/gmcore.h`, a port of the web engine's character, touch, scroll, block-effect and scene code (itself from `code/GM/PLAYGAME.C`) with no board code in it, so the same file runs in the Mac test. Monsters (`src/gmmon.h`, a port of the web engine's `monsters.ts`) are in. **Sound** is queued by the core as events and played by `src/speaker.h` (see Sound below). Not ported: Sound Blaster .VOC clips, FM music, the joystick. Every Sandbox game is left out (`npx vite-node scripts/pocketData.ts --list` says why for each).

Files: `src/gmcore.h` (play loop), `src/gmmon.h` (monsters), `src/gmcfg.h` (a game's `.cfg` and the level file loader), `src/controls.h` (touch controls model), `src/pcspeaker.h` (the PC speaker tune player, no board code), `src/speaker.h` (GPIO 26 and the task that drives it), `src/gt911.h` (touch chip, up to 5 fingers with ids and sizes), `src/main.cpp` (files, panel, screens, drawing), `host/hosttest.cpp` and `host/controlstest.cpp` (Mac tests).

## Flash it from the browser

1. After you pull this branch, start your dev server as usual and open **http://localhost:5173/pocket/index.html** in desktop Chrome or Edge (the page is not linked from the site).
2. Plug the board in with a USB cable that carries data.
3. Click Install, pick the serial port, click Install again, wait a minute or two. This replaces everything on the board, including the settings, and uses a new partition table (1 MB for the program, 3 MB for LittleFS).

## What to try (and what to report back)

The board shows a list of games, five to a page (Prev, Next, Settings along the bottom). Tap a game to play it. A MENU chip in the top-left corner pauses (Resume, Restart game, Games, Settings).

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
11. The status strip: `HP`, `Lives`, `Score`, money and the game's own counters (Keys carried); on the right `lv N fps tick-ms draw-ms size` while Status numbers is on. Does anything stutter? Tell me the fps while the view scrolls.

Report: which games feel wrong, any picture glitch, the pad numbers that felt right (size and dead zone), and the palm and fingertip sizes.

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

- **Pad:** one round zone, not four buttons. The direction is where the finger is, so a finger can slide from left to right and the keys change over (the old one is released first, so both are never down). A dead zone in the middle (small 18 px, medium 26, large 36 radius) presses nothing. Left and right win within 27 degrees of level, up and down within 27 degrees of straight, and in between both keys are down (a diagonal). A direction already held stays held to about 35 degrees, and the dead zone is 20 % smaller to come back to than to leave, so a thumb doesn't flicker. A finger that began on the pad stays on the pad however far it slides. Only the arrows a game uses are drawn, and a game with no ladders sends left and right for any thumb position.
- **Action keys:** Space and Enter come from the game's `controls.json`; a game that doesn't use one doesn't get the circle. Other keys it lists (Ctrl, Alt, letters) go in the **KEYS** menu, a row of 72 by 56 px tiles under the chips (the Starters use none, so you won't see this until a bigger game does). The letters listed beside the arrows (A, D, W, S) are the arrows.
- **Two fingers:** the board reads five contacts with ids; the pad owns one finger, each button takes any other. Every key stays down at least 3 game ticks (165 ms) so a quick tap still registers.
- **Stylus and finger:** the same screen works for both; Stylus mode only adds the tap latch described above (tap under 300 ms and under 10 px moves = tap; anything else is a drag).
- **Palm rejection:** off by default (see item 7).
- **Settings** (saved in LittleFS): Hand, Stylus, Pad size (radius 64, 76, 90 px), Pad dead zone, Palm rejection, Status numbers, Sound (off, low, medium, high).

## Games, memory and size

69 games, all matching the engine tick for tick on the Mac (list in the host check output), the ones with monsters included. No Sandbox game is packed.

- Program: 454 KB of the 1 MB partition. Static RAM: 108 KB of 320 KB (the world now holds 200 monster slots and the monster layer of the map, about 30 KB more); a running game holds the 10 KB map, its blocks (up to 63 KB), the hero files (28 KB), and for a level with monsters the 10 KB monster layer, the monster records and their pictures (the largest level, Take the Wheel, is 114 KB in all).
- Game data: the 69 games take about 330 KB of the 3 MB LittleFS partition. Files are named by content, so the many games that share the hero files and palettes store them once; maps, blocks (cut after the last block the maps use) and hero files are deflated and unpacked with the ROM's miniz.

## Check the play loop on the Mac

`cd web && npx vite-node scripts/pocketHostCheck.ts [id ...]` replays each packed game's committed `walkthrough.json` on the engine's headless player, builds `host/hosttest.cpp` (needs `c++` and zlib), replays the same keys through `gmcore.h` on the same packed files, and compares position, sequence and frame, scroll, score, hit points, lives, counters and a hash of the 312 by 196 picture on every tick. One line per game; exit 1 if any differs.

It also compares the sound schedule: the engine's PC speaker effects (tick, effect number, hash of its 36 frequencies) must be the board code's queue, event for event, and the tone player is timed against the 1/145.6 s steps (a `Z` line from the host test). Nobody has heard the board; this proves what is asked to play, and when, not the pin.

`cd web && npx vite-node scripts/pocketControlsCheck.ts` runs the touch-event replay of the controls (32 scenarios: slides, two fingers, taps, stylus latch, palm rejection, left-handed layout, the key menu, minimum target sizes).

After rebuilding a game: `cd web && npx vite-node scripts/pocketData.ts` repacks `data/` (it also writes `games.txt`).

## Check the board itself (serial self-test)

The host check cannot see stack, heap or DRAM limits, so the firmware has a serial self-test. On the game list only, `T <index> <ticks>` or `T all <ticks>` (115200 baud, a line ending in newline) loads each game the way a tap does, runs it with no input and drawing every tick, then prints one line per game: `ST id=... ok=1 free=... largest=... min=... stack=...` (free heap, largest block, lowest free heap since boot, loop-task stack high-water mark in bytes), then `ST done n=...` and returns to the list. Normal play never reads the serial port.

With the board plugged in and on the list (not mid-game, and nobody using it):

`~/.platformio/penv/bin/python web/scripts/pocketBoardCheck.py /dev/cu.usbserial-XXXX --ticks 300`

It prints a table and exits 1 on a failed load, a stack high-water under 1024 bytes, or a board that stops answering (a crash shows as a missing `ST done`).

## Colors check (on the Mac)

`cd web && npx vite-node scripts/pocketColorCheck.ts out.png` repeats the firmware's color math on First Steps' files, models the panel reading the pushed bytes, and writes the engine's own render, the current firmware and the old one side by side. It exits 1 if a color is off by more than 565 rounding allows. pushImage sends each 16 bit value low byte first and the ST7796 reads it high byte first, so the buffer holds byte-swapped RGB565 (`panel565` in `src/main.cpp`).

## Rebuild

PlatformIO's core CLI lives in a venv (`~/.platformio/penv`). From the repository root:

```sh
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player                 # firmware
npm run heavy -- ~/.platformio/penv/bin/pio run -d hardware/pocket-player -t buildfs      # LittleFS image from data/
```

Then copy `bootloader.bin`, `partitions.bin`, `firmware.bin` and `littlefs.bin` from `hardware/pocket-player/.pio/build/esp32-3248s035/` into `web/public/pocket/fw/`. The offsets in `web/public/pocket/manifest.json` match `partitions.csv`: bootloader 0x1000, partitions 0x8000, firmware 0x10000, LittleFS 0x110000 (3 MB).

## What only a board can tell

Whether the touch orientation guess is right, whether the pad sizes and dead zones feel good under a thumb, what size numbers a fingertip and a palm give (so the palm threshold of 160 is a guess), how a capacitive stylus behaves on the glass, the frame rate while scrolling, whether the picker's rows are easy to hit, and whether the new `rom/miniz.h` decoder links and runs on the board (it compiles and links; the Mac test uses zlib for the same bytes).

## Pins (board.h)

Display SPI: SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, backlight 27. GT911 (I2C): SDA 33, SCL 32, INT 21, RST 25. XPT2046 shares the display bus: CS 33, IRQ 36. Speaker: GPIO 26 (`src/speaker.h`). Sources are in `src/board.h`, `src/speaker.h` and NOTICE.md.
