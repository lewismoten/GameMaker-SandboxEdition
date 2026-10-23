#!/usr/bin/env python3
# Cuts the sung Latin clips of Veni, Vidi, Risi! out of the six recordings, which are NOT
# committed (.for-lewis/songs/veni-vidi-risi/<title>.mp3), into games/risi/src/sound/clips/
# <name>.pcm (games/kit/song/cutclips.py does the cutting; see it for the filters), which
# games/risi/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/risi/tools/cutClips.py [--out DIR]
#
# The cues were found with Whisper's Latin word timings (the .json beside each MP3, and a second
# pass prompted with the written lyrics); each edge snaps to the quietest 10 ms of the voice
# nearby. Game-Maker reads a VOC's size as 16 bits, so a clip at 11025 Hz stays under 3.6 s; the
# longer lines are kept whole at 8000 Hz (up to 4.9 s).
import os
import sys

import numpy as np
import scipy.signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import cutclips  # noqa: E402

SONGS_DIR = os.path.join(ROOT, '.for-lewis', 'songs', 'veni-vidi-risi')
OUT = os.path.join(ROOT, 'games', 'risi', 'src', 'sound', 'clips')
SLOW_RATE = 8000

# recording: {name: (start, end, fade in, fade out, slow)} in seconds of the recording
CUES = {
    'Canis Meus Flatum Dedit': {
        'canis': (7.54, 12.26, 0.01, 0.30, True),  # "Canis meus... flatum dedit!"
        'dii': (12.86, 15.92, 0.01, 0.25, False),  # "O dii immortales"
        'flatus': (67.62, 70.16, 0.01, 0.25, False),  # "O flatus, perfidus ventus!"
    },
    'Laudes Ignavi': {
        'summa': (13.56, 16.56, 0.01, 0.25, False),  # "Summa laus et gloria"
        'currimus': (75.74, 79.08, 0.01, 0.20, False),  # "Cucurri-curri-currimus!"
        'victoria': (79.68, 83.82, 0.01, 0.35, True),  # "Ad victoriam pervenimus!"
    },
    'Titus Torquet Lingua': {
        'titus': (19.22, 23.00, 0.01, 0.25, True),  # "Titus tot titulos tetigit"
        'ter': (25.08, 27.92, 0.01, 0.20, False),  # "Titus, titulus ter!"
        'tecta': (27.92, 32.44, 0.01, 0.30, True),  # "Tanta tecta tecti tectis"
    },
    'Felis Fortissimus': {
        'felis': (39.68, 43.06, 0.01, 0.25, False),  # "Felis fortissimus, terror nocturnus!"
        'cheddar': (84.10, 85.76, 0.01, 0.20, False),  # "Ubi est cheddar?"
        'corona': (125.50, 128.80, 0.01, 0.35, False),  # "...corona casei!"
    },
    'Canit Piscis Aureus_': {
        'piscis': (15.10, 19.54, 0.01, 0.35, True),  # "O piscis aureus"
        'cantemus': (143.44, 146.10, 0.01, 0.30, False),  # "Cantemus omnes"
    },
    'Silentium Ridentium': {
        'nemo': (55.56, 58.44, 0.01, 0.30, False),  # "...nemo ridet."
        'quis': (75.36, 77.56, 0.01, 0.25, False),  # "...sed quis ridet?"
        'ridetis': (160.08, 164.64, 0.01, 0.35, True),  # "Ridetisne? Nonne ridetis?"
    },
}


def main():
    argv = sys.argv[1:]
    out = argv[argv.index('--out') + 1] if '--out' in argv else OUT
    os.makedirs(out, exist_ok=True)
    for title, cues in CUES.items():
        x = cutclips.decode(os.path.join(SONGS_DIR, title + '.mp3'))
        env = cutclips.voice_envelope(x)
        for name, (s, e, fi, fo, slow) in cues.items():
            cutclips.MAX_SECONDS = 4.9 if slow else 3.6
            start, end, p = cutclips.cut(x, env, s, e, fi, fo)
            rate = cutclips.RATE
            data = p
            if slow:
                y = (p.astype(np.float64) - 128) / 127
                y = sg.resample_poly(y, SLOW_RATE // 25, cutclips.RATE // 25)
                y *= 0.97 / np.abs(y).max()
                data = np.clip(np.round(y * 127 + 128), 0, 255).astype(np.uint8)
                rate = SLOW_RATE
            if len(data) + 33 >= 40000:
                raise SystemExit('%s is %d bytes as a VOC' % (name, len(data) + 33))
            with open(os.path.join(out, name + '.pcm'), 'wb') as f:
                f.write(data.tobytes())
            print('%-10s %7.2f - %7.2f s  %.2f s  %6d samples at %5d Hz  VOC %6d bytes' % (name, start, end, end - start, len(data), rate, len(data) + 33))


if __name__ == '__main__':
    main()
