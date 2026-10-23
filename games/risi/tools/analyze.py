#!/usr/bin/env python3
# Analyzes the six recordings of Veni, Vidi, Risi! (Lewis Moten's group; Latin lyrics shaped with
# ChatGPT from his prompts, music and vocals made with Riffusion, now Google Flow Music), which
# are NOT committed (.for-lewis/songs/veni-vidi-risi/<title>.mp3, with Whisper's Latin word
# timings in <title>.json beside each), to inform the OPL2 arrangements in src/sound/song.ts:
# games/kit/song/analyze.py does the work (tempo, key, chords per bar, sections, the sung tune).
#
#   python3 -I games/risi/tools/analyze.py <song> [--out DIR] [--compare WAV [--from S --to S]]
#   <song>: canis, felis, ignavi, titus, piscis, silentium
#
# The word timings come from the .json beside the MP3 (copied into DIR/words.json), so Whisper is
# not run again here. The numbers it found are written beside each song in src/sound/song.ts.
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import analyze  # noqa: E402

SONGS_DIR = os.path.join(ROOT, '.for-lewis', 'songs', 'veni-vidi-risi')

# title, the first words of each lyric section as Whisper heard them, the span to --compare
SONGS = {
    'canis': ('Canis Meus Flatum Dedit', [('intro', None), ('aria', ['submensa', 'in', 'tenebris']), ('rufus', ['porufus', 'fideles', 'sueras']), ('refrain', ['o', 'flatus', 'per', 'fidus']), ('bridge', ['sena', 'nus', 'torres']), ('finale', ["t'anis", 'meus', 'flatus'])], (62, 92)),
    'felis': ('Felis Fortissimus', [('intro', None), ('verse1', ['vellis', 'ambulat', 'super']), ('refrain', ['felis', 'fortis', 'inus']), ('verse2', ['ascendit', 'librum', 'saltat']), ('bridge', ['musibi', 'lat', 'ridet']), ('finale', ['velus', 'fortishimus', 'heros'])], (39, 58)),
    'ignavi': ('Laudes Ignavi', [('intro', None), ('refrain', ['ʻulʻau', 'pērəs', 'ʻiʻta']), ('verse2', ['hum', 'ad', 'murum']), ('bridge', ["qu'is", 'es', 'cille'])], (59, 84)),
    'titus': ('Titus Torquet Lingua', [('intro', None), ('verse1', ['ṣāytūs', 'ṭot', 'ṭītūlos']), ('refrain', ['taitus', 'totti', 'tulus']), ('verse2', ['sāgak', 'sāpiins', 'sājitat'])], (43, 60)),
    'piscis': ('Canit Piscis Aureus_', [('intro', None), ('aria', ['o', 'pisi', 'saureros']), ('refrain', ['llamant', 'múres', 'pyshis']), ('bridge', ['ʃalte', 'te', 'ʃalit']), ('finale', ['kantemus', 'onnes', 'ndishem'])], (84, 110)),
    'silentium': ('Silentium Ridentium', [('intro', None), ('verse1', ['solorizum', 'serludus', 'meus']), ('refrain', ['kante', 'me', 'musriamos']), ('verse2', ['skribo', 'de', 'pishibus']), ('bridge', ['lídetisne', 'non', 'ney'])], (71, 97)),
}


def main():
    argv = sys.argv[1:]
    if not argv or argv[0] not in SONGS:
        sys.exit('usage: analyze.py <%s> [--out DIR] [--compare WAV]' % '|'.join(SONGS))
    key, rest = argv[0], argv[1:]
    title, sections, span = SONGS[key]
    mp3 = os.path.join(SONGS_DIR, title + '.mp3')
    out = rest[rest.index('--out') + 1] if '--out' in rest else os.environ.get('TMPDIR', '/tmp') + '/risi-audio/' + key
    os.makedirs(out, exist_ok=True)
    timings = os.path.join(SONGS_DIR, title + '.json')
    words = os.path.join(out, 'words.json')
    if os.path.exists(timings) and not os.path.exists(words):
        w = json.load(open(timings))
        json.dump([{'word': x['word'].lower().strip(',.!?'), 'start': x['start'], 'end': x['end']} for x in w], open(words, 'w'), indent=1)
    song = {'name': 'risi', 'mp3': mp3, 'sections': sections, 'compare': span, 'range': (55, 79)}
    if '--out' not in rest:
        rest = rest + ['--out', out]
    analyze.main(song, [mp3] + rest)


if __name__ == '__main__':
    main()
