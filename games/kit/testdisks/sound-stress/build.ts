// Explicit build only: never called by catalog/build-games discovery.
// cd web && npx vite-node ../games/kit/testdisks/sound-stress/build.ts
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeDisk } from './disk';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = args.includes('--out') ? resolve(args[args.indexOf('--out') + 1]) : join(here, 'disk');
const disk = makeDisk(out);
console.log(`SOUND STRESS: ${disk.files.size} files, ${disk.write()} bytes in ${out}`);
