// Blocks of one shape in different colors, folded where the palettes allow it. A scene has one
// palette (PLAYGAME.C:4244), so block B (drawn in scenes whose palette P gives its colors) can become
// block A (the same shape in other color numbers) when P is rewritten so that A's color numbers show
// B's old RGB. That is only done when nothing else can see the difference:
//   - no scene draws A and B together, and no scene that opens P (or draws A with another palette
//     that is rewritten) draws A;
//   - the color numbers rewritten in P are drawn by nothing else in any scene that opens P (other
//     blocks, monsters, characters), are not the interface colors 0-15 or 255, and P is not opened
//     by a slide or animation scene;
//   - the two blocks have the same rules and the same "becomes" links, and B is not carried by the
//     character (block 0, pickups and inventory keep their numbers).
// Every scene then draws the same map, pixel for pixel in RGB; the proof (optimize:proof) checks it.
// One step per block set, greedy: each fold is found on the palettes and maps the earlier ones left.
import { BACKBL, parseBlocks, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap, serializeMap, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { applyFold } from '@lewismoten/gamemaker-sandbox-tools/look-alike';
import type { GameFiles } from '../../project/files';
import { isSolidPalette } from '../core/readablePalette';
import { commit, readFor, type Writes } from './commit';
import { carriedBlocks } from './lookAlikes';
import { filesIn, readGame, usersOf, type SceneUse } from './refs';
import { colorsOf } from './spriteColors';
import type { Step } from './types';

const rules = (b: Block, i: number) =>
  [
    b.birthMon,
    b.birthTime,
    ...b.xtra,
    b.solid,
    b.hitpt,
    b.scorePts,
    b.chHitPt,
    b.ntime,
    b.grav,
    b.obj,
    b.effect,
    b.eamt,
    b.nextBl === i ? 'self' : b.nextBl,
    b.touchBl === i ? 'self' : b.touchBl,
  ].join(',');

/** The pixel pattern with colors renamed in order of first appearance. */
function shape(b: Block): string {
  const seen = new Map<number, number>();
  return Array.from(b.pixels, (v) => seen.get(v) ?? (seen.set(v, seen.size), seen.size - 1)).join(',');
}

/** Block numbers a map draws, plus what they turn into. */
function closure(map: GameMap, blocks: Block[]): Set<number> {
  const used = new Set<number>(map.blocks);
  for (const i of [...used]) {
    for (let n = blocks[i]?.nextBl, guard = 0; n !== undefined && !used.has(n) && n < BACKBL && guard < BACKBL; guard++, n = blocks[n]?.nextBl) used.add(n);
    const t = blocks[i]?.touchBl;
    if (t !== undefined && t < BACKBL) used.add(t);
  }
  return used;
}

interface Fold {
  keep: number;
  fold: number;
  palettes: string[];
}

export function planColorFolds(files: GameFiles, gam: string): Step | undefined {
  const c = colorsOf(files, gam);
  const carry = carriedBlocks(files, c.uses);
  for (const bbl of filesIn(c.uses, 'bbl')) {
    const mine = usersOf(c.uses, 'bbl', bbl);
    const mapNames = filesIn(mine, 'map');
    if (mapNames.some((m) => usersOf(c.uses, 'map', m).some((u) => u.bbl !== bbl))) continue;
    const original = parseBlocks(files.get(bbl)!, BACKBL);
    let blocks = original;
    let maps = new Map(mapNames.map((m) => [m, parseMap(files.get(m)!)]));
    const pals = new Map<string, Uint8Array>();
    const palOf = (f: string) => pals.get(f) ?? files.get(f)!;
    const pinned = new Set<number>([0, ...carry, ...original.flatMap((b, i) => (b.obj ? [i] : []))]);
    const done: Fold[] = [];
    const total = original.map((_, i) => i);
    const cellsOf = (u: SceneUse) => (u.map && maps.has(u.map) ? closure(maps.get(u.map)!, blocks) : new Set<number>());
    for (let guard = 0; guard < 150; guard++) {
      const found = foldOnce();
      if (!found) break;
      done.push(found);
    }
    if (!done.length) continue;

    function foldOnce(): Fold | undefined {
      const cells = new Map(mine.map((u) => [u.index, cellsOf(u)]));
      const live = [...new Set([...cells.values()].flatMap((s) => [...s]))].filter((n) => blocks[n]).sort((a, b) => a - b);
      const flat = (b: Block) => b.pixels.every((v) => v === b.pixels[0]);
      for (const a of live)
        for (const b of live) {
          if (a >= b || pinned.has(b) || flat(blocks[a]) || flat(blocks[b])) continue;
          if (shape(blocks[a]) !== shape(blocks[b]) || rules(blocks[a], a) !== rules(blocks[b], b)) continue;
          const r = tryFold(a, b, cells);
          if (r) return r;
        }
      return undefined;
    }

    function tryFold(a: number, b: number, cells: Map<number, Set<number>>): Fold | undefined {
      const [A, B] = [blocks[a], blocks[b]];
      const solid = (u: SceneUse) => !u.pal || !files.get(u.pal) || isSolidPalette(files.get(u.pal)!);
      const solidOnly = (u: SceneUse) => solid(u) && !!u.pal;
      for (const u of mine) if (!solidOnly(u) && cells.get(u.index)!.has(a) && cells.get(u.index)!.has(b)) return undefined;
      const sb = mine.filter((u) => !solid(u) && cells.get(u.index)!.has(b));
      if (!sb.length) return undefined;
      const palFiles = [...new Set(sb.map((u) => u.pal!))];
      const next = new Map<string, Uint8Array>();
      for (const p of palFiles) {
        if (c.locked.has(p)) return undefined;
        const old = palOf(p);
        const np = Uint8Array.from(old);
        const changed = new Set<number>();
        for (let k = 0; k < A.pixels.length; k++) {
          const [ia, ib] = [A.pixels[k], B.pixels[k]];
          for (let x = 0; x < 3; x++) np[ia * 3 + x] = old[ib * 3 + x];
          if ([0, 1, 2].some((x) => old[ia * 3 + x] !== old[ib * 3 + x])) changed.add(ia);
        }
        for (const i of changed) {
          if (i < 16 || i >= 255) return undefined;
          if (c.drawnWith.get(p)?.mbl.has(i) || c.drawnWith.get(p)?.cbl.has(i)) return undefined;
        }
        for (const u of c.uses.filter((x) => x.pal === p)) {
          const mineScene = u.bbl === bbl;
          if (mineScene && cells.get(u.index)!.has(a)) return undefined;
          // what else this scene draws with the rewritten color numbers (B itself is going away)
          const set = mineScene ? blocks : u.bbl ? parseBlocks(files.get(u.bbl)!, BACKBL) : [];
          const shown = mineScene ? cells.get(u.index)! : u.map && u.bbl ? closure(parseMap(files.get(u.map)!), set) : new Set<number>();
          for (const n of shown) {
            if (mineScene && n === b) continue;
            for (const v of set[n]?.pixels ?? []) if (changed.has(v)) return undefined;
          }
        }
        next.set(p, np);
      }
      const r = applyFold(blocks, [...maps.values()], [{ keep: a, fold: [b] }]);
      blocks = r.blocks;
      maps = new Map([...maps.keys()].map((m, i) => [m, r.maps[i]]));
      for (const [p, np] of next) pals.set(p, np);
      total.forEach((t, i) => (total[i] = r.to[t] ?? t));
      return { keep: a, fold: b, palettes: palFiles };
    }

    const before: Writes['before'] = new Map();
    readFor(files, before, bbl);
    for (const m of mapNames) readFor(files, before, m);
    for (const p of pals.keys()) readFor(files, before, p);
    const writes: Writes = { files: new Map(), before, game: readGame(files, gam) };
    writes.files.set(bbl, serializeBlocks(blocks));
    for (const [m, map] of maps) writes.files.set(m, serializeMap(map));
    for (const [p, bytes] of pals) writes.files.set(p, bytes);
    const n = done.length;
    return {
      kind: 'look',
      keep: bbl,
      drop: '',
      saves: 0,
      title: `Join ${n} block${n === 1 ? '' : 's'} in ${bbl} that are the same shape in other colors`,
      changes: [
        ...done.map(
          (d) =>
            `Block ${d.fold} becomes block ${d.keep} (the same shape); in ${d.palettes.join(', ')} block ${d.keep}'s color numbers take block ${d.fold}'s colors`,
        ),
        `${[...pals.keys()].join(', ')} change only in color numbers nothing else draws with, so every scene looks the same`,
        `${n} slot${n === 1 ? '' : 's'} in ${bbl} become blank, so another block set can use them`,
      ],
      touches: [...writes.files.keys(), gam],
      moves: [{ file: bbl, into: bbl, at: new Map(total.flatMap((t, i) => (t === i ? [] : [[i, t] as [number, number]]))) }],
      apply: (f, g) => commit(f, g, writes),
    };
  }
  return undefined;
}
