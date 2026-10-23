#!/usr/bin/env python3
# Cuts the digitized sound clips for "Where's the Remote?" out of the recording, which is NOT
# committed (.for-lewis/songs/remote/Where's The Remote.mp3), into
# games/remote/src/sound/clips/<name>.pcm (games/kit/song/cutclips.py does the cutting; see it
# for the filters), which games/remote/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/remote/tools/cutClips.py [path/to/song.mp3] [--out DIR]
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
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'remote', "Where's The Remote.mp3"),
    'out': os.path.join(ROOT, 'games', 'remote', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'remote': (23.30, 25.00, 0.01, 0.25),  # chorus 1: "Where's the remote?!" ("I" at 25.18)
        'dogcat': (31.10, 33.30, 0.01, 0.20),  # chorus 1: "Lifted the dog, looked under the cat."
        'fridge': (52.10, 55.10, 0.01, 0.30),  # verse 2: "Opened the fridge, who knows anymore?"
        'mom': (55.85, 57.30, 0.01, 0.15),  # verse 2: "Called my mom..."
        'hand': (59.30, 61.60, 0.01, 0.25),  # verse 2: "She said, 'Check your hand.'" ("But" at 61.86)
        'raccoon': (93.95, 95.50, 0.01, 0.20),  # the bridge: "a tiny raccoon"
        'sneaky': (114.05, 116.20, 0.01, 0.25),  # the last chorus: "There you are, you sneaky guy."
    },
}

if __name__ == '__main__':
    cutclips.main(SONG)
