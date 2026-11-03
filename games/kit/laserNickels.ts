// Laser-cut wooden nickels for the Sandbox games: one 1.5 inch (38.1 mm) round per game with an engraved rim band, a front
// (the game's name round the top and its hero and signature figure, drawn from the game's own built disk) and a back
// ("GOOD FOR ONE ..." from the game's world, SANDBOX SOFTWARE and the year), for a Glowforge (cut: red, score: blue,
// engrave: black).
//   cd web && npx vite-node ../games/kit/laserNickels.ts [--game id[,id]] [--force] [--out ROOT]
// Writes web/public/laser/<game>/ (git-ignored build output): front.svg, back.svg (each exactly 38.1 x 38.1 mm), sheet.svg
// (twelve fronts in a 4 x 3 grid with their cut lines, and the flip jig), sheet-back.svg (the back placed on the jig, the
// same page size, for the second pass), a PNG preview of each, and manifest.json with a `source` key: a game whose figures,
// words and builder code match it is skipped (--force remakes). Secret games and games without a built disk are skipped.
// Text is drawn from pixels (8x8 PC font, 3x5 micro font), so no font is needed. How to use the files: docs in games/kit/README.md.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRANSPARENT } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { arcSpanDeg, arcText, engraveRects, figureBitmap, inkBox, lineText, mergeRuns, type Bitmap } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPixels';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { CUT, ENGRAVE, LaserSheet, SCORE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { GAMES, type Def } from './pixelTrinketDefs';
import { picture } from './pixelPicture';
import { NICKELS, heroDef } from './laserNickelDefs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

/** Real sizes in millimeters. */
const DIM = {
  coin: 38.1, // 1.5 inch
  band: [16.9, 18.2], // the engraved rim band's inner and outer radius
  score: 15.5, // the thin line inside the lettering
  face: 15.1, // nothing is engraved farther out than this (inside the score line)
  jigHole: 38.0, // the flip jig's cut-out: 0.1 mm under the coin, for the laser's kerf to open to a snug fit
  sheet: [270, 150],
  pitch: 44,
  jigAt: [235, 75],
} as const;
const R = DIM.coin / 2;
const PC_PX = 0.36; // 8x8 letters: 7 pixels tall = 2.52 mm
const MICRO_PX = 0.5; // 3x5 letters: 5 pixels tall = 2.5 mm
const MIN_CAP = 2.45;

interface Face {
  sheet: LaserSheet;
  texts: { text: string; capMm: number }[];
}
const newFace = (cut: boolean): Face => {
  const sheet = new LaserSheet(DIM.coin, DIM.coin);
  if (cut) sheet.add({ op: 'cut', k: 'circle', cx: R, cy: R, r: R });
  sheet.add({ op: 'engrave', k: 'ring', cx: R, cy: R, r0: DIM.band[0], r1: DIM.band[1] });
  sheet.add({ op: 'score', k: 'circle', cx: R, cy: R, r: DIM.score });
  return { sheet, texts: [] };
};
const line = (f: Face, s: string, y: number) => {
  const m = lineText(f.sheet, s, 'pc', R, R + y, PC_PX);
  f.texts.push({ text: s, capMm: m.h });
};
const arc = (f: Face, s: string, top: boolean) => {
  const r = top ? 12.5 : 15.0;
  // the 8x8 letters when the line fits round the coin in them, else the smaller 3x5 ones (both at least 2.5 mm tall)
  const pc = arcSpanDeg(s, 'pc', r, PC_PX, top) <= 140;
  const span = arcText(f.sheet, s, pc ? 'pc' : 'micro', R, R, r, pc ? PC_PX : MICRO_PX, top);
  if (span > 140) throw new Error(`"${s}" spans ${span.toFixed(0)} degrees round the coin: shorten it`);
  f.texts.push({ text: s, capMm: pc ? 7 * PC_PX : 5 * MICRO_PX });
};

interface Fig {
  bm: Bitmap;
  box: [number, number, number, number];
}
/** The figure's engraving bitmap (a hero's or a monster's picture from the built disk) and where its ink is. */
function figureOf(game: string, d: Def): Fig {
  const pic = picture(game, d);
  const scale = Math.max(...pic.palette) <= 63 ? 63 : 255;
  const lum = (cx: number, cy: number) => {
    const c = pic.cells[cy * pic.w + cx];
    if (c === TRANSPARENT) return -1;
    return (0.3 * pic.palette[c * 3] + 0.59 * pic.palette[c * 3 + 1] + 0.11 * pic.palette[c * 3 + 2]) / scale;
  };
  const bm = figureBitmap(pic.w, pic.h, lum, 0.5);
  return { bm, box: inkBox(bm) ?? [0, 0, pic.w, pic.h] };
}

/** One or two figures side by side on a common floor, as large as fits inside the lettering (at most 0.6 mm a pixel). */
function figures(f: Face, figs: Fig[]) {
  const gap = 2;
  const wp = figs.reduce((n, g) => n + g.box[2] - g.box[0], 0);
  const hp = Math.max(...figs.map((g) => g.box[3] - g.box[1]));
  let px = 0.6;
  const fits = (p: number) => Math.hypot((wp * p + gap * (figs.length - 1)) / 2, (hp * p) / 2) <= 11.4;
  while (!fits(px) && px > 0.3) px -= 0.01;
  const W = wp * px + gap * (figs.length - 1);
  let x = -W / 2;
  const floor = (hp * px) / 2 + 0.2;
  for (const g of figs) {
    const [x0, , x1, y1] = g.box;
    engraveRects(f.sheet, mergeRuns(g.bm), (cx, cy) => [R + x + (cx - x0) * px, R + floor - (y1 - cy) * px]);
    x += (x1 - x0) * px + gap;
  }
  return px;
}

function front(game: string, year: number, hero?: Def, second?: Def): Face {
  const n = NICKELS[game];
  const f = newFace(true);
  arc(f, n.top, true);
  arc(f, n.bottom ?? `* ${year} *`, false);
  if (game === 'realm') {
    // the Round Tuit itself: a boss in the middle of the face, ringed, as the game draws it
    f.sheet.add({ op: 'engrave', k: 'circle', cx: R, cy: R, r: 3.6 });
    f.sheet.add({ op: 'score', k: 'circle', cx: R, cy: R, r: 5.6 });
    f.sheet.add({ op: 'score', k: 'circle', cx: R, cy: R, r: 9.2 });
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      f.sheet.add({ op: 'engrave', k: 'circle', cx: R + 7.4 * Math.cos(a), cy: R + 7.4 * Math.sin(a), r: 0.45 });
    }
  } else if (hero) {
    figures(f, [figureOf(game, hero), ...(second ? [figureOf(game, second)] : [])]);
  }
  return f;
}

function back(game: string, year: number): Face {
  const n = NICKELS[game];
  const f = newFace(false);
  arc(f, n.arc ?? 'GOOD FOR', true); // most games' lines start "ONE ..."
  arc(f, 'SANDBOX SOFTWARE', false);
  n.good.forEach((s, i) => line(f, s, -1.5 + (i - (n.good.length - 1) / 2) * 4));
  line(f, String(year), 8);
  return f;
}

/** Everything engraved stays inside the face (not under the cut or on the band). */
function reach(f: Face): number {
  let m = 0;
  for (const it of f.sheet.items)
    if (it.op === 'engrave' && it.k === 'poly') for (const [x, y] of it.pts) m = Math.max(m, Math.hypot(x - R, y - R));
    else if (it.k === 'circle' && it.op === 'engrave') m = Math.max(m, Math.hypot(it.cx - R, it.cy - R) + it.r);
  return m;
}

const codeKey = (() => {
  const h = createHash('sha1');
  for (const f of [
    fileURLToPath(import.meta.url),
    join(here, 'laserNickelDefs.ts'),
    join(here, 'pixelPicture.ts'),
    join(here, '../../web/packages/tools/src/kit/laserSvg.ts'),
    join(here, '../../web/packages/tools/src/kit/laserPixels.ts'),
    join(here, '../../web/packages/tools/src/kit/laserPreview.ts'),
  ])
    h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex');
})();

const secret = (game: string) => {
  try {
    return JSON.parse(readFileSync(join(here, '..', game, 'about.json'), 'utf8')).secret === true;
  } catch {
    return true;
  }
};

const only = flag('--game')?.split(',');
const games = Object.keys(NICKELS).filter((g) => (!only || only.includes(g)) && !secret(g));
const rootOut = resolve(flag('--out') ?? join(here, '../../web/public/laser'));
const table: string[] = [];

let failed = 0;
for (const game of games)
  try {
    const about = JSON.parse(readFileSync(join(here, '..', game, 'about.json'), 'utf8')) as { title: string; year: number };
    const n = NICKELS[game];
    const hero = n.noFigure ? undefined : (GAMES[game]?.[0] ?? heroDef(game, n));
    const second = n.noFigure ? undefined : GAMES[game]?.[1];
    const out = join(rootOut, game);
    if (hero && !existsSync(join(here, '..', game, 'disk', hero.pal))) {
      console.log(`${game}: skipped (its disk isn't built)`);
      continue;
    }
    const h = createHash('sha1')
      .update(codeKey)
      .update(JSON.stringify([n, about.year, about.title]));
    for (const d of [hero, second]) if (d) h.update(picture(game, d).cells).update(picture(game, d).palette);
    const source = h.digest('hex').slice(0, 16);
    const files = ['front.svg', 'back.svg', 'sheet.svg', 'sheet-back.svg', 'front.png', 'back.png', 'sheet.png', 'manifest.json'];
    try {
      const have = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as { source?: string };
      if (!args.includes('--force') && have.source === source && files.every((f) => existsSync(join(out, f)))) {
        table.push(`${game}: up to date`);
        continue;
      }
    } catch {
      // no manifest yet
    }
    mkdirSync(out, { recursive: true });
    const fr = front(game, about.year, hero, second);
    const bk = back(game, about.year);
    for (const [name, f] of [
      ['front', fr],
      ['back', bk],
    ] as const) {
      if (reach(f) > DIM.face + 0.05) throw new Error(`${game} ${name}: engraving reaches ${reach(f).toFixed(2)} mm from the center (limit ${DIM.face})`);
      const small = f.texts.filter((t) => t.capMm < MIN_CAP);
      if (small.length) throw new Error(`${game} ${name}: letters under ${MIN_CAP} mm tall: ${small.map((t) => t.text).join(', ')}`);
    }
    const [sw, sh] = DIM.sheet;
    const sheet = new LaserSheet(sw, sh);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++) sheet.place(fr.sheet, 8 + DIM.pitch * col + DIM.pitch / 2 - R, 9 + DIM.pitch * row + DIM.pitch / 2 - R);
    const [jx, jy] = DIM.jigAt;
    sheet.add({ op: 'cut', k: 'circle', cx: jx, cy: jy, r: DIM.jigHole / 2 });
    sheet.add({
      op: 'engrave',
      k: 'poly',
      pts: [
        [jx - 2.5, jy - R - 6],
        [jx + 2.5, jy - R - 6],
        [jx, jy - R - 2.5],
      ],
    }); // 12 o'clock
    const sheetBack = new LaserSheet(sw, sh).place(bk.sheet, jx - R, jy - R);
    const view = (s: LaserSheet, mm: number) => renderPreview(s, mm, mm > 6 ? 2 : 3);
    const write = (name: string, s: LaserSheet, title: string, mm: number) => {
      writeFileSync(join(out, `${name}.svg`), s.svg(`${about.title}: ${title}`));
      const p = view(s, mm);
      writeFileSync(join(out, `${name}.png`), pngFromRgb(p.w, p.h, p.rgb));
    };
    write('front', fr.sheet, 'wooden nickel, front', 14);
    write('back', bk.sheet, 'wooden nickel, back', 14);
    write('sheet', sheet, 'twelve fronts and the flip jig', 5);
    writeFileSync(join(out, 'sheet-back.svg'), sheetBack.svg(`${about.title}: the back, placed on the flip jig`));
    writeFileSync(
      join(out, 'manifest.json'),
      JSON.stringify(
        {
          key: 'laser-nickel',
          game,
          title: about.title,
          source,
          mm: { coin: DIM.coin, sheet: DIM.sheet, jigHole: DIM.jigHole, jigAt: DIM.jigAt, pitch: DIM.pitch },
          colors: { cut: CUT, score: SCORE, engrave: ENGRAVE },
          texts: { front: fr.texts, back: bk.texts },
          paths: { front: fr.sheet.items.length, back: bk.sheet.items.length, sheet: sheet.items.length },
          files,
        },
        null,
        1,
      ) + '\n',
    );
    table.push(
      `${game}: front ${fr.sheet.items.length} shapes, back ${bk.sheet.items.length}, sheet ${sheet.items.length} (cut ${sheet.count('cut')}, reach ${reach(fr).toFixed(1)}/${reach(bk).toFixed(1)} mm)`,
    );
  } catch (e) {
    failed++;
    table.push(`${game}: FAILED ${(e as Error).message}`);
  }
console.log(table.join('\n'));
if (failed) process.exitCode = 1;
