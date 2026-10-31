// `npm run disk:diff -- <a> <b> [--json]`: compare two Game-Maker disks, each a folder (such as
// games/<id>/disk) or a .zip. Lists changed, added and removed files with a plain-text summary of
// what changed in each, by file type. The same inputs print the same text. Exit 0 either way.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { diffDisks, formatDiff, type DiskFiles } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';

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

const args = process.argv.slice(2).filter((a) => a !== '--');
const json = args.includes('--json');
const [a, b] = args.filter((x) => x !== '--json');
if (!a || !b) {
  console.error('Usage: npm run disk:diff -- <folder|.zip> <folder|.zip> [--json]');
  process.exit(2);
}
const diff = diffDisks(await load(a), await load(b));
process.stdout.write(json ? JSON.stringify(diff, null, 2) + '\n' : formatDiff(diff));
