#!/usr/bin/env python3
"""Drive the Pocket Player 2.8 setup flow over serial as a pretend user with a chosen picture flip H (0..3) and touch wiring M (0..7).
usage: flowdrive.py PORT H M FAULT   (FAULT 0..3 = which color fault the pretend panel has: bit0 inverted, bit1 red/blue swapped)
Needs the board freshly 'S forget nvs' + restart (step 1). Prints the board's lines; the same tables as src/setupflow.h."""
import sys, time, serial
port, H, M, FAULT = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
LAYOUT = [[0,1,2,3],[0,2,3,1],[1,0,3,2]]
def raw_quad_of(p, m):
    sw, fx, fy = m>>2&1, m>>1&1, m&1
    px, py = (p&1)^fx, (p>>1)^fy
    return (py|px<<1) if sw else (px|py<<1)
def raw_xy_quad(rq): return (3300 if rq&1 else 700, 3300 if rq&2 else 700)
def raw_of_point(x, y, m):  # raw reading of a screen point (after the picture is right), by the pretend wiring
    sw, fx, fy = m>>2&1, m>>1&1, m&1
    def ax(v, span, flip):
        f = (v-24)/(span-1-48); f = min(max(f,0),1)
        if flip: f = 1-f
        return int(450+f*3200)
    a = ax(x, 320, fx); b = ax(y, 240, fy)
    return (b, a) if sw else (a, b)
s = serial.Serial(port, 115200, timeout=0.2)
def pump(t):
    end = time.time()+t
    while time.time() < end:
        l = s.readline().decode('utf-8','replace').rstrip()
        if l and ('setup' in l or 'SETUP' in l or 'cal' in l or 'display' in l): print('<', l)
def send(c, wait=1.0):
    s.write((c+'\n').encode()); print('>', c); pump(wait)
pump(1)
for r in range(3):
    q = next(q for q in range(4) if LAYOUT[r][q]==H) ^ H
    x, y = raw_xy_quad(raw_quad_of(q, M)); send(f'S tap {x} {y}', 1.3)
send('S st')
# step 2: tap the set whose fault matches
cx, cy = (FAULT&1)*160+80, 24+(FAULT>>1)*108+54
x, y = raw_of_point(cx, cy, M); send(f'S tap {x} {y}', 1.0)
pump(6)  # a changed color mode restarts the board
send('S st')
