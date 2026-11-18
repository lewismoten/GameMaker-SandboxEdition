// "In The Year 2000!" cryptex: a laser-cut combination lock for Proofgrade 1/8 in plywood or MDF. Builds selected-stock sheets,
// PNG previews, an assembly diagram and a manifest into web/public/laser/year2000/cryptex/ (ignored by version control;
// the box shelf lists it beside the nickel).
//   cd web && npx vite-node ../games/year2000/laser/cryptex.ts [--sheet 12x12] [--kerf 0.2] [--out DIR] [--force]
// Does nothing when the manifest's source key (this folder, the laser kit code and the kerf) is unchanged.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BED, STOCK, STOCK_MARGIN, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { COMBO, T, CORE, RIM, COLLAR_R, SLICE_HOLE } from './cryptexDims';
import { assemblySvg, legend } from './cryptexSteps';
import { buildCryptex, fittingTable } from './cryptexBuild';

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
  const out = flag('--out') ?? join(here, '../../../web/public/laser/year2000/cryptex');
  const source = sourceKey(kerf, stock);
  const made = join(out, 'manifest.json');
  const previous = existsSync(made) ? (JSON.parse(readFileSync(made, 'utf8')) as { source?: string; sheets?: { svg: string; preview: string }[] }) : undefined;
  if (!args.includes('--force') && previous?.source === source) {
    console.log('Year 2000 cryptex: up to date');
    return;
  }
  const b = buildCryptex(kerf, true, stock);
  const fitting = fittingTable(kerf);
  const fit = fitting.find((f) => f.stock === stock)!;
  const bad = Object.entries(b.clearance).filter(([, c]) => c.length);
  const lockBad = b.lock.opens.join() !== COMBO.join('') || !b.lock.pocketFits || !b.lock.wrongDigitBlocked || b.lock.windowDeg < 4;
  if (bad.length || b.problems.length || lockBad) {
    for (const [n, c] of bad) console.error(`${n} too close: ${c.map((x) => `${x.a} / ${x.b} ${x.mm} mm`).join('; ')}`);
    for (const p of b.problems) console.error(p);
    if (lockBad) console.error(`lock: ${JSON.stringify(b.lock)}`);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  const files = b.sheets.map((s) => {
    writeFileSync(join(out, `${s.file}.svg`), s.sheet.svg(`In The Year 2000! cryptex: ${s.title}`));
    const p = renderPreview(s.sheet, 3, 2);
    writeFileSync(join(out, `${s.file}.png`), pngFromRgb(p.w, p.h, p.rgb));
    return { svg: `${s.file}.svg`, preview: `${s.file}.png`, title: s.title, w: s.sheet.w, h: s.sheet.h, parts: s.placed };
  });
  writeFileSync(join(out, 'assembly.svg'), assemblySvg(kerf));
  copyFileSync(join(here, 'README.md'), join(out, 'README.md'));
  // A size change can reduce the count. Remove only obsolete sheet files named by this kit's previous manifest.
  const currentFiles = new Set(files.flatMap((f) => [f.svg, f.preview]));
  for (const s of previous?.sheets ?? [])
    for (const f of [s.svg, s.preview]) {
      if (/^sheet-\d+(?:-base|-rings)?\.(svg|png)$/.test(f) && !currentFiles.has(f)) rmSync(join(out, f), { force: true });
    }
  const list = Object.values(b.parts).map((m) => ({ name: m.part.name, qty: m.qty, note: m.note, w: m.part.w, h: m.part.h, face: m.face, hidden: m.hidden }));
  const title = 'In The Year 2000!: Teleport-A-Phone Cryptex';
  writeFileSync(
    join(out, 'manifest.json'),
    JSON.stringify(
      {
        kind: 'kit',
        id: 'cryptex',
        source,
        game: 'year2000',
        title,
        blurb:
          'A laser-cut cryptex with four hollow rings of digits. Dial the year the game is named for and the core slides out, with room inside for a note.',
        material: { thickness: T, description: 'Proofgrade 1/8 in plywood or MDF', kerf, bed: BED, stock, size: STOCK[stock], margin: STOCK_MARGIN, rim: RIM },
        fitting,
        fit: fit.label,
        cavity: { coreDiameter: 2 * CORE.bore, baseInnerRadius: COLLAR_R, baseOuterRadius: SLICE_HOLE[3] },
        sheets: files,
        assembly: 'assembly.svg',
        legend: legend(kerf),
        area: b.area,
        parts: list,
        lock: b.lock,
        clearance: b.clearance,
        readme: 'README.md',
        // what the desk's box shelf (web/src/desk/boxes/laserKits.ts) lists
        kit: {
          title,
          summary: `A laser-cut cryptex for a Glowforge, 1/8 in plywood or MDF. Four stepped rings of digits; dial the year and the hollow core slides out. Fits ${fit.sheets} ${fit.sheets === 1 ? 'sheet' : 'sheets'} of ${stock}.`,
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
  console.log(`Year 2000 cryptex: ${files.map((f) => `${f.svg} ${f.w}x${f.h} mm`).join(', ')} -> ${out}`);
  for (const f of fitting) console.log(`${f.label}: ${f.materialIn2.toFixed(0)} in2 (${f.materialMm2.toFixed(0)} mm2) of stock`);
  console.log(`Retained wood: ${b.area.wood.toFixed(0)} mm2; occupied rectangles: ${b.area.occupied.toFixed(0)} mm2`);
}

main();
