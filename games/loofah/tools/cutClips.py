#!/usr/bin/env python3
# Cuts the digitized sound clips for "Cleanse Me, O Loofah, But Leave My Soul" (The Bard of
# Bizarre) out of the recording, which is NOT committed (.for-lewis/songs/loofah/Cleanse Me, O
# Loofah, But Leave My Soul.mp3), into games/loofah/src/sound/clips/<name>.pcm
# (games/kit/song/cutclips.py does the cutting; see it for the filters), which
# games/loofah/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/loofah/tools/cutClips.py [path/to/song.mp3] [--out DIR]
#
# The cues were found with Whisper's word timings (tools/analyze.py writes them); each edge
# snaps to the quietest 10 ms of the voice nearby. Game-Maker reads a VOC's size as 16 bits, so
# a clip at 11025 Hz stays under 3.6 s; the longer lines are kept at 8000 Hz.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import cutclips  # noqa: E402

SONG = {
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'loofah', 'Cleanse Me, O Loofah, But Leave My Soul.mp3'),
    'out': os.path.join(ROOT, 'games', 'loofah', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'pink': (1.70, 4.70, 0.01, 0.25),  # verse 1: "Don't touch the pink one. It's mine!"
        'wrong': (9.20, 11.10, 0.01, 0.30),  # verse 1: "...just a loofah. How wrong I was."
        'lucifer': (59.80, 61.80, 0.01, 0.25),  # chorus 1: "Loofah of Lucifer"
        'rough': (90.68, 91.55, 0.01, 0.15),  # after the chorus: "Rough!"
        'line': (116.50, 117.80, 0.01, 0.20),  # verse 3: "You crossed a line"
        'worse': (121.80, 124.00, 0.01, 0.25),  # verse 3: "YOU MADE IT WORSE!"
        'scrubbus': (124.30, 126.65, 0.01, 0.20),  # the bridge: "Scrubbus maximus"
        'mango': (159.40, 161.30, 0.01, 0.20),  # chorus 2: "You smelled of mango"
        'never': (183.70, 186.10, 0.01, 0.40),  # the end: "Never touch the loofah."
    },
    # longer than 3.6 s: cut whole and kept at slow_rate
    'slow': {
        'brine': (129.40, 134.30, 0.01, 0.35),  # the bridge: "Lather my guilt in rosemary brine"
        'scream': (120.40, 124.00, 0.01, 0.25),  # verse 3: "my towel screams, YOU MADE IT WORSE!"
    },
    'slow_rate': 8000,
}

if __name__ == '__main__':
    cutclips.main(SONG)
