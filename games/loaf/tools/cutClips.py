#!/usr/bin/env python3
# Cuts the digitized sound clips for "Loaf #13 (Left in the Basket)" out of the recording, which
# is NOT committed (.for-lewis/songs/loaf/Loaf #13 (Left in the Basket).mp3), into
# games/loaf/src/sound/clips/<name>.pcm (games/kit/song/cutclips.py does the cutting; see it for
# the filters), which games/loaf/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/loaf/tools/cutClips.py [path/to/song.mp3] [--out DIR]
#
# The cue table below was found with analyze.py's word timings (see clips.ts); each edge snaps
# to the quietest 10 ms of the voice nearby. "Mama, look what I've got" is sung with a breath
# between the two that would make it too long for one VOC (Game-Maker reads 16 bits of size), so
# it is spliced ("Mama," then a short gap, then "look what I've got") and kept at 8000 Hz (a VOC
# can say its own rate) so all of it fits.
import os
import sys

import numpy as np
import scipy.signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import cutclips  # noqa: E402

SONG = {
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'loaf', 'Loaf #13 (Left in the Basket).mp3'),
    'out': os.path.join(ROOT, 'games', 'loaf', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'bread': (69.22, 71.40, 0.01, 0.30),  # chorus 1: "I'm still bread!" ("Don't" at 72.40)
        'countme': (72.35, 75.30, 0.01, 0.25),  # chorus 1: "Don't count me out!"
        'twelve': (106.20, 108.10, 0.01, 0.15),  # the bridge: "twelve baskets full"
        'wasted': (113.15, 116.60, 0.01, 0.40),  # the bridge: "Nothing's ever wasted."
        'still': (195.85, 199.40, 0.01, 0.50),  # the very end, hushed: "I'm still bread."
    },
    # spliced: [(start, end, fade in, fade out), ...] joined with SPLICE_GAP seconds of silence
    'splices': {
        'mama': [(135.88, 137.15, 0.01, 0.08), (137.45, 140.40, 0.01, 0.20)],  # "Mama, look what I've got..."
    },
}
SPLICE_GAP = 0.06
SPLICE_RATE = 8000

if __name__ == '__main__':
    cutclips.main(SONG)
    argv = sys.argv[1:]
    out = argv[argv.index('--out') + 1] if '--out' in argv else SONG['out']
    args = [a for a in argv if not a.startswith('--') and a != out]
    x = cutclips.decode(args[0] if args else SONG['mp3'])
    env = cutclips.voice_envelope(x)
    for name, parts in SONG['splices'].items():
        pcm = []
        for k, (s, e, fi, fo) in enumerate(parts):
            if k:
                pcm.append(np.full(int(SPLICE_GAP * cutclips.RATE), 128, dtype=np.uint8))
            start, end, p = cutclips.cut(x, env, s, e, fi, fo)
            pcm.append(p)
            print('%-10s part %d %7.2f - %7.2f s' % (name, k + 1, start, end))
        y = (np.concatenate(pcm).astype(np.float64) - 128) / 127
        y = sg.resample_poly(y, SPLICE_RATE // 25, cutclips.RATE // 25)
        y *= 0.97 / np.abs(y).max()
        data = np.clip(np.round(y * 127 + 128), 0, 255).astype(np.uint8)
        if len(data) + 33 >= 40000:
            raise SystemExit('%s is %d bytes as a VOC' % (name, len(data) + 33))
        with open(os.path.join(out, name + '.pcm'), 'wb') as f:
            f.write(data.tobytes())
        print('%-10s %.2f s  %6d samples at %d Hz  VOC %6d bytes' % (name, len(data) / SPLICE_RATE, len(data), SPLICE_RATE, len(data) + 33))
