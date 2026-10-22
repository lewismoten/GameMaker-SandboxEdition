#!/usr/bin/env python3
# Analyzes the recording of "The Great Dairy Reckoning of 3:17 a.m." (The Bard of Bizarre, a spoken
# monologue), which is NOT committed (.for-lewis/songs/reckoning/The Great Dairy Reckoning of
# 3_17 a.m..mp3), for a music bed, and prints Whisper's word timings (the cue table in
# src/sound/clips.ts came from them).
#
#   python3 -I games/reckoning/tools/analyze.py [path/to/recording.mp3] [--no-whisper]
#
# What it found (183.5 s, stereo): no music bed. The first minute is the voice alone with true
# silence (about -60 dB) between its lines; from 74 s on the loud stretches are screams and a few
# sound effects with no steady key (their spectra peak round 700-800 Hz, the screaming voice), so
# the game's FM score (src/sound/song.ts) is composed for it, not arranged from it.
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
MP3 = os.path.join(ROOT, '.for-lewis', 'songs', 'reckoning', 'The Great Dairy Reckoning of 3_17 a.m..mp3')
SR = 22050
NAMES = 'C C# D D# E F F# G G# A A# B'.split()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    mp3 = args[0] if args else MP3
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)
    mid, side = x.mean(1), (x[:, 0] - x[:, 1]) / 2
    hop = SR
    n = len(mid) // hop
    db = lambda s: 20 * np.log10(np.sqrt((s[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    m, s = db(mid), db(side)
    print('%.1f s; per second: level (mid) and stereo side (dB); "." marks silence under -55 dB' % (len(mid) / SR))
    for i in range(n):
        f = np.abs(np.fft.rfft(mid[i * hop:(i + 1) * hop]))
        freqs = np.fft.rfftfreq(hop, 1 / SR)
        band = (freqs > 60) & (freqs < 2000)
        pc = (np.round(12 * np.log2(freqs[band] / 440) + 69) % 12).astype(int)
        ch = np.bincount(pc, weights=f[band] ** 2, minlength=12)
        top = NAMES[int(np.argmax(ch))]
        print('%5d s  %6.1f  %6.1f  %s%s' % (i, m[i], s[i], top, '  .' if m[i] < -55 else ''))
    q = SR // 4
    k = len(mid) // q
    quarter = 20 * np.log10(np.sqrt((mid[: k * q].reshape(k, q) ** 2).mean(1)) + 1e-9)
    first = quarter[: 64 * 4]
    silent = int((first < -55).sum())
    print('first minute: %d of %d quarter seconds silent (under -55 dB)%s' % (silent, len(first), ': no music bed under the voice' if silent > 10 else ''))
    if '--no-whisper' in sys.argv:
        return
    import whisper  # openai-whisper, the cached "base" model

    model = whisper.load_model('base')
    r = model.transcribe(mp3, word_timestamps=True, language='en', initial_prompt='The enemy. And the lover. I am lactose intolerant. Begone foul beast! I have almond milk now! Is there Lactaid in hell?')
    for seg in r['segments']:
        for w in seg['words']:
            print('%7.2f %7.2f %s' % (w['start'], w['end'], w['word']))


if __name__ == '__main__':
    main()
