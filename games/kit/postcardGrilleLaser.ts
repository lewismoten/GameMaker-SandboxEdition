// A postcard grille card (printables.json, kind postcardgrille) as a laser-cutter SVG, in real millimeters: red cut
// strokes for the card's outline and its holes, blue engrave fills for the two marks and one to four dots beside each
// hole (the hole's number). It is the card's front; a second file is the back (the marks mirrored), for clear acrylic
// or thin plywood engraved on both faces. Colors and units: web/packages/tools/src/kit/laserSvg.ts.
//   npx vite-node ../games/kit/postcardGrilleLaser.ts <game id> <out dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LaserSheet, type Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { turn } from '../../web/src/manual/printables/postcardMath';

const IN = 25.4;
const CELL = 0.3 * IN;
const MARGIN = 0.2 * IN;

type Glyphs = Record<string, string[]>;
interface Item {
  title: string;
  grille: { n: number; holes: [number, number][]; a: { name: string; row: number }; b: { name: string; col: number } };
  glyphs: Glyphs;
}

const sq = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/** One face of the grille: `flip` mirrors the arrangement left to right, as seen from the back. */
export function grilleLaser(it: Item, flip: boolean): LaserSheet {
  const g = it.grille;
  const size = g.n * CELL + 2 * MARGIN;
  const sheet = new LaserSheet(size, size);
  sheet.add({ op: 'cut', k: 'poly', pts: sq(0, 0, size, size) });
  const at = (v: number) => (v < 0 ? MARGIN / 2 : v >= g.n ? MARGIN + g.n * CELL + MARGIN / 2 : MARGIN + (v + 0.5) * CELL);
  g.holes.forEach((hole, k) => {
    const [i, j] = turn(g, hole, 0, flip);
    const x = MARGIN + j * CELL + 1;
    const y = MARGIN + i * CELL + 1;
    sheet.add({ op: 'cut', k: 'poly', pts: sq(x, y, CELL - 2, CELL - 2) });
    for (let d = 0; d <= k; d++) sheet.add({ op: 'engrave', k: 'poly', pts: sq(x + 1.2 + d * 2.4, y + 1.2, 1.4, 1.4) });
  });
  const put = (p: [number, number], name: string) => {
    const [i, j] = turn(g, p, 0, flip);
    const rows = it.glyphs[name];
    const px = (0.15 * IN) / Math.max(rows.length, rows[0].length);
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '#')
          sheet.add({ op: 'engrave', k: 'poly', pts: sq(at(j) - (rows[0].length * px) / 2 + x * px, at(i) - (rows.length * px) / 2 + y * px, px, px) });
      }),
    );
  };
  put([g.a.row, -1], g.a.name);
  put([-1, g.b.col], g.b.name);
  return sheet;
}

if (process.argv.length > 2 && !process.env.VITEST) {
  const [id, outDir = '.'] = process.argv.slice(2);
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', id, 'printables.json');
  const item = (JSON.parse(readFileSync(file, 'utf8')) as { items: (Item & { kind: string })[] }).items.find((i) => i.kind === 'postcardgrille');
  if (!item) throw new Error(`${id} has no postcard and grille`);
  for (const [name, flip] of [
    ['front', false],
    ['back', true],
  ] as const) {
    const s = grilleLaser(item, flip);
    writeFileSync(join(outDir, `${id}-grille-${name}.svg`), s.svg(`${item.title}: grille ${name}`));
    console.log(name, `${s.count('cut')} cuts, ${s.count('engrave')} engraved shapes`);
  }
}
