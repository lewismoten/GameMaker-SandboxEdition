// Checks that no text a game draws is cut off by the edge of its picture (see textBounds.ts):
// rebuilds each game into a temp folder with the audit on and lists every string whose ink runs
// past its picture or clip area and is never shown whole (a scroll or type-on that is shown
// whole in another frame is fine). Exits 1 if there are any.
//   cd web && npx vite-node ../games/kit/textBoundsCheck.ts [<id>...] [--moving] [--keep <dir>] [--from <dir>]
// With no ids, every game with an about.json (the secret one only when named). --moving also
// lists the moving text; --keep saves each build's report as <dir>/<id>.json, and --from reads
// those instead of building.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, readBounds, type TextOverflow } from './textBounds';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = join(gamesDir, '../web');
const args = process.argv.slice(2);
const opt = (f: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const keep = opt('--keep');
const from = opt('--from');

function build(id: string): { cut: TextOverflow[]; moving: TextOverflow[] } {
  if (from) return readBounds(join(from, `${id}.json`));
  const out = mkdtempSync(join(tmpdir(), 'gm-bounds-'));
  try {
    const report = join(out, 'bounds.json');
    const r = spawnSync(join(webDir, 'node_modules/.bin/vite-node'), [`../games/${id}/build.ts`], {
      cwd: webDir,
      env: { ...process.env, GAME_DISK_OUT: join(out, 'disk'), TEXT_BOUNDS: report },
      encoding: 'utf8',
      maxBuffer: 256 << 20,
    });
    if (r.status !== 0) throw new Error(`${id}: build failed\n${(r.stdout ?? '') + (r.stderr ?? '')}`.slice(-2000));
    if (keep) {
      mkdirSync(keep, { recursive: true });
      copyFileSync(report, join(keep, `${id}.json`));
    }
    return readBounds(report);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

const named = args.filter((a, i) => !a.startsWith('--') && !['--keep', '--from'].includes(args[i - 1]));
const ids = named.length
  ? named
  : readdirSync(gamesDir)
      .filter((id) => existsSync(join(gamesDir, id, 'about.json')))
      .filter((id) => !(JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as { secret?: boolean }).secret)
      .sort();
let cuts = 0;
for (const id of ids) {
  const { cut, moving } = build(id);
  cuts += cut.length;
  console.log(`${id}: ${cut.length ? `${cut.length} cut off` : 'all text fits'}${moving.length ? ` (${moving.length} moving)` : ''}`);
  for (const o of cut) console.log(`  ${describe(o)}`);
  if (args.includes('--moving')) for (const o of moving) console.log(`  moving: ${describe(o)}`);
}
process.exit(cuts ? 1 : 0);
