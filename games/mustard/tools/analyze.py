#!/usr/bin/env python3
# Analyzes the recording of "Mustard Seed Hustle" (The Bard of Bizarre) to inform the OPL2
# arrangement in games/mustard/src/sound/song.ts (games/kit/song/analyze.py does the work; see
# it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/mustard/Mustard Seed Hustle.mp3, which is NOT committed
# (the arrangement is committed as note data in TypeScript, so the game build never needs it).
#
#   python3 -I games/mustard/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/mustard/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/mustard/tools/songPreview.ts writes them) with the
# recording's first chorus.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'mustard',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'mustard', 'Mustard Seed Hustle.mp3'),
    'prompt': "They told me 'bout the mustard seed, so tiny and so small. Oh, it's the mustard seed hustle, movin' slow but sure.",
    'compare': (29.2, 49.4),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['they', 'told', 'me']),
        ('chorus1', ['oh', "it's", 'the', 'mustard']),
        ('verse2', ['it', "don't", 'shout']),
        ('chorus2', ['oh', "it's", 'the', 'mustard']),
        ('bridge', ['so', "don't", 'you', 'underestimate']),
        ('keepOn', ['keep', 'all', 'on', "hustlin'"]),
        ('final', ['yes', 'the', 'mustard', 'seed']),
        ('outro', ['hallelujah', 'keep', 'the']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
