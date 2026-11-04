# Pocket Player (spike)

A test firmware for the ESP32-3248S035 board (3.5 inch, 480 by 320, ST7796). It shows a title, finds the touch chip, and draws the first screen of First Steps level 1 from the game's real DOS files (`walk.map`, `steps.bbl`, `steps.pal`, in `data/`), parsed in C++ (`src/level.h`, following `web/packages/engine/src/formats`). No sound. It is a spike: the pins come from community tables and have not run on a board yet.

## Flash it from the browser (Lewis)

1. Start your dev server as usual and open **http://localhost:5173/pocket/index.html** in desktop Chrome or Edge. (The page is not linked from the site.) Until this branch is merged into the checkout your server runs from, the files are not there; see the branch `feature/pocket-player-spike`.
2. Plug the board in with a USB cable that carries data.
3. Click Install, pick the serial port (often "USB Serial" or "CH340"), click Install again, wait about a minute. This replaces everything on the board.

## What you should see

1. The backlight comes on and the screen reads "Game-Maker Pocket Player", with a line under it: `Touch: GT911 at 0x5D` (or 0x14), or `Touch: no GT911, trying XPT2046`. About 2.5 seconds.
2. The first screen of First Steps level 1: sky, a ground strip with dirt, a sign and a coin, 16 by 10 blocks at 1.5 times, with a black 20 pixel strip along the bottom reading like `heap 2xxxxx  block 1xxxxx  draw NNN ms  GT911`.
3. Touch the glass: a red dot should appear under your finger.

## Report back

- Did the backlight come on? Anything but a white or black screen?
- Colors wrong (inverted, red and blue swapped)? Picture upside down or mirrored?
- Which touch chip it said, and whether the dot lands under your finger. If it is mirrored or swapped, tell me which way (left-right, up-down, or x and y swapped): one line in `src/main.cpp` fixes it.
- The numbers in the strip: heap, block and draw ms.
- If nothing shows: open the serial monitor at 115200 and send me the lines. The same numbers print there.

## Rebuild

PlatformIO's core CLI lives in a venv (`~/.platformio/penv`). From the repository root:

```sh
~/.platformio/penv/bin/pio run -d hardware/pocket-player                 # firmware
~/.platformio/penv/bin/pio run -d hardware/pocket-player -t buildfs      # LittleFS image from data/
```

Then copy `bootloader.bin`, `partitions.bin`, `firmware.bin` and `littlefs.bin` from the build folder into `web/public/pocket/fw/`. The offsets in `web/public/pocket/manifest.json` match `partitions.csv`: bootloader 0x1000, partitions 0x8000, firmware 0x10000, LittleFS 0x1F0000 (256 KB).

## Pins (board.h)

Display SPI: SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, backlight 27. GT911 (I2C): SDA 33, SCL 32, INT 21, RST 25. XPT2046 shares the display bus: CS 33, IRQ 36. Sources are in `src/board.h` and NOTICE.md.
