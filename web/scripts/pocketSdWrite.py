#!/usr/bin/env python3
"""Writes a Pocket Player microSD card's files to the card in the board over USB serial (no card reader needed).

Run with PlatformIO's Python (it has pyserial), with the board on its game list and a card in its slot:
  cd web && npx vite-node scripts/pocketData.ts --out /tmp/pocketcard
  ~/.platformio/penv/bin/python web/scripts/pocketSdWrite.py /dev/cu.usbserial-XXXX /tmp/pocketcard/pocket
Sends every file of the folder to /pocket/ on the card (256 bytes at a time, about 10 KB/s: 2 MB takes several minutes), the list
last, then resets the board so it reads the new list. A file already on the card is replaced. Lines the board logs before a reply (SCREEN, PACK, LOG...) are skipped; a reply that never comes within 10 s fails and shows the last skipped lines.
Exits 1 on any error. `--self-check` tests transfer order and the reply reader with a fake port.
"""
import sys, os, time, argparse
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.join(_os.environ.get('GAMEMAKER_POCKET_DIR') or _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', '..', 'gamemaker-pocket'), 'scripts'))  # pocketStatus.py lives in the gamemaker-pocket repository


def wait_reply(s, want, timeout=10.0):
    """Reads lines until the protocol reply `want` (GO or OK) or an ERR line; returns (reply, skipped).
    Board log lines (SCREEN ..., PACK ..., LOG ..., anything else) are skipped; only the last five are returned. The reply is None on timeout."""
    skipped = []
    end = time.monotonic() + timeout
    original_timeout = s.timeout
    try:
        while (remaining := end - time.monotonic()) > 0:
            read_timeout = remaining if original_timeout is None else min(original_timeout, remaining)
            if s.timeout != read_timeout:
                s.timeout = read_timeout
            line = s.readline().decode("utf-8", "replace").strip()
            if time.monotonic() >= end:
                break
            if line == want or line.startswith("ERR"):
                return line, skipped
            if line:
                skipped.append(line)
                del skipped[:-5]
    finally:
        if s.timeout != original_timeout:
            s.timeout = original_timeout
    return None, skipped


def fail(n, line, skipped):
    print(f"{n}: board said {line!r}" if line else f"{n}: no reply from the board")
    if skipped:
        print("  last lines skipped: " + " | ".join(skipped[-5:]))
    sys.exit(1)


def transfer_order(n):
    return (n == "games.txt", n.endswith(".cfg"), n)


def self_check():
    names = sorted(["games.txt", "teddy.cfg", "map.bin"], key=transfer_order)
    assert names == ["map.bin", "teddy.cfg", "games.txt"], names
    from unittest.mock import patch

    class Fake:
        timeout = 5
        def __init__(self, lines): self.lines = [l.encode() + b"\n" for l in lines]
        def readline(self): return self.lines.pop(0) if self.lines else b""
    assert wait_reply(Fake(["SCREEN picker", "PACK 3", "", "GO"]), "GO", 1) == ("GO", ["SCREEN picker", "PACK 3"])
    assert wait_reply(Fake(["LOG x", "ERR full"]), "OK", 1) == ("ERR full", ["LOG x"])
    assert wait_reply(Fake(["LOG a"]), "GO", 0.3) == (None, ["LOG a"])
    class LateReply(Fake):
        now = 0
        def readline(self):
            self.read_timeout = self.timeout
            self.now += 0.020
            return b"OK\n"

    port = LateReply([])
    with patch.object(time, "monotonic", lambda: port.now):
        assert wait_reply(port, "OK", 0.005) == (None, [])
        assert port.read_timeout == 0.005 and port.timeout == 5
    logs = [f"LOG {i}" for i in range(8)]
    assert wait_reply(Fake(logs + ["GO"]), "GO") == ("GO", logs[-5:])
    print("self-check ok")


ap = argparse.ArgumentParser()
ap.add_argument("port", nargs="?")
ap.add_argument("folder", nargs="?")
ap.add_argument("--self-check", action="store_true", help="test transfer order and the reply reader with a fake serial port and exit")
a = ap.parse_args()
if a.self_check:
    self_check(); sys.exit(0)
if not (a.port and a.folder):
    ap.error("port and folder are required")
import serial
from pocketStatus import show, clear, open_port
s = open_port(a.port, 5)
time.sleep(0.3)
s.reset_input_buffer()
show(s, "Writing games to SD")
try:
    names = sorted(os.listdir(a.folder), key=transfer_order)
    total = sum(os.path.getsize(os.path.join(a.folder, n)) for n in names)
    sent, t0 = 0, time.time()
    for i, n in enumerate(names):
        data = open(os.path.join(a.folder, n), "rb").read()
        s.write(f"W {n} {len(data)}\n".encode())
        line, skipped = wait_reply(s, "GO")
        if line != "GO":
            fail(n, line, skipped)
        for k in range(0, len(data), 256):
            s.write(data[k:k + 256])
            if s.read(1) != b".":
                print(f"{n}: no acknowledgement at byte {k}"); sys.exit(1)
        line, skipped = wait_reply(s, "OK")
        if line != "OK":
            fail(n, line, skipped)
        sent += len(data)
        if i % 25 == 0:
            print(f"{i}/{len(names)} files, {sent}/{total} bytes, {int(time.time()-t0)} s", flush=True)
    clear(s); time.sleep(0.2)
    s.dtr = False; s.rts = True; time.sleep(0.1); s.rts = False  # reset the board
    print(f"done: {len(names)} files, {sent} bytes in {int(time.time()-t0)} s; board resetting")
finally:
    try:
        clear(s)
        time.sleep(0.2)
    except Exception:
        pass
