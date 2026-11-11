// Final Curtain's Stage Box: a laser-cut puzzle box for a Glowforge (3 mm plywood or MDF). Builds selected-stock cut/engrave sheets,
// PNG previews, an assembly diagram and a manifest into web/public/laser/sleuth/stage-box/ (ignored by version control; the box shelf lists it beside the nickels).
//   cd web && npx vite-node ../games/sleuth/laser/stageBox.ts [--sheet 12x12] [--kerf 0.2] [--out DIR] [--force]
// Does nothing when the manifest's source key (this folder, the laser kit code and the kerf) is unchanged.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BED, STOCK, STOCK_MARGIN, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { dims } from './stageBoxDims';
import { assemblySvg } from './stageBoxAssembly';
import { buildStageBox, fittingTable } from './stageBoxBuild';

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
  const out = flag('--out') ?? join(here, '../../../web/public/laser/sleuth/stage-box');
  const source = sourceKey(kerf, stock);
  const made = join(out, 'manifest.json');
  const previous = existsSync(made) ? (JSON.parse(readFileSync(made, 'utf8')) as { source?: string; sheets?: { svg: string; preview: string }[] }) : undefined;
  if (!args.includes('--force') && previous?.source === source) {
    console.log('Stage Box: up to date');
    return;
  }
  const b = buildStageBox(kerf, 3, true, stock);
  const fitting = fittingTable(kerf);
  const fit = fitting.find((f) => f.stock === stock)!;
  const bad = Object.entries(b.clearance).filter(([, c]) => c.length);
  if (bad.length || b.problems.length) {
    for (const [n, c] of bad) console.error(`${n} too close: ${c.map((x) => `${x.a} / ${x.b} ${x.mm} mm`).join('; ')}`);
    for (const p of b.problems) console.error(p);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  const files = b.sheets.map((s) => {
    writeFileSync(join(out, `${s.file}.svg`), s.sheet.svg(`Final Curtain Stage Box: ${s.title}`));
    const p = renderPreview(s.sheet, 3, 2);
    writeFileSync(join(out, `${s.file}.png`), pngFromRgb(p.w, p.h, p.rgb));
    return { svg: `${s.file}.svg`, preview: `${s.file}.png`, title: s.title, w: s.sheet.w, h: s.sheet.h, parts: s.placed };
  });
  writeFileSync(join(out, 'assembly.svg'), assemblySvg(dims()));
  copyFileSync(join(here, 'README.md'), join(out, 'README.md'));
  // Remove only obsolete cut sheets named by the previous manifest after changing stock size.
  const current = new Set(files.flatMap((f) => [f.svg, f.preview]));
  for (const s of previous?.sheets ?? [])
    for (const f of [s.svg, s.preview]) if (/^sheet-\d+(?:-[a-z-]+)?\.(svg|png)$/.test(f) && !current.has(f)) rmSync(join(out, f), { force: true });
  const list = Object.values(b.parts).map((m) => ({ name: m.part.name, qty: m.qty, note: m.note, w: m.part.w, h: m.part.h }));
  writeFileSync(
    join(out, 'manifest.json'),
    JSON.stringify(
      {
        kind: 'kit',
        id: 'stage-box',
        source,
        game: 'sleuth',
        title: 'Final Curtain: Stage Box',
        blurb:
          'A laser-cut puzzle box with an etched proscenium front. A prop dagger and two curtains, worked in the playbill order (raven, rose, moon), release the trap-room drawer.',
        material: { thickness: 3, description: 'Proofgrade plywood or MDF, 3 mm (1/8 in)', kerf, bed: BED, stock, size: STOCK[stock], margin: STOCK_MARGIN },
        fitting,
        fit: fit.label,
        sheets: files,
        assembly: 'assembly.svg',
        parts: list,
        mechanism: b.mechanism,
        clearance: b.clearance,
        readme: 'README.md',
        // what the desk's box shelf (web/src/desk/boxes/laserKits.ts) lists
        kit: {
          title: 'Final Curtain: Stage Box',
          summary: `A laser-cut puzzle box for a Glowforge, 3 mm (1/8 in) plywood or MDF. Cut the sheets, glue it up, and work the dagger and curtains in the playbill order. Fits ${fit.sheets} ${fit.sheets === 1 ? 'sheet' : 'sheets'} of ${stock} in.`,
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
  console.log(`Stage Box: ${files.map((f) => `${f.svg} ${f.w}x${f.h} mm`).join(', ')} -> ${out}`);
}

main();
