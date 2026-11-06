#!/usr/bin/env python3
"""Stage controlled Donut graphs outside the archive and capture a fixed matrix."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
# Key times are emulated milliseconds after ADDKEY, not musical time.
SCENARIOS = {
    'menu': (150, ''),
    'gif': (150, ''),
    'sand': (270, 'p90000 l50 enter p75000 l60000 right space p80000 l50 f3 p5000 f3'),
    'wood': (210, 'p90000 l50 enter'),
    'loop': (1400, 'p90000 l50 enter'),
    'stress': (240, 'p90000 l250 enter p75000 l60000 right space'),
    'toggle': (210, 'p90000 l250 enter p80000 l250 f3 p5000 f3'),
    'f3': (210, 'p90000 l250 enter p80000 l600 f3 p5000 f3'),
}


def prepare(root, scenario):
    if scenario not in SCENARIOS:
        raise ValueError('unknown scenario')
    source = REPO / 'cd/gameware/donut'
    destination = root / scenario
    if destination.resolve().is_relative_to(source.resolve()):
        raise ValueError('fixtures must be outside the archive')
    shutil.copytree(source, destination)
    d = bytearray((source / 'donut.gam').read_bytes())
    if d[:2] != b'GM':
        raise ValueError('expected v3 GAM')
    for slot in (0, 1, 2, 11):
        struct.pack_into('<H', d, 262 + 43 + slot * 2, 0)
    if scenario == 'gif':
        value = struct.unpack_from('<H', d, 262 + 43 + 8 * 2)[0]
        struct.pack_into('<H', d, 262 + 43 + 2 * 2, value)
    if scenario == 'wood':
        struct.pack_into('<H4h', d, 262 + 83, 5, 0, 0, 40, 43)
    if scenario == 'loop':
        for k in range(20):
            struct.pack_into('<H4h', d, 262 + 2 * 283 + 83 + 10 * k,
                             2, 38 + k % 4, 41 + k // 4, 40, 43)
    target = destination / 'donut.gam'
    target.write_bytes(d)
    if scenario in ('stress', 'f3'):
        # CHR_RECORD_SIZE=3784; hit-point meter begins at 3724 (formats/character.ts).
        character = bytearray((source / 'donut.chr').read_bytes())
        struct.pack_into('<h', character, 3724, 32767)
        (destination / 'donut.chr').write_bytes(character)
    (destination / 'measurement-fixture.json').write_text(json.dumps({
        'scenario': scenario, 'source_gam_sha256': hashlib.sha256((source / 'donut.gam').read_bytes()).hexdigest(),
        'fixture_gam_sha256': hashlib.sha256(d).hexdigest(),
        'modified_archival_files': ['donut.gam', 'donut.chr'] if scenario in ('stress', 'f3') else ['donut.gam'],
    }, indent=2) + '\n')
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path, help='new directory outside the repository')
    parser.add_argument('--scenarios', nargs='+', choices=SCENARIOS, default=list(SCENARIOS))
    parser.add_argument('--cycles', nargs='+', type=int, default=[20000, 1000, 2000, 3000])
    parser.add_argument('--repeats', type=int, default=2)
    parser.add_argument('--jobs', type=int, choices=range(1, 5), default=4)
    args = parser.parse_args()
    root = args.output.resolve()
    if root.exists() or root.is_relative_to(REPO):
        parser.error('output must be new and outside the repository')
    if args.repeats < 2 or any(c <= 0 for c in args.cycles):
        parser.error('need >=2 repeats and positive fixed cycles')
    root.mkdir(parents=True)
    fixtures = {s: prepare(root / 'fixtures', s) for s in args.scenarios}
    cases = [(s, c, r) for s in args.scenarios for r in range(1, args.repeats + 1) for c in args.cycles]
    def run(case):
        scenario, cycles, repeat = case
        seconds, keys = SCENARIOS[scenario]
        output = root / f'{scenario}-{cycles}-{repeat}'
        command = [sys.executable, str(HERE / 'capture.py'), str(cycles),
                   str(fixtures[scenario]), str(seconds), str(output), '--keys', keys]
        result = subprocess.run(command, capture_output=True, text=True)
        record = {'scenario': scenario, 'cycles': cycles, 'repeat': repeat,
                  'directory': output.name, 'exit_code': result.returncode,
                  'stdout': result.stdout, 'stderr': result.stderr}
        (root / f'{output.name}.status.json').write_text(json.dumps(record, indent=2) + '\n')
        print(json.dumps(record), flush=True)
        return record
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        records = list(pool.map(run, cases))
    (root / 'matrix.json').write_text(json.dumps(records, indent=2) + '\n')
    if any(r['exit_code'] for r in records):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
