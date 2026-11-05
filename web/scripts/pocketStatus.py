#!/usr/bin/env python3
"""Shows what is being tested on a Pocket Player's screen: a slim banner with a robot icon and up to 40 characters.

  ~/.platformio/penv/bin/python web/scripts/pocketStatus.py /dev/cu.usbserial-XXXX "Checking held input"
  ~/.platformio/penv/bin/python web/scripts/pocketStatus.py /dev/cu.usbserial-XXXX off
Run it when you take a board's lock and again with `off` when you let go. The banner also clears when someone touches
the screen, and by itself after 2 minutes with no serial traffic. Before a flash show "Flashing new firmware" first (the
chip is in its bootloader afterward and can't draw). Other scripts import `show`, `clear` and `banner`.
"""
import sys, time

LIMIT = 40


def show(s, text):
    """Sends `S <text>` (ASCII only, cut at 40 characters) over an open pyserial port."""
    t = "".join(c for c in text if " " <= c < "\x7f")[:LIMIT]
    s.write(f"S {t}\n".encode())
    s.flush()


def clear(s):
    s.write(b"S off\n")
    s.flush()


class banner:
    """with banner(port_or_serial, "Writing games to SD") as b: ... b.say("more") ; clears on exit, even on an error."""

    def __init__(self, s, text):
        self.s, self.text = s, text

    def __enter__(self):
        show(self.s, self.text)
        return self

    def say(self, text):
        show(self.s, text)

    def __exit__(self, *e):
        try:
            clear(self.s)
        except Exception:
            pass
        return False


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__); sys.exit(2)
    import serial
    s = serial.Serial(sys.argv[1], 115200, timeout=1)
    time.sleep(0.3)
    if sys.argv[2] == "off":
        clear(s)
    else:
        show(s, sys.argv[2])
    time.sleep(0.2)
    s.close()
