#!/usr/bin/env python3
# Analyzes the recording of "A Fly Named Carl" (The Bard of Bizarre) to inform the
# OPL2 arrangement in games/carl/src/sound/song.ts (games/kit/song/analyze.py does the work; see
# it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/fly/A fly named Carl.mp3, which is NOT
# committed (the arrangement is committed as note data in TypeScript, so the game build never
# needs it).
#
#   python3 -I games/carl/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/carl/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/carl/tools/songPreview.ts writes them) with the
# recording's first chorus.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'carl',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'fly', 'A fly named Carl.mp3'),
    'prompt': "I sat down with my snacks and my Netflix queue. There's a fly in the room and it's got a vendetta. I've named it Carl. I hate Carl. Carl has seen things. Carl's got the aux cord now.",
    'compare': (0, 30),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['i', 'sat', 'down']),
        ('chorus1', ["there's", 'a', 'fly', 'in', 'the', 'room', 'and', "it's", 'got']),
        ('verse2', ['i', 'tried', 'the', 'old']),
        ('chorus2', ['yeah', "there's", 'a', 'fly']),
        ('bridge', ['carl', 'watches', 'me']),
        ('breakdown', ['some', 'say', 'flies']),
        ('final', ["there's", 'a', 'fly', 'in', 'the', 'room', 'and', "i'm"]),
        ('outro', ['rest', 'in', 'peace']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
