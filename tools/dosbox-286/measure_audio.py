#!/usr/bin/env python3
"""Measure PCM silence and matching OPL key-on passages; no audio synthesis."""
import argparse
from bisect import bisect_right
import hashlib
import json
from pathlib import Path
import struct
import wave
import numpy as np


def decode_dro(data, allow_rollover=False):
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
    if now != duration and not (allow_rollover and duration - now > 30000):
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


def cmf_notes(data):
    """One score pass, following SBMUSIC.C PlayIt/getpaws (leading delta skipped).

    This is a score reader, not a Creative voice allocator or hardware simulator.
    Rhythm notes are retained; callers can avoid rhythm-mode pieces for pitch fits.
    """
    if len(data) < 14 or data[:4] != b'CTMF':
        raise ValueError('not CMF')
    music = struct.unpack_from('<H', data, 8)[0]
    if struct.unpack_from('<H', data, 12)[0] != 146:
        raise ValueError('unexpected CMF clock')
    b = data[music:]
    def delta(offset):
        value = b[offset] & 127
        while b[offset] & 128:
            offset += 1
            value = (value << 7) | (b[offset] & 127)
        return value, offset + 1
    result = []
    tick, function = 0, 8
    try:
        _, offset = delta(0)
        while offset < len(b):
            status = b[offset]
            if status & 240 in (128, 144):
                function = status >> 4
                offset += 1
            status = b[offset]
            if status < 128:
                if function == 9 and b[offset + 1]:
                    result.append((tick, status))
                offset += 2
            elif status & 240 in (160, 176, 224):
                offset += 3
            elif status & 240 in (192, 208):
                offset += 2
            elif status in (240, 247):
                size, offset = delta(offset + 1)
                offset += size + 1
            else:
                break
            wait, offset = delta(offset)
            tick += wait
    except IndexError as exc:
        raise ValueError('truncated CMF event') from exc
    return result


def pitched_ons(writes):
    """Nearest equal-tempered MIDI pitch from OPL2 F-number and block."""
    result = []
    for t, (voice, low, high) in key_ons(writes):
        if voice >= 9:
            continue
        frequency = (low + (high & 3) * 256) * (2 ** ((high >> 2) & 7)) * 49716 / (2 ** 20)
        if frequency > 0:
            result.append((t, int(round(69 + 12 * np.log2(frequency / 440)))))
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
    """All-off signature: >=4 descending zero B registers, ending at B0.

    The library writes all nine; DOSBox-X suppresses already-zero registers.
    Ordinary note-offs retain their frequency/block bits, unlike this reset.
    """
    stops = []
    onsets = [t for t, _ in key_ons(writes)]
    instruments = [t for t, r, _ in writes if r == 0x20]
    i = 0
    while i < len(writes):
        t, reg, value = writes[i]
        if not (0xb0 <= reg <= 0xb8 and value == 0):
            i += 1
            continue
        j, previous = i + 1, reg
        while j < len(writes):
            a, r, v = writes[j]
            if not (0xb0 <= r < previous and v == 0 and a - t <= 20):
                break
            previous = r
            j += 1
        if j - i >= 4 and previous == 0xb0:
            k = bisect_right(onsets, writes[j - 1][0])
            next_key = onsets[k] if k < len(onsets) else None
            k = bisect_right(instruments, writes[j - 1][0])
            instrument = instruments[k] if k < len(instruments) else None
            stops.append({'stop_ms': t, 'restart_ms': next_key,
                          'gap_ms': next_key - t if next_key is not None else None,
                          'instrument_ms': instrument,
                          'key_before_instrument': next_key is not None and instrument is not None and next_key < instrument})
        i = j
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


def wav_measure(path, window=.01, start=0.0, end=None):
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
    if start > 0 and result['startup_seconds'] >= .1:
        result['gaps'].insert(0, {'start_seconds': 0, 'length_seconds': result['startup_seconds']})
        result['startup_seconds'] = 0
    for gap in result['gaps']:
        gap['start_seconds'] += start
    result.update(duration_seconds=duration, region_start_seconds=start, region_end_seconds=end,
                  rms_window_seconds=window, silence_threshold=.001, minimum_gap_seconds=.1)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run', type=Path)
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--score', type=Path, help='optional source CMF, first 60 s at the PIT tick rate')
    parser.add_argument('--start', type=float, default=0, help='DRO onset selection, seconds')
    parser.add_argument('--end', type=float, default=60, help='DRO onset selection, seconds')
    parser.add_argument('--baseline-start', type=float, default=0)
    parser.add_argument('--baseline-end', type=float, default=60)
    parser.add_argument('--wav-start', type=float, default=0)
    parser.add_argument('--wav-end', type=float)
    parser.add_argument('--dro-segment', type=int, default=0)
    parser.add_argument('--allow-rollover', action='store_true',
                        help='accept DOSBox-X documented >30 s unencoded rollover tails, report separately')
    args = parser.parse_args()
    run = args.run
    wav = run / 'capture.wav'
    dro_files = [run / 'capture.dro'] if (run / 'capture.dro').exists() else sorted((run / 'raw').glob('*.dro'))
    if not 0 <= args.dro_segment < len(dro_files):
        parser.error('missing DRO segment')
    dro = dro_files[args.dro_segment]
    metadata = json.loads((run / 'run.json').read_text())
    with wav.open('rb') as f:
        wav_hash = hashlib.file_digest(f, 'sha256').hexdigest()
    if wav_hash != metadata['wav_sha256'] or metadata['exit_code'] != 0:
        parser.error('capture provenance/exit code check failed')
    raw = dro.read_bytes()
    writes = decode_dro(raw, allow_rollover=args.allow_rollover)
    notes = key_ons(writes)
    selected = [p for p in notes if args.start * 1000 <= p[0] < args.end * 1000]
    comparison = None
    if args.baseline:
        base = key_ons(decode_dro((args.baseline / 'capture.dro').read_bytes()))
        base = [p for p in base if args.baseline_start * 1000 <= p[0] < args.baseline_end * 1000]
        comparison = compare_onsets(base, selected)
    score_comparison = None
    if args.score:
        score = [(t * 8191 / 1193182 * 1000, k) for t, k in cmf_notes(args.score.read_bytes())
                 if t * 8191 / 1193182 < 60]
        pitched = [p for p in pitched_ons(writes) if args.start * 1000 <= p[0] < args.end * 1000]
        score_comparison = compare_onsets(score, pitched)
    result = {
        'run': run.name, 'cycles': metadata['cycles'], 'wav_sha256': wav_hash,
        'dro_sha256': hashlib.sha256(raw).hexdigest(),
        'dro_file': str(dro.relative_to(run)), 'dro_segment_count': len(dro_files),
        'dro_header_ms': struct.unpack_from('<I', raw, 16)[0],
        'rollover_unencoded_tail_ms': struct.unpack_from('<I', raw, 16)[0] - (writes[-1][0] if writes else 0),
        'pcm': wav_measure(wav, start=args.wav_start, end=args.wav_end),
        'opl_last_write_ms': writes[-1][0] if writes else None,
        'opl_last_key_on_ms': notes[-1][0] if notes else None,
        'opl_key_on_count': len(notes), 'stop_events': stop_events(writes),
        'onset_comparison': comparison, 'score_comparison': score_comparison,
        'selected_dro_seconds': [args.start, args.end],
        'baseline_selected_dro_seconds': [args.baseline_start, args.baseline_end],
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
