// Pictures of blocks as four kinds of eyes see them: one PNG per vision (normal, protan, deutan, tritan), the
// blocks side by side at 8x, for a look before and after a color-cue fix.
//   cd web && npx vite-node ../games/kit/colorCuesShots.ts <id> <scene> <b12|m3 ...> --out <folder> [--name label]
// "b12" is background block 12 of that scene's set, "m3" monster block 3.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { simulatePalette, type Vision } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { GameFiles } from '../../web/src/project/files';
import { gameOf } from '../../web/src/editor/check/playtest';
import { scenesOf } from '../../web/src/editor/check/sceneData';

const argv = process.argv.slice(2);
const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const pos = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const [id, scene, ...specs] = pos;
const out = opt('--out') ?? '.';
const name = opt('--name') ?? id;
const files = new GameFiles(readDisk(join(import.meta.dirname, '..', id, 'disk')));
const d = scenesOf(gameOf(files), files).find((s) => s.scene === Number(scene));
if (!d) throw new Error(`no scene ${scene}`);
const sheet = new Pixels(specs.length * 21 + 1, 22, 255);
specs.forEach((s, i) => {
  const b = (s[0] === 'm' ? d.mbl : d.bbl)[Number(s.slice(1))];
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) sheet.set(1 + i * 21 + x, 1 + y, b.pixels[y * 20 + x]);
});
mkdirSync(out, { recursive: true });
for (const v of [undefined, 'protan', 'deutan', 'tritan'] as (Vision | undefined)[])
  writePng(join(out, `${name}-${v ?? 'normal'}.png`), sheet, v ? simulatePalette(d.palette, v) : d.palette, 8);
