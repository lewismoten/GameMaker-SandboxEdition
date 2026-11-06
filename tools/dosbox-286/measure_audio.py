#!/usr/bin/env python3
"""Measure PCM silence and matching OPL key-on passages; no audio synthesis."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import wave
import numpy as np


def decode_dro(data):
    """Decode DOSBox-X DRO v2, as documented in its RawHeader/Capture source."""
    if len(data) < 26 or data[:8] != b'DBRAWOPL':
        raise ValueError('not a DRO file')
    major, minor, count, duration, hardware, fmt, compression, short, long, size = struct.unpack_from('<HHIIBBBBBB', data, 8)
    if (major, minor, fmt, compression) != (2, 0, 0, 0) or len(data) != 26 + size + count * 2:
        raise ValueError('unsupported or truncated DRO')
    table = data[26:26 + size]
    result = []
    now = 0
    for i in range(26 + size, len(data), 2):
        command, value = data[i:i + 2]
        if command == short:
            now += value + 1
        elif command == long:
            now += (value + 1) * 256
        elif command & 127 < size:
            result.append((now, table[command & 127] + (256 if command & 128 else 0), value))
        else:
            raise ValueError('invalid register code')
    if now != duration:
        raise ValueError('DRO duration disagrees with commands')
    return result


def key_ons(writes):
    registers = [0] * 512
    result = []
    for t, reg, value in writes:
        if 0xb0 <= reg <= 0xb8 and value & 32 and not registers[reg] & 32:
            result.append((t, (reg - 0xb0, registers[reg - 16], value & 31)))
        if reg == 0xbd and value & 32:
            for bit in range(5):
                if value & (1 << bit) and not registers[reg] & (1 << bit):
                    result.append((t, (9 + bit, 0, 0)))
        registers[reg] = value
    return result


def compare_onsets(baseline, sample, width=8):
    """Fit identical, uniquely identifiable eight-note phrases in time order.

    Ratio is baseline elapsed / sample elapsed: <1 means slower. Repeated
    phrases are excluded rather than guessed. Reject restart-spanning fits.
    """
    def phrases(notes):
        result = {}
        for i in range(len(notes) - width + 1):
            key = tuple(token for _, token in notes[i:i + width])
            result.setdefault(key, []).append(i)
        return result
    b, s = phrases(baseline), phrases(sample)
    pairs = sorted((v[0], s[k][0]) for k, v in b.items()
                   if len(v) == 1 and k in s and len(s[k]) == 1)
    ordered = []
    for i, j in pairs:
        if not ordered or j > ordered[-1][1]:
            ordered.append((i, j))
    if len(ordered) < 20:
        return None
    x = np.array([baseline[i][0] for i, _ in ordered], dtype=float)
    y = np.array([sample[j][0] for _, j in ordered], dtype=float)
    if x[-1] - x[0] < 5000:
        return None
    slope, intercept = np.polyfit(x - x[0], y, 1)
    residual = y - (intercept + slope * (x - x[0]))
    if slope <= 0 or np.max(np.abs(residual)) > 250:
        return None
    return {'tempo_ratio': float(1 / slope), 'matched_phrases': len(ordered),
            'baseline_start_ms': float(x[0]), 'sample_start_ms': float(y[0]),
            'baseline_segment_seconds': float((x[-1] - x[0]) / 1000),
            'segment_seconds': float((y[-1] - y[0]) / 1000),
            'max_fit_residual_ms': float(np.max(np.abs(residual)))}


def stop_events(writes):
    """Strict all-nine descending B-register zeros; cached duplicate writes vanish."""
    stops = []
    onsets = key_ons(writes)
    for i in range(len(writes) - 8):
        t = writes[i][0]
        group = writes[i:i + 9]
        if all(r == 0xb8 - j and v == 0 for j, (_, r, v) in enumerate(group)) and group[-1][0] - t <= 20:
            next_key = next((a for a, _ in onsets if a > group[-1][0]), None)
            # SetInstTable starts by writing operator 0's 0x20 parameter.
            instrument = next((a for a, r, _ in writes[i + 9:] if r == 0x20), None)
            stops.append({'stop_ms': t, 'restart_ms': next_key,
                          'gap_ms': next_key - t if next_key is not None else None,
                          'instrument_ms': instrument,
                          'key_before_instrument': next_key is not None and instrument is not None and next_key < instrument})
    return stops


def silent_gaps(rms, window=.01, threshold=.001, minimum=.1):
    audible = np.flatnonzero(rms >= threshold)
    if not len(audible):
        return {'startup_seconds': len(rms) * window, 'gaps': []}
    start = int(audible[0])
    gaps = []
    edge = None
    for i in range(start, len(rms) + 1):
        silent = i < len(rms) and rms[i] < threshold
        if silent and edge is None:
            edge = i
        if not silent and edge is not None:
            if (i - edge) * window >= minimum:
                gaps.append({'start_seconds': edge * window, 'length_seconds': (i - edge) * window})
            edge = None
    return {'startup_seconds': start * window, 'gaps': gaps}


def wav_measure(path, window=.01, start=0, end=None):
    """RMS over both channels (no cancellation); bounded PCM reads, no trimming."""
    with wave.open(str(path), 'rb') as wav:
        if wav.getsampwidth() != 2 or wav.getcomptype() != 'NONE':
            raise ValueError('requires 16-bit PCM')
        rate, channels = wav.getframerate(), wav.getnchannels()
        duration = wav.getnframes() / rate
        end = min(duration, end if end is not None else duration)
        if not 0 <= start < end:
            raise ValueError('invalid WAV region')
        wav.setpos(round(start * rate))
        frames = round(window * rate)
        remaining = round((end - start) * rate)
        values = []
        while remaining >= frames:
            count = min(remaining // frames, 500) * frames
            data = np.frombuffer(wav.readframes(count), dtype='<i2').astype(float) / 32768
            if len(data) != count * channels:
                raise ValueError('truncated PCM')
            values.extend(np.sqrt(np.mean(data.reshape(-1, frames * channels) ** 2, axis=1)).tolist())
            remaining -= count
    result = silent_gaps(np.array(values), window)
    for gap in result['gaps']:
        gap['start_seconds'] += start
    result.update(duration_seconds=duration, region_start_seconds=start, region_end_seconds=end,
                  rms_window_seconds=window, silence_threshold=.001, minimum_gap_seconds=.1)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run', type=Path)
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--start', type=float, default=0, help='DRO onset selection, seconds')
    parser.add_argument('--end', type=float, default=60, help='DRO onset selection, seconds')
    parser.add_argument('--baseline-start', type=float, default=0)
    parser.add_argument('--baseline-end', type=float, default=60)
    parser.add_argument('--wav-start', type=float, default=0)
    parser.add_argument('--wav-end', type=float)
    args = parser.parse_args()
    run = args.run
    wav, dro = run / 'capture.wav', run / 'capture.dro'
    metadata = json.loads((run / 'run.json').read_text())
    with wav.open('rb') as f:
        wav_hash = hashlib.file_digest(f, 'sha256').hexdigest()
    if wav_hash != metadata['wav_sha256'] or metadata['exit_code'] != 0:
        parser.error('capture provenance/exit code check failed')
    raw = dro.read_bytes()
    writes = decode_dro(raw)
    notes = key_ons(writes)
    selected = [p for p in notes if args.start * 1000 <= p[0] < args.end * 1000]
    comparison = None
    if args.baseline:
        base = key_ons(decode_dro((args.baseline / 'capture.dro').read_bytes()))
        base = [p for p in base if args.baseline_start * 1000 <= p[0] < args.baseline_end * 1000]
        comparison = compare_onsets(base, selected)
    result = {
        'run': run.name, 'cycles': metadata['cycles'], 'wav_sha256': wav_hash,
        'dro_sha256': hashlib.sha256(raw).hexdigest(),
        'pcm': wav_measure(wav, start=args.wav_start, end=args.wav_end),
        'opl_last_write_ms': writes[-1][0] if writes else None,
        'opl_last_key_on_ms': notes[-1][0] if notes else None,
        'opl_key_on_count': len(notes), 'stop_events': stop_events(writes),
        'onset_comparison': comparison,
        'selected_dro_seconds': [args.start, args.end],
        'baseline_selected_dro_seconds': [args.baseline_start, args.baseline_end],
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
