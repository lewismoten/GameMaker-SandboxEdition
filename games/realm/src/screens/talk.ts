// The picture behind a conversation: the speaker's portrait in a gilt frame, their name on a
// ribbon, and a parchment page where Game-Maker prints the words (rows 5-20, from column 5:
// x 40-288, y 40-167) in the page's plum ink. A talk is a slide show: this picture, then the
// words (talk.ts in levels/ writes the .LST and .TXT).
import { Canvas, type RGB, mix, clamp01, tnoise, speck } from '../art/rgb';
import { Screen } from './screen';

export interface Theme {
  /** Top and bottom of the backdrop. */
  bg: [RGB, RGB];
  /** The ribbon's color. */
  ribbon: RGB;
}

export const THEMES: Record<string, Theme> = {
  nowish: {
    bg: [
      [40, 70, 44],
      [16, 30, 22],
    ],
    ribbon: [46, 110, 60],
  },
  laterburg: {
    bg: [
      [40, 46, 96],
      [14, 16, 40],
    ],
    ribbon: [150, 34, 40],
  },
  harbor: {
    bg: [
      [30, 76, 110],
      [10, 28, 52],
    ],
    ribbon: [30, 80, 140],
  },
  falls: {
    bg: [
      [70, 50, 90],
      [24, 16, 36],
    ],
    ribbon: [110, 60, 130],
  },
  wild: {
    bg: [
      [54, 76, 40],
      [20, 30, 16],
    ],
    ribbon: [120, 90, 40],
  },
  dark: {
    bg: [
      [40, 24, 44],
      [10, 6, 14],
    ],
    ribbon: [90, 20, 30],
  },
};

/** Plum ink for the words: Game-Maker prints text pages in the entry nearest purple. */
export const INK: RGB = [104, 26, 92];

/** A sprite blown up 2x with crisp pixels, trimmed to what's drawn. */
export function bigSprite(sprite: Canvas, scale = 2): Canvas {
  let y0 = sprite.h;
  let y1 = 0;
  let x0 = sprite.w;
  let x1 = 0;
  for (let y = 0; y < sprite.h; y++)
    for (let x = 0; x < sprite.w; x++)
      if (sprite.alpha(x, y) > 0.5) {
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
      }
  const w = (x1 - x0 + 1) * scale;
  const h = (y1 - y0 + 1) * scale;
  const out = new Canvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = x0 + Math.floor(x / scale);
      const sy = y0 + Math.floor(y / scale);
      const k = sprite.alpha(sx, sy);
      if (k > 0.5) out.blend(x, y, sprite.get(sx, sy), 1);
    }
  return out;
}

export function parchment(cv: Canvas, x0: number, y0: number, x1: number, y1: number, seed = 1): void {
  // a drop shadow, the sheet, darker scorched edges, two rolled ends
  cv.rrect(x0 + 3, y0 + 4, x1 - x0, y1 - y0, 4, [0, 0, 0]);
  cv.rrect(x0, y0, x1 - x0, y1 - y0, 3, (x, y) => {
    const e = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    const n = tnoise(x, y, 10, 320, seed) * 0.6 + tnoise(x, y, 2.5, 320, seed + 1) * 0.4;
    // mottled only softly and scorched only in a narrow band, so the words that Game-Maker
    // writes from 6 pixels inside the edge sit on plain-looking paper
    let c = mix([224, 200, 152], [246, 232, 196], clamp01(n * 0.9 + 0.25));
    c = mix([150, 108, 60], c, clamp01(e / 4));
    if (speck(x, y, 320, seed) > 0.985) c = mix(c, [170, 130, 80], 0.25);
    return c;
  });
  for (const y of [y0, y1]) {
    cv.rrect(x0 - 4, y - 4, x1 - x0 + 8, 8, 4, (_x, py) => mix([236, 214, 168], [160, 120, 70], clamp01((py - (y - 4)) / 8)));
    cv.ellipse(x0 - 4, y, 3, 4, [120, 84, 44]);
    cv.ellipse(x1 + 4, y, 3, 4, [120, 84, 44]);
  }
}

/** The talk picture for a speaker. */
export function talkPage(name: string, portrait: Canvas, theme: Theme, place = ''): Screen {
  const sc = new Screen();
  const cv = sc.cv;
  // the backdrop: the place's colors, a soft light from the top left, a stitched border
  cv.shade((x, y) => {
    const v = Math.hypot((x - 90) / 260, (y - 40) / 180);
    const base = mix(theme.bg[0], theme.bg[1], clamp01(y / 200));
    return mix(base, [0, 0, 0], clamp01(v - 0.2) * 0.6 + (tnoise(x, y, 20, 320, 9) - 0.5) * 0.08);
  });
  for (let x = 6; x < 314; x += 6) {
    cv.rect(x, 3, 3, 1, mix(theme.ribbon, [255, 230, 160], 0.5));
    cv.rect(x, 198, 3, 1, mix(theme.ribbon, [255, 230, 160], 0.5));
  }
  // the bottom roller clears MORE... (y 168..175)
  parchment(cv, 32, 33, 296, 184, name.length);
  // the ribbon with the name
  const scale = name.length <= 14 ? 2 : 1.5;
  const tw = name.length * 8 * scale;
  const rx0 = 52;
  const rx1 = Math.min(310, rx0 + tw + 26);
  cv.poly(
    [
      [rx0, 8],
      [rx1, 8],
      [rx1 - 6, 18],
      [rx1, 29],
      [rx0, 29],
    ],
    (_x, y) => mix(mix(theme.ribbon, [255, 255, 255], 0.25), mix(theme.ribbon, [0, 0, 0], 0.35), clamp01((y - 8) / 21)),
  );
  cv.line(rx0, 10, rx1 - 2, 10, 0.6, mix(theme.ribbon, [255, 230, 160], 0.6));
  cv.line(rx0, 27, rx1 - 2, 27, 0.6, mix(theme.ribbon, [255, 230, 160], 0.6));
  sc.text(rx0 + 12, 18.5 - 4 * scale, name, (_x, y) => mix([255, 246, 210], [232, 190, 90], clamp01((y - 10) / 16)), scale, [30, 16, 10]);
  // the portrait in a gilt frame, head and shoulders: the frame and its shadow end above
  // y 37, clear of the first line of words (from x 38, y 38)
  const big = bigSprite(portrait);
  const fw = 44;
  const fh = 34;
  const fx = 4;
  const fy = 0;
  cv.rrect(fx + 2, fy + 3, fw, fh, 6, [0, 0, 0]);
  cv.rrect(fx, fy, fw, fh, 6, (x, y) => mix([255, 226, 120], [150, 100, 30], clamp01((x - fx + (y - fy)) / 80)));
  cv.rrect(fx + 3, fy + 3, fw - 6, fh - 6, 4, (_x, y) => mix(mix(theme.bg[0], [255, 255, 255], 0.25), theme.bg[0], clamp01((y - fy) / fh)));
  const bx = Math.round(fx + fw / 2 - big.w / 2);
  const by = fy + 4;
  for (let y = 0; y < big.h && by + y < fy + fh - 3; y++)
    for (let x = 0; x < big.w; x++) {
      const k = big.alpha(x, y);
      if (k > 0 && bx + x >= fx + 3 && bx + x < fx + fw - 3) cv.blend(bx + x, by + y, big.get(x, y), k);
    }
  if (place) sc.text(306 - place.length * 8, 189, place, mix(theme.ribbon, [255, 236, 190], 0.7));
  return sc;
}
