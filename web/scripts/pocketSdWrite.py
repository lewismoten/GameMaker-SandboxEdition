#!/usr/bin/env python3
"""Writes a Pocket Player microSD card's files to the card in the board over USB serial (no card reader needed).

Run with PlatformIO's Python (it has pyserial), with the board on its game list and a card in its slot:
  cd web && npx vite-node scripts/pocketData.ts --out /tmp/pocketcard
  ~/.platformio/penv/bin/python web/scripts/pocketSdWrite.py /dev/cu.usbserial-XXXX /tmp/pocketcard/pocket
Sends every file of the folder to /pocket/ on the card (256 bytes at a time, about 10 KB/s: 2 MB takes several minutes), the list
last, then resets the board so it reads the new list. A file already on the card is replaced. Exits 1 on any error.
"""
import sys, os, time, argparse
import serial

ap = argparse.ArgumentParser()
ap.add_argument("port")
ap.add_argument("folder")
a = ap.parse_args()
s = serial.Serial(a.port, 115200, timeout=5)
time.sleep(0.3)
s.reset_input_buffer()
names = sorted(os.listdir(a.folder), key=lambda n: (n.endswith(".cfg") or n == "games.txt", n))
total = sum(os.path.getsize(os.path.join(a.folder, n)) for n in names)
sent, t0 = 0, time.time()
for i, n in enumerate(names):
    data = open(os.path.join(a.folder, n), "rb").read()
    s.write(f"W {n} {len(data)}\n".encode())
    line = s.readline().decode("utf-8", "replace").strip()
    if line != "GO":
        print(f"{n}: board said {line!r}"); sys.exit(1)
    for k in range(0, len(data), 256):
        s.write(data[k:k + 256])
        if s.read(1) != b".":
            print(f"{n}: no acknowledgement at byte {k}"); sys.exit(1)
    line = s.readline().decode("utf-8", "replace").strip()
    if line != "OK":
        print(f"{n}: board said {line!r}"); sys.exit(1)
    sent += len(data)
    if i % 25 == 0:
        print(f"{i}/{len(names)} files, {sent}/{total} bytes, {int(time.time()-t0)} s", flush=True)
s.dtr = False; s.rts = True; time.sleep(0.1); s.rts = False  # reset the board
print(f"done: {len(names)} files, {sent} bytes in {int(time.time()-t0)} s; board resetting")
