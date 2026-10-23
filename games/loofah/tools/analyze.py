#!/usr/bin/env python3
# Analyzes the recording of "Cleanse Me, O Loofah, But Leave My Soul" (The Bard of Bizarre) to
# inform the OPL2 arrangement in games/loofah/src/sound/song.ts (games/kit/song/analyze.py does
# the work; see it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/loofah/Cleanse Me, O Loofah, But Leave My Soul.mp3, which
# is NOT committed (the arrangement is committed as note data in TypeScript, so the game build
# never needs it).
#
#   python3 -I games/loofah/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/loofah/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/loofah/tools/songPreview.ts writes them) with the
# recording's first chorus.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'loofah',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'loofah', 'Cleanse Me, O Loofah, But Leave My Soul.mp3'),
    'prompt': "She said, don't touch the pink one. It's mine! But I didn't listen. I thought, it's just a loofah. Loofah of Lucifer, you lather my fate. Scrubbus maximus, demon sponge divine.",
    'compare': (60, 90),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),
        ('verse1', ['she', 'said', "don't", 'touch']),
        ('verse2', ['there', 'it', 'hung']),
        ('pre1', ['i', 'reached', 'out']),
        ('verse3', ['it', 'was', 'peach']),
        ('chorus1', ['loofah', 'of', 'lucifer', 'you']),
        ('verse4', ['she', 'warned', 'me']),
        ('verse5', ['the', 'mirror', 'steamed']),
        ('bridge', ['scrubbus', 'maximus']),
        ('chorus2', ['loofah', 'of', 'lucifer', 'why']),
        ('outro', ["i'm", 'sleeping', 'alone']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
