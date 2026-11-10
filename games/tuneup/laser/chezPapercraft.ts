// Tune-Up's paper THE CHEZ: a fold-up papercraft car for a Glowforge (cut, score, engrave on cardstock) or a home printer
// (Letter or A4, in color, with cut and fold lines drawn). Writes web/public/laser/tuneup/papercraft-chez/ (ignored by git).
//   cd web && npx vite-node ../games/tuneup/laser/chezPapercraft.ts [--out DIR] [--force]
// Does nothing when the manifest's source key (this folder and the car's side view) is unchanged.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { buildLaser } from './papercraftLaser';
import { allPieces } from './papercraftParts';
import { PAPER, layoutPages, pagePng, pageSvg, pdf } from './papercraftPrint';

const here = dirname(fileURLToPath(import.meta.url));
const chez = join(here, '../../kit/chez.ts');
// THE CHEZ stays together on one line (a non-breaking space)
const TITLE = 'Tune-Up: paper THE CHEZ';

function sourceKey(): string {
  const h = createHash('sha1');
  for (const f of [...readdirSync(here).map((x) => join(here, x)), chez].sort()) h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex');
}

function main() {
  const args = process.argv.slice(2);
  const flag = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const out = flag('--out') ?? join(here, '../../../web/public/laser/tuneup/papercraft-chez');
  const source = sourceKey();
  const made = join(out, 'manifest.json');
  if (!args.includes('--force') && existsSync(made) && (JSON.parse(readFileSync(made, 'utf8')) as { source?: string }).source === source) {
    console.log('Paper CHEZ: up to date');
    return;
  }
  const pieces = allPieces();
  const laser = buildLaser(pieces);
  if (laser.problems.length) {
    for (const p of laser.problems) console.error(p);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'laser.svg'), laser.sheet.svg(TITLE.replace('Tune-Up: ', 'Laser sheet: ')));
  const prev = renderPreview(laser.sheet, 3, 2);
  writeFileSync(join(out, 'laser.png'), pngFromRgb(prev.w, prev.h, prev.rgb));
  const previews: { file: string; alt: string }[] = [{ file: 'laser.png', alt: 'The laser sheet: cuts, folds and engraving' }];
  const downloads: { file: string; label: string }[] = [{ file: 'laser.svg', label: 'Laser sheet for a Glowforge (SVG)' }];
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
        sheets: [{ preview: 'laser.png', w: laser.sheet.w, h: laser.sheet.h, parts: laser.placed }],
        pages: printed,
        pieces: pieces.map((p) => ({ name: p.name, qty: p.qty, w: Math.round(p.w), h: Math.round(p.h) })),
        readme: 'README.md',
        kit: {
          title: TITLE,
          summary:
            'A fold-up paper model of THE CHEZ, 180 mm long: cut it on a Glowforge from cardstock (score folds, cut windows and headlights, engrave the stripes), or print it in color on Letter or A4 and cut it by hand.',
          previews,
          downloads,
        },
      },
      null,
      2,
    ),
  );
  console.log(`Paper CHEZ: ${laser.sheet.w} x ${laser.sheet.h} mm laser sheet, ${printed.letter} Letter pages, ${printed.a4} A4 pages -> ${out}`);
}

main();
