#!/usr/bin/env python3
# Cuts the digitized sound clips for "Mustard Seed Hustle" out of the recording, which is NOT
# committed (.for-lewis/songs/mustard/Mustard Seed Hustle.mp3), into
# games/mustard/src/sound/clips/<name>.pcm (games/kit/song/cutclips.py does the cutting; see it
# for the filters), which games/mustard/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/mustard/tools/cutClips.py [path/to/song.mp3] [--out DIR]
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
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'mustard', 'Mustard Seed Hustle.mp3'),
    'out': os.path.join(ROOT, 'games', 'mustard', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'hustle': (29.80, 32.18, 0.01, 0.12),  # chorus 1: "...it's the mustard seed hustle!" ("movin'" starts at 32.38)
        'hallelu': (121.90, 123.12, 0.02, 0.20),  # the shout at the end: "Hallelujah!" ("keep" at 123.16)
        'keepon': (102.90, 104.42, 0.01, 0.15),  # the bridge: "Keep on hustlin'" ("keep the faith" at 104.48)
        'alive': (123.10, 126.30, 0.01, 0.40),  # the last line: "keep the mustard seed hustle alive!"
        'mountain': (117.20, 119.62, 0.01, 0.15),  # "Tiny faith can move mountains" ("just wait" at 119.68)
        'feet': (46.86, 48.80, 0.01, 0.30),  # chorus 1: "...got the greatest feet!"
    },
}

if __name__ == '__main__':
    cutclips.main(SONG)
