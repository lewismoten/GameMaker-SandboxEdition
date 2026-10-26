// Joey's drawing for the Mail Bag's letter of the month (sections/mailBag.ts): Teddy driving THE
// CHEZ to a cheese moon, in crayon on a sheet torn out of a notebook and taped up. Everything is
// drawn the way an 8-year-old would: scribbled fills that miss the lines, wobbly outlines gone
// over twice, and hand-printed letters (one or two of them backwards). A seeded random keeps
// every wobble the same from one viewing to the next; an SVG filter gives the strokes a waxy grain.
import { mulberry32 } from '../../seededRandom';
import './joeyDrawing.css';
import { svgArt } from './svgArt';

type Pt = [number, number];

const r1 = (n: number) => Math.round(n * 10) / 10;

class Crayon {
  private rand = mulberry32(1994); // the same wobbles every time
  out = '';
  defs = '';
  private clips = 0;
  constructor(private id: string) {}

  jit(n: number): number {
    return (this.rand() - 0.5) * 2 * n;
  }

  /** A hand-drawn line through `pts`: broken into short pieces, each a little off. */
  line(pts: Pt[], color: string, width: number, o: { closed?: boolean; wob?: number; twice?: boolean } = {}): void {
    const wob = o.wob ?? 0.9;
    const path = o.closed ? [...pts, pts[0]] : pts;
    for (let pass = 0; pass < (o.twice === false ? 1 : 2); pass++) {
      let d = '';
      path.forEach(([x, y], i) => {
        if (i === 0) {
          d += `M${r1(x + this.jit(wob))} ${r1(y + this.jit(wob))}`;
          return;
        }
        const [px, py] = path[i - 1];
        const n = Math.max(1, Math.round(Math.hypot(x - px, y - py) / 7));
        for (let k = 1; k <= n; k++) d += `L${r1(px + ((x - px) * k) / n + this.jit(wob))} ${r1(py + ((y - py) * k) / n + this.jit(wob))}`;
      });
      this.out += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${pass ? width * 0.7 : width}" stroke-linecap="round" stroke-linejoin="round"${pass ? ' opacity="0.75"' : ''}/>`;
    }
  }

  /** Scribbled back and forth across a shape (`shape` is SVG markup), missing a bit here and there. */
  fill(shape: string, color: string, box: [number, number, number, number], step = 3.2, slant = 0.5): void {
    const id = `${this.id}c${this.clips++}`;
    this.defs += `<clipPath id="${id}">${shape}</clipPath>`;
    const [x, y, w, hh] = box;
    let d = `M${r1(x - 3)} ${r1(y)}`;
    for (let yy = y, right = true; yy < y + hh + step; yy += step, right = !right) {
      d += `L${r1((right ? x + w + 3 : x - 3) + this.jit(2.5))} ${r1(yy + step * slant + this.jit(0.8))}`;
    }
    this.out += `<g clip-path="url(#${id})"><path d="${d}" fill="none" stroke="${color}" stroke-width="${r1(step * 0.95)}" stroke-linejoin="round" opacity="0.9"/></g>`;
  }

  raw(markup: string): void {
    this.out += markup;
  }
}

const poly = (pts: Pt[]) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}"/>`;
const ring = (cx: number, cy: number, r: number, n = 14): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)] as Pt);

/** Printed letters on a 4 x 6 grid: strokes split by |, each a polyline of x y points. */
const GLYPH_STROKES: Record<string, string> = {
  A: '0 6,2 0,4 6|.8 3.8,3.2 3.8',
  B: '0 0,0 6|0 0,2.6 0,3.6 .8,3.6 2.2,2.6 3,0 3|2.6 3,3.9 3.8,3.9 5.2,2.8 6,0 6',
  C: '4 .9,3 0,1 .1,0 1.6,0 4.4,1 6,3 6,4 5.1',
  D: '0 0,0 6,2.2 6,4 4.4,4 1.6,2.2 0,0 0',
  E: '4 0,0 0,0 6,4 6|0 3,3 3',
  G: '4 .9,3 0,1 .1,0 1.6,0 4.4,1 6,3 6,4 4.9,4 3.4,2.3 3.4',
  H: '0 0,0 6|4 0,4 6|0 3,4 3',
  J: '1.6 0,4.4 0|3.4 0,3.4 4.8,2.5 6,1 6,.1 4.8',
  M: '0 6,0 0,2 3.4,4 0,4 6',
  N: '0 6,0 0,4 6,4 0',
  O: '2 0,.6 .6,0 3,.6 5.4,2 6,3.4 5.4,4 3,3.4 .6,2 0',
  T: '0 0,4 0|2 0,2 6',
  Y: '0 0,2 3|4 0,2 3,2 6',
  Z: '0 0,4 0,0 6,4 6',
  '+': '2 1.4,2 4.6|.4 3,3.6 3',
  '!': '2 0,2 4|2 5.6,2.1 5.9',
  '8': '2 3,.6 2.2,.6 .8,2 0,3.4 .8,3.4 2.2,2 3,.2 4,.2 5.3,2 6,3.8 5.3,3.8 4,2 3',
};
const glyph = (ch: string): Pt[][] => GLYPH_STROKES[ch].split('|').map((st) => st.split(',').map((xy) => xy.split(' ').map(Number) as Pt));

/**
 * Prints `text` from (x, y) at `size` (grid units to px), each letter its own crayon from
 * `colors`, a little up or down and askew. Letters at the indexes in `backwards` face the wrong way.
 */
function print(c: Crayon, text: string, x: number, y: number, size: number, colors: string[], backwards: number[] = []): void {
  let at = x;
  [...text].forEach((ch, i) => {
    if (ch === ' ') {
      at += size * 3.4;
      return;
    }
    const s = size * (1 + c.jit(0.1));
    const dy = c.jit(size * 0.5);
    const tilt = c.jit(0.12);
    const flip = backwards.includes(i);
    for (const stroke of glyph(ch)) {
      const pts = stroke.map(([gx, gy]): Pt => {
        const lx = (flip ? 4 - gx : gx) - 2;
        const ly = gy - 3;
        return [at + 2 * s + (lx * Math.cos(tilt) - ly * Math.sin(tilt)) * s, y + 3 * s + dy + (lx * Math.sin(tilt) + ly * Math.cos(tilt)) * s];
      });
      c.line(pts, colors[i % colors.length], size * 0.75, { wob: size * 0.12, twice: false });
    }
    at += s * 4 + size * 2.1;
  });
}

const RED = '#e2321f';
const DARK_RED = '#9c1c12';
const ORANGE = '#ef8a1d';
const CHARCOAL = '#3b3b3f';
const BLACK = '#1d1b1b';
const YELLOW = '#f6c916';
const GOLD = '#d99a06';
const SKY = '#6aa7e8';

/** THE CHEZ from the driver's side, kid-style, in grid units of 40 x 20 (k px each). */
function chez(c: Crayon, k: number): void {
  const u = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x * k, y * k]);
  const body = u([
    [6, 2],
    [18.5, 2],
    [36, 12.6],
    [36, 15.6],
    [4.8, 15.6],
  ]);
  const win = u([
    [9.6, 3.2],
    [18.2, 3.2],
    [26, 10.4],
    [10, 10.4],
  ]);
  c.fill(poly(body), RED, [4 * k, 1.5 * k, 33 * k, 15 * k], 2.6);
  c.fill(poly(body), '#d42a18', [4 * k, 1.5 * k, 33 * k, 15 * k], 3.4, -0.4);
  c.line(body, DARK_RED, 2.2, { closed: true });
  // the black roof, pressed on hard
  c.line(
    u([
      [6.2, 1.6],
      [18.4, 1.6],
    ]),
    BLACK,
    6.5,
  );
  c.line(
    u([
      [6.6, 2.4],
      [18.8, 2.4],
    ]),
    BLACK,
    3,
  );
  // the door window, Teddy in it
  c.raw(poly(win).replace('/>', ' fill="#fbf7ea"/>'));
  c.fill(poly(win), SKY, [9.6 * k, 3.2 * k, 16.4 * k, 7.2 * k], 3, 0.3);
  c.line(win, BLACK, 1.8, { closed: true });
  c.raw(`<g transform="translate(${15 * k} ${7.6 * k}) scale(1.35)">`);
  teddy(c, 0, 0);
  c.raw('</g>');
  // the steering wheel in front of him, and a paw on it
  c.line(ring(22.4 * k, 8.2 * k, 1.7 * k, 9), BLACK, 2.2, { closed: true, twice: false });
  c.line(ring(21.1 * k, 8.8 * k, 0.8 * k, 7), ORANGE, 3.4, { closed: true, twice: false });
  // the door and its handle
  c.line(
    u([
      [10, 10.4],
      [10, 15.4],
      [26.4, 15.4],
      [26.4, 10.6],
    ]),
    DARK_RED,
    1.4,
    { twice: false },
  );
  c.line(
    u([
      [22.5, 11.3],
      [24.5, 11.3],
    ]),
    BLACK,
    2,
    { twice: false },
  );
  // two charcoal stripes with red between them and a white pinstripe, stepping up behind the door
  for (const [dy, color, w] of [
    [-0.9, '#ffffff', 1.6],
    [0, '#2c2c30', 4.4],
    [1.9, '#2c2c30', 4.4],
  ] as const) {
    c.line(
      u([
        [35.6, 12.8 + dy],
        [10.6, 12.8 + dy],
        [9.2, 11.8 + dy],
        [8.4, 8.4 + dy],
        [7.2, 7.4 + dy],
        [5.4, 7.4 + dy],
      ]),
      color,
      w,
      { twice: false },
    );
  }
  // square bumpers
  for (const x of [3.6, 35.8])
    c.raw(`<rect x="${x * k}" y="${13.2 * k}" width="${1.7 * k}" height="${2.6 * k}" fill="${BLACK}" transform="rotate(${c.jit(4)} ${x * k} ${14 * k})"/>`);
  // white wheels on black tires
  for (const x of [10.2, 29.8]) {
    c.raw(`<circle cx="${x * k}" cy="${16.6 * k}" r="${3 * k}" fill="#fff"/>`);
    c.line(ring(x * k, 16.6 * k, 3 * k), BLACK, 3.2, { closed: true });
    c.line(ring(x * k, 16.6 * k, 0.8 * k, 7), '#9a9a9a', 2.2, { closed: true, twice: false });
  }
}

/** Teddy, the corgi, at (x, y): orange and white, both big ears up and the same size, grinning. */
function teddy(c: Crayon, x: number, y: number): void {
  const ear = (side: 1 | -1): Pt[] => [
    [x + side * 2.5, y - 7],
    [x + side * 9.5, y - 21],
    [x + side * 11, y - 4],
  ];
  for (const side of [-1, 1] as const) {
    c.fill(poly(ear(side)), ORANGE, [x - 12, y - 22, 24, 19], 2.4);
    c.line(ear(side), DARK_RED, 1.3, { closed: true, twice: false });
    const inner = ear(side).map(([ex, ey]): Pt => [x + (ex - x) * 0.6 + side * 2.6, y + (ey - y) * 0.6 - 3.2]);
    c.fill(poly(inner), '#f4a3a8', [x - 12, y - 22, 24, 19], 2);
  }
  const head = ring(x, y, 9.5, 12).map(([hx, hy]): Pt => [hx, hy + (hy > y ? 1.5 : 0)]);
  c.fill(poly(head), ORANGE, [x - 10, y - 10, 20, 22], 2.4);
  // the white blaze and muzzle
  c.fill(
    poly([
      [x - 1.6, y - 9],
      [x + 1.6, y - 9],
      [x + 3.5, y + 1],
      [x + 7, y + 6],
      [x, y + 10.5],
      [x - 7, y + 6],
      [x - 3.5, y + 1],
    ]),
    '#ffffff',
    [x - 8, y - 10, 16, 21],
    2,
  );
  c.line(head, DARK_RED, 1.3, { closed: true, twice: false });
  c.raw(`<circle cx="${x - 4.2}" cy="${y - 1.5}" r="1.6" fill="${BLACK}"/><circle cx="${x + 4.2}" cy="${y - 1.7}" r="1.6" fill="${BLACK}"/>`);
  c.raw(`<ellipse cx="${x}" cy="${y + 3.2}" rx="2.3" ry="1.6" fill="${BLACK}"/>`);
  c.line(
    [
      [x - 4.5, y + 5.2],
      [x - 2, y + 7.6],
      [x, y + 6.2],
      [x + 2, y + 7.6],
      [x + 4.5, y + 5.2],
    ],
    BLACK,
    1.2,
    { wob: 0.3, twice: false },
  );
  c.raw(`<path d="M${x - 1.4} ${y + 7.4}q1.4 4 2.8 0z" fill="#f05a7e"/>`);
}

function star(c: Crayon, x: number, y: number, r: number): void {
  const pts = Array.from({ length: 10 }, (_, i): Pt => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return [x + rr * Math.cos(a), y + rr * Math.sin(a)];
  });
  c.fill(poly(pts), YELLOW, [x - r, y - r, 2 * r, 2 * r], 2);
  c.line(pts, GOLD, 1.3, { closed: true, wob: 0.5, twice: false });
}

let drawn = 0;

/** Joey's drawing, as an SVG labelled `alt`. */
export function joeyDrawing(alt: string): Element {
  const id = `joey${drawn++}`;
  const c = new Crayon(id);
  // the sheet, torn out of a spiral notebook along its left edge
  const torn: Pt[] = [];
  for (let y = 230; y >= 6; y -= 5) torn.push([7 + c.jit(2.2) + (y % 10 ? 1.5 : -1), y]);
  const paper = `<polygon points="${[...torn, [266, 5] as Pt, [267, 231] as Pt].map((p) => p.map(r1).join(',')).join(' ')}" fill="#fbf7ea"/>`;

  // the moon is cheese
  const moon = ring(204, 98, 40, 18);
  c.fill(poly(moon), YELLOW, [162, 56, 84, 84], 3.4);
  c.line(moon, GOLD, 2.2, { closed: true });
  for (const [hx, hy, hr] of [
    [190, 78, 7],
    [218, 92, 9],
    [196, 112, 5.5],
    [222, 120, 4.5],
    [180, 98, 3.5],
  ]) {
    const hole = ring(hx, hy, hr, 9);
    c.fill(poly(hole), '#e7a90c', [hx - hr, hy - hr, 2 * hr, 2 * hr], 2.2);
    c.line(hole, '#b57a05', 1.4, { closed: true, twice: false });
  }
  star(c, 30, 76, 7);
  star(c, 120, 70, 5.5);
  star(c, 145, 104, 4.5);
  star(c, 252, 30, 5);
  star(c, 74, 112, 4);
  // the swoosh behind the car
  for (const [y, color] of [
    [176, '#4a7fd6'],
    [189, '#4a7fd6'],
    [202, '#8c8c96'],
  ] as const)
    c.line(
      [
        [13, y + 8],
        [26, y + 2],
        [40, y - 3],
      ],
      color,
      2.4,
      { twice: false },
    );

  c.raw('<g transform="translate(44 112) rotate(-13)">');
  chez(c, 4.3);
  c.raw('</g>');

  print(c, 'TEDDY + THE CHEZ', 20, 14, 2.4, ['#2f56c9', '#8b2fb8', '#1f8a3c', RED], [3]);
  print(c, 'GO TO THE MOON!', 26, 40, 2.4, ['#8b2fb8', '#1f8a3c', RED, '#2f56c9'], [13]);
  print(c, 'BY JOEY AGE 8', 154, 208, 1.3, [CHARCOAL]);

  // a strip of tape across the top
  const tape = `<polygon points="110,-3 112,0 110,3 112,6 110,9 112,12 110,15 162,15 160,12 162,9 160,6 162,3 160,0 162,-3" fill="rgba(236,229,184,0.75)" stroke="rgba(160,150,110,0.35)" stroke-width="0.6" transform="rotate(3 136 8)"/>`;

  return svgArt(
    '0 -4 272 240',
    `<defs>${c.defs}<filter id="${id}w" x="-5%" y="-5%" width="110%" height="110%">` +
      '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="w"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="g"/>' +
      '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.2 2.3" result="m"/>' +
      '<feComposite in="d" in2="m" operator="in"/></filter></defs>' +
      `${paper}<g filter="url(#${id}w)">${c.out}</g>${tape}`,
    alt,
    'joey-drawing',
  );
}
