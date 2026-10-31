// `npm run disk:diff -- <a> <b> [--json|--notes]` or `-- <game-id> --since [rev]` (against Git): compare two Game-Maker disks, each a folder (such as
// games/<id>/disk) or a .zip. Lists changed, added and removed files with a plain-text summary of
// what changed in each, by file type. The same inputs print the same text. Exit 0 either way.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { diffDisks, formatDiff, type DiskFiles } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { lastPushToMaster, VersionDisks } from '../../games/kit/versionDisks';
import { parseDiskDiffArgs } from './diskDiffArgs';
import { releaseNotes } from '@lewismoten/gamemaker-sandbox-tools/release-notes';

async function load(source: string): Promise<DiskFiles> {
  const files = new Map<string, Uint8Array>();
  if (statSync(source).isDirectory()) {
    for (const n of readdirSync(source)) if (statSync(join(source, n)).isFile()) files.set(n.toLowerCase(), new Uint8Array(readFileSync(join(source, n))));
  } else {
    for (const { name, data } of await readZip(new Uint8Array(readFileSync(source))))
      if (!name.endsWith('/')) files.set(name.split('/').pop()!.toLowerCase(), data);
  }
  return files;
}

const parsed = parseDiskDiffArgs(process.argv.slice(2));
if ('error' in parsed) {
  console.error(parsed.error);
  process.exit(2);
}
let before: DiskFiles;
let after: DiskFiles;
if (parsed.mode === 'paths') {
  before = await load(parsed.a);
  after = await load(parsed.b);
} else {
  const root = join(import.meta.dirname, '../..');
  const gameDir = join(root, 'games', parsed.game);
  if (!existsSync(join(gameDir, 'about.json'))) {
    console.error(`No game "${parsed.game}" in games/.`);
    process.exit(2);
  }
  if ((JSON.parse(readFileSync(join(gameDir, 'about.json'), 'utf8')) as { secret?: boolean }).secret) {
    console.error('That game is not available to compare.');
    process.exit(2);
  }
  const built = spawnSync(process.execPath, [join(root, 'scripts/build-games.mjs')], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  if (built.status !== 0) process.exit(built.status ?? 1);
  const rev = parsed.since ?? lastPushToMaster(root);
  if (!rev) {
    console.error('No master to compare with here; pass --since <rev>.');
    process.exit(2);
  }
  const disks = new VersionDisks(root, rev);
  try {
    before = await disks.files(parsed.game);
  } finally {
    disks.dispose();
  }
  after = await load(join(gameDir, 'disk'));
  console.error(`${parsed.game}: disk now against ${rev.slice(0, 9)}`);
}
const diff = diffDisks(before, after);
if (parsed.notes) process.stdout.write(releaseNotes(diff) + '\n');
else process.stdout.write(parsed.json ? JSON.stringify(diff, null, 2) + '\n' : formatDiff(diff));
