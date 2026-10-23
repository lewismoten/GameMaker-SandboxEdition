// Checks multi-block objects (trees, houses, cars, signs, big pictures): that every map puts
// each object's parts together in the right places, and that the parts' ART joins up across
// the block edges (the Maximus tree bug was a trunk drawn half a block off its crown). Each
// game's tools/align.ts says which block names make up which objects; tools/check.ts runs it.
//   checkParts(...)  rules per part name: which part must sit at which offset
//   gridParts(...)   objects named name<sep>col,row (or any regex with col and row groups)
//   seams(...)       how much each joined pair's colors jump across the shared edge
//   diskScenes(...)  a built disk's scenes (palette, map, background blocks) for pictures
//   writeArea(...)   a PNG of a map's rectangle, for before/after pictures of an object
import { readFileSync, readdirSync } from 'node:fs';
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
export type Want = string | { test(got: string): boolean; toString(): string };
/** A part and the parts that must sit beside it: [dx, dy, wanted name]. `want` may use the
 * match: a function of the part's regex match returning the wanted names. */
export interface PartRule {
  part: string | RegExp;
  need: [number, number, Want][] | ((m: RegExpExecArray) => [number, number, Want][]);
  /** Name for the report (default: the part's name). */
  what?: string;
}

const ok = (want: Want, got: string) => (typeof want === 'string' ? got === want : want.test(got));

/** Every part whose neighbors are wrong: "name at x,y: wanted W at dx,dy, found G". Parts must
 * not run off the map's edge either (playgame's maps wrap, so the other side is wrong too). */
export function checkParts(at: NameAt, rules: PartRule[], w = MLEN, h = MWID): string[] {
  const bad: string[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const name = at(x, y);
      if (!name) continue;
      for (const r of rules) {
        const m = typeof r.part === 'string' ? (name === r.part ? /^.*$/.exec(name) : null) : r.part.exec(name);
        if (!m) continue;
        const need = typeof r.need === 'function' ? r.need(m) : r.need;
        for (const [dx, dy, want] of need) {
          const X = x + dx;
          const Y = y + dy;
          const got = X < 0 || Y < 0 || X >= w || Y >= h ? 'off the map' : (at(X, Y) ?? '?');
          if (!ok(want, got)) bad.push(`${r.what ?? name} at ${x},${y}: wanted ${String(want)} at ${dx},${dy}, found ${got}`);
        }
      }
    }
  return bad;
}

/** Rules for objects whose parts are named by column and row (house:0,1 or cat12): every part
 * wants every other part of its object. `sizes` gives each object's columns and rows; `name`
 * turns object, column and row back into a part name. `alias` lets an animation frame stand
 * in for a part. */
export function gridParts(re: RegExp, sizes: Map<string, [number, number]>, name: (obj: string, c: number, r: number) => string, alias: (got: string) => string = (g) => g): PartRule {
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
export type Pic = (x: number, y: number) => number;
export interface Seam {
  a: string;
  b: string;
  dir: 'h' | 'v';
  /** Mean color distance across the shared edge. */
  across: number;
  /** Mean color distance one pixel in from the edge, on both sides (the art's own texture). */
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
    let within = 0;
    for (let i = 0; i < 20; i++) {
      const [a1, a0, b0, b1] = dir === 'h' ? [A(18, i), A(19, i), B(0, i), B(1, i)] : [A(i, 18), A(i, 19), B(i, 0), B(i, 1)];
      across += dist(pal, a0, b0);
      within += (dist(pal, a1, a0) + dist(pal, b0, b1)) / 2;
    }
    return { a, b, dir, across: across / 20, within: within / 20 };
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
    out.push({ desc: s.desc, map: f('map'), pal: parsePalette(read(f('pal'))), blocks: parseMap(read(f('map'))).blocks, bbl: parseBlocks(read(f('bbl')), BACKBL) });
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
export function writeParts(file: string, pic: (name: string) => Pic, pal: Uint8Array, rows: string[][], s = 4, gap = 0): void {
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

/** Prints a game's alignment report; returns how many misplaced parts and broken seams. */
export function report(game: string, maps: [string, string[]][], broken: Seam[] = []): number {
  let n = 0;
  for (const [map, bad] of maps) {
    if (!bad.length) continue;
    n += bad.length;
    console.log(`${game} ${map}: ${bad.length} misplaced part(s)`);
    for (const b of bad.slice(0, 12)) console.log(`  ${b}`);
    if (bad.length > 12) console.log(`  ... and ${bad.length - 12} more`);
  }
  for (const s of broken) console.log(`${game} seam ${s.a} ${s.dir === 'h' ? '|' : '/'} ${s.b}: ${s.across.toFixed(1)} across vs ${s.within.toFixed(1)} beside`);
  n += broken.length;
  if (!n) console.log(`${game}: every multi-block object is whole (${maps.length} maps)`);
  return n;
}
