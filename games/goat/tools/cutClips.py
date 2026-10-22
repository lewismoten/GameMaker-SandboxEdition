#!/usr/bin/env python3
# Cuts the digitized sound clips for "Third Goat from the Left" out of Lewis's recording, which
# is NOT committed (.for-lewis/songs/goat/Third Goat from the Left.mp3), into
# games/goat/src/sound/clips/<name>.pcm: raw 8-bit unsigned mono PCM at 11025 Hz, which
# games/goat/src/sound/clips.ts wraps as Creative Voice Files.
#
#   python3 -I games/goat/tools/cutClips.py [path/to/song.mp3] [--out DIR]
#
# Deterministic: the cue table below (found with analyze.py's word timings and the vocal
# envelope; see clips.ts) is fixed, and each edge snaps to the quietest 10 ms of the
# center-panned voice within SNAP seconds. Each clip is the stereo mid channel, high-passed at
# 90 Hz, low-passed at 4.8 kHz (under the 5512 Hz Nyquist of 11025 Hz) and decimated by 4 with
# an anti-alias filter, given short fades, normalized to 0.97 of full scale and rounded to
# 8 bits. Game-Maker reads a VOC's size as 16 bits, so every clip stays under 3.6 s.
import os
import subprocess
import sys

import numpy as np
import scipy.signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
MP3 = os.path.join(ROOT, '.for-lewis', 'songs', 'goat', 'Third Goat from the Left.mp3')
OUT = os.path.join(ROOT, 'games', 'goat', 'src', 'sound', 'clips')
SR = 44100
RATE = 11025
SNAP = 0.12
MAX_SECONDS = 3.6

# name: (start, end, fade in, fade out) in seconds of the recording
CUES = {
    'hook': (47.95, 50.15, 0.01, 0.10),  # chorus 1: "Third goat from the left" (whisper heard every word here; "for-" starts at 50.29)
    'hey': (165.80, 167.35, 0.01, 0.30),  # the last "Hey..." after the break at 165.6
    'yeah': (7.75, 11.25, 0.02, 0.25),  # the intro's "Yeah-ay-ay-ay!" melisma, the loudest voice over the band
    'bleat': (78.30, 79.50, 0.02, 0.20),  # chorus 2: "li-i-ive!", a held vowel with a 1-semitone wobble
    'seesyou': (155.25, 156.62, 0.01, 0.08),  # outro: "He sees you."
    'nightlong': (137.50, 140.55, 0.02, 0.30),  # final chorus: "...all night long." (clearer than the echo at 141.9)
}


def decode(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)


def voice_envelope(x):
    """Center-panned energy (where L and R agree), 10 ms frames, 200..4000 Hz."""
    b, a = sg.butter(4, [200, 4000], btype='band', fs=SR)
    lr = sg.filtfilt(b, a, x, axis=0)
    mid, side = lr.mean(1), (lr[:, 0] - lr[:, 1]) / 2
    hop = SR // 100
    n = len(mid) // hop
    e = lambda s: np.sqrt((s[: n * hop].reshape(n, hop) ** 2).mean(1))
    return np.maximum(e(mid) - e(side), 0)


def snap(env, t, prefer):
    """The quietest 10 ms frame within SNAP of t (ties go toward `prefer`: -1 earlier, +1 later)."""
    i = int(round(t * 100))
    w = int(SNAP * 100)
    idx = np.arange(max(i - w, 0), min(i + w + 1, len(env)))
    cost = env[idx] + 1e-6 * prefer * (i - idx)
    return idx[int(np.argmin(cost))] / 100


def cut(x, env, start, end, fade_in, fade_out):
    start, end = snap(env, start, -1), snap(env, end, 1)
    end = min(end, start + MAX_SECONDS)
    mid = x[int(start * SR):int(end * SR)].mean(1)
    b, a = sg.butter(2, 90, btype='high', fs=SR)
    mid = sg.filtfilt(b, a, mid)
    b, a = sg.butter(8, 4800, btype='low', fs=SR)
    mid = sg.filtfilt(b, a, mid)
    y = sg.resample_poly(mid, 1, SR // RATE)
    n = len(y)
    ramp = np.ones(n)
    fi, fo = max(1, int(fade_in * RATE)), max(1, int(fade_out * RATE))
    ramp[:fi] = np.linspace(0, 1, fi) ** 2
    ramp[n - fo:] = np.minimum(ramp[n - fo:], np.linspace(1, 0, fo) ** 2)
    y *= ramp
    y *= 0.97 / np.abs(y).max()
    pcm = np.clip(np.round(y * 127 + 128), 0, 255).astype(np.uint8)
    return start, end, pcm


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else OUT
    if out in args:
        args.remove(out)
    x = decode(args[0] if args else MP3)
    env = voice_envelope(x)
    os.makedirs(out, exist_ok=True)
    for name, (s, e, fi, fo) in CUES.items():
        start, end, pcm = cut(x, env, s, e, fi, fo)
        with open(os.path.join(out, name + '.pcm'), 'wb') as f:
            f.write(pcm.tobytes())
        print('%-10s %7.2f - %7.2f s  %.2f s  %6d samples  VOC %6d bytes' % (name, start, end, end - start, len(pcm), len(pcm) + 33))


if __name__ == '__main__':
    main()
