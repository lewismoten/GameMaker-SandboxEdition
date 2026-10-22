#!/usr/bin/env python3
# Cuts the digitized sound clips for "I Screamed, She Smirked" out of the recording, which is NOT
# committed (.for-lewis/songs/smirked/I Screamed, She Smirked.mp3), into
# games/smirked/src/sound/clips/<name>.pcm (games/kit/song/cutclips.py does the cutting; see it
# for the filters), which games/smirked/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/smirked/tools/cutClips.py [path/to/song.mp3] [--out DIR]
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
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'smirked', 'I Screamed, She Smirked.mp3'),
    'out': os.path.join(ROOT, 'games', 'smirked', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'mild': (2.30, 4.75, 0.01, 0.25),  # verse 1: "the sign said mild scares for all ages"
        'fog': (35.25, 37.95, 0.01, 0.20),  # verse 3: "Fog machine hisses, I scream like a cat"
        'okay': (39.30, 40.26, 0.01, 0.10),  # verse 3: "You okay with that?"
        'afraid': (46.05, 48.40, 0.01, 0.25),  # chorus 1: "She's eight, and I'm afraid"
        'getdown': (54.72, 55.78, 0.01, 0.15),  # chorus 1: "GET DOWN!"
        'cardboard': (57.25, 59.62, 0.01, 0.20),  # chorus 1: "Turns out she was cardboard"
        'target': (62.40, 65.28, 0.01, 0.25),  # chorus 1: "She strolls like it's Target"
        'exit': (70.30, 72.30, 0.01, 0.30),  # chorus 1: "the emergency exit sign"
        'werewolf': (80.42, 83.28, 0.01, 0.20),  # verse 4: "There's a guy in a werewolf mask, he growls"
        'dontrun': (83.74, 84.82, 0.01, 0.12),  # verse 4: "I don't run. No, no."
        'sneezing': (88.44, 90.98, 0.01, 0.25),  # verse 4: "Now I'm sneezing like Salem's last witch left behind"
        'notreal': (100.34, 101.64, 0.01, 0.12),  # the bridge: "You know it's not real, right?"
        'pats': (102.04, 103.72, 0.01, 0.12),  # the breakdown: "Then she pats me. Pats me."
        'juice': (103.72, 105.96, 0.01, 0.25),  # the breakdown: "like I need the juice box and some therapy"
        'badge': (106.30, 108.56, 0.01, 0.20),  # the breakdown: "She gets a Bravery Badge from the front desk"
        'sword': (108.66, 110.26, 0.01, 0.20),  # the breakdown: "I get a souvenir sword"
        'ashamed': (110.90, 114.16, 0.01, 0.30),  # the last chorus: "She's eight, and I'm ashamed"
        'datewell': (139.50, 141.22, 0.01, 0.20),  # the outro: "So yeah. The date went well."
    },
}

if __name__ == '__main__':
    cutclips.main(SONG)
