// Builds Maximus's embroidered patch: the stitch files (.dst, .exp, .pes), the vector source (design.svg), the thread list,
// a stitch-simulation preview and the manifest the box reads (kit entry in the same shape as the other feelies), then reads
// every stitch file back and checks it. Nothing here has been sewn on a real machine.
//   cd web && npx vite-node ../games/maximus/patch/build.ts [--out DIR]
// Writes web/public/laser/maximus/patch/ (git-ignored build output). Exits 1 if a written file fails its checks.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@lewismoten/gamemaker-sandbox-tools/embroidery/compile';
import { writeDst, readDst } from '@lewismoten/gamemaker-sandbox-tools/embroidery/dst';
import { writeExp, readExp } from '@lewismoten/gamemaker-sandbox-tools/embroidery/exp';
import { writePes, readPes } from '@lewismoten/gamemaker-sandbox-tools/embroidery/pes';
import { simulate } from '@lewismoten/gamemaker-sandbox-tools/embroidery/simulate';
import { designSvg } from '@lewismoten/gamemaker-sandbox-tools/embroidery/svg';
import { validate } from '@lewismoten/gamemaker-sandbox-tools/embroidery/validate';
import { pngFromRgb } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { RADIUS, maximusPatch } from './design';

const here = dirname(fileURLToPath(import.meta.url));
const flag = (n: string) => process.argv[process.argv.indexOf(n) + 1];
const out = resolve(process.argv.includes('--out') ? flag('--out') : join(here, '../../../web/public/laser/maximus/patch'));
mkdirSync(out, { recursive: true });

/** The picture is this many mm square (the patch plus backing round it); the 3D view reads it from the manifest. */
const PICTURE_MM = 92;

const design = maximusPatch();
const pattern = compile(design);
const files = {
  'maximus-patch.dst': writeDst(pattern),
  'maximus-patch.exp': writeExp(pattern),
  'maximus-patch.pes': writePes(pattern),
};
const hoop = design.hoop;
const colors = design.blocks.length;
const reports = {
  dst: validate(readDst(files['maximus-patch.dst']).stitches, { hoop, colors, maxRecord: 12.1 }),
  exp: validate(readExp(files['maximus-patch.exp']).stitches, { hoop, colors, maxRecord: 12.7 }),
  pes: validate(readPes(files['maximus-patch.pes']).stitches, { hoop, colors, maxRecord: 204.7 }),
};
const stitches = reports.dst.stitches;
const pic = simulate(pattern, { size: PICTURE_MM, pxPerMm: 10 });
if (process.argv.includes('--zoom')) {
  // a close look: --zoom cx,cy,size writes zoom.png, 30 px per mm, centered on that point (mm)
  const [cx, cy, size] = flag('--zoom').split(',').map(Number);
  const z = simulate(pattern, { size, pxPerMm: 30, center: [cx, cy] });
  writeFileSync(join(out, 'zoom.png'), pngFromRgb(z.w, z.h, z.rgb));
}

const threads = design.blocks.map(
  (b, i) => `${i + 1}. ${b.thread.name}  rgb(${b.thread.rgb.join(', ')})  #${b.thread.rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`,
);
const size = `${(RADIUS * 2).toFixed(0)} mm (${((RADIUS * 2) / 25.4).toFixed(2)} in) across`;
writeFileSync(
  join(out, 'threads.txt'),
  [
    'Maximus patch: thread list, in the order they are sewn',
    '(any 40-weight embroidery thread in these colors; names are generic, not a brand)',
    '',
    ...threads,
    '',
    `Finished size: ${size}, round, cut out along the satin border.`,
    `Stitches: ${stitches.toLocaleString('en-US')} in ${design.blocks.length} colors (${design.blocks.length - 1} color changes).`,
    'Hoop: 4 x 4 in (100 x 100 mm). Stabilizer: medium tear-away or cut-away under twill or felt; trim along the border.',
    'Made by a program and never sewn on a real machine: sew a test on scrap first.',
    '',
  ].join('\n'),
);
writeFileSync(join(out, 'design.svg'), designSvg(design, PICTURE_MM));
writeFileSync(join(out, 'preview.png'), pngFromRgb(pic.w, pic.h, pic.rgb));
for (const [name, bytes] of Object.entries(files)) writeFileSync(join(out, name), bytes);
writeFileSync(
  join(out, 'manifest.json'),
  `${JSON.stringify(
    {
      id: 'embroidery-patch',
      key: 'embroidery-patch',
      material: { thickness: 2.4 },
      diameter: RADIUS * 2,
      pictureMm: PICTURE_MM,
      stitches,
      threads: design.blocks.map((b) => ({ name: b.thread.name, rgb: b.thread.rgb })),
      kit: {
        title: 'Embroidered patch',
        summary: `A machine-embroidered Courier patch, ${size}, in ${design.blocks.length} thread colors and ${stitches.toLocaleString('en-US')} stitches. For a 4 x 4 in hoop. Written for DST (most machines), EXP (Melco, Bernina) and PES (Brother, Baby Lock); not yet sewn on a real machine.`,
        previews: [
          {
            file: 'preview.png',
            alt: 'Stitch simulation of the Maximus patch: a ten-point amber star on midnight navy with COURIER and MAXIMUS round the rim',
          },
        ],
        downloads: [
          { file: 'maximus-patch.dst', label: 'Stitch file for most machines (DST, Tajima)' },
          { file: 'maximus-patch.exp', label: 'Stitch file for Melco and Bernina (EXP)' },
          { file: 'maximus-patch.pes', label: 'Stitch file for Brother and Baby Lock (PES)' },
          { file: 'threads.txt', label: 'Thread list, in sewing order (text)' },
          { file: 'design.svg', label: 'The design as a vector drawing (SVG)' },
          { file: 'preview.png', label: 'Stitch simulation (PNG)' },
        ],
      },
    },
    null,
    2,
  )}\n`,
);

let bad = 0;
for (const [kind, r] of Object.entries(reports)) {
  console.log(
    `${kind}: ${r.stitches} stitches, ${r.jumps} jumps, ${r.colorChanges} color changes, longest stitch ${r.maxStitch.toFixed(2)} mm, ${r.width.toFixed(1)} x ${r.height.toFixed(1)} mm${r.problems.length ? ' PROBLEMS: ' + r.problems.join('; ') : ' ok'}`,
  );
  bad += r.problems.length;
}
console.log(`Wrote ${out}`);
process.exit(bad ? 1 : 0);
