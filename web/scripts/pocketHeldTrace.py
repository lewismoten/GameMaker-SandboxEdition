#!/usr/bin/env python3
"""Pocket Player held-input trace. Usage: pocketHeldTrace.py PORT GAME_INDEX [x y] [seconds]
Starts the game from the list (G), turns the trace on (V 1), optionally holds a made-up finger at screen x,y (I), prints
tick-by-tick key lines (K) and chip reports (R), summarizes: ticks with the key down, gaps. Without x y it just listens (for a live test)."""
import sys, time, serial
port, g = sys.argv[1], sys.argv[2]
xy = sys.argv[3:5] if len(sys.argv) >= 5 else None
secs = float(sys.argv[5] if len(sys.argv) >= 6 else (sys.argv[3] if len(sys.argv) == 4 else 6))
s = serial.Serial(port, 115200, timeout=0.2)
time.sleep(0.3); s.reset_input_buffer()
if g != '-':
    s.write(f"G {g}\n".encode()); time.sleep(4)
s.write(b"V 1\n")
if xy: s.write(f"I {xy[0]} {xy[1]}\n".encode())
end = time.time() + secs; K = []; R = []
while time.time() < end:
    l = s.readline().decode('utf-8','replace').strip()
    if l.startswith('K '): K.append(l)
    elif l.startswith('R '): R.append(l)
    elif l: print('(board)', l)
s.write(b"I off\nV 0\n"); s.close()
print(len(K), 'ticks', len(R), 'reports')
print('\n'.join(K[:12])); print('...')
up = [('up=1' in k) for k in K]
print('ticks with Up down:', sum(up), 'of', len(up))
ts = [int(k.split()[1]) for k in K]
d = [b - a for a, b in zip(ts, ts[1:])]
print('tick gaps ms: min', min(d) if d else '-', 'max', max(d) if d else '-', 'avg', sum(d)/len(d) if d else '-')
if R:
    rs = [int(r.split()[1]) for r in R]; rd = [b - a for a, b in zip(rs, rs[1:])]
    print('reports gaps ms: min', min(rd), 'max', max(rd)); print('zero-point reports:', sum(' n=0 ' in r for r in R))
