// Snowbound's Plowed Street box: a laser-cut puzzle box for a Glowforge (3 mm plywood or MDF). Builds selected-stock cut/engrave sheets,
// PNG previews, an assembly diagram and a manifest into web/public/laser/snowbound/plowed-street/ (ignored by version control;
// the box shelf lists it beside the nickel).
//   cd web && npx vite-node ../games/snowbound/laser/plowedStreet.ts [--sheet 12x12] [--kerf 0.2] [--out DIR] [--force]
// Does nothing when the manifest's source key (this folder, the laser kit code and the kerf) is unchanged.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BED, STOCK, STOCK_MARGIN, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { assemblySvg } from './plowedSteps';
import { buildPlowedStreet, fittingTable } from './plowedBuild';

const here = dirname(fileURLToPath(import.meta.url));
const kit = join(here, '../../../web/packages/tools/src/kit');

/** What the box is drawn from: every file in this folder, the laser kit modules and the kerf. */
function sourceKey(kerf: number, stock: StockSize): string {
  const h = createHash('sha1').update(`${kerf}:${stock}`);
  const files = [
    ...readdirSync(here).map((f) => join(here, f)),
    ...readdirSync(kit)
      .filter((f) => f.startsWith('laser'))
      .map((f) => join(kit, f)),
  ].sort();
  for (const f of files) h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex');
}

function main() {
  const args = process.argv.slice(2);
  const flag = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const kerf = Number(flag('--kerf') ?? 0.2);
  const stockArg = flag('--sheet') ?? '12x12';
  if (!Object.hasOwn(STOCK, stockArg)) throw new Error('--sheet must be 6x12, 8x12, 12x12 or 12x20');
  const stock = stockArg as StockSize;
  const out = flag('--out') ?? join(here, '../../../web/public/laser/snowbound/plowed-street');
  const source = sourceKey(kerf, stock);
  const made = join(out, 'manifest.json');
  const previous = existsSync(made) ? (JSON.parse(readFileSync(made, 'utf8')) as { source?: string; sheets?: { svg: string; preview: string }[] }) : undefined;
  if (!args.includes('--force') && previous?.source === source) {
    console.log('Plowed Street: up to date');
    return;
  }
  const b = buildPlowedStreet(kerf, true, stock);
  const fitting = fittingTable(kerf);
  const fit = fitting.find((f) => f.stock === stock)!;
  const bad = Object.entries(b.clearance).filter(([, c]) => c.length);
  const lockBad = !b.lock.startReachesMall || b.lock.openCells.join() !== '6,2' || !b.lock.alwaysContained;
  if (bad.length || b.problems.length || lockBad) {
    for (const [n, c] of bad) console.error(`${n} too close: ${c.map((x) => `${x.a} / ${x.b} ${x.mm} mm`).join('; ')}`);
    for (const p of b.problems) console.error(p);
    if (lockBad) console.error(`lock: ${JSON.stringify(b.lock)}`);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  const files = b.sheets.map((s) => {
    writeFileSync(join(out, `${s.file}.svg`), s.sheet.svg(`Snowbound Plowed Street box: ${s.title}`));
    const p = renderPreview(s.sheet, 3, 2);
    writeFileSync(join(out, `${s.file}.png`), pngFromRgb(p.w, p.h, p.rgb));
    return { svg: `${s.file}.svg`, preview: `${s.file}.png`, title: s.title, w: s.sheet.w, h: s.sheet.h, parts: s.placed };
  });
  writeFileSync(join(out, 'assembly.svg'), assemblySvg(kerf));
  copyFileSync(join(here, 'README.md'), join(out, 'README.md'));
  // Remove only obsolete cut sheets named by the previous manifest after changing stock size.
  const current = new Set(files.flatMap((f) => [f.svg, f.preview]));
  for (const s of previous?.sheets ?? [])
    for (const f of [s.svg, s.preview]) if (/^sheet-\d+(?:-[a-z-]+)?\.(svg|png)$/.test(f) && !current.has(f)) rmSync(join(out, f), { force: true });
  const list = Object.values(b.parts).map((m) => ({ name: m.part.name, qty: m.qty, note: m.note, w: m.part.w, h: m.part.h }));
  const title = 'Snowbound: Plowed Street Box';
  writeFileSync(
    join(out, 'manifest.json'),
    JSON.stringify(
      {
        kind: 'kit',
        id: 'plowed-street',
        source,
        game: 'snowbound',
        title,
        blurb: 'A laser-cut puzzle box whose lid is an etched street map. Slide the plow along the plowed streets to LaVale Mall and the drawer opens.',
        material: { thickness: 3, description: 'Proofgrade plywood or MDF, 3 mm (1/8 in)', kerf, bed: BED, stock, size: STOCK[stock], margin: STOCK_MARGIN },
        fitting,
        fit: fit.label,
        sheets: files,
        assembly: 'assembly.svg',
        parts: list,
        lock: b.lock,
        clearance: b.clearance,
        readme: 'README.md',
        // what the desk's box shelf (web/src/desk/boxes/laserKits.ts) lists
        kit: {
          title,
          summary: `A laser-cut puzzle box for a Glowforge, 3 mm (1/8 in) plywood or MDF. The lid is a street map: slide the plow along the plowed streets to LaVale Mall to open the drawer. Fits ${fit.sheets} ${fit.sheets === 1 ? 'sheet' : 'sheets'} of ${stock} in.`,
          previews: files.map((f) => ({ file: f.preview, alt: f.title })),
          downloads: [
            ...files.map((f) => ({ file: f.svg, label: `${f.title} (SVG)` })),
            { file: 'assembly.svg', label: 'Assembly diagram (SVG)' },
            { file: 'README.md', label: 'Build notes' },
          ],
        },
      },
      null,
      2,
    ),
  );
  for (const f of fitting) console.log(`${f.label}: ${f.materialIn2.toFixed(0)} in2 (${f.materialMm2.toFixed(0)} mm2) of stock`);
  console.log(`Plowed Street: ${files.map((f) => `${f.svg} ${f.w}x${f.h} mm`).join(', ')} -> ${out}`);
}

main();
