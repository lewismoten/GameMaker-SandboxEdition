#!/usr/bin/env python3
"""Drive the Pocket Player 2.8 three-step setup over serial as a pretend user (BOOT presses and taps), for a glass that
needs MIRROR presses of step 1, ORIENT presses of step 2 and COLORS presses of step 3.
usage: pocketSetupDrive.py PORT MIRROR ORIENT COLORS [WIRING]   (MIRROR 0/1, ORIENT 0..5, COLORS 0..3, WIRING 0..7 of the touch chip, default 5)
Needs the board freshly 'S forget nvs' + restart (step 1). Run it with the PlatformIO python (has pyserial).
Each BOOT press is 'S boot' and an OK is 'S tap RX RY' (any position counts); the three calibration taps use raw readings
made from the wiring the way src/touchcal.h expects (bit 2: axes swapped, bit 1: the x axis counts down, bit 0: the y axis does)."""
import re, sys, time
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.join(_os.environ.get('GAMEMAKER_POCKET_DIR') or _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', '..', 'gamemaker-pocket'), 'scripts'))  # pocketStatus.py lives in the gamemaker-pocket repository
from pocketStatus import show, clear, open_port, take_reset_flag
reset = take_reset_flag()
port = sys.argv[1]
mirror, orient, colors = (int(a) for a in sys.argv[2:5])
wiring = int(sys.argv[5]) if len(sys.argv) > 5 else 5
s = open_port(port, 0.2, reset)
def expect(pattern):
    deadline = time.monotonic() + 8
    while time.monotonic() < deadline:
        line = s.readline().decode('utf-8', 'replace').strip()
        if line:
            print('<', line)
            if re.match(pattern, line):
                return
    sys.exit(f'Timed out waiting for {pattern}')

def send(command, expected):
    if command != 'S st':
        show(s, ('Setup drive: ' + command)[:40])
    s.write((command + '\n').encode())
    print('>', command)
    expect(expected)

def raw_of(x, y):  # raw reading of a logical screen point (320 x 240) for the pretend wiring, margin 24
    sw, fx, fy = wiring >> 2 & 1, wiring >> 1 & 1, wiring & 1
    def ax(v, span, flip):
        f = min(max((v - 24) / (span - 1 - 48), 0), 1)
        return int(450 + (1 - f if flip else f) * 3200)
    a, b = ax(x, 320, fx), ax(y, 240, fy)
    return (b, a) if sw else (a, b)
try:
    show(s, 'Setup drive: starting')
    send('S st', r'SETUP chip=\S+ state=[01] step=0 live=1,')
    for step, presses in enumerate((mirror, orient, colors), 1):
        for _ in range(presses):
            send('S boot', f'setup: step {step} ')
        next_screen = f'setup: step {step + 1} ' if step < 3 else 'setup: display panel '
        send('S tap 2000 2000', next_screen)
    for target, (x, y) in enumerate(((24, 24), (295, 24), (24, 215)), 1):
        rx, ry = raw_of(x, y)
        send(f'S tap {rx} {ry}', f'cal tap {target} raw {rx},{ry}$')
    expect('cal saved swap=')
    rx, ry = raw_of(264, 218)
    send(f'S tap {rx} {ry}', r'SETUP saved .* full=1\b')
    send('S st', r'SETUP chip=\S+ state=3 step=0 .*valid=1 full=1 .*nvs=\d+,\d+,3\b')
finally:
    clear(s)
