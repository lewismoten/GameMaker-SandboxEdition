// Hint book answers hidden the way 90s hint books (and Daniel C. Wilson's "red reveal",
// danielcwilson.com/blog/2018/02/optical-fun-red-reveal/) hid them. Through red film only
// a color's red gets through, so anything printed with full red (R = 255) turns the film's
// own red, just like the white paper, and vanishes; the answer is printed in a pale cyan,
// which has little red, so it alone turns dark.
//
// Without the film the answer has to be hard to pick out, so each word is drawn on a canvas
// in three layers, all from a seed made of the word so a page always prints the same:
//   1. decoy strokes: short pale pink and lilac pen strokes as thick as the letters' and as
//      light as the cyan, some under the letters and some over them, so the eye cannot tell
//      a letter stroke from noise by its weight, lightness or shape;
//   2. the letters in pale cyan, about as light as the decoys;
//   3. dense crossing red lines over everything, cutting every letter into pieces.
// Every decoy and line has R = 255, so through the film only the letters are left.
import { h } from '../../editor/core/ui';
import type { HintSketch } from './types';

/** The answer's ink on screen: a very pale cyan, hardly different from the white decoys. */
export const CYAN_INK = 'rgb(204,250,255)';
/** The answer's ink on paper: a stronger cyan, so real red cellophane over a print shows it dark enough. */
export const PRINT_CYAN_INK = 'rgb(160,240,255)';
/** The red lines over everything, saturated to light; every one has full red. */
export const LINE_INKS = ['rgb(255,0,0)', 'rgb(255,50,50)', 'rgb(255,90,110)', 'rgb(255,30,80)'];
/** The decoy strokes: pale pinks and lilacs about as light as the cyan; full red. */
export const DECOY_INKS = ['rgb(255,255,255)', 'rgb(255,252,246)', 'rgb(255,248,255)'];
/** The paper under it all, a pale pink. */
export const FIELD_INK = 'rgb(255,196,202)';

const rgb = (color: string) => (color.match(/\d+/g) ?? []).map(Number);

/** Rec. 601 luma of an "rgb(r,g,b)" color, 0-255. */
export function luma(color: string): number {
  const [r, g, b] = rgb(color);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** How light a color looks through pure red film, 0-255: only its red gets through. */
export function throughRedFilm(color: string): number {
  return rgb(color)[0];
}

/** A small seeded random number generator (mulberry32), so a word always gets the same noise. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed from a string. */
export function hashText(text: string): number {
  let x = 2166136261;
  for (let i = 0; i < text.length; i++) x = Math.imul(x ^ text.charCodeAt(i), 16777619);
  return x >>> 0;
}

/** The canvas's font size in pixels: big enough to print sharply at a few times its size on screen. */
const PX = 64;
/** Line height, in ems (the word canvases stack into lines this tall). */
const LINE = 1.4;
const FONT = `700 ${PX}px Arial, Helvetica, sans-serif`;
/** Bold Arial's stroke is about this many ems thick. */
const STROKE = 0.15;

/** Draws `count` short pen strokes, each a gentle curve, from `inks`. */
function strokes(
  c: CanvasRenderingContext2D,
  rnd: () => number,
  w: number,
  hh: number,
  count: number,
  inks: string[],
  width: () => number,
  len: () => number,
): void {
  c.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    // start anywhere up to a stroke's length outside, so the noise is as thick at the edges
    const l = len();
    const x = -l + rnd() * (w + 2 * l);
    const y = -l + rnd() * (hh + 2 * l);
    const a = rnd() * Math.PI * 2;
    const bend = (rnd() - 0.5) * l * 0.8;
    const ex = x + Math.cos(a) * l;
    const ey = y + Math.sin(a) * l;
    c.strokeStyle = inks[Math.floor(rnd() * inks.length)];
    c.lineWidth = width();
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo((x + ex) / 2 - Math.sin(a) * bend, (y + ey) / 2 + Math.cos(a) * bend, ex, ey);
    c.stroke();
  }
}

/**
 * The three layers around whatever `ink` draws (see the top of this file): decoy strokes as
 * thick as `stroke()` under and over it, then `lines` red lines per square em across everything.
 */
function camouflage(c: CanvasRenderingContext2D, rnd: () => number, w: number, hh: number, stroke: () => number, ink: () => void, lines = 20): void {
  const area = ((w + PX) * (hh + PX)) / (PX * PX);
  c.fillStyle = FIELD_INK;
  c.fillRect(0, 0, w, hh);
  const decoyLen = () => PX * (0.2 + rnd() * 0.45);
  // 1. decoys under the ink
  strokes(c, rnd, w, hh, Math.round(area * 12), DECOY_INKS, stroke, decoyLen);
  // 2. the answer itself
  ink();
  // decoys over it, breaking it up
  strokes(c, rnd, w, hh, Math.round(area * 0.6), DECOY_INKS, stroke, decoyLen);
  // 3. the red lines: long and thin, crossing every which way
  strokes(
    c,
    rnd,
    w,
    hh,
    Math.round(area * lines),
    LINE_INKS,
    () => PX * (0.03 + rnd() * 0.03),
    () => PX * (0.4 + rnd() * 1.2),
  );
}

/** One word (with the space after it) hidden in noise, as a canvas `PX` pixels to the em. */
export function hiddenWord(word: string, seed = hashText(word), ink = CYAN_INK): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const c0 = canvas.getContext('2d');
  if (!c0) return canvas;
  c0.font = FONT;
  const pad = PX * 0.3;
  const w = Math.ceil(c0.measureText(word).width + pad);
  const hh = Math.ceil(PX * LINE);
  canvas.width = w;
  canvas.height = hh;
  const c = canvas.getContext('2d')!;
  const rnd = seeded(seed);
  camouflage(c, rnd, w, hh, () => PX * STROKE * (0.8 + rnd() * 0.4), () => {
    c.font = FONT;
    c.textBaseline = 'middle';
    c.fillStyle = ink;
    c.fillText(word, pad / 3, hh / 2 + PX * 0.04);
  });
  return canvas;
}

/** An answer hidden among red lines: each word is its own picture so the answer wraps like text
 * (one picture for the screen, one in a stronger cyan for printing). */
export function redCode(text: string): HTMLElement {
  const words = text.split(/\s+/).filter(Boolean);
  const base = hashText(text);
  const picture = (word: string, seed: number, ink: string, cls: string) => {
    const cv = hiddenWord(word, seed, ink);
    const img = h('img', { class: `rf-word ${cls}`, alt: '', draggable: false, src: cv.toDataURL('image/png') });
    img.style.width = `${cv.width / PX}em`;
    img.style.height = `${LINE}em`;
    return img;
  };
  const box = h(
    'span',
    { class: 'rf-code', role: 'img', 'aria-label': 'Hidden answer: lay the red film over it' },
    ...words.flatMap((word, i) => [picture(word, base + i * 7919, CYAN_INK, 'rf-screen'), picture(word, base + i * 7919, PRINT_CYAN_INK, 'rf-print')]),
  );
  // the box is as wide as the column, so the space after the last word is filled with the
  // same noise (no letters in it) and every answer box looks alike, whatever its length
  const tile = filler();
  if (tile) {
    box.style.backgroundImage = `url(${tile.src})`;
    box.style.backgroundSize = `${tile.width / PX}em ${LINE}em`;
  }
  return box;
}

let fillerTile: { src: string; width: number } | undefined;
/** A strip of the answers' noise with nothing hidden in it (its "letters" are a decoy ink). */
function filler(): { src: string; width: number } | undefined {
  if (fillerTile || typeof document === 'undefined') return fillerTile;
  const cv = hiddenWord('MWMWMWMW', 13, DECOY_INKS[1]);
  if (!cv.width) return undefined;
  return (fillerTile = { src: cv.toDataURL('image/png'), width: cv.width });
}

/** A sketch cell's size on the canvas, in pixels. */
const CELL = PX * 0.75;
/** How wide a sketch cell is shown, in ems of the answer's text. */
const CELL_EM = 1.5;
/** A sketch's pen: about as thick as the decoys, so neither gives the other away. */
const PEN = CELL * 0.2;
const LABEL_FONT = `700 ${CELL * 0.7}px Arial, Helvetica, sans-serif`;

/** What each character of a sketch's rows draws in its cell. */
export const SKETCH_GLYPHS: Record<string, string> = {
  ' ': 'nothing',
  '.': 'a dot: a path or floor',
  '#': 'a filled block: wall, rock or hedge',
  '=': 'an outlined block: brick, box or shelf',
  ':': 'a dashed block: a faint seam, or rock that is not rock',
  X: 'the spot',
  '@': 'you, or where to stand',
  T: 'a tree',
  o: 'something round',
  '~': 'water',
  '>': 'arrow right',
  '<': 'arrow left',
  v: 'arrow down',
  '^': 'arrow up',
  '-': 'a line across',
  '|': 'a line up and down',
};

/** Characters in a sketch that SKETCH_GLYPHS does not know (none, for a good sketch). */
export function unknownGlyphs(sketch: HintSketch): string[] {
  return [...new Set(sketch.rows.join(''))].filter((ch) => !(ch in SKETCH_GLYPHS));
}

/** Draws one sketch cell's glyph with its top left at (x, y). */
function glyph(c: CanvasRenderingContext2D, ch: string, x: number, y: number): void {
  const s = CELL;
  const m = PEN / 2 + 1;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const line = (pts: number[][]) => {
    c.beginPath();
    pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
    c.stroke();
  };
  const arrow = (dx: number, dy: number) => {
    const r = s * 0.36;
    const tip = [cx + dx * r, cy + dy * r];
    line([[cx - dx * r, cy - dy * r], tip]);
    line([[tip[0] - dx * r * 0.7 - dy * r * 0.6, tip[1] - dy * r * 0.7 - dx * r * 0.6], tip, [tip[0] - dx * r * 0.7 + dy * r * 0.6, tip[1] - dy * r * 0.7 + dx * r * 0.6]]);
  };
  switch (ch) {
    case '.':
      c.beginPath();
      c.arc(cx, cy, s * 0.1, 0, Math.PI * 2);
      c.fill();
      break;
    case '#':
      c.fillRect(x + 1, y + 1, s - 2, s - 2);
      break;
    case '=':
      c.strokeRect(x + m, y + m, s - 2 * m, s - 2 * m);
      break;
    case ':':
      c.setLineDash([s * 0.18, s * 0.14]);
      c.strokeRect(x + m, y + m, s - 2 * m, s - 2 * m);
      c.setLineDash([]);
      break;
    case 'X':
      c.lineWidth = PEN * 1.5;
      line([[x + s * 0.12, y + s * 0.12], [x + s * 0.88, y + s * 0.88]]);
      line([[x + s * 0.88, y + s * 0.12], [x + s * 0.12, y + s * 0.88]]);
      c.lineWidth = PEN;
      break;
    case '@':
      c.beginPath();
      c.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
      c.fill();
      break;
    case 'T':
      c.beginPath();
      c.moveTo(cx, y + s * 0.06);
      c.lineTo(x + s * 0.88, y + s * 0.78);
      c.lineTo(x + s * 0.12, y + s * 0.78);
      c.closePath();
      c.fill();
      c.fillRect(cx - s * 0.08, y + s * 0.7, s * 0.16, s * 0.26);
      break;
    case 'o':
      c.beginPath();
      c.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
      c.stroke();
      break;
    case '~':
      c.beginPath();
      c.moveTo(x, cy);
      c.bezierCurveTo(x + s * 0.25, cy - s * 0.3, x + s * 0.25, cy + s * 0.3, cx, cy);
      c.bezierCurveTo(x + s * 0.75, cy - s * 0.3, x + s * 0.75, cy + s * 0.3, x + s, cy);
      c.stroke();
      break;
    case '>':
      arrow(1, 0);
      break;
    case '<':
      arrow(-1, 0);
      break;
    case 'v':
      arrow(0, 1);
      break;
    case '^':
      arrow(0, -1);
      break;
    case '-':
      line([[x, cy], [x + s, cy]]);
      break;
    case '|':
      line([[cx, y], [cx, y + s]]);
      break;
  }
}

/** A sketch hidden in noise, as a canvas `CELL` pixels to the cell. */
export function hiddenSketch(sketch: HintSketch, seed = hashText(sketch.rows.join('/')), ink = CYAN_INK): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const c0 = canvas.getContext('2d');
  if (!c0) return canvas;
  c0.font = LABEL_FONT;
  const pad = CELL * 0.25;
  const cols = Math.max(...sketch.rows.map((r) => r.length));
  let w = cols * CELL;
  for (const l of sketch.labels ?? []) w = Math.max(w, l.x * CELL + c0.measureText(l.text).width);
  w = Math.ceil(w + 2 * pad);
  const hh = Math.ceil(sketch.rows.length * CELL + 2 * pad);
  canvas.width = w;
  canvas.height = hh;
  const c = canvas.getContext('2d')!;
  const rnd = seeded(seed);
  camouflage(c, rnd, w, hh, () => PEN * (0.8 + rnd() * 0.5), () => {
    c.fillStyle = ink;
    c.strokeStyle = ink;
    c.lineWidth = PEN;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    sketch.rows.forEach((row, j) => [...row].forEach((ch, i) => glyph(c, ch, pad + i * CELL, pad + j * CELL)));
    c.font = LABEL_FONT;
    c.textBaseline = 'middle';
    for (const l of sketch.labels ?? []) c.fillText(l.text, pad + l.x * CELL, pad + (l.y + 0.55) * CELL);
  }, 16);
  return canvas;
}

/** A drawing hidden among red lines, like an answer (a picture for the screen and one for printing). */
export function redSketch(sketch: HintSketch): HTMLElement {
  const seed = hashText(sketch.rows.join('/'));
  const picture = (ink: string, cls: string) => {
    const cv = hiddenSketch(sketch, seed, ink);
    const img = h('img', { class: `rf-word rf-sketch ${cls}`, alt: '', draggable: false, src: cv.toDataURL('image/png') });
    img.style.width = `${(cv.width / CELL) * CELL_EM}em`;
    img.style.aspectRatio = `${cv.width} / ${cv.height}`;
    return img;
  };
  return h(
    'span',
    { class: 'rf-code rf-sketch-box', role: 'img', 'aria-label': 'Hidden drawing: lay the red film over it' },
    picture(CYAN_INK, 'rf-screen'),
    picture(PRINT_CYAN_INK, 'rf-print'),
  );
}

/**
 * How the red film is shown on screen: an SVG filter for `backdrop-filter` that keeps only the
 * red channel and stretches its light end, the way an eye looking through red film soon sees
 * the red as white and anything a little darker as dark. (Where it isn't supported the film
 * just multiplies by red.)
 */
export const RED_VIEW_ID = 'rf-red-view';

function ensureRedView(): void {
  if (document.getElementById(RED_VIEW_ID)) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const filter = document.createElementNS(ns, 'filter');
  filter.id = RED_VIEW_ID;
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  const m = document.createElementNS(ns, 'feColorMatrix');
  m.setAttribute('type', 'matrix');
  m.setAttribute('values', `${RED_VIEW_GAIN} 0 0 0 ${1 - RED_VIEW_GAIN}  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0`);
  filter.append(m);
  svg.append(filter);
  document.body.append(svg);
}

/** How much the red film view stretches the red channel (1 = plain red film). */
export const RED_VIEW_GAIN = 4;

/** Red through the on-screen film for a color, 0-255 (see ensureRedView). */
export function throughRedView(color: string): number {
  return Math.max(0, Math.min(255, Math.round(RED_VIEW_GAIN * throughRedFilm(color) + (1 - RED_VIEW_GAIN) * 255)));
}

/**
 * A circle of red film that follows the pointer over a page with hidden answers, like
 * holding the hint book's red lens up to it.
 */
export class RedLens {
  private el = h('div', { class: 'rf-lens', hidden: true, 'aria-hidden': 'true' });

  mount(parent: HTMLElement): void {
    ensureRedView();
    parent.append(this.el);
  }

  /** Follows the pointer over `area` while `active()` says this page has answers to hide. */
  follow(area: HTMLElement, active: () => boolean): void {
    const move = (e: PointerEvent) => {
      const over = active() && (e.target as Element | null)?.closest?.('.pp-sheet');
      if (!over) return this.hide();
      this.el.hidden = false;
      this.el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerdown', move);
    area.addEventListener('pointerleave', () => this.hide());
    area.addEventListener('scroll', () => this.hide(), { passive: true });
  }

  hide(): void {
    this.el.hidden = true;
  }
}

/** The draggable red cellophane. */
export class RedFilm {
  private el = h(
    'div',
    { class: 'rf-film', hidden: true, role: 'img', 'aria-label': 'Red film (drag it over the answers)' },
    h('span', { class: 'rf-film-label' }, 'RED FILM · drag me'),
  );
  private x = 0;
  private y = 0;

  constructor() {
    let start: { px: number; py: number; x: number; y: number } | undefined;
    this.el.addEventListener('pointerdown', (e) => {
      start = { px: e.clientX, py: e.clientY, x: this.x, y: this.y };
      this.el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    this.el.addEventListener('pointermove', (e) => {
      if (!start) return;
      this.place(start.x + e.clientX - start.px, start.y + e.clientY - start.py);
    });
    const end = () => (start = undefined);
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', end);
  }

  mount(parent: HTMLElement): void {
    ensureRedView();
    parent.append(this.el);
  }

  private place(x: number, y: number): void {
    const w = this.el.offsetWidth || 300;
    const hh = this.el.offsetHeight || 180;
    this.x = Math.max(-w / 2, Math.min(window.innerWidth - w / 2, x));
    this.y = Math.max(0, Math.min(window.innerHeight - 40, y));
    this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(-2deg)`;
    void hh;
  }

  toggle(): void {
    if (this.el.hidden) this.show();
    else this.hide();
  }

  show(): void {
    this.el.hidden = false;
    const w = this.el.offsetWidth;
    this.place((window.innerWidth - w) / 2, window.innerHeight * 0.35);
  }

  hide(): void {
    this.el.hidden = true;
  }
}
