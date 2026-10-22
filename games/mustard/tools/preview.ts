// Design previews (never on the disk): the block, monster and seed sheets, as PNGs in the
// folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/mustard/tools/preview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { buildPalette } from '../src/art/pal';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';

const out = process.argv[2] ?? join(tmpdir(), 'mustard-preview');
mkdirSync(out, { recursive: true });
const day = buildPalette('day');
const mb = buildMonsterBlocks(day);
const cb = buildCharBlocks(day);
writePng(join(out, 'monsters.png'), blockSheet(mb.blocks.slice(0, mb.index.size), 12), day.pal, 4);
writePng(join(out, 'seed.png'), blockSheet(cb.blocks.slice(0, cb.index.size), 13), day.pal, 4);
console.log(`previews in ${out}`);
