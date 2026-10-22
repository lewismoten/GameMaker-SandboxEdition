#!/usr/bin/env python3
# Analyzes the recording of "Thread the Needle, Brother Camel" (The Bard of Bizarre) to inform
# the OPL2 arrangement in games/needle/src/sound/song.ts (games/kit/song/analyze.py does the
# work; see it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/needle/Thread the Needle, Brother Camel.mp3, which is NOT
# committed (the arrangement is committed as note data in TypeScript, so the game build never
# needs it).
#
#   python3 -I games/needle/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/needle/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/needle/tools/songPreview.ts writes them) with the
# recording's first chorus.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'needle',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'needle', 'Thread the Needle, Brother Camel.mp3'),
    'prompt': "I was mindin' my humps by the city gate, chewin' my cud, ponderin' fate. Thread the needle, Brother Camel, squeeze on through!",
    'compare': (0, 30),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['i', 'was', "mindin'", 'my', 'humps']),
        ('verse1b', ['but', 'jesus', 'looked', 'him']),
        ('chorus1', ['he', 'said', "it's", 'easier']),
        ('verse2', ['now', "i'm", 'just', 'a', 'camel']),
        ('verse2b', ['i', 'tried', 'to', 'squint']),
        ('bridge', ['lord', 'i', 'got', 'knees']),
        ('final', ['thread', 'the', 'needle', 'brother']),
        ('final2', ['thread', 'the', 'needle', 'heart']),
        ('outro', ['hump', 'down', 'thread', 'up']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
