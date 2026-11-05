# Pocket Player

Firmware for the ESP32-3248S035 board (3.5 inch, 480 by 320, ST7796, GT911 capacitive touch). It plays **30 of the Starter games** from the games' real DOS files, packed small into LittleFS (`web/scripts/pocketData.ts`), with a game list, touch controls for fingers and a stylus, a settings screen and a status strip. No sound.

The play rules are `src/gmcore.h`, a port of the web engine's character, touch, scroll, block-effect and scene code (itself from `code/GM/PLAYGAME.C`) with no board code in it, so the same file runs in the Mac test. **Monsters, sound, pick up and drop are not ported**: the 17 Starters that have monsters (or monster births), and every Sandbox game, are left out of the list (`npx vite-node scripts/pocketData.ts --list` says why for each).

Files: `src/gmcore.h` (play loop), `src/gmcfg.h` (a game's `.cfg` and the level file loader), `src/controls.h` (touch controls model), `src/gt911.h` (touch chip, up to 5 fingers with ids and sizes), `src/main.cpp` (files, panel, screens, drawing), `host/hosttest.cpp` and `host/controlstest.cpp` (Mac tests).

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
5. **A stylus.** Only a *capacitive* stylus works. The GT911 is a capacitive touch chip, so a plain plastic stick or a pen cap registers as nothing (a stylus with a rubber or mesh tip, or a bare fingertip, does). With a stylus, turn on **Stylus (taps latch)** in Settings: a short tap on the right of the pad keeps the hero walking right after you lift, so you can tap Space with the same stylus; a tap in the middle of the pad (or on the other side) stops him. A drag still steers while held.
6. **Left-handed.** Settings, Hand: Left. The pad and buttons trade sides.
7. **Palm rejection.** Settings, Palm rejection: Size (drops contacts the chip reports as big), Size+near (also drops a contact that lands within 70 px of one already held). The thresholds are guesses. The status strip's last number is the contact size of the most recent touch; rest a palm, then a fingertip, and tell me both numbers.
8. **Health and Hearts, Watch Your Step, Switches** (damage and restarts) and **Countdown, Gusts** (timed blocks).
9. The status strip: `HP`, `Lives`, `Score`, money and the game's own counters (Keys carried); on the right `lv N fps tick-ms draw-ms size` while Status numbers is on. Does anything stutter? Tell me the fps while the view scrolls.

Report: which games feel wrong, any picture glitch, the pad numbers that felt right (size and dead zone), and the palm and fingertip sizes.

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
- **Settings** (saved in LittleFS): Hand, Stylus, Pad size (radius 64, 76, 90 px), Pad dead zone, Palm rejection, Status numbers.

## Games, memory and size

30 games, all matching the engine tick for tick on the Mac (list below). The 17 Starters left out have monsters (and in two cases monster births): and-gate, boss-hits, boss-phases, flock, follower, horizon, many-weapons, meet-the-monsters, popups, scripted, searchlight, short-lived, take-the-wheel, things-that-grow, throw-it, who-wins, your-first-game. The other Starters, listed in the host check output, are in the game list. No Sandbox game is free of monsters.

- Program: 444 KB of the 1 MB partition. Static RAM: 78 KB of 320 KB; a running game holds the 10 KB map, its blocks (up to 63 KB), the hero files (28 KB) and a few KB of the world.
- Game data: the 30 games take about 210 KB of the 3 MB LittleFS partition. Files are named by content, so the many games that share the hero files and palettes store them once; maps, blocks (cut after the last block the maps use) and hero files are deflated and unpacked with the ROM's miniz.

## Check the play loop on the Mac

`cd web && npx vite-node scripts/pocketHostCheck.ts [id ...]` replays each packed game's committed `walkthrough.json` on the engine's headless player, builds `host/hosttest.cpp` (needs `c++` and zlib), replays the same keys through `gmcore.h` on the same packed files, and compares position, sequence and frame, scroll, score, hit points, lives, counters and a hash of the 312 by 196 picture on every tick. One line per game; exit 1 if any differs.

`cd web && npx vite-node scripts/pocketControlsCheck.ts` runs the touch-event replay of the controls (32 scenarios: slides, two fingers, taps, stylus latch, palm rejection, left-handed layout, the key menu, minimum target sizes).

After rebuilding a game: `cd web && npx vite-node scripts/pocketData.ts` repacks `data/` (it also writes `games.txt`).

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

Display SPI: SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, backlight 27. GT911 (I2C): SDA 33, SCL 32, INT 21, RST 25. XPT2046 shares the display bus: CS 33, IRQ 36. Sources are in `src/board.h` and NOTICE.md.
