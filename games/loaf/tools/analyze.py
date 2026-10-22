#!/usr/bin/env python3
# Analyzes the recording of "Loaf #13 (Left in the Basket)" (The Bard of Bizarre) to inform the
# OPL2 arrangement in games/loaf/src/sound/song.ts (games/kit/song/analyze.py does the work; see
# it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/loaf/Loaf #13 (Left in the Basket).mp3, which is NOT
# committed (the arrangement is committed as note data in TypeScript, so the game build never
# needs it).
#
#   python3 -I games/loaf/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/loaf/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/loaf/tools/songPreview.ts writes them) with the
# recording's first chorus.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'loaf',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'loaf', 'Loaf #13 (Left in the Basket).mp3'),
    'prompt': "They broke five loaves for the hungry crowd. Loaf number thirteen, left in the shade. But I'm still bread! Don't count me out! Nothing's ever wasted. Mama, look what I've got.",
    'compare': (0, 30),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['they', 'broke', 'five', 'loaves']),
        ('verse2', ['loaf', 'number', 'thirteen']),
        ('chorus1', ['but', "i'm", 'still', 'bread']),
        ('bridge', ['you', 'think', 'he', "didn't"]),
        ('verse3', ['i', 'traveled', 'home']),
        ('final', ["we're", 'still', 'bread']),
        ('outro', ['so', 'here', 'i', 'rise']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
