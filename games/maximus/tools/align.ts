// Checks that every multi-block object in every map is put together right: the 2x2 pictures
// (planets, suns, warps, tree crowns), the trees' two-block trunks under their crowns, the
// core's 3x3, pillars standing on their shafts. Reports each misplaced part. Run by
// tools/check.ts (alone: cd web && npx vite-node ../games/maximus/tools/check.ts --align).
import type { Built } from '../src/game';

const QUAD: Record<string, [number, number, string][]> = {
  tl: [[1, 0, 'tr'], [0, 1, 'bl']],
  tr: [[-1, 0, 'tl'], [0, 1, 'br']],
  bl: [[1, 0, 'br'], [0, -1, 'tl']],
  br: [[-1, 0, 'bl'], [0, -1, 'tr']],
};

/** Misplaced parts of multi-block objects, by scene name. */
export function misaligned(b: Built): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const info of b.scenes) {
    const s = b.sets[info.bbl];
    const byId = new Map([...s.names_()].map(([k, v]) => [v, k]));
    const g = info.map;
    const n = (x: number, y: number) => byId.get(g.get(x, y)) ?? '?';
    const bad: string[] = [];
    const want = (x: number, y: number, dx: number, dy: number, part: string | RegExp, what: string) => {
      const got = n(x + dx, y + dy);
      if (typeof part === 'string' ? got !== part : !part.test(got)) bad.push(`${what} at ${x},${y}: ${got} at ${dx},${dy}`);
    };
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++) {
        const c = n(x, y);
        const q = /^(.*):(tl|tr|bl|br)$/.exec(c);
        if (q) for (const [dx, dy, p] of QUAD[q[2]]) want(x, y, dx, dy, `${q[1]}:${p}`, c);
        const core = /^core:(\d)(\d)$/.exec(c);
        if (core) {
          const [cx, cy] = [Number(core[1]), Number(core[2])];
          if (cx < 2) want(x, y, 1, 0, `core:${cx + 1}${cy}`, c);
          if (cy < 2) want(x, y, 0, 1, `core:${cx}${cy + 1}`, c);
        }
        if (c === 'tree:bl') want(x, y, 0, 1, 'tree:trunk', c);
        if (c === 'tree:br') want(x, y, 0, 1, 'tree:trunk:r', c);
        if (c === 'tree:trunk') want(x, y, 1, 0, 'tree:trunk:r', c);
        if (info.bbl === 'surface' && c === 'pillar:base') want(x, y, 0, -1, /^pillar:(mid|top)$/, c);
        if (info.bbl === 'surface' && c === 'pillar:mid') want(x, y, 0, -1, /^pillar:(mid|top)$/, c);
      }
    if (bad.length) out.set(info.name, bad);
  }
  return out;
}

