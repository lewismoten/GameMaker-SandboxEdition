// Checks MAKE A TITLE's templates against the real engine: the engine's own drawing (src/engineWords.ts)
// writes the longest words each screen can hold (a wide letter, M, in every free place)
// over a blank screen, and every pixel it draws must fall inside one of the template's boxes,
// every box must get some, and no label may cover a box. With --out it also writes PNGs (1x and
// 3x) of each template, its plain version, and the template with ordinary words on it.
//   cd web && npx vite-node ../games/title-demo/tools/templateCheck.ts [--out dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildStarterPalette } from '../../kit/starter/palette';
import { gif } from '../../kit/starter/screens';
import { withEngineWords, type Words } from '../src/engineWords';
import { TITLE } from '../src/game';
import { TEMPLATES, type Template } from '../src/templateBoxes';
import { labelRects, plainTemplate, templatePicture } from '../src/templates';

const pal = buildStarterPalette(undefined, 'title-demo');
const vga = decodeGif(gif(new Pixels(320, 200, 0), pal)).palette;
const BLOCK = 'M';
const fill = (n: number) => BLOCK.repeat(n);
const outAt = process.argv.indexOf('--out');
const out = outAt > 0 ? process.argv[outAt + 1] : undefined;

/** The most each screen can show, as separate passes (the "no page" lines share one place). */
function longest(t: Template): Words[] {
  if (t.file === 'TMENU')
    return (['noInstructions', 'noStoryline', 'noCredits'] as const).map((noFile) => ({ kind: 'menu', title: fill(19), noFile, marker: [1, 2, 3, 4, 5, 6] }));
  if (t.file === 'TSCORES') return [{ kind: 'scores', rows: Array.from({ length: 10 }, () => ({ score: 2147483647, name: fill(22) })), latest: 2147483647 }];
  const saving = t.file === 'TSAVE';
  const lines: [number, string][] = saving
    ? [
        [40, 'I cannot save your game!'],
        [112, 'Game Saved!'],
      ]
    : [
        [40, 'This game has not been saved!'],
        [40, 'This saved game is damaged!'],
        [88, 'Old Game Loaded!'],
      ];
  return lines.map((line) => ({
    kind: 'slots',
    saving,
    names: Array.from({ length: 10 }, () => fill(20)),
    marker: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    line: [line],
  }));
}

/** Ordinary words, for the pictures. */
function ordinary(t: Template): Words {
  if (t.file === 'TMENU') return { kind: 'menu', title: TITLE, marker: [1] };
  if (t.file === 'TSCORES')
    return {
      kind: 'scores',
      rows: [
        { score: 12500, name: 'LIAN' },
        { score: 9000, name: 'KIT' },
        { score: 4200, name: 'TEDDY' },
        ...Array.from({ length: 7 }, () => ({ score: 0, name: '' })),
      ],
      latest: 3100,
    };
  const saving = t.file === 'TSAVE';
  return {
    kind: 'slots',
    saving,
    names: ['The first hall', 'By the door', ...Array.from({ length: 8 }, () => '')],
    marker: [2],
    line: [saving ? [112, 'Game Saved!'] : [88, 'Old Game Loaded!']],
  };
}

type Rect = { x: number; y: number; w: number; h: number };
const inside = (r: Rect, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const meet = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

let failed = 0;
if (out) mkdirSync(out, { recursive: true });
for (const t of TEMPLATES) {
  const areas: Rect[] = t.boxes.flatMap((b) => (b.rows && b.rows[1] - b.rows[0] > 8 ? b.rows.map((y) => ({ x: b.x, y, w: b.w, h: 8 })) : [b]));
  const hit = new Set<number>();
  let outside = 0;
  let first = '';
  for (const words of longest(t)) {
    const p = withEngineWords(new Pixels(320, 200, 0), vga, words);
    for (let y = 0; y < 200; y++)
      for (let x = 0; x < 320; x++) {
        if (!p.get(x, y)) continue;
        const i = areas.findIndex((r) => inside(r, x, y));
        if (i < 0) {
          outside++;
          first ||= `${x},${y}`;
        } else hit.add(i);
      }
  }
  const empty = areas.map((r, i) => (hit.has(i) ? '' : `${r.x},${r.y}`)).filter(Boolean);
  const covered = labelRects(t).filter((l) => areas.some((r) => meet(l, r)));
  const ok = !outside && !empty.length && !covered.length;
  if (!ok) failed++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${t.file}.GIF: ${t.boxes.map((b) => `${b.what} ${b.x},${b.y} ${b.w}x${b.h}`).join('; ')}` +
      (outside ? `\n  ${outside} word pixels outside every box (first at ${first})` : '') +
      (empty.length ? `\n  boxes the engine never writes in: ${empty.join(' ')}` : '') +
      (covered.length ? `\n  ${covered.length} labels cover a box` : ''),
  );
  if (out) {
    const pal8 = pal.pal;
    const pic = templatePicture(pal, t);
    const plain = plainTemplate(pal, t);
    const words = withEngineWords(pic, vga, ordinary(t));
    for (const [name, p] of [
      [t.file, pic],
      [`${t.file}P`, plain],
      [`${t.file}-words`, words],
      [`${t.file}-longest`, withEngineWords(pic, vga, longest(t)[0])],
    ] as [string, Pixels][]) {
      writePng(join(out, `${name.toLowerCase()}.png`), p, pal8, 1);
      writePng(join(out, `${name.toLowerCase()}@3x.png`), p, pal8, 3);
    }
  }
}
if (failed) process.exitCode = 1;
