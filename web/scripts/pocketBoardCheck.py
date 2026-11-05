#!/usr/bin/env python3
"""Board self-test for the Pocket Player: sends `T all <ticks>` over serial, prints a table.

Run with PlatformIO's Python (it has pyserial):
  ~/.platformio/penv/bin/python web/scripts/pocketBoardCheck.py /dev/cu.usbserial-XXXX [--ticks 300]
Needs the board on the game list. Exits 1 on any failed load, a stack high-water mark under
1024 bytes, or no answer. Never run it while someone is using the board.
"""
import sys, time, argparse
import serial

ap = argparse.ArgumentParser()
ap.add_argument("port")
ap.add_argument("--ticks", type=int, default=300)
ap.add_argument("--index", help="one game index instead of all")
ap.add_argument("--timeout", type=float, default=600)
a = ap.parse_args()

s = serial.Serial(a.port, 115200, timeout=1)
time.sleep(0.3)
s.reset_input_buffer()
s.write(f"T {a.index if a.index is not None else 'all'} {a.ticks}\n".encode())
rows, end, bad = [], time.time() + a.timeout, False
done = False
while time.time() < end and not done:
    line = s.readline().decode("utf-8", "replace").strip()
    if line.startswith("ST done"):
        done = True
    elif line.startswith("ST error"):
        print(line); sys.exit(1)
    elif line.startswith("ST "):
        rows.append(dict(kv.split("=") for kv in line[3:].split()))
    elif line:
        print("  (board)", line)
s.close()
print(f"{'game':<16}{'ok':<5}{'free':>8}{'largest':>9}{'minfree':>9}{'stack':>7}")
for r in rows:
    fail = r["ok"] != "1" or int(r["stack"]) < 1024
    bad |= fail
    print(f"{r['id']:<16}{'yes' if r['ok']=='1' else 'FAIL':<5}{r['free']:>8}{r['largest']:>9}{r['min']:>9}{r['stack']:>7}{'  <-- check' if fail else ''}")
if not done:
    print("no 'ST done' line: the board stopped answering (crashed or reset?)"); bad = True
if not rows:
    print("no results"); bad = True
sys.exit(1 if bad else 0)
