#!/usr/bin/env python3
# Cuts the digitized sound clips for "Thread the Needle, Brother Camel" out of the recording,
# which is NOT committed (.for-lewis/songs/needle/Thread the Needle, Brother Camel.mp3), into
# games/needle/src/sound/clips/<name>.pcm (games/kit/song/cutclips.py does the cutting; see it
# for the filters), which games/needle/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/needle/tools/cutClips.py [path/to/song.mp3] [--out DIR]
#
# The cue table below was found with analyze.py's word timings (see clips.ts); each edge snaps
# to the quietest 10 ms of the voice nearby.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import cutclips  # noqa: E402

SONG = {
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'needle', 'Thread the Needle, Brother Camel.mp3'),
    'out': os.path.join(ROOT, 'games', 'needle', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'thread': (121.80, 124.50, 0.01, 0.15),  # the last chorus: "Thread the needle, Brother Camel..." ("squeeze" at 124.62)
        'squeeze': (124.55, 125.80, 0.01, 0.20),  # "...squeeze on through!"
        'gold': (135.85, 139.45, 0.01, 0.30),  # "(So) drop that gold and run your race!"
        'dream': (151.90, 155.40, 0.01, 0.40),  # "Even a camel can dream!"
        'humpdown': (160.95, 164.20, 0.02, 0.40),  # the outro, slow over the desert wind: "Hump down..." ("thread up... mercy come" are hardly sung)
    },
}

if __name__ == '__main__':
    cutclips.main(SONG)
