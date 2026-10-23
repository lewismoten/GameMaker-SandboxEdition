#!/usr/bin/env python3
# Cuts the digitized sound clips for "Third Goat from the Left" out of Lewis's recording, which
# is NOT committed (.for-lewis/songs/goat/Third Goat from the Left.mp3), into
# games/goat/src/sound/clips/<name>.pcm (games/kit/song/cutclips.py does the cutting; see it for
# the filters), which games/goat/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/goat/tools/cutClips.py [path/to/song.mp3] [--out DIR]
#
# The cue table below was found with analyze.py's word timings and the vocal envelope (see
# clips.ts); each edge snaps to the quietest 10 ms of the voice nearby.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import cutclips  # noqa: E402

SONG = {
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'goat', 'Third Goat from the Left.mp3'),
    'out': os.path.join(ROOT, 'games', 'goat', 'src', 'sound', 'clips'),
    # name: (start, end, fade in, fade out) in seconds of the recording
    'cues': {
        'hook': (47.95, 50.15, 0.01, 0.10),  # chorus 1: "Third goat from the left" (whisper heard every word here; "for-" starts at 50.29)
        'hey': (165.80, 167.35, 0.01, 0.30),  # the last "Hey..." after the break at 165.6
        'yeah': (7.75, 11.25, 0.02, 0.25),  # the intro's "Yeah-ay-ay-ay!" melisma, the loudest voice over the band
        'bleat': (78.30, 79.50, 0.02, 0.20),  # chorus 2: "li-i-ive!", a held vowel with a 1-semitone wobble
        'seesyou': (155.25, 156.62, 0.01, 0.08),  # outro: "He sees you."
        'nightlong': (137.50, 140.55, 0.02, 0.30),  # final chorus: "...all night long." (clearer than the echo at 141.9)
    },
}

if __name__ == '__main__':
    cutclips.main(SONG)
