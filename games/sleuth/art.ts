// Pictures for the 320x200 screens and the cartoons: the Paragon's front in the rain,
// the stage seen from the stalls, actors on it, and the papers PLAYGAME writes on.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, blob, centered, gradient, micro, microC, outlined, pool, shadeAt, speckle, text } from './src/art/draw';
import { c, ink, ramp as r } from './src/art/pal';
import { portrait, PEOPLE, type Who } from './src/art/people';
import { symbol } from './tiles';

export const W = 320;
export const H = 200;

// ---------------------------------------------------------------- the Paragon, outside

/** Rain streaks over a picture (seeded per frame for the cartoons). */
export function rain(p: Pixels, seed: number, n = 160, color = c('rain', 4)): void {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(R() * W);
    const y = Math.floor(R() * H);
    const len = 4 + Math.floor(R() * 5);
    for (let k = 0; k < len; k++) p.set(x - Math.floor(k / 3), y + k, color);
  }
}

/** The theater front at night: brick, the blade sign, the marquee, lit doors, a wet street. `chase` turns the bulbs. */
export function facade(chase = 0, lit = 1): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 120, r('rain'), 0, 2);
  // the building
  for (let y = 20; y < 150; y++)
    for (let x = 40; x < 280; x++) {
      const row = Math.floor(y / 4);
      const mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7;
      p.set(x, y, mortar ? c('brick', 0) : shadeAt(r('brick'), 0, 2, ((x * 7 + y * 13) % 17) / 17, x, y));
    }
  p.rect(36, 16, 248, 6, c('tile', 1)).rect(36, 16, 248, 1, c('tile', 3));
  // tall windows upstairs, warm light in two of them
  for (let i = 0; i < 6; i++) {
    const x = 56 + i * 38;
    p.rect(x, 30, 18, 30, i === 1 || i === 4 ? c('glow', 1) : c('navy', 0));
    p.frame(x - 1, 29, 20, 32, c('tile', 2));
    p.rect(x + 8, 30, 2, 30, c('tile', 2));
  }
  // the blade sign: PARAGON, down the middle
  p.rect(150, 2, 20, 74, c('black', 1)).frame(150, 2, 20, 74, c('gold', 2));
  'PARAGON'.split('').forEach((ch, i) => {
    text(p, 156, 6 + i * 10, ch, lit ? c('neon', 2) : c('velvet', 1));
  });
  for (let i = 0; i < 18; i++) {
    const on = lit && (i + chase) % 3 !== 0;
    const y = 4 + i * 4;
    p.set(151, y, on ? c('glow', 4) : c('gold', 0)).set(168, y, on ? c('glow', 4) : c('gold', 0));
  }
  // the marquee
  p.rect(60, 80, 200, 34, c('black', 1));
  p.rect(64, 84, 192, 26, c('paper', 4));
  for (let x = 60; x < 260; x += 5) {
    const on = lit && (x / 5 + chase) % 3 !== 0;
    p.set(x + 2, 81, on ? c('glow', 4) : c('gold', 0)).set(x + 2, 112, on ? c('glow', 4) : c('gold', 0));
  }
  microC(p, 160, 87, 'OPENING NIGHT', c('velvet', 3), 1);
  centered(p, 95, "THE RAVEN'S BRIDE", c('black', 0), 1, undefined, 160);
  microC(p, 160, 104, 'WITH VICTOR CRANE AND LILA FONTAINE', c('velvet', 2), 1);
  p.rect(56, 114, 208, 3, c('gold', 1));
  // doors, lit from within
  for (let i = 0; i < 4; i++) {
    const x = 92 + i * 36;
    p.rect(x, 118, 28, 32, lit ? c('glow', 1) : c('navy', 1));
    p.frame(x, 118, 28, 32, c('gold', 2));
    p.rect(x + 13, 118, 2, 32, c('gold', 2));
    if (lit) pool(p, x + 14, 150, 18, 6, r('glow'), 0, 1);
  }
  // posters either side
  for (const x of [48, 248]) {
    p.rect(x, 120, 24, 30, c('black', 1)).frame(x, 120, 24, 30, c('gold', 2));
    symbol(p, x + 6, 124, 'raven', c('velvet', 4), c('gold', 4));
    microC(p, x + 12, 140, 'NOW', c('gold', 4));
  }
  // the wet street, with the lights in it
  for (let y = 150; y < H; y++)
    for (let x = 0; x < W; x++) {
      const refl = p.get(x, 300 - y);
      const base = shadeAt(r('rain'), 0, 1, (y - 150) / 50, x, y);
      p.set(x, y, (y + x) % 3 === 0 && refl >= 0 && (refl === c('glow', 1) || refl === c('glow', 4) || refl === c('neon', 2)) ? refl : base);
    }
  p.rect(0, 150, W, 2, c('grey', 2));
  return p;
}

// ---------------------------------------------------------------- the stage, from the stalls

/** The proscenium with the castle backdrop, red curtains drawn back and the footlights. `open` 0..1 closes the main curtain. */
export function stageView(curtain = 0, lights = 1): Pixels {
  const p = new Pixels(W, H);
  // backdrop: the castle flat, painted big
  gradient(p, 0, 20, W, 100, r('navy'), 0, 2);
  const R = rng(17);
  for (let i = 0; i < 40; i++) p.set(40 + R() * 240, 22 + R() * 50, c('paper', 5));
  blob(p, 236, 46, 14, 14, r('paper'), 3, 5);
  p.disc(242, 42, 12, c('navy', 1));
  for (let x = 40; x < 280; x++) {
    const h = 96 + (x % 16 < 8 ? -6 : 0) + Math.round(Math.sin(x / 23) * 4);
    for (let y = h; y < 120; y++) p.set(x, y, c('black', 1));
  }
  for (const [tx, tw, th] of [
    [70, 26, 50],
    [150, 34, 70],
    [210, 22, 44],
  ]) {
    p.rect(tx, 120 - th, tw, th, c('black', 1));
    for (let x = tx - 2; x < tx + tw + 2; x += 6) p.rect(x, 116 - th, 4, 5, c('black', 1));
    p.rect(tx + Math.floor(tw / 2) - 2, 128 - th, 4, 6, c('glow', 2));
  }
  // stage floor
  for (let y = 120; y < 180; y++)
    for (let x = 0; x < W; x++) p.set(x, y, y % 6 === 0 ? c('wood', 3) : shadeAt(r('wood'), 4, 6, ((x + y * 3) % 11) / 11 + (y - 120) / 120, x, y));
  if (lights) pool(p, 160, 150, 150, 30, r('glow'), 0, 1);
  // proscenium and side curtains
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const side = x < 40 || x >= 280;
      const top = y < 20;
      if (side || top) p.set(x, y, c('velvet', [1, 2, 4, 5, 4, 2][(x + (top ? Math.floor(y / 3) : 0)) % 6]));
    }
  p.rect(0, 0, W, 4, c('gold', 3)).rect(36, 0, 4, 180, c('gold', 2)).rect(280, 0, 4, 180, c('gold', 2));
  // the main curtain closing in from both sides
  if (curtain > 0) {
    const w = Math.round(curtain * 120);
    for (let y = 4; y < 180; y++)
      for (let x = 40; x < 40 + w; x++) {
        p.set(x, y, c('velvet', [1, 3, 5, 6, 5, 3][(x - 40) % 6]));
        p.set(319 - x, y, c('velvet', [1, 3, 5, 6, 5, 3][(x - 40) % 6]));
      }
  }
  // footlights and the pit
  p.rect(0, 180, W, 20, c('black', 0));
  for (let x = 44; x < 280; x += 12) blob(p, x, 181, 4, 2, r('glow'), lights ? 2 : 0, lights ? 4 : 1);
  return p;
}

/** A standing actor about 2.5 times the height of a block: a portrait head and a costume. */
export function actor(who: Who, h = 64, pose: 'stand' | 'raise' | 'fall' | 'bow' = 'stand'): Pixels {
  const L = PEOPLE[who];
  const w = Math.round(h * 0.6);
  const p = new Pixels(w, h, CLEAR);
  const head = portrait(who, Math.round(h * 0.5));
  const gown = who === 'lila' || who === 'agatha';
  const cx = w / 2;
  const top = Math.round(h * 0.4);
  // body
  for (let y = top; y < h - 3; y++) {
    const t = (y - top) / (h - top);
    const half = gown ? 5 + t * (w * 0.45) : 6 + (t < 0.6 ? t * 3 : 1.8);
    for (let x = Math.floor(cx - half); x <= cx + half; x++) p.set(x, y, shadeAt(r(L.coat), L.coatLo, L.coatHi, 1 - (x - cx + half) / (half * 2), x, y));
  }
  if (!gown) {
    p.rect(Math.round(cx - 5), h - 12, 4, 10, c('black', 1));
    p.rect(Math.round(cx + 1), h - 12, 4, 10, c('black', 1));
  }
  p.rect(Math.round(cx - 6), h - 3, 5, 3, c('black', 0)).rect(Math.round(cx + 1), h - 3, 5, 3, c('black', 0));
  if (who === 'victor') {
    // Count Corvin's cloak, lined in red
    for (let y = top + 2; y < h - 4; y++) {
      p.set(Math.round(cx - 9 - (y - top) / 6), y, c('velvet', 4));
      p.set(Math.round(cx + 9 + (y - top) / 6), y, c('velvet', 4));
    }
  }
  p.blit(head, Math.round(cx - head.w / 2), 0, CLEAR);
  // arms
  const arm = c(L.coat, L.coatLo);
  if (pose === 'raise') {
    p.line(cx + 5, top + 4, cx + 10, top - 8, arm);
    p.line(cx + 6, top + 4, cx + 11, top - 8, arm);
  } else if (pose === 'bow') {
    p.line(cx - 6, top + 4, cx - 10, top + 16, arm);
    p.line(cx + 6, top + 4, cx + 10, top + 16, arm);
  } else {
    p.line(cx - 7, top + 3, cx - 8, top + 18, arm);
    p.line(cx + 7, top + 3, cx + 8, top + 18, arm);
  }
  if (pose === 'fall') {
    // lying down: rotate a quarter turn
    const q = new Pixels(h, w, CLEAR);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) q.set(h - 1 - y, x, p.get(x, y));
    return q;
  }
  return p;
}

/** A dagger held up (for the cartoons). */
export function dagger(p: Pixels, x: number, y: number, real: boolean): void {
  p.line(x, y, x, y - 14, real ? c('grey', 7) : c('grey', 5));
  p.line(x + 1, y, x + 1, y - 13, real ? c('ghost', 3) : c('grey', 4));
  p.rect(x - 3, y, 8, 2, c('gold', 3));
  p.rect(x - 1, y + 2, 3, 5, c('black', 1));
  p.disc(x + 1, y + 8, 2, real ? c('black', 0) : c('gold', 3));
}

// ---------------------------------------------------------------- paper

/** The case folder: a manila folder on a desk, with a sheet of paper where PLAYGAME writes (x 40..288, y 40..168). */
export function caseFile(heading: string, seed = 1): Pixels {
  const p = new Pixels(W, H);
  speckle(p, 0, 0, W, H, r('wood'), 1, 1, seed, 0.3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((y * 3 + x) % 37 === 0) p.set(x, y, c('wood', 0));
  // the folder
  p.rect(18, 14, 288, 182, c('tan', 2)).rect(18, 14, 288, 2, c('tan', 4));
  p.rect(30, 8, 70, 8, c('tan', 2));
  micro(p, 34, 10, 'CASE 36-1031', c('black', 1));
  // the sheet
  p.rect(30, 26, 268, 166, c('black', 0));
  p.rect(28, 24, 268, 166, c('paper', 4));
  for (let y = 40; y < 184; y += 8) p.rect(36, y + 7, 252, 1, c('paper', 3));
  p.rect(32, 24, 1, 166, c('velvet', 3));
  if (heading) {
    centered(p, 28, heading, c('black', 0), 1, undefined, 162);
  }
  // a paper clip and a coffee ring
  p.rect(260, 18, 6, 18, c('grey', 5)).rect(261, 20, 4, 14, c('paper', 4));
  p.ring(292, 176, 12, c('wood', 3));
  return p;
}

/** A notebook page on the left (PLAYGAME writes x 40..200) and a framed portrait on the right. */
export function portraitScreen(who: Who): Pixels {
  const p = new Pixels(W, H);
  // green room wallpaper
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (x + y) % 12 === 0 || (x - y + 240) % 12 === 0 ? c('teal', 2) : c('teal', 1));
  // notebook page
  p.rect(30, 30, 176, 160, c('black', 0));
  p.rect(28, 28, 176, 160, c('paper', 4));
  for (let y = 40; y < 184; y += 8) p.rect(32, y + 7, 168, 1, c('paper', 3));
  for (let y = 34; y < 186; y += 10) p.disc(28, y, 2, c('teal', 0));
  // portrait
  p.rect(212, 30, 100, 116, c('gold', 1)).rect(214, 32, 96, 112, c('gold', 3)).rect(217, 35, 90, 106, c('black', 1));
  gradient(p, 218, 36, 88, 104, r('teal'), 0, 2);
  const face = portrait(who, 88);
  p.blit(face, 218, 52, CLEAR);
  p.rect(218, 136, 88, 4, c('black', 1));
  // name plate (above) and a cream tab where PLAYGAME may write MORE...
  const L = PEOPLE[who];
  p.rect(212, 8, 100, 18, c('gold', 3)).rect(214, 10, 96, 14, c('black', 1));
  microC(p, 262, 11, L.name, c('gold', 4));
  microC(p, 262, 18, L.role.toUpperCase(), c('paper', 4));
  p.rect(214, 160, 98, 22, c('paper', 4)).frame(214, 160, 98, 22, c('gold', 2));
  return p;
}

/** The same notebook, with a close-up of a piece of evidence on the right. */
export function evidenceScreen(close: Pixels, label: string): Pixels {
  const p = new Pixels(W, H);
  speckle(p, 0, 0, W, H, r('wood'), 4, 1, 3, 0.3);
  p.rect(0, 0, W, H, c('wood', 4));
  speckle(p, 0, 0, W, H, r('wood'), 4, 1, 9, 0.35);
  p.rect(30, 30, 176, 160, c('black', 0));
  p.rect(28, 28, 176, 160, c('paper', 4));
  for (let y = 40; y < 184; y += 8) p.rect(32, y + 7, 168, 1, c('paper', 3));
  for (let y = 34; y < 186; y += 10) p.disc(28, y, 2, c('wood', 1));
  // a pinned card with the close-up
  p.rect(214, 26, 96, 110, c('black', 0)).rect(212, 24, 96, 110, c('paper', 5));
  p.blit(close, 220, 32, CLEAR);
  p.disc(260, 26, 3, c('velvet', 5));
  microC(p, 260, 122, label, c('black', 0));
  p.rect(214, 160, 98, 22, c('paper', 4)).frame(214, 160, 98, 22, c('gold', 2));
  return p;
}

/** An act card: a title, the hour, and the brief, over a view. */
export function actCard(view: Pixels, title: string, time: string, lines: string[]): Pixels {
  const p = new Pixels(W, H, c('black', 0));
  p.blit(view, 0, 0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && y > 70) p.set(x, y, c('black', 0));
  p.rect(16, 74, 288, 116, c('black', 0)).frame(16, 74, 288, 116, c('gold', 2)).frame(18, 76, 284, 112, c('gold', 0));
  outlined(p, 160 - title.length * 12, 12, title, c('gold', 4), c('black', 0), 3);
  centered(p, 44, time, c('paper', 5), 2, c('black', 0));
  lines.forEach((l, i) => text(p, 24, 86 + i * 12, l, l.includes('EVIDENCE') || l.startsWith('Find') ? c('glow', 4) : c('paper', 5)));
  void ink;
  return p;
}
