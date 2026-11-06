#!/usr/bin/env python3
"""Collect verified captures into auditable PCM, OPL-event and phrase-fit JSON."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import numpy as np
from measure_audio import compare_onsets, decode_dro, key_ons, stop_events, wav_measure

REPO = Path(__file__).resolve().parents[2]


def inspect_run(run):
    scenario, cycles, repeat = run.name.rsplit('-', 2)
    metadata = json.loads((run / 'run.json').read_text())
    with (run / 'capture.wav').open('rb') as f:
        digest = hashlib.file_digest(f, 'sha256').hexdigest()
    if digest != metadata['wav_sha256'] or metadata['exit_code'] != 0:
        raise ValueError(f'{run.name}: invalid capture provenance')
    pcm = wav_measure(run / 'capture.wav')
    files = [run / 'capture.dro'] if (run / 'capture.dro').exists() else sorted((run / 'raw').glob('*.dro'))
    if not files:
        raise ValueError(f'{run.name}: no OPL capture')
    segments = []
    for file in files:
        raw = file.read_bytes()
        writes = decode_dro(raw, allow_rollover=True)
        notes = key_ons(writes)
        header_ms = struct.unpack_from('<I', raw, 16)[0]
        gaps = [{'start_ms': a[0], 'length_ms': b[0] - a[0]}
                for a, b in zip(writes, writes[1:]) if b[0] - a[0] >= 2000]
        segments.append({
            'file': str(file.relative_to(run)), 'sha256': hashlib.sha256(raw).hexdigest(),
            'header_ms': header_ms, 'last_write_ms': writes[-1][0],
            'last_key_on_ms': notes[-1][0] if notes else None,
            'unencoded_rollover_gap_ms': header_ms - writes[-1][0],
            'write_gaps_at_least_2s': gaps, 'stops': stop_events(writes),
            '_writes': writes, '_notes': notes,
        })
    passages = {}
    first = segments[0]
    notes, stops = first['_notes'], first['stops']
    def passage(name, start, end, wav_start, wav_end):
        passages[name] = {
            'dro_start_ms': start, 'dro_end_ms': end,
            'pcm': wav_measure(run / 'capture.wav', start=wav_start, end=wav_end),
            '_notes': [v for v in notes if start <= v[0] < end],
        }
    onset = pcm['startup_seconds']
    if scenario in ('menu', 'gif'):
        passage('first60', 0, 60000, onset, onset + 60)
    elif scenario != 'loop' and stops and stops[0]['restart_ms'] is not None:
        start = stops[0]['restart_ms']
        length = 20000 if scenario == 'wood' else 60000
        passage('quiet', start, start + length, onset + start / 1000,
                onset + (start + length) / 1000)
        if scenario in ('sand', 'stress'):
            passage('motion', 165000 - onset * 1000, 225000 - onset * 1000, 165, 225)
        if scenario == 'toggle' and len(stops) >= 2 and stops[1]['restart_ms'] is not None:
            start = stops[1]['restart_ms']
            passage('after_toggle', start, start + 20000,
                    onset + start / 1000, onset + start / 1000 + 20)
    if len(segments) == 1:
        # Censored end: no claim is made about when progression would resume.
        first['trailing_no_write_ms'] = max(0, round((pcm['duration_seconds'] - onset) * 1000) - first['last_write_ms'])
    return {'run': run.name, 'scenario': scenario, 'cycles': int(cycles), 'repeat': int(repeat),
            'wav_sha256': digest, 'pcm': pcm, 'segments': segments, 'passages': passages}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('roots', type=Path, nargs='+')
    parser.add_argument('--partial', action='store_true', help='inspect only finished status records')
    args = parser.parse_args()
    records, failures = [], []
    for root in args.roots:
        if not args.partial and not (root / 'matrix.json').exists():
            parser.error(f'{root}: matrix not finalized (or use --partial)')
        for status in sorted(root.glob('*.status.json')):
            item = json.loads(status.read_text())
            if item['exit_code'] != 0:
                failures.append({'root': root.name, **item})
                continue
            result = inspect_run(root / item['directory'])
            result['root'] = root.name
            records.append(result)
    baselines = {(r['scenario'], r['repeat']): r for r in records if r['cycles'] == 20000}
    for row in records:
        base = baselines.get((row['scenario'], 1))
        for name, p in row['passages'].items():
            ref = base['passages'].get(name) if base else None
            p['vs_baseline'] = compare_onsets(ref['_notes'], p['_notes']) if ref else None
            if row['scenario'] == 'toggle' and name == 'after_toggle':
                # F3 restarts the same score; compare against the first 20 s before it.
                quiet = row['passages']['quiet']
                q = [v for v in quiet['_notes'] if v[0] < quiet['dro_start_ms'] + 20000]
                p['vs_pre_toggle'] = compare_onsets(q, p['_notes'])
        if row['scenario'] == 'loop':
            stops = row['segments'][0]['stops'][1:]
            complete = [s for s in stops if s['restart_ms'] is not None]
            gaps = [s['gap_ms'] for s in complete]
            row['scene_loops'] = {
                'complete_count': len(complete),
                'min_stop_gap_ms': min(gaps) if gaps else None,
                'median_stop_gap_ms': float(np.median(gaps)) if gaps else None,
                'max_stop_gap_ms': max(gaps) if gaps else None,
                'early_key_before_instrument_candidates': sum(
                    s['key_before_instrument'] and s['instrument_ms'] - s['restart_ms'] > 100 for s in complete),
            }
    # Remove private arrays, retaining all timestamps/counts/fit spans and hashes.
    for row in records:
        for segment in row['segments']:
            segment.pop('_writes')
            segment.pop('_notes')
        for passage in row['passages'].values():
            passage.pop('_notes')
    print(json.dumps({'schema': 1, 'complete': not args.partial,
                      'capture_count': len(records), 'failed_capture_count': len(failures),
                      'failures': failures, 'captures': records}, indent=2))


if __name__ == '__main__':
    main()
