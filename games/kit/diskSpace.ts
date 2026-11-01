// The editor's disk-space tool (web/src/editor/disk) over built games: what it would merge, what
// it left alone and why, and the size on floppy disks. Reads games/<id>/disk, changes nothing.
//   cd web && npx vite-node ../games/kit/diskSpace.ts [<id>...]            one line per finding
//   cd web && npx vite-node ../games/kit/diskSpace.ts --write              also writes .for-lewis/disk-space-findings.md
//   cd web && npx vite-node ../games/kit/diskSpace.ts <id> --strict        exit 1 when a step is left to apply
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { planDisk } from '../../web/src/editor/disk/plan';
import { sizeUp, floppyLine } from '../../web/src/editor/disk/size';

const here = dirname(fileURLToPath(import.meta.url));
const games = join(here, '..');
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
// a secret game is never named outside its own folder, so the tool skips it unless asked for by id
const secret = (d: string) => {
  try {
    return JSON.parse(readFileSync(join(games, d, 'about.json'), 'utf8')).secret === true;
  } catch {
    return false;
  }
};
const all = readdirSync(games).filter((d) => existsSync(join(games, d, 'disk')) && d !== 'kit' && !secret(d));
let left = 0;
const lines: string[] = [
  '# Disk space findings',
  '',
  'From `npx vite-node ../games/kit/diskSpace.ts --write` (web/). Nothing here was changed; each is a suggestion.',
  '',
];
for (const id of ids.length ? ids : all) {
  const files = new GameFiles(readDisk(join(games, id, 'disk')));
  const gam = files.byExtension('gam')[0];
  if (!gam) continue;
  const plan = planDisk(files, gam);
  const size = sizeUp(files, gam);
  left += plan.steps.length;
  const head = `${id}: ${floppyLine(size)}`;
  console.log(head);
  lines.push(`## ${id}`, '', floppyLine(size), '');
  for (const s of plan.steps) {
    console.log(`  MERGE ${s.title} (saves ${s.saves} bytes)`);
    lines.push(`- **${s.title}**, saves ${s.saves} bytes. ${s.changes.join('; ')}.`);
  }
  for (const n of plan.notes) {
    console.log(`  note: ${n.title}: ${n.why}`);
    lines.push(`- Left alone: ${n.title}, because ${n.why}.`);
  }
  if (!plan.steps.length && !plan.notes.length) lines.push('- Nothing to merge.');
  lines.push('');
}
if (args.includes('--write')) {
  const dir = join(here, '..', '..', '.for-lewis');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'disk-space-findings.md'), lines.join('\n'));
}
if (args.includes('--strict') && left) process.exit(1);
