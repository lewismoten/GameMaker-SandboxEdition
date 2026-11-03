// Laser-cut wooden nickels for the Sandbox games: one 1.5 inch (38.1 mm) token per game, a 1994 collectible in a series of 26,
// each the money of its game's own world (laserNickelDefs.ts). Every one has a reeded rim, a front (the game's name round the
// top, the token's art, a line round the bottom, sometimes a hole cut through) and a back ("GOOD FOR ..." in the game's words,
// its number in the series, the year, SM for Sandbox Mint, and one letter of a hidden Sandscript message), for a Glowforge
// (cut: red, score: blue, engrave: black).
//   cd web && npx vite-node ../games/kit/laserNickels.ts [--game id[,id]] [--force] [--out ROOT]
// Writes web/public/laser/<game>/ (git-ignored build output): front.svg, back.svg (each exactly 38.1 x 38.1 mm), sheet.svg
// (twelve fronts in a 4 x 3 grid with their cut lines, and the flip jig), sheet-back.svg (the back placed on the jig, the
// same page size, for the second pass), a PNG preview of each, and manifest.json with a `source` key: a game whose figures,
// words and builder code match it is skipped (--force remakes). Also web/public/laser/checklist.svg and .png, the collector's
// checklist of all 26. Secret games and games without a built disk are skipped.
// Text is drawn from pixels (8x8 PC font, 3x5 micro font, Sandscript), so no font is needed. Docs: games/kit/README.md.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tooClose } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import { arcSpanDeg, arcText, engraveRects, lineText, mergeRuns } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPixels';
import { pngFromRgb, renderPreview } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import { CUT, ENGRAVE, LaserSheet, SCORE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { GAMES, type Def } from './pixelTrinketDefs';
import { picture } from './pixelPicture';
import { MESSAGE, NICKELS, heroDef } from './laserNickelDefs';
import { Art, R, figureOf } from './laserNickelParts';
import { sandPixels } from './sandscript';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

/** Real sizes in millimeters. */
const DIM = {
  coin: 38.1, // 1.5 inch
  rim: [16.9, 18.2], // the reeded rim's inner and outer radius
  face: 15.1, // nothing is engraved farther out than this (inside the score line)
  jigHole: 38.0, // the flip jig's cut-out: 0.1 mm under the coin, for the laser's kerf to open to a snug fit
  sheet: [270, 150],
  pitch: 44,
  jigAt: [235, 75],
  wood: 3, // wood left between a cut-out and the rim, at the least
} as const;
const PC_PX = 0.36; // 8x8 letters: 7 pixels tall = 2.52 mm
const MICRO_PX = 0.5; // 3x5 letters: 5 pixels tall = 2.5 mm
const MIN_CAP = 2.45;
const ORDER = Object.keys(NICKELS);
const OF = ORDER.length;

const newFace = (cut: boolean, figs: ConstructorParameters<typeof Art>[1]) => {
  const sheet = new LaserSheet(DIM.coin, DIM.coin);
  if (cut) sheet.add({ op: 'cut', k: 'circle', cx: R, cy: R, r: R });
  const a = new Art(sheet, figs);
  // the reeded rim: engraved ticks, 90 of them, round a thin solid ring, all inside the cut
  a.mark('rim');
  sheet.add({ op: 'engrave', k: 'ring', cx: R, cy: R, r0: DIM.rim[0] - 0.35, r1: DIM.rim[0] - 0.05 });
  for (let i = 0; i < 90; i++) {
    const t = (i * 4 * Math.PI) / 180;
    a.bar((DIM.rim[0] + 0.1) * Math.cos(t), (DIM.rim[0] + 0.1) * Math.sin(t), (DIM.rim[1] - 0.1) * Math.cos(t), (DIM.rim[1] - 0.1) * Math.sin(t), 0.55);
  }
  return a.mark('motif');
};
const arc = (a: Art, s: string, top: boolean) => {
  a.mark(`arc ${s}`);
  const r = top ? 12.5 : 15.0;
  // the 8x8 letters when the line fits round the coin in them, else the smaller 3x5 ones (both at least 2.5 mm tall)
  const pc = arcSpanDeg(s, 'pc', r, PC_PX, top) <= 140;
  const span = arcText(a.sheet, s, pc ? 'pc' : 'micro', R, R, r, pc ? PC_PX : MICRO_PX, top);
  if (span > 140) throw new Error(`"${s}" spans ${span.toFixed(0)} degrees round the coin: shorten it`);
  a.texts.push({ text: s, capMm: pc ? 7 * PC_PX : 5 * MICRO_PX });
  a.mark('motif');
};

function front(game: string, year: number, figs: ReturnType<typeof figureOf>[]): Art {
  const n = NICKELS[game];
  const a = newFace(true, figs);
  arc(a, n.top, true);
  arc(a, n.bottom ?? `* ${year} *`, false);
  const from = a.sheet.items.length;
  n.art(a);
  const out = reach(a, from);
  if (out > (n.zone ?? 12.3)) throw new Error(`${game}: the art reaches ${out.toFixed(1)} mm out, into the lettering (limit ${n.zone ?? 12.3})`);
  return a;
}

/** A Sandscript letter (laserNickelDefs MESSAGE), centered on (x, y), `px` mm a pixel. */
function sandLetter(a: Art, ch: string, x: number, y: number, px: number) {
  a.mark('sandscript letter');
  const s = sandPixels(ch, 3);
  engraveRects(a.sheet, mergeRuns({ w: s.cols, h: s.rows, on: (cx, cy) => s.px[cy * s.cols + cx] === 1 }), (cx, cy) => [
    R + x + (cx - s.cols / 2) * px,
    R + y + (cy - s.rows / 2) * px,
  ]);
  a.texts.push({ text: `sandscript ${ch}`, capMm: s.rows * px });
  a.mark('motif');
}

function back(game: string, year: number): Art {
  const n = NICKELS[game];
  const no = ORDER.indexOf(game) + 1;
  const a = newFace(false, []);
  arc(a, n.arc ?? 'GOOD FOR', true); // most games' lines start "ONE ..."
  arc(a, 'SANDBOX SOFTWARE', false);
  // the joke lines in the middle, the number and the year with the mint mark below, the Sandscript letter alone above
  n.good.forEach((s, i) => a.text(s, 0, -2.6 + (i - (n.good.length - 1) / 2) * 3.2));
  a.text(`NO.${String(no).padStart(2, '0')}/${OF}`, 0, 4.2, MICRO_PX, 'micro');
  a.text(`${year} SM`, 0, 7.7, MICRO_PX, 'micro');
  sandLetter(a, MESSAGE[no - 1], 0, -9.9, PC_PX);
  return a;
}

/** The farthest an engraved shape reaches from the center, and whether the holes leave wood. */
function reach(a: Art, from = 0): number {
  let m = 0;
  for (const it of a.sheet.items.slice(from))
    if (it.op === 'engrave' && it.k === 'poly') {
      const r = Math.max(...it.pts.map(([x, y]) => Math.hypot(x - R, y - R)));
      if (r < DIM.rim[0] - 0.4) m = Math.max(m, r); // the rim's own ticks are out past this
    } else if (it.k === 'circle' && it.op === 'engrave') m = Math.max(m, Math.hypot(it.cx - R, it.cy - R) + it.r);
  return m;
}

const codeKey = (() => {
  const h = createHash('sha1');
  for (const f of [
    fileURLToPath(import.meta.url),
    join(here, 'laserNickelDefs.ts'),
    join(here, 'laserNickelParts.ts'),
    join(here, 'sandscript.ts'),
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
const games = ORDER.filter((g) => (!only || only.includes(g)) && !secret(g));
const rootOut = resolve(flag('--out') ?? join(here, '../../web/public/laser'));
const table: string[] = [];
let failed = 0;
const checklist: { no: number; name: string }[] = [];

for (const game of games)
  try {
    const about = JSON.parse(readFileSync(join(here, '..', game, 'about.json'), 'utf8')) as { title: string; year: number };
    const n = NICKELS[game];
    const defs: Def[] = n.figs ? [GAMES[game]?.[0] ?? heroDef(game, n), GAMES[game]?.[1]].filter((d): d is Def => !!d).slice(0, n.figs) : [];
    const hero = n.hero ? heroDef(game, n) : undefined;
    if (hero) defs[0] = hero;
    const out = join(rootOut, game);
    if (defs.some((d) => !existsSync(join(here, '..', game, 'disk', d.pal)))) {
      console.log(`${game}: skipped (its disk isn't built)`);
      continue;
    }
    const h = createHash('sha1')
      .update(codeKey)
      .update(JSON.stringify([n.top, n.bottom, n.good, n.arc, n.figs, n.hero, about.year, about.title, ORDER, MESSAGE, String(n.art)]));
    for (const d of defs) h.update(picture(game, d).cells).update(picture(game, d).palette);
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
    const fr = front(
      game,
      about.year,
      defs.map((d) => figureOf(game, d)),
    );
    const bk = back(game, about.year);
    for (const [name, f] of [
      ['front', fr],
      ['back', bk],
    ] as const) {
      f.done();
      const close = tooClose(f.sheet, f.elements);
      if (close.length) throw new Error(`${game} ${name} too close: ${close.map((c) => `${c.a} / ${c.b} ${c.mm} mm`).join('; ')}`);
      if (reach(f) > DIM.face + 0.05) throw new Error(`${game} ${name}: engraving reaches ${reach(f).toFixed(2)} mm from the center (limit ${DIM.face})`);
      const small = f.texts.filter((t) => t.capMm < MIN_CAP);
      if (small.length) throw new Error(`${game} ${name}: letters under ${MIN_CAP} mm tall: ${small.map((t) => t.text).join(', ')}`);
    }
    for (const hole of fr.holes)
      if (R - (Math.hypot(hole.x, hole.y) + hole.r) < DIM.wood) throw new Error(`${game}: a hole leaves under ${DIM.wood} mm of wood to the rim`);
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
    const write = (name: string, s: LaserSheet, title: string, mm: number) => {
      writeFileSync(join(out, `${name}.svg`), s.svg(`${about.title}: ${title}`));
      const p = renderPreview(s, mm, mm > 6 ? 2 : 3);
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
          concept: n.concept,
          source,
          mm: { coin: DIM.coin, sheet: DIM.sheet, jigHole: DIM.jigHole, jigAt: DIM.jigAt, pitch: DIM.pitch, wood: DIM.wood },
          colors: { cut: CUT, score: SCORE, engrave: ENGRAVE },
          series: { no: ORDER.indexOf(game) + 1, of: OF, letter: MESSAGE[ORDER.indexOf(game)], message: MESSAGE },
          holes: fr.holes,
          clearance: { front: tooClose(fr.sheet, fr.elements), back: tooClose(bk.sheet, bk.elements) },
          reach: { front: +reach(fr).toFixed(2), back: +reach(bk).toFixed(2) },
          texts: { front: fr.texts, back: bk.texts },
          paths: { front: fr.sheet.items.length, back: bk.sheet.items.length, sheet: sheet.items.length },
          files,
        },
        null,
        1,
      ) + '\n',
    );
    table.push(
      `${game}: front ${fr.sheet.items.length} shapes, back ${bk.sheet.items.length}, sheet ${sheet.items.length} (holes ${fr.holes.length}, reach ${reach(fr).toFixed(1)}/${reach(bk).toFixed(1)} mm)`,
    );
  } catch (e) {
    failed++;
    table.push(`${game}: FAILED ${(e as Error).message}`);
  }

// the collector's checklist: all 26 tokens by number, a tick box each (score), and the series' hidden message line
if (!only) {
  for (const g of ORDER)
    if (!secret(g)) checklist.push({ no: ORDER.indexOf(g) + 1, name: NICKELS[g].bottom ? `${NICKELS[g].top} - ${NICKELS[g].bottom}` : NICKELS[g].top });
  const W = 190;
  const rowH = 9.5;
  const sheet = new LaserSheet(W, 28 + rowH * 13);
  lineText(sheet, 'SANDBOX MINT 1994 SERIES', 'pc', W / 2, 8, 0.6);
  lineText(sheet, `WOODEN NICKELS: ${OF} TO COLLECT`, 'micro', W / 2, 17, 0.5);
  checklist.forEach((c, i) => {
    const col = Math.floor(i / 13);
    const x = 10 + col * 92;
    const y = 30 + (i % 13) * rowH;
    sheet.add({
      op: 'score',
      k: 'poly',
      pts: [
        [x, y - 3],
        [x + 6, y - 3],
        [x + 6, y + 3],
        [x, y + 3],
      ],
    });
    const t = `${String(c.no).padStart(2, '0')} ${c.name}`;
    lineText(sheet, t, 'micro', x + 9 + (t.length * 4 * 0.5) / 2, y, 0.5);
  });
  mkdirSync(rootOut, { recursive: true });
  writeFileSync(join(rootOut, 'checklist.svg'), sheet.svg('Wooden nickel checklist'));
  const p = renderPreview(sheet, 5, 3);
  writeFileSync(join(rootOut, 'checklist.png'), pngFromRgb(p.w, p.h, p.rgb));
}
console.log(table.join('\n'));
if (failed) process.exitCode = 1;
