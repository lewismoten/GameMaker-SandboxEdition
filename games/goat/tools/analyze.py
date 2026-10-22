#!/usr/bin/env python3
# Analyzes Lewis's recording of "Third Goat from the Left" (The Bard of Bizarre) to inform the
# OPL2 arrangement in games/goat/src/sound/song.ts.
#
# It reads the MP3 at .for-lewis/songs/goat/Third Goat from the Left.mp3, which is NOT committed
# (the arrangement is committed as note data in TypeScript, so the game build never needs it).
#
#   python3 -I games/goat/tools/analyze.py [path/to/song.mp3] [--out DIR] [--no-whisper]
#
# Needs ffmpeg, numpy and scipy; uses openai-whisper (the cached "base" model) for word timings
# when installed. Writes into DIR (default $TMPDIR/goat-audio): song.wav (22050 Hz stereo
# decode), vox.wav (center-panned harmonic part, the voice), words.json (whisper word timings)
# and analysis.json, and prints a summary:
#   - tempo and beat grid (spectral-flux autocorrelation, then a phase search), the downbeat
#     (the beat phase where the chroma changes most, i.e. where chords change)
#   - key (Krumhansl-Schmuckler profiles over the whole song's chroma)
#   - chords per bar (half-bar chroma + bass chroma against diatonic templates in the key,
#     smoothed with a Viterbi pass that charges for each change)
#   - sections (intro, verses, choruses, bridge, spoken, final chorus, outro), anchored on the
#     first word of each lyric section and snapped to bars
#   - the sung melody: harmonic-sum pitch salience on vox.wav per sung word, folded into one
#     octave around the previous note, quantized to the eighth-note grid as MIDI notes.
import json
import os
import subprocess
import sys

import numpy as np
import scipy.io.wavfile as wavfile
import scipy.ndimage as nd
import scipy.signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
MP3 = os.path.join(ROOT, '.for-lewis', 'songs', 'goat', 'Third Goat from the Left.mp3')
SR = 22050
NAMES = 'C C# D D# E F F# G G# A A# B'.split()

# First words of each lyric section (as they are sung), used to find where sections start.
SECTIONS = [
    ('intro', None),
    ('verse1', ['i', 'was', 'there', 'that', 'night']),
    ('verse2', ['the', "donkey's", 'dummies', 'donkeys']),
    ('chorus1', ['third', 'goat', 'from', 'the', 'left']),
    ('chorus2', ['third', 'they', 'go', 'goat', 'from', 'the', 'left']),
    ('bridge', ['the', 'wise', "why's", 'men', 'strutted']),
    ('spoken', ['some', 'say', 'history']),
    ('finalChorus', ['third', 'the', 'go', 'goat', 'from', 'the', 'left']),
    ('outro', ['so', 'if', 'you', 'feel']),
]


def note_name(m):
    m = int(round(m))
    return '%s%d' % (NAMES[m % 12], m // 12 - 1)


def decode(mp3, out):
    wav = os.path.join(out, 'song.wav')
    if not os.path.exists(wav):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '2', '-ar', str(SR), wav], check=True)
    sr, x = wavfile.read(wav)
    return x.astype(np.float32) / 32768


def stft(x, n, hop):
    f, _, z = sg.stft(x, SR, nperseg=n, noverlap=n - hop, boundary=None)
    return f, z, SR / hop, n / 2 / SR  # frequencies, spectrum, frames/s, time of frame 0


def chroma(f, power, lo, hi):
    mask = (f > lo) & (f < hi)
    pc = np.round(12 * np.log2(f[mask] / 440) + 69) % 12
    out = np.zeros((12, power.shape[1]))
    for k in range(12):
        out[k] = power[mask][pc == k].sum(0)
    return out


def beat_grid(mono, duration):
    f, z, fps, t0 = stft(mono, 2048, 256)
    lm = np.log1p(100 * np.abs(z))
    flux = np.maximum(0, np.diff(lm, axis=1)).sum(0)
    flux = np.maximum(flux - sg.medfilt(flux, 31), 0)
    ac = np.correlate(flux - flux.mean(), flux - flux.mean(), 'full')[len(flux) - 1:]

    def ac_at(bpm):
        lag = 60 / bpm * fps
        i = int(lag)
        return ac[i] * (1 - (lag - i)) + ac[i + 1] * (lag - i)

    coarse = max(np.arange(70, 180, 0.5), key=ac_at)

    def score(bpm, ph):
        idx = np.round((np.arange(ph, duration, 60 / bpm) - t0) * fps).astype(int) - 1
        return flux[idx[(idx >= 0) & (idx < len(flux))]].mean()

    best = max(((score(b, p), b, p) for b in np.arange(coarse - 0.4, coarse + 0.41, 0.02) for p in np.arange(0, 60 / coarse, 0.005)))
    return float(best[1]), float(best[2])


def downbeat(mono, bpm, phase, duration):
    """The beat (of four) that starts a bar: the kick lands on 1 and 3 (low-band onsets), and
    chords change most on 1 (chroma change). The two cues' z-scores are added."""
    f, z, fps, t0 = stft(mono, 2048, 256)
    mag = np.abs(z)
    lm = np.log1p(100 * mag)
    low = np.maximum(0, np.diff(lm[f < 150], axis=1)).sum(0)
    c = chroma(f, mag, 50, 1500)
    beat = 60 / bpm
    lows, feats = [], []
    for k in range(int((duration - phase) / beat) - 1):
        a = max(int((phase + k * beat - t0) * fps), 0)
        b = int((phase + (k + 1) * beat - t0) * fps)
        lows.append(low[max(a - 1, 0)])
        v = c[:, a:max(b, a + 1)].mean(1)
        feats.append(v / (np.linalg.norm(v) + 1e-9))
    lows, feats = np.array(lows), np.array(feats)
    change = np.r_[0, 1 - (feats[1:] * feats[:-1]).sum(1)]  # change[i]: from beat i-1 into beat i
    kick = np.array([lows[m::4].mean() for m in range(4)])
    chg = np.array([change[m + 4::4].mean() for m in range(4)])
    zs = lambda a: (a - a.mean()) / (a.std() + 1e-9)
    total = zs(kick) + zs(chg)
    m = int(np.argmax(total))
    return phase + m * beat, {'kick': [round(float(x), 3) for x in kick], 'chordChange': [round(float(x), 4) for x in chg]}


def find_key(mono):
    f, z, _, _ = stft(mono, 8192, 512)
    c = chroma(f, np.abs(z) ** 2, 60, 2000)
    cs = np.sqrt(c).sum(1)
    major = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor = np.array([6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    scores = [(float(np.corrcoef(cs, np.roll(major, k))[0, 1]), k, 'major') for k in range(12)]
    scores += [(float(np.corrcoef(cs, np.roll(minor, k))[0, 1]), k, 'minor') for k in range(12)]
    scores.sort(reverse=True)
    return scores


def chords_per_bar(mono, key, bar0, bpm, duration):
    """Diatonic triads (plus V7 and bVII) of the major key, per half bar, Viterbi-smoothed."""
    f, z, fps, t0 = stft(mono, 8192, 512)
    p = np.abs(z) ** 2
    treble, bass = chroma(f, p, 130, 1500), chroma(f, p, 38, 130)
    deg = [(0, ''), (2, 'm'), (4, 'm'), (5, ''), (7, ''), (9, 'm'), (10, '')]
    tmpl = []
    for d, q in deg:
        r = (key + d) % 12
        iv = [0, 3 if q == 'm' else 4, 7]
        tmpl.append((NAMES[r] + q, [(r + i) % 12 for i in iv]))
    r5 = (key + 7) % 12
    tmpl.append((NAMES[r5] + '7', [r5, (r5 + 4) % 12, (r5 + 7) % 12, (r5 + 10) % 12]))
    half = 2 * 60 / bpm
    first = bar0 - 2 * half * int(bar0 / (2 * half) + 1)  # a bar line at or before 0 (bar -1 etc.)
    units = []
    t = first
    while t + half <= duration:
        a, b = max(int((t - t0) * fps), 0), int((t + half - t0) * fps)
        h = np.sqrt(treble[:, a:max(b, a + 1)].mean(1))
        h /= np.linalg.norm(h) + 1e-9
        lo = np.sqrt(bass[:, a:max(b, a + 1)].mean(1))
        lo /= lo.sum() + 1e-9
        row = []
        for _, iv in tmpl:
            v = np.zeros(12)
            v[iv] = 1
            row.append(h @ (v / np.linalg.norm(v)) + 0.6 * lo[iv[0]])
        units.append((t, row))
        t += half
    obs = np.array([r for _, r in units])
    K = len(tmpl)
    d = obs[0].copy()
    back = []
    for i in range(1, len(obs)):
        tr = d[:, None] - 0.08 * (1 - np.eye(K))
        back.append(tr.argmax(0))
        d = tr.max(0) + obs[i]
    path = [int(d.argmax())]
    for b in reversed(back):
        path.append(int(b[path[-1]]))
    path.reverse()
    labels = [tmpl[i][0] for i in path]
    bars = []
    for i in range(0, len(labels) - 1, 2):
        bars.append({'bar': int(round((units[i][0] - bar0) / (2 * half))), 'start': round(units[i][0], 3), 'chords': labels[i:i + 2]})
    return bars


def isolate_voice(x, out):
    """Center-panned (L ~ R) and harmonic (horizontal in the spectrogram) energy, 180..6000 Hz."""
    n, hop = 2048, 512
    f, _, zl = sg.stft(x[:, 0], SR, nperseg=n, noverlap=n - hop)
    _, _, zr = sg.stft(x[:, 1], SR, nperseg=n, noverlap=n - hop)
    sim = 2 * np.abs(zl * np.conj(zr)) / (np.abs(zl) ** 2 + np.abs(zr) ** 2 + 1e-12)
    zc = (zl + zr) / 2 * np.clip((sim - 0.8) / 0.2, 0, 1) ** 2
    mag = np.abs(zc)
    harm, perc = nd.median_filter(mag, size=(1, 17)), nd.median_filter(mag, size=(17, 1))
    zv = zc * harm ** 2 / (harm ** 2 + perc ** 2 + 1e-12)
    zv[(f < 180) | (f > 6000)] = 0
    _, v = sg.istft(zv, SR, nperseg=n, noverlap=n - hop)
    v = (v / np.abs(v).max() * 0.9).astype(np.float32)
    wavfile.write(os.path.join(out, 'vox.wav'), SR, (v * 32767).astype(np.int16))
    return v


def words(out, use_whisper):
    path = os.path.join(out, 'words.json')
    if os.path.exists(path):
        return json.load(open(path))
    if not use_whisper:
        return []
    try:
        import whisper  # noqa: PLC0415
    except ImportError:
        return []
    model = whisper.load_model('base')
    prompt = 'Third goat from the left, forgotten but true. I was there that night in Bethlehem, manger-side, behind the lambs.'
    r = model.transcribe(os.path.join(out, 'song.wav'), word_timestamps=True, language='en', initial_prompt=prompt, fp16=False)
    w = [{'word': x['word'].strip(), 'start': round(x['start'], 3), 'end': round(x['end'], 3)} for s in r['segments'] for x in s['words']]
    json.dump(w, open(path, 'w'), indent=1)
    return w


def word_pitches(v, ws):
    """Harmonic-sum salience over MIDI 45..79 for each word; returns the best candidates."""
    n, hop = 4096, 256
    f, t, z = sg.stft(v, SR, nperseg=n, noverlap=n - hop, boundary=None)
    lg = np.log1p(np.abs(z) * 200)
    cands = np.arange(45, 80)
    sal = np.zeros((len(cands), lg.shape[1]))
    for i, m in enumerate(cands):
        hz = 440 * 2 ** ((m - 69) / 12)
        for h in range(1, 11):
            k = int(round(hz * h / f[1]))
            if k >= len(f) - 2:
                break
            sal[i] += 0.8 ** (h - 1) * lg[k - 1:k + 2].max(0)
    outw = []
    for w in ws:
        sel = (t >= w['start']) & (t < w['end'])
        if not sel.any():
            continue
        s = sal[:, sel].mean(1)
        # fold to pitch classes: the voice's octave is unreliable with a band behind it
        pcs = np.zeros(12)
        for i, m in enumerate(cands):
            pcs[m % 12] = max(pcs[m % 12], s[i])
        outw.append({**w, 'pc': int(np.argmax(pcs)), 'cands': [int(cands[i]) for i in np.argsort(-s)[:3]]})
    return outw


def melody(pw, bar0, bpm, lo=60, hi=76):
    """Pitch classes placed in the octave nearest the previous note (kept within lo..hi), on the eighth grid."""
    eighth = 30 / bpm
    notes, prev = [], 67
    for w in pw:
        m = w['pc'] + 12 * round((prev - w['pc']) / 12)
        while m < lo:
            m += 12
        while m > hi:
            m -= 12
        q = round((w['start'] - bar0) / eighth)
        notes.append({'word': w['word'], 'eighth': q, 'bar': q // 8, 'beat': (q % 8) / 2, 'midi': m, 'name': note_name(m)})
        prev = m
    for a, b in zip(notes, notes[1:]):
        a['eighths'] = max(1, min(8, b['eighth'] - a['eighth']))
    if notes:
        notes[-1]['eighths'] = 4
    return notes


def sections(ws, bar0, bpm, duration):
    """Each section starts at the bar holding its first sung word (a pickup belongs to the next bar)."""
    bar = 240 / bpm
    found = [('intro', 0.0)]
    i = 0
    for name, keys in SECTIONS[1:]:
        # the section's first word: a run of at least 3 of its key words in order, after the previous section
        while i < len(ws) - 2:
            win = [ws[i + k]['word'].lower().strip(',.?!') for k in range(3)]
            if sum(w in keys for w in win) >= 2 and (not found or ws[i]['start'] > found[-1][1] + 8):
                break
            i += 1
        if i >= len(ws) - 2:
            break
        t = ws[i]['start']
        b = round((t - bar0) / bar + 0.25)  # a word up to half a bar early is a pickup
        found.append((name, bar0 + b * bar))
        i += 3
    out = []
    for k, (name, t) in enumerate(found):
        end = found[k + 1][1] if k + 1 < len(found) else duration
        out.append({'name': name, 'start': round(t, 3), 'end': round(end, 3), 'bar': int(round((t - bar0) / bar))})
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    mp3 = args[0] if args else MP3
    out = os.environ.get('TMPDIR', '/tmp') + '/goat-audio'
    if '--out' in sys.argv:
        out = sys.argv[sys.argv.index('--out') + 1]
        if out in args:
            args.remove(out)
    os.makedirs(out, exist_ok=True)
    x = decode(mp3, out)
    mono = x.mean(1)
    duration = len(mono) / SR
    bpm, phase = beat_grid(mono, duration)
    bar0, by_mod = downbeat(mono, bpm, phase, duration)
    keys = find_key(mono)
    key = keys[0][1]
    bars = chords_per_bar(mono, key, bar0, bpm, duration)
    v = isolate_voice(x, out)
    ws = words(out, '--no-whisper' not in sys.argv)
    secs = sections(ws, bar0, bpm, duration) if ws else []
    pw = word_pitches(v, ws) if ws else []
    mel = melody(pw, bar0, bpm)
    for s in secs:
        s['chords'] = [' '.join(dict.fromkeys(b['chords'])) for b in bars if s['bar'] <= b['bar'] < s['bar'] + round((s['end'] - s['start']) / (240 / bpm))]
        s['melody'] = [m for m in mel if s['start'] - 0.25 <= bar0 + m['eighth'] * 30 / bpm < s['end'] - 0.25]
    result = {
        'duration': round(duration, 3),
        'bpm': round(bpm, 2),
        'beatPhase': round(phase, 3),
        'downbeat': round(bar0, 3),
        'downbeatCues': by_mod,
        'key': '%s %s' % (NAMES[keys[0][1]], keys[0][2]),
        'keyCandidates': [{'key': '%s %s' % (NAMES[k], q), 'r': round(r, 3)} for r, k, q in keys[:4]],
        'bars': bars,
        'sections': secs,
    }
    json.dump(result, open(os.path.join(out, 'analysis.json'), 'w'), indent=1)
    print('tempo %.2f BPM, first beat %.3f s, downbeat %.3f s (bar 0); key %s' % (bpm, phase, bar0, result['key']))
    for s in secs:
        print('\n%-11s %6.2f-%6.2f  bar %d' % (s['name'], s['start'], s['end'], s['bar']))
        print('  chords: ' + ' | '.join(s['chords']))
        print('  melody: ' + ' '.join('%s(%s)' % (m['name'], m['word']) for m in s['melody']))
    print('\nwrote', os.path.join(out, 'analysis.json'))


if __name__ == '__main__':
    main()
