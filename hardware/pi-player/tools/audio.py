"""Extract effect VOC sidecars from an original DOS disk; Pocket bundles stay unchanged."""
import argparse
import shutil
import struct
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('disk', type=Path)
parser.add_argument('sidecar', type=Path, help='bundle.GMP.audio (or data-directory.audio)')
parser.add_argument('--game', help='GAM filename if more than one exists')
args = parser.parse_args()
files = {p.name.lower(): p for p in args.disk.iterdir() if p.is_file()}
games = [p for n, p in files.items() if n.endswith('.gam')]
if args.game:
    games = [files[args.game.lower()]]
if len(games) != 1:
    parser.error('choose one GAM with --game')
b = games[0].read_bytes()
if b[:2] != b'GM' or len(b) < 264:
    parser.error('first cut supports version 3.00 GAM files only')
count, slots, links = struct.unpack_from('<HHH', b, 256)
pool = 262 + count * 283 + 2
if slots != 20 or links != 20 or pool > len(b):
    parser.error('invalid GAM scene table')
args.sidecar.mkdir(parents=True, exist_ok=True)
rows = []
level = 0
for scene in range(count):
    at = 262 + scene * 283
    if struct.unpack_from('<H', b, at)[0] != 10:
        continue
    offset = struct.unpack_from('<H', b, at + 43 + 7 * 2)[0]
    if offset:
        name = b[pool + offset:].split(b'\0', 1)[0].decode('ascii').lower()
        snd = files.get(name if name.endswith('.snd') else name + '.snd')
        if snd:
            sound = snd.read_bytes()
            for effect in range(30):
                raw = sound[2160 + effect * 9:2160 + (effect + 1) * 9]
                voice = raw.split(b'\0', 1)[0].decode('ascii').strip().lower()
                if not voice:
                    continue
                path = files.get(voice if voice.endswith('.voc') else voice + '.voc')
                if path:
                    target = f'{level}-{effect}.voc'
                    shutil.copyfile(path, args.sidecar / target)
                    rows.append(f'{level} {effect} {target}')
    level += 1
(args.sidecar / 'audio.txt').write_text('\n'.join(rows) + '\n')
print(f'{len(rows)} effect mappings; preserve the original game notices with this sidecar')
