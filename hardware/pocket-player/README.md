# Pocket Player

Firmware for the ESP32-3248S035 board (3.5 inch, 480 by 320, ST7796, GT911 touch). It plays **First Steps**, both levels, from the game's real DOS files (`data/`: `steps.bbl`, `steps.pal`, `hero.cbl`, `hero.chr`, `walk.map`, `climb.map`, plus `steps.cfg`, which `web/scripts/pocketData.ts` writes from `steps.gam`). No sound. The play rules are `src/gmcore.h`, a port of the web engine's character, touch, scroll and scene code (itself from `code/GM/PLAYGAME.C`) with no board code in it, so the same file runs in the Mac test. Monsters, sounds, pick up and drop are not ported (First Steps has none).

Files: `src/gmcore.h` (play loop), `src/gmcfg.h` (reads `steps.cfg`), `src/gt911.h` (touch, up to 5 fingers), `src/pocketui.h` (button shapes), `src/main.cpp` (files, drawing, debug strip), `host/hosttest.cpp` (Mac test).

## Flash it from the browser (Lewis)

1. After you pull this branch, start your dev server as usual and open **http://localhost:5173/pocket/index.html** in desktop Chrome or Edge (the page is not linked from the site).
2. Plug the board in with a USB cable that carries data.
3. Click Install, pick the serial port, click Install again, wait about a minute. This replaces everything on the board.

## What you should see

1. The title and `Touch: GT911 at 0x5D` (or 0x14) for about a second, then First Steps level 1: the hero at 1.5 times size, and a 20 pixel strip along the bottom with numbers.
2. Five dark squares over the game: Left and Right at the lower left, Jump (a ring) at the lower right, Up and Down (small, for ladders in level 2) beside it. They light up yellow while a finger is on them. Two fingers work (run and jump).
3. The hero walks, jumps (the engine's momentum jump, with gravity pulling back), falls, collects coins, and the view scrolls once he is past a third of the screen. Reach the end of level 1 to enter level 2; the end of level 2 shows "You made it!" and a touch starts over.
4. The strip reads `heap N  draw N ms  tick N ms  N fps  lv N  score N  touch rawx,rawy>x,y`. Touch the strip to turn it off (a dim "tap: debug" stays); touch it again to bring it back.

## Report back

- Do Left and Right move the right way, does Jump feel right, can you run and jump with two fingers?
- Do the buttons sit where your thumbs are? Does a touch land where you press? The strip shows the raw touch and the screen position it was turned into; if a button reacts mirrored or swapped, tell me which, and it is one line in `GT911::toScreen` (`src/gt911.h`).
- The strip's numbers while walking and while the view scrolls (draw ms, fps). The game keeps its speed (18 ticks a second) by running extra ticks after a slow frame; drawing is what gets choppy.
- Anything odd in the picture (colors, flicker at the hero's edges).

## Check the play loop on the Mac

`cd web && npx vite-node scripts/pocketHostCheck.ts` has the walkthrough bot play First Steps on the real engine, writes its keys, builds `host/hosttest.cpp` (needs `c++`) and replays them through `gmcore.h`. Each tick it compares position, sequence and frame, scroll, score and a hash of the 312 by 196 picture. Exit 1 on the first difference. `--ticks N` stops early; `--keep dir` keeps the files. After rebuilding the game, `npx vite-node scripts/pocketData.ts` refreshes `data/`.

## Colors check (on the Mac)

`cd web && npx vite-node scripts/pocketColorCheck.ts out.png` repeats the firmware's color math on the same files, models the panel reading the pushed bytes, and writes the engine's own render, the current firmware and the old one side by side. It exits 1 if a color is off by more than 565 rounding allows. The cause it confirmed: pushImage sent each 16 bit value low byte first and the ST7796 reads it high byte first, so the buffer now holds byte-swapped RGB565 (`panel565` in `src/main.cpp`).

## Rebuild

PlatformIO's core CLI lives in a venv (`~/.platformio/penv`). From the repository root:

```sh
~/.platformio/penv/bin/pio run -d hardware/pocket-player                 # firmware
~/.platformio/penv/bin/pio run -d hardware/pocket-player -t buildfs      # LittleFS image from data/
```

Then copy `bootloader.bin`, `partitions.bin`, `firmware.bin` and `littlefs.bin` from the build folder into `web/public/pocket/fw/`. The offsets in `web/public/pocket/manifest.json` match `partitions.csv`: bootloader 0x1000, partitions 0x8000, firmware 0x10000, LittleFS 0x1F0000 (256 KB).

## Pins (board.h)

Display SPI: SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, backlight 27. GT911 (I2C): SDA 33, SCL 32, INT 21, RST 25. XPT2046 shares the display bus: CS 33, IRQ 36. Sources are in `src/board.h` and NOTICE.md.
