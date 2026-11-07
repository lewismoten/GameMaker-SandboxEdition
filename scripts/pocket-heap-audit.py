#!/usr/bin/env python3
"""Audit packed indexes without dropping games. Host measurements, never board heap.
Run from any directory; --card is pocketData.ts --out's /pocket folder.
"""
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]


def read_index(path, source):
    rows = []
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        fields = line.split('|')
        if len(fields) != (4 if source == 'sd' else 3):
            raise ValueError(f'malformed index row: {line!r}')
        ident, title, levels = fields[:3]
        if not ident or '/' in ident or '\\' in ident or ident in ('.', '..'):
            raise ValueError(f'unsafe id: {ident!r}')
        rows.append(dict(id=ident, title=title, levels=int(levels), source=source,
                         cfg=(fields[3] if source == 'sd' else ident) + '.cfg'))
    return rows


def reconcile(onboard, card, expected):
    rows = onboard + card
    ids = [r['id'] for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError('duplicate game id across indexes')
    return dict(expected_games=expected, actual_games=len(rows),
                expected_count_matches=len(rows) == expected, games=rows)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--card', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--expected-games', type=int, default=121)
    parser.add_argument('--replay', action='store_true', help='also run the full tick-for-tick walkthroughs')
    args = parser.parse_args()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    card = args.card.resolve()
    onboard = ROOT / 'hardware/pocket-player/data'
    inventory = reconcile(read_index(onboard / 'games.txt', 'onboard'),
                          read_index(card / 'games.txt', 'sd'), args.expected_games)
    inventory['indexes_sha256'] = {str(p): digest(p) for p in [onboard / 'games.txt', card / 'games.txt']}
    # Host tools address <id>.cfg, while the actual SD index uses 8.3 names.
    # Copy into the report, never modify the source card or its real filenames.
    alias = out / 'card-host'
    shutil.copytree(card, alias, dirs_exist_ok=True)
    for row in inventory['games']:
        disk = ROOT / 'games' / row['id'] / 'disk'
        row['walkthrough_sha256'] = digest(disk.parent / 'walkthrough.json')
        row['disk_exists'] = disk.is_dir()
        row['disk_sha256'] = None
        if disk.is_dir():
            h = hashlib.sha256()
            for p in sorted(disk.iterdir()):
                if p.is_file():
                    h.update(p.name.encode() + b'\0' + p.read_bytes() + b'\0')
            row['disk_sha256'] = h.hexdigest()
        if row['source'] == 'sd':
            cfg = card / row['cfg']
            row['cfg_sha256'] = digest(cfg)
            if cfg.is_file():
                shutil.copyfile(cfg, alias / (row['id'] + '.cfg'))
    (out / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n')
    runs = []

    def run(command, label, cwd=ROOT, timeout=3600):
        start = time.time()
        try:
            proc = subprocess.run([str(c) for c in command], cwd=cwd, capture_output=True,
                                  text=True, timeout=timeout)
            stdout, stderr, code = proc.stdout, proc.stderr, proc.returncode
        except subprocess.TimeoutExpired as error:
            stdout = (error.stdout or b'').decode() if isinstance(error.stdout, bytes) else error.stdout or ''
            stderr, code = 'audit timeout', 124
        (out / (label + '.stdout.log')).write_text(stdout)
        (out / (label + '.stderr.log')).write_text(stderr)
        runs.append(dict(command=[str(c) for c in command], cwd=str(cwd), exit_code=code,
                         started_unix=start, seconds=time.time() - start, label=label))
        (out / 'commands.json').write_text(json.dumps(runs, indent=2) + '\n')
        return code, stdout

    exe = out / 'heaptest'
    code, _ = run(['c++', '-std=c++17', '-O1', '-Wall', '-Wextra', '-I',
                   ROOT / 'hardware/pocket-player/src', ROOT / 'hardware/pocket-player/host/heaptest.cpp',
                   '-o', exe, '-lz'], 'compile')
    if code:
        return code
    heap = []
    failures = []
    for game in inventory['games']:
        code, stdout = run([exe, alias if game['source'] == 'sd' else onboard, game['id']],
                           'heap-' + game['id'], timeout=60)
        rows = [dict(json.loads(line), id=game['id'], source=game['source']) for line in stdout.splitlines()]
        heap.extend(rows)
        if code or len(rows) != game['levels']:
            failures.append(dict(id=game['id'], exit_code=code, measured_levels=len(rows), expected_levels=game['levels']))
    (out / 'heap.json').write_text(json.dumps(heap, indent=2) + '\n')
    if heap:
        with (out / 'heap.csv').open('w') as f:
            writer = csv.DictWriter(f, fieldnames=list(heap[0]))
            writer.writeheader()
            writer.writerows(heap)
    replay_codes = []
    if args.replay:
        for source, data in [('onboard', onboard), ('sd', alias)]:
            ids = [r['id'] for r in inventory['games'] if r['source'] == source]
            keep = out / ('replay-' + source)
            keep.mkdir(exist_ok=True)
            code, _ = run(['npx', '--no-install', 'vite-node', '-c', '../scripts/game-build.config.mjs',
                           'scripts/pocketHostCheck.ts', *ids, '--data', data, '--keep', keep],
                          'replay-' + source, cwd=ROOT / 'web')
            replay_codes.append(code)
    # Preserve the requested command's absence/failure; do not invent an npm alias.
    cyd_code, _ = run(['npm', 'run', 'check:cyd'], 'check-cyd')
    env = dict(platform=platform.platform(), python=platform.python_version(),
               base_commit=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
               node=subprocess.check_output(['node', '--version'], text=True).strip(),
               cxx=subprocess.check_output(['c++', '--version'], text=True).splitlines()[0],
               npm=subprocess.check_output(['npm', '--version'], text=True).strip())
    (out / 'environment.json').write_text(json.dumps(env, indent=2) + '\n')
    summary = dict(games=len(inventory['games']), levels=len(heap), heap_failures=failures,
                   expected_count_matches=inventory['expected_count_matches'],
                   replay_exit_codes=replay_codes, check_cyd_exit_code=cyd_code,
                   units='bytes', metric='scoped host requested allocation bytes, not CYD heap',
                   top_ten_provisional=sorted((r for r in heap if r['loaded']), key=lambda r: r['peak_bytes'], reverse=True)[:10])
    (out / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))
    return int(bool(failures or any(replay_codes) or cyd_code or not inventory['expected_count_matches']))


if __name__ == '__main__':
    raise SystemExit(main())
