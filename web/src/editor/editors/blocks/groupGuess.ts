// Guessing block groups from the game's files, to suggest (never to add by themselves):
// - background blocks that always sit together in the same arrangement on the maps (each
//   always has the same neighbor on a side, and that neighbor always has it back);
// - monsters placed side by side on a map that animate and move in step: frame by frame, their
//   pictures make one bigger picture;
// - a character's frames, the top block over the bottom one.
// Pure: the block editor reads the files and passes them in.
import { CHARBL, MONBL } from '../../../formats/blocks';
import { MLEN, MWID, type PlacedMonster } from '../../../formats/map';
import { LASTMON, LASTSL, type Monster } from '../../../formats/monster';
import { frameCount, type Character } from '../../../formats/character';
import { MAX_SIDE, type BlockGroup } from './blockGroups';

export interface Suggestion {
  group: BlockGroup;
  /** Why it is suggested, in a few words ("together 3 times on the maps"). */
  why: string;
}

/** Lays out blocks at (col, row) positions into a group, or undefined if they clash or spread too far. */
function place(name: string, at: Map<number, [number, number]>): BlockGroup | undefined {
  const pts = [...at.entries()];
  const minC = Math.min(...pts.map(([, p]) => p[0]));
  const minR = Math.min(...pts.map(([, p]) => p[1]));
  const cols = Math.max(...pts.map(([, p]) => p[0])) - minC + 1;
  const rows = Math.max(...pts.map(([, p]) => p[1])) - minR + 1;
  if (cols > MAX_SIDE || rows > MAX_SIDE) return undefined;
  const cells = new Array<number>(cols * rows).fill(-1);
  for (const [b, [c, r]] of pts) {
    const i = (r - minR) * cols + (c - minC);
    if (cells[i] >= 0) return undefined;
    cells[i] = b;
  }
  return { name, cols, rows, cells };
}

/** Background blocks that always appear together, in the same arrangement, on these maps (each 100 x 100, row by row). */
export function guessMapGroups(maps: Uint8Array[], count: number): Suggestion[] {
  const seen = new Array<number>(count).fill(0);
  // the one neighbor each block always has to its right / below (-1: none yet, -2: not always the same)
  const right = new Array<number>(count).fill(-1);
  const below = new Array<number>(count).fill(-1);
  const left = new Array<number>(count).fill(-1);
  const above = new Array<number>(count).fill(-1);
  const note = (arr: number[], b: number, n: number) => (arr[b] = arr[b] === -1 || arr[b] === n ? n : -2);
  for (const m of maps)
    for (let y = 0; y < MWID; y++)
      for (let x = 0; x < MLEN; x++) {
        const b = m[y * MLEN + x];
        if (b >= count) continue;
        seen[b]++;
        note(right, b, x + 1 < MLEN ? m[y * MLEN + x + 1] : -2);
        note(below, b, y + 1 < MWID ? m[(y + 1) * MLEN + x] : -2);
        note(left, b, x > 0 ? m[y * MLEN + x - 1] : -2);
        note(above, b, y > 0 ? m[(y - 1) * MLEN + x] : -2);
      }
  const tied = (b: number, n: number, back: number[]) => n >= 0 && n < count && n !== b && back[n] === b;
  const links = (b: number): [number, number, number][] =>
    [
      [right[b], 1, 0, left],
      [left[b], -1, 0, right],
      [below[b], 0, 1, above],
      [above[b], 0, -1, below],
    ].flatMap(([n, dx, dy, back]) => (tied(b, n as number, back as number[]) ? [[n as number, dx as number, dy as number]] : []));
  const done = new Set<number>();
  const out: Suggestion[] = [];
  for (let b = 0; b < count; b++) {
    if (!seen[b] || done.has(b) || !links(b).length) continue;
    const at = new Map<number, [number, number]>([[b, [0, 0]]]);
    const queue = [b];
    let clash = false;
    while (queue.length) {
      const c = queue.shift()!;
      const [cx, cy] = at.get(c)!;
      for (const [n, dx, dy] of links(c)) {
        const p = at.get(n);
        if (p && (p[0] !== cx + dx || p[1] !== cy + dy)) clash = true;
        if (!p) {
          at.set(n, [cx + dx, cy + dy]);
          queue.push(n);
        }
      }
    }
    for (const k of at.keys()) done.add(k);
    const g = !clash && place(`Blocks ${[...at.keys()].sort((p, q) => p - q).join(', ')}`, at);
    if (g) out.push({ group: g, why: `always together on the maps (${seen[b]} time${seen[b] === 1 ? '' : 's'})` });
  }
  return out.sort((p, q) => q.group.cells.length - p.group.cells.length);
}

/** A monster's pictures and their ticks, up to its end marker. */
const picsOf = (m: Monster) => {
  const out: [number, number][] = [];
  for (let i = 0; i < LASTSL && m.pic[i][0] < MONBL; i++) out.push(m.pic[i]);
  return out;
};

/** Two monsters that would stay side by side and change pictures together: same timing, same paths. */
function inStep(a: Monster, b: Monster): boolean {
  const pa = picsOf(a);
  const pb = picsOf(b);
  if (!pa.length || pa.length !== pb.length || pa.some((p, i) => p[1] !== pb[i][1])) return false;
  const path = (m: Monster) => JSON.stringify([m.march, m.towards, m.activate, m.fly, m.jump, m.thru]);
  return path(a) === path(b);
}

/** Monsters placed next to each other on these maps that move and animate as one: one group per frame. */
export function guessMonsterGroups(mons: Monster[], placed: PlacedMonster[][], count: number): Suggestion[] {
  const out: Suggestion[] = [];
  const keys = new Set<string>();
  for (const list of placed) {
    const live = list.filter((p) => p.monnum < LASTMON && mons[p.monnum]?.used);
    const byCell = new Map(live.map((p) => [p.cury * MLEN + p.curx, p]));
    const used = new Set<PlacedMonster>();
    for (const start of live) {
      if (used.has(start)) continue;
      // monsters in step with this one, joined cell to cell
      const comp = new Map<PlacedMonster, [number, number]>([[start, [0, 0]]]);
      const queue = [start];
      while (queue.length) {
        const p = queue.shift()!;
        const [c, r] = comp.get(p)!;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const q = byCell.get((p.cury + dy) * MLEN + p.curx + dx);
          if (!q || comp.has(q) || used.has(q) || !inStep(mons[start.monnum], mons[q.monnum])) continue;
          comp.set(q, [c + dx, r + dy]);
          queue.push(q);
        }
      }
      for (const p of comp.keys()) used.add(p);
      if (comp.size < 2) continue;
      const nums = [...comp.keys()].map((p) => p.monnum);
      const frames = picsOf(mons[start.monnum]).length;
      for (let k = 0; k < frames; k++) {
        const at = new Map<number, [number, number]>();
        let clash = false;
        for (const [p, pos] of comp) {
          const b = mons[p.monnum].pic[k][0];
          if (b >= count || at.has(b)) clash = true;
          else at.set(b, pos);
        }
        const g = !clash && place(`Monsters ${[...new Set(nums)].sort((p, q) => p - q).join(', ')}${frames > 1 ? ` · frame ${k + 1}` : ''}`, at);
        const key = g && `${g.cols}x${g.rows}:${g.cells.join(',')}`;
        if (!g || !key || keys.has(key)) continue;
        keys.add(key);
        out.push({ group: g, why: frames > 1 ? `placed side by side, frame ${k + 1} of ${frames}` : 'placed side by side' });
      }
    }
  }
  return out;
}

/** Each frame of the character's sequences: its top block over its bottom one (frames shown turned are left out). */
export function guessCharacterGroups(chr: Character, names: (i: number) => string = (i) => `Sequence ${i}`): Suggestion[] {
  const out: Suggestion[] = [];
  const keys = new Set<string>();
  chr.sequences.forEach((s, i) =>
    s.frames.slice(0, frameCount(s)).forEach((f, k) => {
      if (f.pic2 === MONBL || f.pic1 >= CHARBL || f.pic2 >= CHARBL || f.pic1 === f.pic2 || f.orient) return;
      const key = `${f.pic1},${f.pic2}`;
      if (keys.has(key)) return;
      keys.add(key);
      out.push({ group: { name: `${names(i)} ${k + 1}`, cols: 1, rows: 2, cells: [f.pic1, f.pic2] }, why: `${names(i).toLowerCase()}, frame ${k + 1}` });
    }),
  );
  return out;
}
