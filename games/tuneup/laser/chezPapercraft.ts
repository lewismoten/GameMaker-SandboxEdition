// Tune-Up's paper THE CHEZ: a fold-up papercraft car for a Glowforge (cut, score, engrave on cardstock) or a home printer
// (Letter or A4, in color, with cut and fold lines drawn). Writes web/public/laser/tuneup/papercraft-chez/ (ignored by git).
//   cd web && npx vite-node ../games/tuneup/laser/chezPapercraft.ts [--sheet 12x12] [--out DIR] [--force]
// Does nothing when the manifest's source key (this folder and the car's side view) is unchanged.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { BED, STOCK, STOCK_MARGIN, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { buildLaser, fittingTable } from './papercraftLaser';
import { allPieces } from './papercraftParts';
import { PAPER, layoutPages, pagePng, pageSvg, pdf } from './papercraftPrint';

const here = dirname(fileURLToPath(import.meta.url));
const chez = join(here, '../../kit/chez.ts');
// THE CHEZ stays together on one line (a non-breaking space)
const TITLE = 'Tune-Up: paper THE CHEZ';

function sourceKey(stock: StockSize): string {
  const h = createHash('sha1').update(stock);
  const kit = join(here, '../../../web/packages/tools/src/kit');
  const helpers = readdirSync(kit)
    .filter((f) => f.startsWith('laser'))
    .map((f) => join(kit, f));
  for (const f of [...readdirSync(here).map((x) => join(here, x)), chez, ...helpers].sort()) h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex');
}

function main() {
  const args = process.argv.slice(2);
  const flag = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const stockArg = flag('--sheet') ?? '12x12';
  if (!Object.hasOwn(STOCK, stockArg)) throw new Error('--sheet must be 6x12, 8x12, 12x12 or 12x20');
  const stock = stockArg as StockSize;
  const out = flag('--out') ?? join(here, '../../../web/public/laser/tuneup/papercraft-chez');
  const source = sourceKey(stock);
  const made = join(out, 'manifest.json');
  const previous = existsSync(made) ? (JSON.parse(readFileSync(made, 'utf8')) as { source?: string; sheets?: { svg?: string; preview: string }[] }) : undefined;
  if (!args.includes('--force') && previous?.source === source) {
    console.log('Paper CHEZ: up to date');
    return;
  }
  const pieces = allPieces();
  const laser = buildLaser(pieces, stock);
  const fitting = fittingTable(pieces);
  const fit = fitting.find((f) => f.stock === stock)!;
  if (laser.problems.length) {
    for (const p of laser.problems) console.error(p);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  const files = laser.sheets.map((s) => {
    writeFileSync(join(out, `${s.file}.svg`), s.sheet.svg(`${TITLE}: ${s.title}`));
    const prev = renderPreview(s.sheet, 3, 2);
    writeFileSync(join(out, `${s.file}.png`), pngFromRgb(prev.w, prev.h, prev.rgb));
    return { svg: `${s.file}.svg`, preview: `${s.file}.png`, title: s.title, w: s.sheet.w, h: s.sheet.h, parts: s.placed };
  });
  const current = new Set(files.flatMap((f) => [f.svg, f.preview]));
  for (const s of previous?.sheets ?? [])
    for (const f of [s.svg ?? 'laser.svg', s.preview]) if (/^(?:sheet-\d+|laser)\.(svg|png)$/.test(f) && !current.has(f)) rmSync(join(out, f), { force: true });
  const previews: { file: string; alt: string }[] = files.map((f) => ({ file: f.preview, alt: f.title }));
  const downloads: { file: string; label: string }[] = files.map((f) => ({ file: f.svg, label: `${f.title} (SVG)` }));
  const printed: Record<string, number> = {};
  for (const [key, label] of [
    ['letter', 'Letter'],
    ['a4', 'A4'],
  ] as const) {
    const pages = layoutPages(pieces, PAPER[key]);
    printed[key] = pages.length;
    writeFileSync(join(out, `print-${key}.pdf`), pdf(pages));
    downloads.push({ file: `print-${key}.pdf`, label: `Color pattern for a home printer, ${label} (PDF)` });
    pages.forEach((pg, i) => {
      writeFileSync(join(out, `print-${key}-${i + 1}.svg`), pageSvg(pg, `${TITLE}, ${label} page ${i + 1}`));
      writeFileSync(join(out, `print-${key}-${i + 1}.png`), pagePng(pg));
      if (key === 'letter')
        previews.push({ file: `print-letter-${i + 1}.png`, alt: `Printable page ${i + 1} of ${pages.length}, color with cut and fold lines` });
    });
  }
  copyFileSync(join(here, 'README.md'), join(out, 'README.md'));
  downloads.push({ file: 'README.md', label: 'Build notes' });
  writeFileSync(
    join(out, 'manifest.json'),
    JSON.stringify(
      {
        kind: 'kit',
        id: 'papercraft-chez',
        source,
        game: 'tuneup',
        title: TITLE,
        material: { description: 'Cardstock, using Proofgrade sheet dimensions', bed: BED, stock, size: STOCK[stock], margin: STOCK_MARGIN },
        fitting,
        fit: fit.label,
        sheets: files,
        pages: printed,
        pieces: pieces.map((p) => ({ name: p.name, qty: p.qty, w: Math.round(p.w), h: Math.round(p.h) })),
        readme: 'README.md',
        kit: {
          title: TITLE,
          summary: `A fold-up paper model of THE CHEZ, 180 mm (7.09 in) long: cut it on a Glowforge from cardstock (score folds, cut windows and headlights, engrave the stripes), or print it in color on Letter or A4 and cut it by hand. Fits ${fit.sheets} ${fit.sheets === 1 ? 'sheet' : 'sheets'} of ${stock} in.`,
          previews,
          downloads,
        },
      },
      null,
      2,
    ),
  );
  for (const f of fitting) console.log(`${f.label}: ${f.materialIn2.toFixed(0)} in2 (${f.materialMm2.toFixed(0)} mm2) of stock`);
  console.log(`Paper CHEZ: ${files.length} ${stock} inch laser sheets, ${printed.letter} Letter pages, ${printed.a4} A4 pages -> ${out}`);
}

main();
