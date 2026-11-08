#!/usr/bin/env python3
"""Plot measured PCM RMS and OPL onsets; optional Matplotlib, no synthetic audio."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import wave
import numpy as np
from measure_audio import decode_dro, key_ons


def rms_curve(path, start, end, window=.05):
    with wave.open(str(path), 'rb') as wav:
        rate, channels = wav.getframerate(), wav.getnchannels()
        if wav.getsampwidth() != 2 or not 0 <= start < end <= wav.getnframes() / rate:
            raise ValueError('expected valid 16-bit PCM interval')
        wav.setpos(round(start * rate))
        frames = round(window * rate)
        count = int((end - start) * rate) // frames
        data = np.frombuffer(wav.readframes(count * frames), dtype='<i2').astype(float) / 32768
        values = np.sqrt(np.mean(data.reshape(count, frames * channels) ** 2, axis=1))
    return start + (np.arange(count) + .5) * window, values


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('results', type=Path)
    parser.add_argument('output', type=Path, help='new or existing plot output directory')
    parser.add_argument('roots', type=Path, nargs='+', help='original capture roots')
    args = parser.parse_args()
    data = json.loads(args.results.read_text())
    if (not data['complete'] or data.get('failed_capture_count', 0)
            or data.get('failures') or not data.get('captures')):
        parser.error('plots require a finalized, nonempty result collection without failures')
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault('MPLCONFIGDIR', str(out / '.mpl-cache'))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams.update({'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
    rows = data['captures']
    roots = {p.name: p for p in args.roots}
    def row(scenario, cycles):
        return next(r for r in rows if r['scenario'] == scenario and r['cycles'] == cycles and r['repeat'] == 1)
    def directory(record):
        return roots[record['root']] / record['run']
    def notes(record):
        return key_ons(decode_dro((directory(record) / record['segments'][0]['file']).read_bytes()))
    used = []
    base = row('menu', 20000)
    baseline = [v for v in notes(base) if v[0] < 60000]
    fig, axes = plt.subplots(1, 2, figsize=(14, 5), layout='constrained')
    for cycles in (563, 750, 1000, 1510, 2000, 3000, 20000):
        record = row('menu', cycles)
        selected = [v for v in notes(record) if v[0] < 60000]
        n = min(len(baseline), len(selected))
        if [k for _, k in baseline[:n]] != [k for _, k in selected[:n]]:
            raise ValueError('menu onset sequences differ; cannot plot an index-aligned drift')
        x = np.array([t for t, _ in baseline[:n]]) / 1000
        drift = np.array([t for t, _ in selected[:n]]) - np.array([t for t, _ in baseline[:n]])
        axes[0].plot(x, drift - drift[0], label=f'{cycles:,}', linewidth=1)
        used.append(record)
    axes[0].set(title='Same menu passage: note-onset lag vs 20,000 cycles',
                xlabel='Baseline musical time (s)', ylabel='Aligned onset lag (ms)')
    axes[0].legend(title='Fixed cycles', ncol=2, fontsize=9)
    axes[0].grid(alpha=.2)
    groups, labels = [], []
    for cycles in (20000, 3000, 2000, 1000):
        group = []
        for record in rows:
            if record['scenario'] == 'loop' and record['cycles'] == cycles:
                group += [s['gap_ms'] for s in record['segments'][0]['stops'][1:] if s['gap_ms'] is not None]
                used.append(record)
        groups.append(group)
        labels.append(f'{cycles:,}\nN={len(group)}')
    axes[1].boxplot(groups, tick_labels=labels, whis=(0, 100), showfliers=False)
    axes[1].set(title='Repeated real scene loads: stop to next FM key-on',
                xlabel='Fixed cycles (two captures per setting)', ylabel='Stop-to-key-on gap (ms)')
    axes[1].grid(axis='y', alpha=.2)
    short = sum(value < 500 for group in groups for value in group)
    if short:
        axes[1].text(.03, .06, f'{short} early-key outlier(s), not a faster scene load',
                     transform=axes[1].transAxes, fontsize=9)
    fig.savefig(out / 'playgame-onset-tempo.png', dpi=140,
                metadata={'Description': 'Measured OPL traces, not modeled hardware timings; see plot-provenance.json'})
    plt.close(fig)

    fig, axes = plt.subplots(3, 1, figsize=(14, 9), layout='constrained')
    for ax, cycles in zip(axes[:2], (20000, 1000)):
        record = row('wood', cycles)
        segment = record['segments'][0]
        start_ms = segment['stops'][0]['restart_ms']
        start = record['pcm']['startup_seconds'] + start_ms / 1000
        x, rms = rms_curve(directory(record) / 'capture.wav', start, start + 100)
        ax.plot(x - start, rms, linewidth=.8, color='#2864aa', label='Measured PCM RMS (50 ms)')
        key_times = [(t - start_ms) / 1000 for t, _ in notes(record) if start_ms <= t <= start_ms + 100000]
        ax.vlines(key_times, -.012, -.004, color='#303030', linewidth=.45, label='FM key-ons')
        last = (segment['last_key_on_ms'] - start_ms) / 1000
        ax.axvspan(last, 100, color='#b74332', alpha=.07)
        ax.axvline(last, color='#b74332', linestyle='--', linewidth=1)
        ax.text(.57, .85, f'Last key-on: {last:.3f} s; residual sound remains', transform=ax.transAxes)
        ax.set(title=f'Wood Castle, {cycles:,} cycles: musical progression stops, not necessarily silence',
               xlabel='Seconds from scene song onset', ylabel='Normalized PCM RMS',
               xlim=(0, 100), ylim=(-.018, max(.12, float(rms.max()) * 1.25)))
        ax.grid(alpha=.15)
        used.append(record)
    record = row('f3', 1000)
    start = record['pcm']['startup_seconds']
    event = next(s for s in record['segments'][0]['stops'] if s['gap_ms'] is not None and 4000 <= s['gap_ms'] <= 6000)
    x, rms = rms_curve(directory(record) / 'capture.wav', 165, 185)
    ax = axes[2]
    ax.plot(x, rms, color='#2864aa', linewidth=.8)
    key_times = [start + t / 1000 for t, _ in notes(record) if 165 <= start + t / 1000 <= 185]
    ax.vlines(key_times, -.012, -.004, color='#303030', linewidth=.6)
    left, right = start + event['stop_ms'] / 1000, start + event['restart_ms'] / 1000
    ax.axvspan(left, right, color='#b74332', alpha=.1)
    ax.text((left + right) / 2, max(.12, float(rms.max()) * 1.1),
            f'F3 off/on: {event["gap_ms"] / 1000:.3f} s without a new key-on', ha='center')
    ax.set(title='F3 control, 1,000 cycles: song restarts after the scheduled off interval',
           xlabel='WAV capture time (s; about 10 ms alignment precision)', ylabel='Normalized PCM RMS',
           xlim=(165, 185), ylim=(-.018, max(.16, float(rms.max()) * 1.3)))
    ax.grid(alpha=.15)
    fig.savefig(out / 'playgame-music-holds.png', dpi=140,
                metadata={'Description': 'Actual PCM RMS and raw OPL key-ons; no reconstructed audio'})
    plt.close(fig)
    used.append(record)
    references = {(r['root'], r['run']): {'root': r['root'], 'run': r['run'], 'wav_sha256': r['wav_sha256']} for r in used}
    (out / 'plot-provenance.json').write_text(json.dumps({
        'results_sha256': hashlib.sha256(args.results.read_bytes()).hexdigest(),
        'sources': list(references.values()), 'matplotlib': matplotlib.__version__,
        'pngs': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in out.glob('*.png')},
    }, indent=2) + '\n')


if __name__ == '__main__':
    main()
