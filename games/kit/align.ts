// Checks multi-block objects (trees, houses, cars, signs, big pictures): that every map puts
// each object's parts together in the right places, and that the parts' ART joins up across
// the block edges (the Maximus tree bug was a trunk drawn half a block off its crown). Each
// game's tools/align.ts says which block names make up which objects; tools/check.ts runs it.
//   checkParts(...)  rules per part name: which part must sit at which offset
//   gridParts(...)   objects named name<sep>col,row (or any regex with col and row groups)
//   seams(...)       how much each joined pair's colors jump across the shared edge
//   diskScenes(...)  a built disk's scenes (palette, map, background blocks) for pictures
//   writeArea(...)   a PNG of a map's rectangle, for before/after pictures of an object
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame, ADVTYPE, ADV_EXTS } from '../../web/src/formats/game';
import { parseMap, MLEN, MWID } from '../../web/src/formats/map';
import { parseBlocks, BACKBL, type Block } from '../../web/src/formats/blocks';
import { parsePalette } from '../../web/src/formats/palette';
import { Pixels } from './pixels';
import { writePng } from './png';

/** What a map cell holds, by block name ('' or undefined for unnamed). */
export type NameAt = (x: number, y: number) => string | undefined;
/** A wanted part: its name, or a test (a RegExp, or { test, toString } for the report). */
type Want = string | { test(got: string): boolean; toString(): string };
/** Where a part wants its neighbors: [dx, dy, wanted]. */
export type Need = [number, number, Want][];
/** A part and the parts that must sit beside it. `need` may be a function of the part's regex
 * match; with several needs (a part that can stand in more than one place of its object) one
 * of them must hold. */
export interface PartRule {
  part: string | { test(name: string): boolean };
  need: Need | Need[] | ((m: RegExpExecArray) => Need);
  /** Name for the report (default: the part's name). */
  what?: string;
  /** false: the neighbors it checks are not parts of its object (no art join to measure). */
  joins?: boolean;
}

const ok = (want: Want, got: string) => (typeof want === 'string' ? got === want : want.test(got));

/** Every part whose neighbors are wrong: "name at x,y: wanted W at dx,dy, found G". Parts must
 * not run off the map's edge either (playgame's maps wrap, so the other side is wrong too).
 * Right-hand and lower neighbors that are right go into `joined` (JSON [left or upper, right or
 * lower, 'h' or 'v']), the pairs whose art must join up. */
export function checkParts(at: NameAt, rules: PartRule[], w = MLEN, h = MWID, joined?: Set<string>): string[] {
  const bad: string[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const name = at(x, y);
      if (!name) continue;
      for (const r of rules) {
        const m =
          typeof r.part === 'string'
            ? name === r.part
              ? /^.*$/.exec(name)
              : null
            : r.part instanceof RegExp
              ? r.part.exec(name)
              : r.part.test(name)
                ? /^.*$/.exec(name)
                : null;
        if (!m) continue;
        const needs: Need[] = typeof r.need === 'function' ? [r.need(m)] : Array.isArray(r.need[0]?.[0]) ? (r.need as Need[]) : [r.need as Need];
        let best: string[] | undefined;
        for (const need of needs) {
          const fails: string[] = [];
          const joins: string[] = [];
          for (const [dx, dy, want] of need) {
            const X = x + dx;
            const Y = y + dy;
            const got = X < 0 || Y < 0 || X >= w || Y >= h ? 'off the map' : (at(X, Y) ?? '?');
            if (!ok(want, got)) fails.push(`${r.what ?? name} at ${x},${y}: wanted ${String(want)} at ${dx},${dy}, found ${got}`);
            else if (r.joins !== false && Math.abs(dx) + Math.abs(dy) === 1)
              joins.push(JSON.stringify(dx + dy > 0 ? [name, got, dx ? 'h' : 'v'] : [got, name, dx ? 'h' : 'v']));
          }
          if (!fails.length) {
            best = [];
            for (const j of joins) joined?.add(j);
            break;
          }
          if (!best || fails.length < best.length) best = fails;
        }
        bad.push(...(best ?? []));
      }
    }
  return bad;
}

/** Rules for objects whose parts are named by column and row (house:0,1 or cat12): every part
 * wants every other part of its object. `sizes` gives each object's columns and rows; `name`
 * turns object, column and row back into a part name. `alias` lets an animation frame stand
 * in for a part. */
export function gridParts(
  re: RegExp,
  sizes: Map<string, [number, number]>,
  name: (obj: string, c: number, r: number) => string,
  alias: (got: string) => string = (g) => g,
): PartRule {
  return {
    part: re,
    need: (m) => {
      const obj = m[1];
      const [c, r] = [Number(m[2]), Number(m[3])];
      const [w, h] = sizes.get(obj) ?? [1, 1];
      const out: [number, number, Want][] = [];
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const want = name(obj, i, j);
          if (i !== c || j !== r) out.push([i - c, j - r, { test: (g) => alias(g) === want, toString: () => want }]);
        }
      return out;
    },
  };
}

/** Rules for an object drawn as rows of parts (null: any block): each part wants every other
 * part of the object at its place (a part found at several places: at one of them). */
export function shape(what: string, rows: (Want | null)[][]): PartRule[] {
  const cells: [number, number, Want][] = [];
  rows.forEach((row, r) => row.forEach((p, c) => p !== null && cells.push([c, r, p])));
  const byPart = new Map<string, [number, number, Want][]>();
  for (const cell of cells) byPart.set(String(cell[2]), [...(byPart.get(String(cell[2])) ?? []), cell]);
  return [...byPart.values()].map((at) => {
    const p = at[0][2];
    return {
      what: `${what} (${String(p)})`,
      part: typeof p === 'string' ? p : { test: (g: string) => p.test(g) },
      need: at.map(([c, r]) => cells.filter((o) => o[0] !== c || o[1] !== r).map(([c2, r2, q]) => [c2 - c, r2 - r, q] as [number, number, Want])),
    };
  });
}

/** Pairs: every `a` has a `b` at dx, dy and every `b` an `a` the other way. */
export const pair = (what: string, a: Want, b: Want, dx: number, dy: number): PartRule[] =>
  shape(what, dy === 0 ? (dx === 1 ? [[a, b]] : [[b, a]]) : dy === 1 ? [[a], [b]] : [[b], [a]]);

/** Rules read off the maps themselves, for a game whose objects are numbered parts (sign0
 * sign1 sign2, or sign00 sign01 down a column): where part n mostly stands (`share` of the
 * time) with part n+1 just right of it (or just below it), that is how the object goes
 * together, and every part n and n+1 must be so. Numbered animation frames and patterns don't
 * stand that way, so they get no rule.
 * `skip` leaves out stems that only look like objects. */
export function autoParts(maps: NameAt[], names: Iterable<string>, skip: RegExp = /$^/, share = 0.75): PartRule[] {
  const all = new Set(names);
  const seen = new Map<string, { n: number; h: number; v: number }>();
  for (const at of maps)
    for (let y = 0; y < MWID; y++)
      for (let x = 0; x < MLEN; x++) {
        const m = /^(.*?)(\d)$/.exec(at(x, y) ?? '');
        if (!m || skip.test(m[1])) continue;
        const next = `${m[1]}${Number(m[2]) + 1}`;
        if (!all.has(next)) continue;
        const c = seen.get(m[0]) ?? { n: 0, h: 0, v: 0 };
        c.n++;
        if (x + 1 < MLEN && at(x + 1, y) === next) c.h++;
        if (y + 1 < MWID && at(x, y + 1) === next) c.v++;
        seen.set(m[0], c);
      }
  // an object's parts stand together nearly everywhere; a pattern's tiles only now and then
  const found = new Map<string, [number, number]>();
  for (const [k, c] of seen) {
    if (c.h >= share * c.n) found.set(k, [1, 0]);
    else if (c.v >= share * c.n) found.set(k, [0, 1]);
  }
  return [...found].flatMap(([a, [dx, dy]]) =>
    pair(
      `${a.replace(/\d$/, '')} (found on the maps)`,
      a,
      a.replace(/\d$/, (d) => String(Number(d) + 1)),
      dx,
      dy,
    ),
  );
}

/** A block book's names by block number. */
export function namesOf(index: Map<string, number>): string[] {
  const out: string[] = [];
  for (const [n, i] of index) out[i] = n;
  return out;
}

/** Object sizes (columns, rows) from a block set's part names matched by `re` (object, col, row). */
export function sizesOf(names: Iterable<string>, re: RegExp): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  for (const n of names) {
    const m = re.exec(n);
    if (!m) continue;
    const s = out.get(m[1]) ?? [0, 0];
    out.set(m[1], [Math.max(s[0], Number(m[2]) + 1), Math.max(s[1], Number(m[3]) + 1)]);
  }
  return out;
}

/** A block's picture: palette index at x, y (0..19). */
type Pic = (x: number, y: number) => number;
interface Seam {
  a: string;
  b: string;
  dir: 'h' | 'v';
  /** Mean color distance across the shared edge. */
  across: number;
  /** Draws the pair joined (scaled up) into a PNG, for a look. */
  draw?: (file: string, s?: number) => void;
  /** Mean color distance one pixel in from the edge, on the busier side (the art's own texture,
   * so a pattern with a line on its edge, like tile grout, is not a break). */
  within: number;
}

const dist = (pal: Uint8Array, p: number, q: number) => {
  if (p === q) return 0;
  if (p === 255 || q === 255) return 63;
  let d = 0;
  for (let i = 0; i < 3; i++) d += Math.abs(pal[p * 3 + i] - pal[q * 3 + i]);
  return d / 3;
};

/** How sharply each joined pair's art changes across its shared edge ('h': b right of a,
 * 'v': b below a), next to how much it changes one pixel either side of the edge. A seam
 * whose `across` is far above `within` is where the art breaks (an outline, a jump). */
export function seams(pic: (name: string) => Pic, pal: Uint8Array, pairs: [string, string, 'h' | 'v'][]): Seam[] {
  return pairs.map(([a, b, dir]) => {
    const A = pic(a);
    const B = pic(b);
    let across = 0;
    let inA = 0;
    let inB = 0;
    for (let i = 0; i < 20; i++) {
      const [a1, a0, b0, b1] = dir === 'h' ? [A(18, i), A(19, i), B(0, i), B(1, i)] : [A(i, 18), A(i, 19), B(i, 0), B(i, 1)];
      across += dist(pal, a0, b0);
      inA += dist(pal, a1, a0);
      inB += dist(pal, b0, b1);
    }
    return { a, b, dir, across: across / 20, within: Math.max(inA, inB) / 20 };
  });
}

/** Seams that look broken: the colors jump across the edge much more than beside it. */
export function brokenSeams(s: Seam[], factor = 2.5, floor = 6): Seam[] {
  return s.filter((x) => x.across > floor && x.across > factor * x.within);
}

/** One adventure scene of a built disk: its name, palette, map and background blocks. */
export interface DiskScene {
  desc: string;
  map: string;
  pal: Uint8Array;
  blocks: Uint8Array;
  bbl: Block[];
}

/** Every adventure scene on a built disk (the .gam's scenes, by their files). */
export function diskScenes(disk: string): DiskScene[] {
  const files = new Map(readdirSync(disk).map((f) => [f.toLowerCase(), f]));
  const read = (f: string) => new Uint8Array(readFileSync(join(disk, files.get(f.toLowerCase()) ?? f)));
  const gam = [...files.keys()].find((f) => f.endsWith('.gam'));
  if (!gam) throw new Error(`no .gam in ${disk}`);
  const game = parseGame(read(gam));
  const out: DiskScene[] = [];
  for (const s of game.scenes) {
    if (s.gametype !== ADVTYPE) continue;
    const f = (ext: string) => s.files[ADV_EXTS.indexOf(ext as (typeof ADV_EXTS)[number])];
    if (!f('map') || !f('bbl') || !f('pal')) continue;
    out.push({
      desc: s.desc,
      map: f('map'),
      pal: parsePalette(read(f('pal'))),
      blocks: parseMap(read(f('map'))).blocks,
      bbl: parseBlocks(read(f('bbl')), BACKBL),
    });
  }
  return out;
}

/** A PNG of map cells x..x+w, y..y+h of a disk scene (wrapping like playgame), scaled `s`
 * times; `blocks` overrides the scene's block pictures (to show art before a fix). */
export function writeArea(file: string, sc: DiskScene, x: number, y: number, w: number, h: number, s = 4, blocks: Block[] = sc.bbl): void {
  const p = new Pixels(w * 20, h * 20);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const b = blocks[sc.blocks[((y + j + MWID) % MWID) * MLEN + ((x + i + MLEN) % MLEN)]];
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) p.px[(j * 20 + yy) * p.w + i * 20 + xx] = b.pixels[yy * 20 + xx];
    }
  writePng(file, p, sc.pal, s);
}

/** A PNG of named blocks laid out as rows of names ('' leaves a gap), scaled `s` times. */
function writeParts(file: string, pic: (name: string) => Pic, pal: Uint8Array, rows: string[][], s = 4, gap = 0): void {
  const w = Math.max(...rows.map((r) => r.length));
  const p = new Pixels(w * (20 + gap), rows.length * (20 + gap), 255);
  rows.forEach((r, j) =>
    r.forEach((n, i) => {
      if (!n) return;
      const P = pic(n);
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) p.set(i * (20 + gap) + xx, j * (20 + gap) + yy, P(xx, yy));
    }),
  );
  writePng(file, p, pal, s);
}

/** Checks a built disk: every map's multi-block objects (names: each map file's block names by
 * number, undefined to skip the map) by the rules (or each map's own rules), and the art of every pair the maps join. */
function auditDisk(
  disk: string,
  names: (map: string) => string[] | undefined,
  rules: PartRule[] | ((map: string) => PartRule[]),
  opts: { factor?: number; floor?: number } = {},
): { maps: [string, string[]][]; seams: Seam[]; broken: Seam[] } {
  const maps: [string, string[]][] = [];
  const pairs = new Map<string, { sc: DiskScene; ids: Map<string, number> }>();
  const done = new Set<string>();
  for (const sc of diskScenes(disk)) {
    const n = names(sc.map.toLowerCase());
    if (!n || done.has(sc.map.toLowerCase())) continue;
    done.add(sc.map.toLowerCase());
    const joined = new Set<string>();
    maps.push([
      sc.map.toLowerCase(),
      checkParts((x, y) => n[sc.blocks[y * MLEN + x]], typeof rules === 'function' ? rules(sc.map.toLowerCase()) : rules, MLEN, MWID, joined),
    ]);
    const ids = new Map<string, number>();
    n.forEach((v, i) => v !== undefined && ids.set(v, i));
    for (const j of joined) if (!pairs.has(j)) pairs.set(j, { sc, ids });
  }
  const seamsOut: Seam[] = [];
  for (const [j, { sc, ids }] of pairs) {
    const [a, b, dir] = JSON.parse(j) as [string, string, 'h' | 'v'];
    const pic = (name: string): Pic => {
      const px = sc.bbl[ids.get(name)!].pixels;
      return (x, y) => px[y * 20 + x];
    };
    for (const x of seams(pic, sc.pal, [[a, b, dir]]))
      seamsOut.push({ ...x, draw: (file, s = 8) => writeParts(file, pic, sc.pal, dir === 'h' ? [[a, b]] : [[a], [b]], s) });
  }
  return { maps, seams: seamsOut, broken: brokenSeams(seamsOut, opts.factor, opts.floor) };
}

/** Runs a game's alignment check on its built disk (games/<id>/disk) and prints the report:
 * misplaced parts per map, and joined pairs whose art jumps at the shared edge (`seamOk` lists
 * the ones drawn that way on purpose, as "a|b" side by side or "a/b" a over b). Returns how
 * many problems it found. */
export function alignGame(
  id: string,
  names: (map: string) => string[] | undefined,
  rules: PartRule[] | ((map: string) => PartRule[]),
  opts: { seamOk?: string[]; factor?: number; floor?: number; draw?: string } = {},
): number {
  const r = auditDisk(new URL(`../${id}/disk`, import.meta.url).pathname, names, rules, opts);
  const okSeams = new Set(opts.seamOk ?? []);
  const broken = r.broken.filter((x) => !okSeams.has(`${x.a}${x.dir === 'h' ? '|' : '/'}${x.b}`));
  let n = 0;
  for (const [map, bad] of r.maps) {
    if (!bad.length) continue;
    n += bad.length;
    console.log(`${id} ${map}: ${bad.length} misplaced part(s)`);
    for (const b of bad.slice(0, 12)) console.log(`  ${b}`);
    if (bad.length > 12) console.log(`  ... and ${bad.length - 12} more`);
  }
  // ALIGN_DRAW=<folder> draws each flagged join there, for a look
  const draw = opts.draw ?? process.env.ALIGN_DRAW;
  if (draw && broken.length) mkdirSync(draw, { recursive: true });
  if (draw) for (const x of broken) x.draw?.(`${draw}/${id}-${x.a}${x.dir === 'h' ? '-' : '_'}${x.b}.png`);
  for (const x of broken)
    console.log(`${id} seam ${x.a}${x.dir === 'h' ? '|' : '/'}${x.b}: colors jump ${x.across.toFixed(1)} across the edge, ${x.within.toFixed(1)} beside it`);
  n += broken.length;
  if (!n) console.log(`${id}: multi-block objects whole on ${r.maps.length} maps (${r.seams.length} joins)`);
  return n;
}
