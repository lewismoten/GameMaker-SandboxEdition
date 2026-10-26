// layOutCourse on a small made-up track: five lanes at 45 degrees with a kink, on a map that wraps
// (as Virus Blaster's ribbon cable is built), unrolled into one strip that runs up the page.
import { describe, expect, it } from 'vitest';
import type { Block } from '../../formats/blocks';
import { findCourse } from '../../editor/check/course';
import { courseRaster, layOutCourse, panelOf } from './levelCourse';

const mod = (v: number, n: number) => ((v % n) + n) % n;
const OPEN = 0;
const WALL = 1;
const TAPE = 2;
const blocks = [
  { solid: 0, touchBl: 0, nextBl: 0, ntime: 0 },
  { solid: 15, touchBl: 1, nextBl: 1, ntime: 0 },
  { solid: 0, touchBl: 2, nextBl: 2, ntime: 0 },
] as unknown as Block[];

/** Lanes 20 apart on the slant (x + y), flat on the kink (columns 80 to 99): 7 of wall, 13 open. */
const lane = (x: number, y: number) => mod(x < 80 ? x + y : y + 80, 100) % 20;
/** The middle of lap `lap`'s lane at column x (lap 0 rides lane 0), unwrapped. */
const middle = (lap: number, x: number) => {
  const t = lap * 20 + 13;
  return t - (x < 80 ? x : 80);
};

function track(splice?: number): Uint8Array {
  const cells = new Uint8Array(100 * 100);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) cells[y * 100 + x] = lane(x, y) < 7 ? WALL : OPEN;
  // a splice across the wall from lap 1's lane into lap 2's at columns splice to splice + 9
  if (splice !== undefined) for (let x = splice; x < splice + 10; x++) for (let o = 0; o < 7; o++) cells[mod(middle(1, x) + 7 + o, 100) * 100 + x] = TAPE;
  return cells;
}

/** The ride: from column 85 of lap 0, every lap along its lane, to column 90 of lap 4. */
function ride(): [number, number][] {
  const out: [number, number][] = [];
  for (let u = 85; u <= 490; u++) {
    const lap = Math.floor(u / 100);
    const x = u % 100;
    out.push([x, mod(middle(lap, x), 100)]);
  }
  return out;
}

const marks = [
  { kind: 'start', x: 86, y: mod(middle(0, 86), 100), w: 1, h: 1 },
  { kind: 'exit', x: 89, y: mod(middle(4, 89), 100), w: 1, h: 1 },
];

describe('a course laid out as one strip', () => {
  const path = findCourse(ride())!;
  it('is found from the ride', () => expect(path).toBeDefined());

  const l = layOutCourse(track(), blocks, path, marks, 56);

  it('turns the way on (up and to the right) to point up the page, start at the bottom', () => {
    expect(l.up[0]).toBeCloseTo(Math.SQRT1_2);
    expect(l.up[1]).toBeCloseTo(-Math.SQRT1_2);
    const [start, exit] = l.marks;
    expect(start.at.a).toBeLessThan(exit.at.a);
    expect(panelOf(l, start.at.a)).toBe(0);
    expect(panelOf(l, exit.at.a)).toBe(l.panels.length - 1);
  });

  it('draws each lane once, at the lap it is ridden, with no jump at a seam', () => {
    // every block of the way is drawn, and each place on the map only once on the way
    const way = l.cells.filter((c) => c.way);
    const places = new Set(way.map((c) => `${mod(c.x, 100)},${mod(c.y, 100)}`));
    expect(places.size).toBe(way.length);
    // the ride's every block is on the way, unwrapped as one unbroken line
    const onWay = new Set(way.map((c) => `${c.x},${c.y}`));
    for (let u = 90; u <= 480; u++) {
      const x = u % 100;
      const lap = Math.floor(u / 100);
      // unwrapped: x runs on past 99, and y on past 0 by however many laps of 100 rows
      const y = middle(lap, x);
      expect(
        [-300, -200, -100, 0, 100].some((d) => onWay.has(`${u},${y + d}`)),
        `${u}`,
      ).toBe(true);
    }
  });

  it('counts the laps by the edge crossed most, and marks the kinks and seams', () => {
    expect(l.laps.map((x) => x.n)).toEqual([1, 2, 3, 4, 5]);
    expect(l.kinks.length).toBeGreaterThanOrEqual(4);
    expect(l.kinks.every((k) => !k.taken)).toBe(true);
    expect(l.seams.some((s) => s.axis === 'x')).toBe(true);
    expect(l.seams.some((s) => s.axis === 'y')).toBe(true);
    expect(l.shortcuts).toEqual([]);
  });

  it('cuts it into equal panels that cover it bottom to top and overlap', () => {
    expect(l.panels[0].a0).toBeCloseTo(l.box.a0);
    expect(l.panels[l.panels.length - 1].a1).toBeCloseTo(l.box.a1);
    for (const [i, p] of l.panels.entries()) {
      expect(p.a1 - p.a0).toBeLessThanOrEqual(56 + 1e-9);
      if (i) expect(p.a0).toBeLessThan(l.panels[i - 1].a1);
    }
  });

  it('finds a splice across to the next lane as a shortcut a lap on', () => {
    const s = layOutCourse(track(30), blocks, path, marks, 56);
    expect(s.shortcuts.length).toBe(1);
    const [sc] = s.shortcuts;
    // a lap on is 100 across and 80 up the map: about 127 blocks up the strip
    expect(sc.to.a - sc.from.a).toBeGreaterThan(100);
  });

  it('draws the strip from the map, nearest-neighbor: only the map’s colors, and blank off the way', () => {
    const blen = 4;
    const source = { width: 100 * blen, height: 100 * blen, pixels: new Uint8Array(100 * blen * 100 * blen) };
    for (let i = 0; i < source.pixels.length; i++) source.pixels[i] = 10 + (i % 7);
    const r = courseRaster(l, l.panels[1], source, blen, 2 * blen, 256);
    const seen = new Set(r.pixels);
    expect(seen.has(256)).toBe(true);
    for (const v of seen) expect(v === 256 || (v >= 10 && v < 17)).toBe(true);
  });
});
