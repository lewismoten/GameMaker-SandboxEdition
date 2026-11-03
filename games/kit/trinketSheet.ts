// A contact sheet of a game's field-made 3D-print trinkets (games/<id>/src/trinkets: TRINKETS and makeTrinket, as Depth
// Perception's and Quest for the Round Tuit's): each one seen from above (the renderer's negative pitch looks down on a z-up trinket), from a three-quarter angle and from the side,
// from its color bodies (what the 3MF holds), so a person can look at them. Also prints mesh stats.
//   cd web && npx vite-node ../games/kit/trinketSheet.ts <game> [--only id[,id]] [--out DIR]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng, renderBodies, sheet } from './trinketRender';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const game = args[0];
if (!game || game.startsWith('--')) throw new Error('usage: trinketSheet.ts <game> [--only id[,id]] [--out DIR]');
const out = resolve(flag('--out') ?? join(here, '../../.for-lewis/research/trinkets', game));
mkdirSync(out, { recursive: true });
const only = flag('--only')?.split(',');

const { TRINKETS, makeTrinket } = await import(/* @vite-ignore */ join(here, '..', game, 'src/trinkets/trinkets.ts'));
const views: [number, number][] = [
  [0, -90],
  [-30, -38],
  [0, -6],
];
const rows: ReturnType<typeof sheet>[] = [];
for (const def of TRINKETS.filter((d: { id: string }) => !only || only.includes(d.id))) {
  const t = makeTrinket(def);
  const images = views.map(([yaw, pitch]) => renderBodies(t.bodies, yaw, pitch, 300, 300));
  const row = sheet(images, 6);
  rows.push(row);
  writeFileSync(join(out, `${def.id}.png`), encodePng(row));
  process.stdout.write(
    `${def.id}: ${t.report.triangles} triangles, ${t.report.min.map((v: number, i: number) => +(t.report.max[i] - v).toFixed(1)).join(' x ')} mm, ${t.bodies.length} colors, pieces ${t.report.pieces}, specks ${t.erodedSpecks}, overhang ${t.overhang.area.toFixed(0)} mm2, volume ${t.report.volume.toFixed(0)} mm3\n`,
  );
}
if (rows.length) writeFileSync(join(out, 'contact-sheet.png'), encodePng(sheet(rows, 6, [236, 232, 224], 1)));
process.stdout.write(`written to ${out}\n`);
