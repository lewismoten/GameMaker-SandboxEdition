// Hidden Teleport-A-Phone scenes, drawn in code with OpenAI Codex (GPT-6), directed by Lewis Moten.
// Square 0.5 mm engraving pixels, merged with the kit's bitmap helper; no people, vehicles or glue-face decoration.
import type { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { arcText, lineText, mergeRuns, textPixels } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPixels';
import { LaserSheet, type Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';

type Ink = (x: number, y: number) => boolean;
type Box = readonly [number, number, number, number];
const PIXEL = 0.5;
const rect = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
const inBox = (x: number, y: number, b: Box) => x >= b[0] && y >= b[1] && x <= b[2] && y <= b[3];

// The roof, divided glazing, handset and raised platform echo the game's pixel-built teleporter.
const BOOTH = [
  '...###########...',
  '..#############..',
  '..##.........##..',
  '..##.#######.##..',
  '..##.........##..',
  '..#############..',
  '..##....#....##..',
  '..##....#....##..',
  '..##....#....##..',
  '..##....#.##.##..',
  '..##....#.#..##..',
  '..##....#.#..##..',
  '..#########..##..',
  '..##....#.##.##..',
  '..##....#....##..',
  '..##....#....##..',
  '..#############..',
  '..##.##.##.####..',
  '..#############..',
  '.###############.',
  '.................',
  '#################',
  '#################',
];
const SMALL_BOOTH = [
  '.#########.',
  '###########',
  '.#.......#.',
  '.#.##.##.#.',
  '.#.##.##.#.',
  '.#.......#.',
  '.#########.',
  '.#.......#.',
  '.#########.',
  '...........',
  '###########',
];
const HOUSE = [
  '......#...............#.........',
  '.....###.............###........',
  '....#####...........#####.......',
  '...#######.........#######......',
  '..#########.......#########.....',
  '.###########.....###########....',
  '..#.......#.......#.......#.....',
  '..#.##.##.#.......#.##.##.#.....',
  '..#.##.##.#.......#.##.##.#.....',
  '..#.......#.......#.......#.....',
  '..####.####.......####.####.....',
  '..####.####.......####.####.....',
  '################################',
];
const SMALL_HOUSE = [
  '......#......',
  '.....###.....',
  '....#####....',
  '...#######...',
  '..#########..',
  '..#.......#..',
  '..#.##.##.#..',
  '..####.####..',
  '..####.####..',
];
const MOON = [
  '....#####....',
  '...#######...',
  '..#########..',
  '.###..######.',
  '####..#######',
  '#############',
  '#######...###',
  '#######...###',
  '###..########',
  '.##..#######.',
  '..#########..',
  '...#######...',
  '....#####....',
];
const stamp = (rows: readonly string[], x: number, y: number, scale = 0.5) =>
  rows[Math.floor(y / scale + rows.length / 2)]?.[Math.floor(x / scale + rows[0].length / 2)] === '#';
const cross = (x: number, y: number, size = 1.5) => (Math.abs(x) < 0.4 && Math.abs(y) < size / 2) || (Math.abs(y) < 0.4 && Math.abs(x) < size / 2);

/** Keep whole square pixels inside the unglued region; never clip a pixel into a thin sliver. */
function scene(p: Part, label: string, cx: number, cy: number, r0: number, r1: number, ink: Ink, blank: Box[] = []) {
  const n = Math.ceil(r1 / PIXEL);
  const shapes = mergeRuns({
    w: 2 * n,
    h: 2 * n,
    on: (i, j) => {
      const x = (i - n + 0.5) * PIXEL,
        y = (j - n + 0.5) * PIXEL;
      const near = Math.hypot(Math.max(0, Math.abs(x) - PIXEL / 2), Math.max(0, Math.abs(y) - PIXEL / 2));
      const far = Math.hypot(Math.abs(x) + PIXEL / 2, Math.abs(y) + PIXEL / 2);
      return near >= r0 && far <= r1 && !blank.some((b) => inBox(x, y, b)) && ink(x, y);
    },
  }).map(([x, y, w, h]) => rect(cx + (x - n) * PIXEL, cy + (y - n) * PIXEL, w * PIXEL, h * PIXEL));
  p.engrave(label, shapes);
}

function idSpace(id: string, y: number): Box {
  const half = (textPixels('micro', id) * PIXEL) / 2;
  return [-half - 1.5, y - 2.75, half + 1.5, y + 2.75];
}

/** Narrowest ring: tangent-aligned pixel twinkles and comet trails around the entire 4 mm rim. */
export function starfield(p: Part, c: number, inner: number, outer: number) {
  const radius = (inner + outer) / 2 + 0.2;
  const shapes: Pt[][] = [];
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    const rows = i % 3 ? ['.#.', '###'] : ['.....#', '######'];
    for (const [x, y, w, h] of mergeRuns({ w: rows[0].length, h: rows.length, on: (x, y) => rows[y][x] === '#' })) {
      shapes.push(
        rect((x - rows[0].length / 2) * PIXEL, (y - 1) * PIXEL, w * PIXEL, h * PIXEL).map(([u, v]): Pt => [
          c + (radius + v) * Math.cos(a) - u * Math.sin(a),
          c + (radius + v) * Math.sin(a) + u * Math.cos(a),
        ]),
      );
    }
  }
  p.engrave('hidden starfield and comet band', shapes);
}

/** Panorama panels follow the ring, upright when their section is turned toward the viewer. */
export function ringScene(p: Part, c: number, inner: number, outer: number, theme: 'suburb' | 'moon' | 'teleporter', id: string) {
  const lo = inner + 1.65,
    hi = outer - 1.25;
  const mid = (lo + hi) / 2;
  const large = hi - lo > 12;
  const count = theme === 'suburb' ? 8 : theme === 'moon' ? 10 : 8;
  const idY = -mid;
  scene(
    p,
    `hidden ${theme} panorama`,
    c,
    c,
    lo,
    hi,
    (x, y) => {
      const r = Math.hypot(x, y);
      const step = (2 * Math.PI) / count;
      const angle = Math.atan2(y, x) + (count === 8 ? step / 2 : 0);
      const a = angle - Math.round(angle / step) * step;
      const u = Math.sin(a) * mid,
        v = r - mid;
      if (theme === 'suburb') {
        const houses = stamp(hi - lo < 6.5 ? SMALL_HOUSE : HOUSE, u, v + 0.3, 0.5);
        const verge = hi - lo < 6.5 ? 1.75 : 3.25;
        const road = v > verge && v < verge + 0.55;
        const stars = hi - lo < 6.5 ? cross(u + 5.5, v + 1.5, 1.5) || cross(u - 5.5, v + 1.5, 1.5) : cross(u + 7, v + 3, 1.5) || cross(u - 6, v + 3, 1.5);
        return houses || road || stars;
      }
      if (theme === 'moon') {
        const moon = stamp(MOON, u, v, 0.5);
        const stars = cross(u - 5, v + 1.5, 1.5) || cross(u + 5, v - 1.5, 1.5);
        // Two terraces of lunar terrain on the wider hidden top face.
        const ground = hi - lo > 9 && ((v > 4 && v < 4.6) || (v > 5.4 && v < 6 && Math.abs(u) < 4));
        return moon || stars || ground;
      }
      const booth = stamp(large ? BOOTH : SMALL_BOOTH, u, v, large ? 0.55 : 0.5);
      const beam =
        Math.abs(u) > (large ? 6 : 3.5) &&
        Math.abs(u) < (large ? 10 : (mid * step) / 2 - 1.5) &&
        Math.abs(v - Math.round(v / 1.8) * 1.8) < 0.3 &&
        Math.abs(v) < (large ? 6 : 3);
      return booth || beam || cross(u - (large ? 9 : 6), v + 2, 1.5);
    },
    [idSpace(id, idY)],
  );
  p.text(id, 'micro', c, c + idY, PIXEL);
}

/** Dense traces and nodes, with the right-hand notch left clear on collars and washers. */
export function circuitBand(p: Part, c: number, inner: number, outer: number, id: string, variant = 0, notch = true) {
  const lo = inner + 1.65,
    hi = outer - 1.25,
    mid = (lo + hi) / 2;
  scene(
    p,
    'hidden circuit and star band',
    c,
    c,
    lo,
    hi,
    (x, y) => {
      if (notch && x > 0 && Math.abs(y) < 5.5) return false;
      const r = Math.hypot(x, y),
        a = Math.atan2(y, x);
      const step = Math.PI / 6;
      const local = a - Math.round(a / step) * step;
      const u = local * mid,
        v = r - mid;
      const wide = hi - lo > 5;
      const trace = Math.abs(v) < 0.4 && Math.abs(u) > (wide ? 1.5 : 1) && Math.abs(u) < (mid * step) / 2 - 0.7;
      const node = wide ? Math.abs(u) < 1.5 && Math.abs(v) < 1.5 && (Math.abs(u) > 0.65 || Math.abs(v) > 0.65) : Math.abs(u) < 0.65 && Math.abs(v) < 0.65;
      const branch = Math.abs(u - 3) < 0.4 && v > (wide ? -2.5 : 0) && v < 1.1;
      const rail = wide && Math.abs(Math.abs(v) - 2.5) < 0.4 && Math.abs(u) > 3 && Math.abs(u) < (mid * step) / 2 - 1;
      const spark = (Math.round(a / step) + variant) % 3 === 0 && cross(u, v, 2.5);
      return trace || node || branch || spark || rail;
    },
    [idSpace(id, -mid)],
  );
  p.text(id, 'micro', c, c - mid, PIXEL);
}

export function hollowTeleporter(p: Part, c: number, inner: number, outer: number) {
  const title = 'TELEPORT-A-PHONE';
  scene(
    p,
    'hidden Teleport-A-Phone and radiating beams',
    c,
    c,
    inner + 1,
    outer - 1,
    (x, y) => {
      const booth = stamp(BOOTH, x, y - 28, 0.6);
      const r = Math.hypot(x, y),
        a = Math.atan2(y, x);
      const ray = Math.abs(Math.sin(a * 16)) * r < 6.4 && r > inner + 3 && r < outer - 2;
      const pulse = (r > 24 && r < 24.7) || (r > 33.5 && r < 34.2);
      const stars = cross(x + 28, y, 3.5) || cross(x - 28, y, 3.5) || cross(x + 21, y + 18, 2.5) || cross(x - 21, y + 18, 2.5);
      return booth || ((ray || pulse) && !(Math.abs(x) < 7 && y > 18)) || stars;
    },
    [idSpace(title, -28)],
  );
  p.text(title, 'micro', c, c - 28, PIXEL);
}

export function floorReveal(p: Part, c: number) {
  scene(
    p,
    'hidden phone booth arrival',
    c,
    c,
    0,
    10.5,
    (x, y) =>
      stamp(BOOTH, x, y + 2, 0.5) || cross(x - 7, y + 3, 2.5) || cross(x + 7, y + 3, 2.5) || (Math.abs(x) > 6 && Math.abs(x) < 9 && Math.abs(y + 1) < 0.3),
    [idSpace('A1', 7.5)],
  );
  p.text('A1', 'micro', c, c + 7.5, PIXEL);
}

/** A cratered moon surrounded by a complete star-and-ray medallion, outside the glue annulus. */
export function medallion(p: Part, c: number, inner: number, outer: number, words?: string) {
  const lo = inner,
    hi = outer,
    mid = (lo + hi) / 2;
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const snap = (n: number) => Math.round(n / PIXEL) * PIXEL + PIXEL / 2;
    return [snap(mid * Math.cos(a)), snap(mid * Math.sin(a))];
  }).filter(([x]) => x > -mid + 4);
  scene(
    p,
    'hidden cratered moon and star medallion',
    c,
    c,
    lo,
    hi,
    (x, y) => {
      const r = Math.hypot(x, y),
        a = Math.atan2(y, x);
      // A smaller moon is necessary in the lid's annulus; its three craters remain full pixels.
      const moon =
        outer > 15
          ? stamp(['...###...', '..#####..', '.#######.', '###..####', '###..####', '######.##', '.#######.', '..#####..', '...###...'], x + mid, y, PIXEL)
          : stamp(['..###..', '.#####.', '##..###', '#######', '###..##', '.#####.', '..###..'], x + mid, y, PIXEL);
      const sparkle = stars.some(([sx, sy]) => cross(x - sx, y - sy, outer > 15 ? 2.5 : 1.5));
      const rim = r > hi - 0.75 && r < hi - 0.15 && Math.abs(Math.sin(a * 12)) > 0.65;
      return moon || sparkle || rim;
    },
    words ? [idSpace(words, -mid)] : [],
  );
  if (words) p.text(words, 'micro', c, c - mid, PIXEL);
}

/** Four short lines retain the full message at 0.5 mm per pixel inside the 16 mm bore. */
export function coreMessage(p: Part, c: number) {
  const words = new LaserSheet(p.w, p.h);
  lineText(words, 'YOU', 'micro', c, c - 4.5, PIXEL);
  lineText(words, 'FOUND', 'micro', c, c - 1.5, PIXEL);
  lineText(words, 'IT.', 'micro', c, c + 1.5, PIXEL);
  arcText(words, 'BZZZT!', 'micro', c, c, 7.3, PIXEL, false);
  // One text block: like inter-letter spacing, its line gaps are one full pixel (0.5 mm).
  p.engrave(
    'hidden message YOU FOUND IT. BZZZT!',
    words.items.flatMap((it) => (it.k === 'poly' ? [it.pts] : [])),
  );
  p.texts.push({ text: 'YOU FOUND IT. BZZZT!', capMm: 2.5 });
}
