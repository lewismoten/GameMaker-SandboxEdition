#!/usr/bin/env python3
# Analyzes the recording of "I Screamed, She Smirked" (The Bard of Bizarre) to inform the
# OPL2 arrangement in games/smirked/src/sound/song.ts (games/kit/song/analyze.py does the work; see
# it for what is measured and how).
#
# It reads the MP3 at .for-lewis/songs/smirked/I Screamed, She Smirked.mp3, which is NOT
# committed (the arrangement is committed as note data in TypeScript, so the game build never
# needs it).
#
#   python3 -I games/smirked/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#   python3 -I games/smirked/tools/analyze.py --compare render/title.wav [--from S --to S]
# The second compares a rendered song (games/smirked/tools/songPreview.ts writes them) with the
# recording's first chorus.
#
# Whisper (base) hears the outro ("So yeah. The date went well...", 139.8-169 s) as noise; the
# small model finds it (see src/screens/text.ts for the words as sung).
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONG = {
    'name': 'smirked',
    'mp3': os.path.join(ROOT, '.for-lewis', 'songs', 'smirked', 'I Screamed, She Smirked.mp3'),
    'prompt': "Okay, in my defense, the sign said mild scares for all ages. Lily, my girlfriend's kid. Fog machine hisses, I scream like a cat. She's eight, and I'm afraid. GET DOWN! Werewolf mask. You know it's not real, right? Bravery Badge. The emergency exit sign.",
    'compare': (46, 72),
    # First words of each lyric section (as they are sung), used to find where sections start.
    'sections': [
        ('intro', None),  # verse 1 is sung from the first beat: "Okay, in my defense..."
        ('verse2', ['so', 'i', 'take']),
        ('verse3', ['fog', 'machine', 'hisses']),
        ('chorus1', ["she's", 'eight', 'and']),
        ('verse4', ["there's", 'a', 'guy']),
        ('bridge', ['eyes', 'are', 'all']),
        ('breakdown', ['she', 'cuts', 'me']),
        ('final', ["she's", 'eight', 'and']),
    ],
}

if __name__ == '__main__':
    analyze.main(SONG)
