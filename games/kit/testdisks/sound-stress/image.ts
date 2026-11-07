// Explicit private image output; refuses replacement so existing reference artifacts are preserved.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { dosFiles, makeFloppy } from './floppy';

const arg = process.argv.indexOf('--out');
if (arg < 0 || !process.argv[arg + 1]) throw new Error('Use --out /private/path/SOUNDTST.img (a new file)');
const out = resolve(process.argv[arg + 1]);
if (!/^SOUNDTST[^/]*\.img$/i.test(out.split('/').at(-1)!)) throw new Error('Image name must be SOUNDTST*.img');
const files = await dosFiles();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, makeFloppy(files), { flag: 'wx' });
console.log(`${out}: 1474560 bytes; FAT12, F0, 18 sectors/track, 2 heads; ${files.size} files. Data floppy, not bootable.`);
