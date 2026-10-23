#!/usr/bin/env python3
# Analyzes the Riffusion recordings of "Shakespeare in Sweatpants" (The Bard of Bizarre's spoken
# monologues over music beds), which are NOT committed (.for-lewis/songs/shakespeare/<title>.mp3,
# with their word timings in <title>.json beside them), for the music beds' tempo, key and
# chords: games/kit/song/analyze.py does the work (see it for what is measured and how). The
# game's FM score (src/sound/song.ts) is composed from what it found; its comments say which
# song came from which bed.
#
#   python3 -I games/sweats/tools/analyze.py "<title>" [--out DIR] [--no-whisper]
#   python3 -I games/sweats/tools/analyze.py "<title>" --compare render/office.wav [--from S --to S]
#
# The word timings come from the .json beside the MP3 (copied into DIR/words.json), so
# --no-whisper is enough. What it found (the score's beds):
#   - "The Office Chair That Tried to Kill Me"  -> office
#   - "Shelter Me Gently, You Wounded Beast"    -> home
#   - "How the Cat Won the Pizza War"           -> epic
#   - "Wore All the Weird Socks"                -> triumph
# (the measured numbers are in src/sound/song.ts beside each song).
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

BEDS = os.path.join(ROOT, '.for-lewis', 'songs', 'shakespeare')


def main():
    argv = sys.argv[1:]
    if not argv or argv[0].startswith('--'):
        sys.exit('usage: analyze.py "<title>" [--out DIR] [--no-whisper] [--compare WAV]')
    title, rest = argv[0], argv[1:]
    slug = ''.join(c if c.isalnum() else '-' for c in title.lower()).strip('-')
    mp3 = os.path.join(BEDS, title + '.mp3')
    out = rest[rest.index('--out') + 1] if '--out' in rest else os.environ.get('TMPDIR', '/tmp') + '/sweats-audio/' + slug
    os.makedirs(out, exist_ok=True)
    timings = os.path.join(BEDS, title + '.json')
    words = os.path.join(out, 'words.json')
    if os.path.exists(timings) and not os.path.exists(words):
        segs = json.load(open(timings))['segments']
        w = [{'word': x['word'].strip(), 'start': round(x['start'], 3), 'end': round(x['end'], 3)} for s in segs for x in s.get('words', [])]
        json.dump(w, open(words, 'w'), indent=1)
    song = {'name': 'sweats', 'mp3': mp3, 'sections': [('intro', None)], 'compare': (10, 40), 'range': (55, 79)}
    if '--out' not in rest:
        rest = rest + ['--out', out]
    analyze.main(song, [mp3] + rest)


if __name__ == '__main__':
    main()
