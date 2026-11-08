#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Prove harness sensitivity using disposable guard mutations; never edit production."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MUTANTS = [
    ('id-marker', 'courier_id.c', 'set_digit(&id, 13u, 12u);', 'set_digit(&id, 13u, 11u);'),
    ('id-check-position', 'courier_id.c', 'if (i == 24u) continue;', 'if (i == 23u) continue;'),
    ('id-check-validation', 'courier_id.c', '&& digit(id, 24u) == check_digit(id);', '&& (digit(id, 24u) == check_digit(id) || 1);'),
    ('capsule-crc', 'capsule.c', 'if (crc32(bytes, length - 4u) != get32(bytes + length - 4u))', 'if (crc32(bytes, length - 4u) != get32(bytes + length - 4u) && 0)'),
    ('capsule-world', 'capsule.c', 'c.world >= COURIER_WORLD_COUNT', 'c.world > COURIER_WORLD_COUNT'),
    ('capsule-capacity', 'capsule.c', 'if (capacity < length)', 'if (capacity + 1u < length)'),
    ('decode-atomicity', 'capsule.c', 'if (length < COURIER_CAPSULE_MIN', 'memset(out, 0, sizeof *out);\n    if (length < COURIER_CAPSULE_MIN'),
    ('unknown-hash-clearing', 'capsule.c', 's->game_hash = 0u;', 's->game_hash = 1u;'),
]
for name, filename, old, new in MUTANTS:
    with tempfile.TemporaryDirectory(prefix='courier-mutation-') as tmp:
        dest = Path(tmp) / 'courier'
        shutil.copytree(ROOT, dest, ignore=shutil.ignore_patterns('.build', '.build-sanitize', '__pycache__'))
        source = dest / filename
        text = source.read_text()
        assert text.count(old) == 1, (name, 'mutation anchor must be unique')
        source.write_text(text.replace(old, new))
        build = subprocess.run(['make', '-s', '.build/test_courier'], cwd=dest, capture_output=True, text=True)
        if build.returncode:
            raise RuntimeError(f'{name}: compile failure is NOT a detected mutation\n{build.stdout}{build.stderr}')
        run = subprocess.run(['./.build/test_courier'], cwd=dest, capture_output=True, text=True)
        if run.returncode != 1 or 'test_courier.c:' not in run.stderr:
            raise RuntimeError(f'{name}: expected assertion failure, got {run.returncode}\n{run.stdout}{run.stderr}')
        print(f'DETECTED {name}: {run.stderr.strip()}')
print(f'PASS: {len(MUTANTS)} independently compiled mutants caught by assertions')
