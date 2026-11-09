#!/usr/bin/env python3
"""Drive the Pocket Player 2.8 three-step setup over serial as a pretend user (BOOT presses and taps), for a glass that
needs MIRROR presses of step 1, ORIENT presses of step 2 and COLORS presses of step 3.
usage: pocketSetupDrive.py PORT MIRROR ORIENT COLORS [WIRING]   (MIRROR 0/1, ORIENT 0..5, COLORS 0..3, WIRING 0..7 of the touch chip, default 5)
Needs the board freshly 'S forget nvs' + restart (step 1). Run it with the PlatformIO python (has pyserial).
Each BOOT press is 'S boot' and an OK is 'S tap RX RY' (any position counts); the three calibration taps use raw readings
made from the wiring the way src/touchcal.h expects (bit 2: axes swapped, bit 1: the x axis counts down, bit 0: the y axis does)."""
import sys, time, serial
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.join(_os.environ.get('GAMEMAKER_POCKET_DIR') or _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', '..', 'gamemaker-pocket'), 'scripts'))  # pocketStatus.py lives in the gamemaker-pocket repository
from pocketStatus import show, clear, open_port, take_reset_flag
reset = take_reset_flag()
port = sys.argv[1]
mirror, orient, colors = (int(a) for a in sys.argv[2:5])
wiring = int(sys.argv[5]) if len(sys.argv) > 5 else 5
s = open_port(port, 0.2, reset)
def pump(t):
    end = time.time() + t
    while time.time() < end:
        l = s.readline().decode('utf-8', 'replace').rstrip()
        if l and ('setup' in l or 'SETUP' in l or 'cal' in l or 'display' in l): print('<', l)
def send(c, wait=1.2):
    if not c.startswith('S st'): show(s, ('Setup drive: ' + c)[:40])
    s.write((c + '\n').encode()); print('>', c); pump(wait)
def raw_of(x, y):  # raw reading of a logical screen point (320 x 240) for the pretend wiring, margin 24
    sw, fx, fy = wiring >> 2 & 1, wiring >> 1 & 1, wiring & 1
    def ax(v, span, flip):
        f = min(max((v - 24) / (span - 1 - 48), 0), 1)
        return int(450 + (1 - f if flip else f) * 3200)
    a, b = ax(x, 320, fx), ax(y, 240, fy)
    return (b, a) if sw else (a, b)
pump(1)
show(s, 'Setup drive: starting')
send('S st')
for _ in range(mirror): send('S boot')
send('S tap 2000 2000')          # OK step 1
for _ in range(orient): send('S boot')
send('S tap 2000 2000')          # OK step 2
for _ in range(colors): send('S boot')
send('S tap 2000 2000', 2.0)     # OK step 3
for x, y in ((24, 24), (295, 24), (24, 215)):
    rx, ry = raw_of(x, y); send(f'S tap {rx} {ry}', 1.5)
pump(2)
rx, ry = raw_of(264, 218); send(f'S tap {rx} {ry}', 1.5)  # Done on the calibration's check screen
send('S st', 2.5)
clear(s); time.sleep(0.2)
