#!/usr/bin/env python3
# Analyzes Lewis's recording of "Third Goat from the Left" (The Bard of Bizarre) to inform the
# OPL2 arrangement in games/goat/src/sound/song.ts (games/kit/song/analyze.py does the work; see
# it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/goat/Third Goat from the Left.mp3, which is NOT committed
# (the arrangement is committed as note data in TypeScript, so the game build never needs it).
#
#   python3 -I games/goat/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/goat/tools/analyze.py --compare render/title.wav [--from 47.375 --to 79.375]
# The second compares a rendered song (games/goat/tools/songPreview.ts writes them) with the
# recording's two choruses.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'goat',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'goat', 'Third Goat from the Left.mp3'),
    'prompt': 'Third goat from the left, forgotten but true. I was there that night in Bethlehem, manger-side, behind the lambs.',
    'compare': (47.375, 79.375),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['i', 'was', 'there', 'that', 'night']),
        ('verse2', ['the', "donkey's", 'dummies', 'donkeys']),
        ('chorus1', ['third', 'goat', 'from', 'the', 'left']),
        ('chorus2', ['third', 'they', 'go', 'goat', 'from', 'the', 'left']),
        ('bridge', ['the', 'wise', "why's", 'men', 'strutted']),
        ('spoken', ['some', 'say', 'history']),
        ('finalChorus', ['third', 'the', 'go', 'goat', 'from', 'the', 'left']),
        ('outro', ['so', 'if', 'you', 'feel']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
