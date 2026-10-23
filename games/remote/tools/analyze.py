#!/usr/bin/env python3
# Analyzes the recording of "Where's the Remote?" (The Bard of Bizarre) to inform the
# OPL2 arrangement in games/remote/src/sound/song.ts (games/kit/song/analyze.py does the work; see
# it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/remote/Where's The Remote.mp3, which is NOT
# committed (the arrangement is committed as note data in TypeScript, so the game build never
# needs it).
#
#   python3 -I games/remote/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/remote/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/remote/tools/songPreview.ts writes them) with the
# recording's first chorus.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'remote',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'remote', "Where's The Remote.mp3"),
    'prompt': "Where's the remote? I just had it here! Checked the cushions, checked my rear. Lifted the dog, looked under the cat. This couch is a portal, a Bermuda zone. Check your hand. There you are, you sneaky guy.",
    'compare': (0, 30),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['i', 'sat', 'down']),
        ('chorus1', ["where's", 'the', 'remote', 'i', 'just']),
        ('verse2', ['i', 'flipped', 'the']),
        ('chorus2', ["where's", 'the', 'remote', 'is', 'it']),
        ('bridge', ['i', 'found', 'ten']),
        ('final', ["where's", 'the', 'remote', 'my']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
