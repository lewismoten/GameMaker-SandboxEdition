#!/usr/bin/env python3
# Cuts the digitized sound clips for "A Fly Named Carl" out of the recording, which is NOT
# committed (.for-lewis/songs/fly/A fly named Carl.mp3), into games/carl/src/sound/clips/<name>.pcm
# (games/kit/song/cutclips.py does the cutting; see it for the filters), which
# games/carl/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/carl/tools/cutClips.py [path/to/song.mp3] [--out DIR]
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
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'fly', 'A fly named Carl.mp3'),
    'out': os.path.join(ROOT, 'games', 'carl', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'hook': (28.05, 29.95, 0.01, 0.20),  # chorus 1: "There's a fly in the room"
        'miss': (33.55, 34.70, 0.01, 0.12),  # chorus 1: "I swing and I miss"
        'smile': (54.10, 55.62, 0.01, 0.20),  # verse 2: "just to flash me a smile"
        'lamp': (71.40, 72.75, 0.01, 0.15),  # chorus 2: "On my lamp"
        'named': (76.20, 78.70, 0.01, 0.25),  # chorus 2: "I've named it Carl. I hate Carl."
        'window': (95.00, 96.85, 0.01, 0.20),  # the bridge: "I've opened the window"
        'time': (109.25, 111.55, 0.01, 0.25),  # the breakdown: "Carl has broken time"
        'seen': (112.10, 114.30, 0.01, 0.30),  # the breakdown: "Carl has seen things"
        'aux': (142.85, 144.85, 0.01, 0.30),  # the very end: "Carl's got the aux cord now"
    },
}

if __name__ == '__main__':
    cutclips.main(SONG)
