#!/usr/bin/env python3
"""Draws the Pocket Player's Space and Enter buttons for games, with the picture btnicon.h picks for each.

  python3 -I web/scripts/pocketIconsShot.py <out dir> <game id>[:ticks[:seq,seq]] ...

It builds hardware/pocket-player/host/iconsdump.cpp (which runs the firmware's own icon choice on the game's
packed data in hardware/pocket-player/data) and draws the result at the board's 480 x 320 layout, 2x. The
text sizes and the wrapping are a Mac approximation of main.cpp (PIL's font, not the board's); the pictures and
their choice are the firmware's own code. Seqs: sequences to give ammo, to see their pictures.
"""
import math, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'hardware', 'pocket-player')
out, specs = sys.argv[1], sys.argv[2:]
os.makedirs(out, exist_ok=True)
exe = os.path.join(tempfile.mkdtemp(), 'iconsdump')
subprocess.run(['c++', '-std=c++17', '-O1', '-I', os.path.join(here, 'src'), os.path.join(here, 'host', 'iconsdump.cpp'), '-lz', '-o', exe], check=True)

Z = 2
W = 480


def font(sz):
    return ImageFont.load_default(size=max(6, int(round(8 * sz * 1.25))))


def tw(d, s, sz):
    return 6 * sz * len(s)  # the board's 6 px glyphs


def avail(box, y0, y1):
    if not box['round']:
        return box['w'] - 6
    dy = max(abs(y0 - box['cy']), abs(y1 - box['cy']))
    rr = box['r'] - 2
    return 0 if dy >= rr else 2 * math.sqrt(rr * rr - dy * dy)


def text(d, s, x, y, sz, fill, edge):
    f = font(sz)
    if edge:
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            d.text(((x + dx) * Z, (y + dy) * Z), s, font=f, fill=(0, 0, 0), anchor='mm')
    d.text((x * Z, y * Z), s, font=f, fill=fill, anchor='mm')


def name_size(box, name, yc):
    for sz in (2.0, 1.5, 1.0):
        h = int(8 * sz + 0.5)
        if 6 * sz * len(name) <= avail(box, yc - h // 2, yc + h // 2):
            return sz
    return 1.0


def label_lines(box, label, top, maxh):
    label = label[:23]
    for pas in range(3):
        sz = (1.0, 0.75, 0.75)[pas]
        h = int(8 * sz + 0.5)
        if h > maxh:
            continue
        lines = [label]
        if 6 * sz * len(label) > avail(box, top, top + h) and 2 * h <= maxh:
            best = -1
            for i in range(1, len(label) - 1):
                if label[i] == ' ' and (best < 0 or abs(i - len(label) // 2) < abs(best - len(label) // 2)):
                    best = i
            if best > 0:
                lines = [label[:best], label[best + 1:]]
        ok = True
        for k, s in enumerate(lines):
            aw = avail(box, top + k * h, top + k * h + h)
            if 6 * sz * len(s) <= aw:
                continue
            if pas < 2:
                ok = False
                break
            while s and 6 * sz * (len(s) + 3) > aw:
                s = s[:-1]
            lines[k] = s + '...'
        if ok:
            return sz, h, lines
    return 0.75, 6, []


def icon_img(tokens):
    im = Image.new('RGBA', (20, 20), (0, 0, 0, 0))
    for i, t in enumerate(tokens):
        if t != '-':
            im.putpixel((i % 20, i // 20), (int(t[0:2], 16), int(t[2:4], 16), int(t[4:6], 16), 255))
    return im


def disc(img, d, cx, cy, r, name, label, icon):
    fg = (255, 255, 255)
    for k, c in ((r + 1, (0, 0, 0)), (r, fg), (r - 1, fg)):
        d.ellipse([(cx - k) * Z, (cy - k) * Z, (cx + k) * Z, (cy + k) * Z], outline=c, width=Z)
    box = {'round': True, 'cx': cx, 'cy': cy, 'r': r, 'w': 0}
    sub = icon is not None or (label and label != name)
    yc = cy - r // 3 if sub else cy
    text(d, name, cx, yc, name_size(box, name, yc), fg, True)
    if icon is not None:
        S = r * 2 // 3
        d.rectangle([(cx - S // 2 - 1) * Z, (cy + 2) * Z, (cx - S // 2 + S) * Z, (cy + 3 + S) * Z], fill=(0, 0, 0))
        img.paste(icon.resize((S * Z, S * Z), Image.NEAREST), ((cx - S // 2) * Z, (cy + 3) * Z), icon.resize((S * Z, S * Z), Image.NEAREST))
    elif sub:
        sz, h, lines = label_lines(box, label, cy + 3, r - 7)
        for k, s in enumerate(lines):
            text(d, s, cx, cy + 3 + k * h + h // 2, sz, fg, True)


for spec in specs:
    parts = spec.split(':')
    gid, ticks = parts[0], parts[1] if len(parts) > 1 else '30'
    seqs = parts[2].split(',') if len(parts) > 2 else []
    res = subprocess.run([exe, os.path.join(here, 'data'), gid, ticks] + seqs, capture_output=True, text=True, check=True).stdout.splitlines()
    keys, last = {}, None
    for ln in res:
        if ln.startswith('K '):
            _, scan, rest = ln.split(' ', 2)
            n, lab, has = rest.split('|')
            last = int(scan)
            keys[last] = [n, lab, None]
        elif ln.startswith('I ') and last is not None:
            keys[last][2] = icon_img(ln[2:].split())
    img = Image.new('RGB', (W * Z, 320 * Z), (88, 120, 70))  # stand-in for the game behind the buttons
    d = ImageDraw.Draw(img)
    for scan, (cx, cy, r) in ((57, (W - 46, 256, 34)), (28, (W - 12 - 34 - 34 - 30 - 12, 258, 30))):
        if scan in keys:
            n, lab, ic = keys[scan]
            disc(img, d, cx, cy, r, n, lab, ic)
    img.save(os.path.join(out, gid + '.png'))
    print(gid, {k: (v[0], v[1], v[2] is not None) for k, v in keys.items()})
