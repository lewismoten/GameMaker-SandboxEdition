"""Compile public, non-Starter visibility metadata; bundles have no secret flag."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
print('// Generated from repository metadata; do not edit.\n#pragma once')
print('static const char* PUBLIC_IDS[] = {')
for about in sorted((root / 'games').glob('*/about.json')):
    meta = json.loads(about.read_text())
    if not meta.get('secret') and meta.get('series') != 'starter':
        print('  ' + json.dumps(about.parent.name) + ',')
print('};')
