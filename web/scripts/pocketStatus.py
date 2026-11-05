#!/usr/bin/env python3
"""Shows what is being tested on a Pocket Player's screen: a slim banner with a robot icon and up to 40 characters.

  ~/.platformio/penv/bin/python web/scripts/pocketStatus.py /dev/cu.usbserial-XXXX "Checking held input"
  ~/.platformio/penv/bin/python web/scripts/pocketStatus.py /dev/cu.usbserial-XXXX off
  (add --id X to name the board; by default usbserial-1140 is A, -1130 B, -120 C: see BOARDS below)
Run it when you take a board's lock and again with `off` when you let go. The banner also clears when someone touches
the screen, and by itself after 2 minutes with no serial traffic. Before a flash run it with `flash` (shows "Flashing new firmware") first (the
chip is in its bootloader afterward and can't draw). Other scripts import `show`, `clear` and `banner`.
"""
import sys, time

LIMIT = 40
# Lewis's boards by USB serial port: the letter shows as a bold badge at the left of the banner (and is what he says: "board B").
BOARDS = {
    "usbserial-1140": ("A", '3.5" 480x320, GT911 capacitive touch'),
    "usbserial-1130": ("B", '2.8" 320x240, ESP32-2432S028, resistive touch'),
    "usbserial-120": ("C", '2.8" 320x240, ESP32-2432S028, resistive touch'),
}
_override = {}


def board_id(s):
    """The ID for an open port: --id / set_id if given, else the table above by the port name, else none."""
    port = getattr(s, "port", "") or ""
    if port in _override:
        return _override[port]
    for k, (i, _) in BOARDS.items():
        if port.endswith(k):
            return i
    return ""


def set_id(s, i):
    _override[getattr(s, "port", "") or ""] = i


def show(s, text, big=False):
    """Sends `S <text>` (ASCII only, cut at 40 characters) over an open pyserial port; big=True sends `S2 <text>`, the double-size
    banner for filming (cut at 21 characters on a 320 px board, 34 on 480 px: pocketShowcase.py uses it)."""
    t = "".join(c for c in text if " " <= c < "\x7f")[:LIMIT]
    i = board_id(s)
    s.write(((f"ID {i}\n" if i else "") + f"{'S2' if big else 'S'} {t}\n").encode())
    s.flush()


def clear(s):
    s.write(b"S off\nID off\n")
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
    args = sys.argv[1:]
    ident = None
    if "--id" in args:
        k = args.index("--id")
        ident = args[k + 1] if k + 1 < len(args) else ""
        del args[k:k + 2]
    if len(args) != 2:
        print(__doc__); sys.exit(2)
    import serial
    s = serial.Serial(args[0], 115200, timeout=1)
    time.sleep(0.3)
    if ident is not None:
        set_id(s, ident)
    if args[1] == "off":
        clear(s)
    else:
        show(s, "Flashing new firmware" if args[1] == "flash" else args[1])
    time.sleep(0.2)
    s.close()
