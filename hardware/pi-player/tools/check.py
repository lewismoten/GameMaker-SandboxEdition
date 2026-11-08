"""Run the existing Pocket oracle, then compare SDL host frames using its exact artifacts."""
import argparse
import subprocess
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('data', type=Path, help='Pocket folder or one GMP')
parser.add_argument('id', help='repository game with built disk and recorded walkthrough')
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
player = root / 'hardware/pi-player/build/pi-player'
with tempfile.TemporaryDirectory(prefix='pi-replay-') as work:
    subprocess.run(['npx', 'vite-node', 'scripts/pocketHostCheck.ts', args.id,
                    '--data', str(args.data.resolve()), '--keep', work], cwd=root / 'web', check=True)
    fixture = Path(work) / args.id
    subprocess.run([str(player), '--headless', str(args.data.resolve()), args.id,
                    str(fixture / 'keys.txt'), str(fixture / 'expected.txt')], check=True)
