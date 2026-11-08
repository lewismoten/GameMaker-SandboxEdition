// LUCKY CAT's 320x200 pictures, cut in the game's woodcut (print.ts): a night street under a full moon (gouged plate,
// an ink roofline with cut lines and gold windows, the clock tower whose top number is 13), and on it the title,
// the menu, the pages PLAYGAME writes on, the level cards (a poster on the wall), the story cards (comic caption
// boxes over the street) and the endings. PLAYGAME writes its own words on the menu, the pages and the lists, so
// those keep the plain places the kit's screens keep (kit/starter/screens.ts), in the same spots.
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T, hatch, type Pal } from './print';

export const W = 320;
export const H = 200;

/** A picture as a GIF file in the given palette. */
export const gif = (p: Pixels, pal: Pal): Uint8Array => encodeGif({ width: p.w, height: p.h, pixels: p.px, palette: pal.pal });

/** The moon: a paper disc with hatched seas and a cut ring. */
function moon(p: Pixels, pal: Pal, x: number, y: number, r: number): void {
  const { c } = pal;
  p.disc(x, y, r + 2, c('sky', 0)).disc(x, y, r, c('paper', 4));
  const seas: [number, number, number][] = [
    [-0.35, -0.2, 0.28],
    [0.25, 0.15, 0.22],
    [-0.1, 0.45, 0.16],
  ];
  for (const [dx, dy, s] of seas) {
    const cx = x + dx * r;
    const cy = y + dy * r;
    const rr = s * r;
    for (let yy = Math.floor(cy - rr); yy <= cy + rr; yy++)
      for (let xx = Math.floor(cx - rr); xx <= cx + rr; xx++) if (Math.hypot(xx - cx, yy - cy) <= rr && (xx + yy) % 3 === 0) p.set(xx, yy, c('paper', 1));
  }
}

/** One house: an ink front with a pitched roof, a chimney, cut lines and gold windows (one pane each). */
function house(p: Pixels, pal: Pal, x: number, w: number, h: number, ground: number, seed: number): void {
  const { c } = pal;
  const top = ground - h;
  const roof = Math.round(w * 0.45);
  const paper = c('paper', 3);
  for (let k = 0; k <= roof; k++) {
    const half = Math.round((w / 2 + 2) * (k / roof));
    p.rect(x + w / 2 - half - 1, top - roof + k, half * 2 + 2, 1, paper);
    p.rect(x + w / 2 - half, top - roof + k, half * 2, 1, c('ink', 1));
  }
  p.rect(x - 1, top, w + 2, h, paper).rect(x, top, w, h, c('ink', 1));
  hatch(p, x + w - 6, top + 1, 6, h - 1, c('ink', 0), 2);
  const cx = x + Math.round(w * 0.7);
  p.rect(cx - 1, top - roof, 8, roof - 2, paper).rect(cx, top - roof + 1, 6, roof - 3, c('ink', 1));
  const rand = rng(seed);
  for (let wy = top + 6; wy < ground - 14; wy += 16)
    for (let wx = x + 5; wx < x + w - 10; wx += 13) {
      const lit = rand() < 0.45;
      p.rect(wx - 1, wy - 1, 8, 11, paper).rect(wx, wy, 6, 9, lit ? c('gold', 3) : c('ink', 0));
      if (lit) p.rect(wx, wy, 6, 3, c('paper', 4));
    }
  p.rect(x + Math.round(w / 2) - 4, ground - 15, 8, 15, paper).rect(x + Math.round(w / 2) - 3, ground - 14, 6, 14, c('red', 1));
}

/** The clock tower: tall ink with a paper dial whose top number is 13, its spire against the sky. */
function tower(p: Pixels, pal: Pal, x: number, ground: number): void {
  const { c } = pal;
  const paper = c('paper', 3);
  p.rect(x - 1, ground - 120, 38, 120, paper).rect(x, ground - 119, 36, 119, c('ink', 1));
  hatch(p, x + 26, ground - 118, 10, 118, c('ink', 0), 2);
  for (let k = 0; k < 26; k++) {
    const half = Math.round(19 * (1 - k / 26));
    p.rect(x + 18 - half - 1, ground - 120 - k, half * 2 + 2, 1, paper);
    p.rect(x + 18 - half, ground - 120 - k, half * 2, 1, c('ink', 1));
  }
  const cy = ground - 92;
  p.disc(x + 18, cy, 13, paper).disc(x + 18, cy, 11.5, c('paper', 4));
  for (let i = 1; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    p.set(Math.round(x + 18 + Math.sin(a) * 9), Math.round(cy - Math.cos(a) * 9), c('ink', 0));
  }
  p.draw(x + 15, cy - 11, ['.K.KKK', 'KK...K', '.K.KKK', '.K...K', 'KKKKKK'], { K: c('ink', 0) });
  p.line(x + 18, cy, x + 18, cy - 5, c('ink', 0)).line(x + 18, cy, x + 22, cy - 4, c('red', 1));
  p.rect(x + 14, ground - 60, 8, 12, c('gold', 3)).rect(x + 13, ground - 61, 10, 1, paper);
}

/** The night street: the gouged plate, the moon, the roofline and tower, a wire, the curb and the ink street. */
export function scene(pal: Pal, ground = 160, seed = 3, o: { moon?: [number, number, number]; tower?: number } = {}): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H, c('sky', 1));
  const rand = rng(seed);
  for (let i = 0; i < 150; i++) {
    const y = Math.floor(rand() * ground);
    const x = Math.floor(rand() * W);
    p.rect(x, y, 3 + Math.floor(rand() * 8), 1, c('sky', y < 40 ? 0 : 2));
  }
  for (let i = 0; i < 14; i++) p.set(Math.floor(rand() * W), Math.floor(rand() * (ground - 70)), c('paper', 4));
  const [mx, my, mr] = o.moon ?? [252, 46, 26];
  moon(p, pal, mx, my, mr);
  const towerX = o.tower ?? 136;
  const houses: [number, number][] = [
    [-6, 54],
    [56, 44],
    [186, 60],
    [258, 40],
  ];
  houses.forEach(([x, h], i) => house(p, pal, x, x < 0 ? 58 : 56 + (i % 2) * 8, h, ground, seed + i));
  if (towerX >= 0) tower(p, pal, towerX, ground);
  p.rect(0, ground, W, 2, c('paper', 3)).rect(0, ground + 2, W, H - ground - 2, c('ink', 0));
  for (let x = 0; x < W; x += 22) p.rect(x + ((x / 22) % 2) * 6, ground + 6, 10, 1, c('ink', 2));
  return p;
}

/** Big lettering: paper letters, an ink edge and a red print-shadow (the second color run, slightly off). */
export function lettering(p: Pixels, pal: Pal, y: number, s: string, scale: number, fill = pal.c('paper', 4)): void {
  outlined(p, Math.round((W - textWidth(s, scale)) / 2), y, s, fill, pal.c('ink', 0), scale, pal.c('red', 2));
}

/** A figure (20x40), scaled, standing with its feet on `ground`; `flip` faces it left. */
export function standing(p: Pixels, figure: Pixels, x: number, ground: number, scale: number, flip = false): void {
  scaleBlit(p, figure, x, ground - 40 * scale, scale, flip, T);
}

/** A comic caption box: paper with an ink frame and a red corner tab. */
function caption(p: Pixels, pal: Pal, x: number, y: number, w: number, h: number): void {
  const { c } = pal;
  p.rect(x + 3, y + 3, w, h, c('ink', 0));
  p.rect(x, y, w, h, c('ink', 0)).rect(x + 1, y + 1, w - 2, h - 2, c('paper', 4));
  p.rect(x + 1, y + 1, 6, 6, c('red', 2));
}

/** The title: the name, a red band with the line, the charms on a wire and Midnight on a rooftop against the moon. */
export function titlePicture(pal: Pal, cat: Pixels, charms: Pixels[], name: string, tagline: string): Pixels {
  const { c } = pal;
  const p = scene(pal, 166, 14, { moon: [70, 108, 40], tower: 244 });
  // Midnight sits on the ridge in front of the moon
  p.rect(20, 152, 100, 14, c('ink', 1)).rect(20, 151, 100, 1, c('paper', 3));
  standing(p, cat, 52, 153, 2);
  lettering(p, pal, 12, name, 4);
  const band = textWidth(tagline) + 16;
  const bx = Math.round((W - band) / 2);
  p.rect(bx, 54, band, 13, c('red', 2)).rect(bx, 54, band, 1, c('red', 1)).rect(bx, 66, band, 1, c('red', 0));
  text(p, bx + 8, 57, tagline, c('paper', 4));
  // a telephone wire with the 13 charms hanging off it like laundry
  const y0 = 80;
  p.line(110, y0, 210, y0 + 8, c('ink', 0)).line(210, y0 + 8, 319, y0, c('ink', 0));
  charms.forEach((ch, i) => {
    const x = 112 + i * 16;
    const sag = Math.round(Math.sin(((x - 110) / 210) * Math.PI) * 8);
    p.rect(x + 9, y0 + sag, 1, 3, c('ink', 0));
    p.blit(ch, x, y0 + sag + 2, T);
  });
  return p;
}

/** The menu: the name over the street, a sheet for PLAYGAME's menu words, Midnight beside it. */
export function menuPicture(pal: Pal, cat: Pixels, name: string): Pixels {
  const { c } = pal;
  const p = scene(pal, 176, 7);
  lettering(p, pal, 8, name, name.length > 11 ? 2 : 3);
  p.rect(59, 49, 208, 132, c('ink', 0));
  p.rect(56, 46, 208, 132, c('ink', 0)).rect(58, 48, 204, 128, c('paper', 3));
  p.rect(62, 52, 196, 120, c('paper', 4));
  standing(p, cat, 270, 176, 2);
  return p;
}

/** Plain paper for a page of words (PLAYGAME writes in plum over it), its heading in ink. */
export function paper(pal: Pal, heading: string): Pixels {
  const { c } = pal;
  const p = scene(pal, 176, 11);
  p.rect(25, 3, 273, 197, c('ink', 0));
  p.rect(22, 0, 276, 200, c('paper', 3)).rect(26, 4, 268, 194, c('paper', 4));
  p.rect(26, 30, 268, 1, c('red', 2));
  if (heading.length <= 17) centered(p, 12, heading, c('ink', 0), 2);
  else {
    const spaces = [...heading].flatMap((ch, i) => (ch === ' ' ? [i] : []));
    const at = spaces.reduce((a, b) => (Math.abs(b - heading.length / 2) < Math.abs(a - heading.length / 2) ? b : a));
    [heading.slice(0, at), heading.slice(at + 1)].forEach((l, i) => centered(p, 4 + i * 13, l, c('ink', 0), 2));
  }
  return p;
}

/** The load and save lists: PLAYGAME writes the names in yellow, so each slot is a dark strip. */
export function slotsPicture(pal: Pal, heading: string): Pixels {
  const p = paper(pal, heading);
  for (let i = 0; i < 10; i++) p.rect(56, 37 + i * 14, 189, 13, pal.c('ink', 1)).rect(56, 49 + i * 14, 189, 1, pal.c('ink', 0));
  return p;
}

/** The high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192 over a plain panel. */
export function scoresPicture(pal: Pal, heading: string): Pixels {
  const { c } = pal;
  const p = scene(pal, 176, 13);
  p.rect(4, 0, 312, H, c('paper', 4)).rect(4, 0, 1, H, c('ink', 0)).rect(315, 0, 1, H, c('ink', 0));
  centered(p, 11, heading, c('ink', 0));
  const rule = textWidth(heading) + 16;
  p.rect(160 - rule / 2, 21, rule, 1, c('red', 2));
  return p;
}

/** A level card: a poster pasted on the wall ("LEVEL 3 OF 8", the name, a line), the level's hero beside it. */
export function cardPicture(pal: Pal, hero: Pixels, n: number, of: number, name: string, hint: string, seed: number): Pixels {
  const { c } = pal;
  const p = scene(pal, 160, seed);
  p.rect(19, 11, 288, 70, c('ink', 0));
  p.rect(16, 8, 288, 70, c('paper', 4)).frame(16, 8, 288, 70, c('paper', 2));
  p.rect(16, 8, 288, 14, c('red', 2));
  centered(p, 11, `LEVEL ${n} OF ${of}`, c('paper', 4));
  const title = name.toUpperCase();
  centered(p, 30, title, c('ink', 0), title.length * 16 <= 272 ? 2 : 1);
  centered(p, 58, hint, c('ink', 1));
  standing(p, hero, 40, 160, 2);
  return p;
}

/** A story card: a caption box of up to four lines over the street, the speaker (or speakers) below. */
export function storyCard(pal: Pal, left: Pixels, lines: string[], seed: number, right?: Pixels): Pixels {
  const { c } = pal;
  const p = scene(pal, 160, seed);
  const h = 14 + lines.length * 13;
  caption(p, pal, 12, 8, 294, h);
  lines.forEach((l, i) => centered(p, 16 + i * 13, l, c('ink', 0)));
  standing(p, left, 48, 160, 2);
  if (right) standing(p, right, 232, 160, 2, true);
  return p;
}

/** An ending card: a big line, a smaller one in a red band, and the hero over the street. */
export function endPicture(pal: Pal, hero: Pixels, head: string, line: string, tone: 'won' | 'lost'): Pixels {
  const { c } = pal;
  const p = scene(pal, 160, tone === 'won' ? 31 : 37);
  lettering(p, pal, 14, head, 3, tone === 'won' ? c('gold', 3) : c('paper', 4));
  const band = textWidth(line) + 24;
  p.rect((W - band) / 2, 50, band, 16, c('red', 2));
  centered(p, 54, line, c('paper', 4));
  standing(p, hero, 140, 160, 2);
  if (tone === 'won') {
    const rand = rng(9);
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(rand() * W);
      const y = 76 + Math.floor(rand() * 70);
      p.rect(x, y, 3, 2, [c('red', 2), c('gold', 3), c('paper', 4)][i % 3]);
    }
  }
  return p;
}
