#!/usr/bin/env python3
"""Drive the Pocket Player 2.8 four-step setup over serial as a pretend user (BOOT presses and taps), for a glass that
needs MIRROR presses of step 1, TURN presses of step 2, ORIENT presses of step 3 and COLORS presses of step 4.
usage: pocketSetupDrive.py PORT MIRROR TURN ORIENT COLORS [WIRING]   (MIRROR 0/1, TURN 0/1, ORIENT 0/1, COLORS 0..3, WIRING 0..7 of the touch chip, default 5)
Needs the board freshly 'S forget nvs' + restart (step 1). Run it with the PlatformIO python (has pyserial).
Each BOOT press is 'S boot' and an OK is 'S tap RX RY' (any position counts); the three calibration taps use raw readings
made from the wiring the way src/touchcal.h expects (bit 2: axes swapped, bit 1: the x axis counts down, bit 0: the y axis does)."""
import sys, time, serial
port = sys.argv[1]
mirror, turn, orient, colors = (int(a) for a in sys.argv[2:6])
wiring = int(sys.argv[6]) if len(sys.argv) > 6 else 5
s = serial.Serial(port, 115200, timeout=0.2)
def pump(t):
    end = time.time() + t
    while time.time() < end:
        l = s.readline().decode('utf-8', 'replace').rstrip()
        if l and ('setup' in l or 'SETUP' in l or 'cal' in l or 'display' in l): print('<', l)
def send(c, wait=1.2):
    s.write((c + '\n').encode()); print('>', c); pump(wait)
def raw_of(x, y):  # raw reading of a logical screen point (320 x 240) for the pretend wiring, margin 24
    sw, fx, fy = wiring >> 2 & 1, wiring >> 1 & 1, wiring & 1
    def ax(v, span, flip):
        f = min(max((v - 24) / (span - 1 - 48), 0), 1)
        return int(450 + (1 - f if flip else f) * 3200)
    a, b = ax(x, 320, fx), ax(y, 240, fy)
    return (b, a) if sw else (a, b)
pump(1)
send('S st')
for _ in range(mirror): send('S boot')
send('S tap 2000 2000')          # OK step 1
for _ in range(turn): send('S boot')
send('S tap 2000 2000')          # OK step 2
for _ in range(orient): send('S boot')
send('S tap 2000 2000')          # OK step 3
for _ in range(colors): send('S boot')
send('S tap 2000 2000', 2.0)     # OK step 4
for x, y in ((24, 24), (295, 24), (24, 215)):
    rx, ry = raw_of(x, y); send(f'S tap {rx} {ry}', 1.5)
pump(2)
rx, ry = raw_of(264, 218); send(f'S tap {rx} {ry}', 1.5)  # Done on the calibration's check screen
send('S st', 2.5)
