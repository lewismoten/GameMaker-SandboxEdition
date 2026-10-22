#!/usr/bin/env python3
# Cuts the digitized speech for "The Great Dairy Reckoning of 3:17 a.m." (The Bard of Bizarre, a
# spoken monologue) out of the recording, which is NOT committed (.for-lewis/songs/reckoning/
# The Great Dairy Reckoning of 3_17 a.m..mp3), into games/reckoning/src/sound/clips/<name>.pcm
# (games/kit/song/cutclips.py does the cutting; see it for the filters), which
# games/reckoning/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/reckoning/tools/cutClips.py [path/to/recording.mp3] [--out DIR]
#
# The cues were found with Whisper's word timings (tools/analyze.py prints them); each edge
# snaps to the quietest 10 ms of the voice nearby. Game-Maker reads a VOC's size as 16 bits, so
# a clip at 11025 Hz stays under 3.6 s; the two longer lines are kept at 8000 Hz (a VOC can say
# its own rate) so all of them fit.
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
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'reckoning', 'The Great Dairy Reckoning of 3_17 a.m..mp3'),
    'out': os.path.join(ROOT, 'games', 'reckoning', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'enemy': (0.00, 3.45, 0.01, 0.25),  # "The enemy. And the lover."
        'cant': (14.20, 17.15, 0.01, 0.25),  # "I shouldn't. I can't."
        'better': (39.55, 40.40, 0.01, 0.12),  # "You know better."
        'betray': (73.70, 76.45, 0.01, 0.30),  # "Why must betrayal taste so good?!"
        'ohno': (77.95, 80.75, 0.01, 0.15),  # "Oh no, oh no, oh no no no no no"
        'worth': (111.95, 114.00, 0.01, 0.30),  # "IT'S NOT WORTH IT!"
        'colon': (122.85, 124.85, 0.01, 0.20),  # "My colon is in open rebellion!"
        'coward': (128.55, 131.35, 0.01, 0.25),  # "You lactose-weak mortal, you cheesy coward."
        'begone': (132.00, 133.50, 0.01, 0.12),  # "Begone, foul beast!"
        'almond': (133.95, 135.95, 0.01, 0.20),  # "I have almond milk now!"
        'suffer': (148.80, 151.35, 0.01, 0.25),  # "You've made your choice. Now suffer."
        'shins': (156.10, 158.85, 0.01, 0.25),  # "I'm sweating from my shins!"
        'lactaid': (176.05, 179.10, 0.01, 0.40),  # "...Is there Lactaid in hell?"
    },
    # longer than 3.6 s: cut whole and kept at SLOW_RATE
    'slow': {
        'intol': (17.70, 21.75, 0.01, 0.30),  # "I am lactose intolerant."
        'demon': (115.90, 119.75, 0.01, 0.30),  # "Sweet dairy demon, you lie!"
    },
}
SLOW_RATE = 8000

if __name__ == '__main__':
    cutclips.main(SONG)
    argv = sys.argv[1:]
    out = argv[argv.index('--out') + 1] if '--out' in argv else SONG['out']
    args = [a for a in argv if not a.startswith('--') and a != out]
    x = cutclips.decode(args[0] if args else SONG['mp3'])
    env = cutclips.voice_envelope(x)
    cutclips.MAX_SECONDS = 4.9
    for name, (s, e, fi, fo) in SONG['slow'].items():
        start, end, p = cutclips.cut(x, env, s, e, fi, fo)
        y = (p.astype(np.float64) - 128) / 127
        y = sg.resample_poly(y, SLOW_RATE // 25, cutclips.RATE // 25)
        y *= 0.97 / np.abs(y).max()
        data = np.clip(np.round(y * 127 + 128), 0, 255).astype(np.uint8)
        if len(data) + 33 >= 40000:
            raise SystemExit('%s is %d bytes as a VOC' % (name, len(data) + 33))
        with open(os.path.join(out, name + '.pcm'), 'wb') as f:
            f.write(data.tobytes())
        print('%-10s %7.2f - %7.2f s  %.2f s  %6d samples at %d Hz  VOC %6d bytes' % (name, start, end, end - start, len(data), SLOW_RATE, len(data) + 33))
