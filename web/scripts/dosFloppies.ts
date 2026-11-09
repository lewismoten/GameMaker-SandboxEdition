// Optional preparation on a modern host; produces flat disk folders, NOT bootable floppy images.
// From web/: npx vite-node scripts/dosFloppies.ts game.zip NEW-OUTPUT-DIRECTORY
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';

const args = process.argv.slice(2).filter((a) => a !== '--');
if (args.length !== 2) throw new Error('Usage: npx vite-node scripts/dosFloppies.ts game.zip NEW-OUTPUT-DIRECTORY');
const [input, output] = args.map((a) => resolve(a));
if (existsSync(output)) throw new Error(`Output already exists; nothing was changed: ${output}`);
const entries = await readZip(new Uint8Array(readFileSync(input)));
const config = entries.find((e) => e.name.toUpperCase() === 'CONFIG.BAT');
const stem = config && /^@ECHO OFF\r\n([A-Z0-9_'\-~!@#$%^&()]{1,8}) config\r\n$/.exec(new TextDecoder().decode(config.data))?.[1];
if (!stem) throw new Error('Expected a standalone DOS export ZIP with its generated CONFIG.BAT.');
const { splitDosFiles } = await import('../src/export/dosFloppies');
const disks = splitDosFiles(entries, stem); // validate and pack everything BEFORE creating output
mkdirSync(output);
for (const [i, files] of disks.entries()) {
  const dir = join(output, `DISK${i + 1}`);
  mkdirSync(dir);
  for (const file of files) writeFileSync(join(dir, file.name), file.data, { flag: 'wx' });
  console.log(`disk ${i + 1} of ${disks.length}: ${dir}`);
}
console.log('Copy each DISKn folder CONTENTS to a separate formatted 1.44 MB disk. Start INSTALL on disk 1.');
console.log('These are file layouts, not disk images. Read INSTALL.TXT and check all COPY messages.');
