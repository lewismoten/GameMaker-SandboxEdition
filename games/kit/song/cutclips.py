#!/usr/bin/env python3
# Cuts digitized sound clips out of a Bard of Bizarre recording (an MP3 that is NOT committed)
# into <out>/<name>.pcm: raw 8-bit unsigned mono PCM at 11025 Hz, which the game's clips.ts
# wraps as Creative Voice Files. A game's tools/cutClips.py names its cues and calls main():
#
#   python3 -I games/<id>/tools/cutClips.py [path/to/song.mp3] [--out DIR]
#
# Deterministic: a game's cue table is fixed, and each edge snaps to the quietest 10 ms of the
# center-panned voice within SNAP seconds. Each clip is the stereo mid channel, high-passed at
# 90 Hz, low-passed at 4.8 kHz (under the 5512 Hz Nyquist of 11025 Hz) and decimated by 4 with
# an anti-alias filter, given short fades, normalized to 0.97 of full scale and rounded to
# 8 bits. Game-Maker reads a VOC's size as 16 bits, so every clip stays under 3.6 s.
import os
import subprocess
import sys

import numpy as np
import scipy.signal as sg

SR = 44100
RATE = 11025
SNAP = 0.12
MAX_SECONDS = 3.6


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


def slow_down(pcm, rate):
    """8-bit PCM at RATE resampled to `rate` (a VOC can say its own rate), normalized again."""
    y = (pcm.astype(np.float64) - 128) / 127
    y = sg.resample_poly(y, rate // 25, RATE // 25)
    y *= 0.97 / np.abs(y).max()
    return np.clip(np.round(y * 127 + 128), 0, 255).astype(np.uint8)


def write_pcm(out, name, data):
    """<out>/<name>.pcm, refusing a clip whose VOC would pass Game-Maker's 16-bit size."""
    if len(data) + 33 >= 40000:
        raise SystemExit('%s is %d bytes as a VOC' % (name, len(data) + 33))
    with open(os.path.join(out, name + '.pcm'), 'wb') as f:
        f.write(data.tobytes())


def paths(default_out, argv=None):
    """The clips folder (--out DIR, else `default_out`) and the recording named on the command line (or None)."""
    argv = sys.argv[1:] if argv is None else argv
    out = argv[argv.index('--out') + 1] if '--out' in argv else default_out
    args = [a for a in argv if not a.startswith('--') and a != out]
    return out, (args[0] if args else None)


def main(song, argv=None):
    """Cuts every clip of one song: a dict with 'mp3' (default path), 'out' (the clips folder)
    and 'cues' ({name: (start, end, fade in, fade out)} in seconds of the recording). Optional:
    'slow' (cues up to 4.9 s long, kept at 'slow_rate', 8000 Hz unless said) and 'splices'
    ({name: [cue, ...]} joined by 'splice_gap' seconds of silence, kept at 'splice_rate')."""
    global MAX_SECONDS
    out, mp3 = paths(song['out'], argv)
    x = decode(mp3 or song['mp3'])
    env = voice_envelope(x)
    os.makedirs(out, exist_ok=True)
    for name, (s, e, fi, fo) in song['cues'].items():
        start, end, pcm = cut(x, env, s, e, fi, fo)
        with open(os.path.join(out, name + '.pcm'), 'wb') as f:
            f.write(pcm.tobytes())
        print('%-10s %7.2f - %7.2f s  %.2f s  %6d samples  VOC %6d bytes' % (name, start, end, end - start, len(pcm), len(pcm) + 33))
    if 'slow' in song:
        rate = song.get('slow_rate', 8000)
        MAX_SECONDS = 4.9
        for name, (s, e, fi, fo) in song['slow'].items():
            start, end, p = cut(x, env, s, e, fi, fo)
            data = slow_down(p, rate)
            write_pcm(out, name, data)
            print('%-10s %7.2f - %7.2f s  %.2f s  %6d samples at %d Hz  VOC %6d bytes' % (name, start, end, end - start, len(data), rate, len(data) + 33))
    if 'splices' in song:
        rate = song.get('splice_rate', 8000)
        for name, parts in song['splices'].items():
            pcm = []
            for k, (s, e, fi, fo) in enumerate(parts):
                if k:
                    pcm.append(np.full(int(song['splice_gap'] * RATE), 128, dtype=np.uint8))
                start, end, p = cut(x, env, s, e, fi, fo)
                pcm.append(p)
                print('%-10s part %d %7.2f - %7.2f s' % (name, k + 1, start, end))
            data = slow_down(np.concatenate(pcm), rate)
            write_pcm(out, name, data)
            print('%-10s %.2f s  %6d samples at %d Hz  VOC %6d bytes' % (name, len(data) / rate, len(data), rate, len(data) + 33))
