#!/usr/bin/env python3
"""Shows what is being tested on a Pocket Player's screen: a slim banner with a robot icon and up to 40 characters.

  ~/.platformio/penv/bin/python web/scripts/pocketStatus.py /dev/cu.usbserial-XXXX "Checking held input"
  ~/.platformio/penv/bin/python web/scripts/pocketStatus.py /dev/cu.usbserial-XXXX off
    ~/.platformio/penv/bin/python web/scripts/pocketStatus.py --find     (lists which board is on which port, asked of the boards)
  (add --reset to reset the board on open; add --id X to override the board's own letter; the badge normally comes from its `FW` answer)
Run it when you take a board's lock and again with `off` when you let go. The banner also clears when someone touches
the screen, and by itself after 2 minutes with no serial traffic. Before a flash run it with `flash` (shows "Flashing new firmware") first (the
chip is in its bootloader afterward and can't draw). Other scripts import `show`, `clear` and `banner`.
"""
import sys, time

LIMIT = 40
# Each board keeps its own letter in flash (`ID set C`, NVS "bid"); the firmware prints it in `FW board=C ...`. So the letter is
# asked of the board, not read from the port name (USB serial names change with the port or hub: on 2026-11-09 the boards
# were on -120, -130 and -210, not the -1140/-1130/-120 of 2026-11-05). A board that was never named reports the last 4 hex
# digits of its chip id; give it a letter with `ID set A` over serial (A: 3.5" 480x320, GT911 touch; B and C: 2.8" 320x240,
# ESP32-2432S028, resistive touch).
def take_reset_flag():
    """Removes `--reset` from sys.argv (for scripts that read positional arguments) and says whether it was there."""
    r = "--reset" in sys.argv
    if r:
        sys.argv.remove("--reset")
    return r


def open_port(port, timeout=1, reset=False):
    """Opens a board's serial port WITHOUT the DTR/RTS reset pulse the USB-serial chip gives on a plain open
    (so the board keeps its screen and a banner sent at once is not lost). Do NOT set .dtr/.rts to False before opening:
    on this Mac's CH340/CP210x drivers that deasserts lines the driver had just asserted and pulses the board (tested
    2026-11-09: it rebooted; leaving both untouched did not). reset=True pulses the board on purpose
    (EN low through RTS) and waits for the boot."""
    import serial
    s = serial.Serial()
    s.port, s.baudrate, s.timeout = port, 115200, timeout
    s.dsrdtr = s.rtscts = s.xonxoff = False
    s.open()
    if reset:
        s.dtr = False
        s.rts = True
        time.sleep(0.1)
        s.rts = False
        time.sleep(2.5)
    return s


_override = {}
_asked = {}


def ask_board(s):
    """Sends `FW` and returns the board's name from `FW board=X ...` ("" if nothing answers, e.g. in the bootloader)."""
    old = s.timeout
    s.timeout = 0.3
    try:
        s.write(b"FW\n"); s.flush()
        end = time.time() + 1.5
        while time.time() < end:
            l = s.readline().decode("utf-8", "replace")
            if l.startswith("FW board="):
                return l.split()[1][6:]
    finally:
        s.timeout = old
    return ""


def board_id(s):
    """The ID for an open port: --id / set_id if given, else asked of the board once (`FW`), else none."""
    port = getattr(s, "port", "") or ""
    if port in _override:
        return _override[port]
    if port not in _asked:
        _asked[port] = ask_board(s)
    return _asked[port]


def find_ports():
    """{name: port} for every USB serial board on this Mac (/dev/cu.usbserial-*; the Pi's usbmodem is left alone), asking each
    one `FW`. A port that doesn't answer is listed under its own name."""
    import glob, serial
    out = {}
    for p in sorted(glob.glob("/dev/cu.usbserial-*")):
        try:
            with open_port(p, 0.3) as s:
                time.sleep(0.3)
                out[ask_board(s) or p] = p
        except Exception:
            out[p] = p
    return out


def port_for(letter):
    """The port of board `letter` (A, B or C), or None."""
    return find_ports().get(letter)


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
    reset = "--reset" in sys.argv
    args = [x for x in sys.argv[1:] if x != "--reset"]
    ident = None
    if "--id" in args:
        k = args.index("--id")
        ident = args[k + 1] if k + 1 < len(args) else ""
        del args[k:k + 2]
    if args == ["--find"]:
        for k, v in find_ports().items():
            print(k, v)
        sys.exit(0)
    if len(args) != 2:
        print(__doc__); sys.exit(2)
    import serial
    s = open_port(args[0], 1, reset)
    time.sleep(0.3)
    if ident is not None:
        set_id(s, ident)
    if args[1] == "off":
        clear(s)
    else:
        show(s, "Flashing new firmware" if args[1] == "flash" else args[1])
    time.sleep(0.2)
    s.close()
