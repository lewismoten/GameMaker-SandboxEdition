// Name Level Map scenes and join their arrival and exit marks.
import { type Point, type Game, NOSCENE, ENDTYPE, STARTTYPE, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

type MarkKind = 'start' | 'exit' | 'end';

/** A mark on a Level Map: where you arrive (in `scenes`), or a way out (to `scenes`). */
export interface LevelMark extends Point {
  kind: MarkKind;
  scenes: number[];
  /** Cells across and down: side-by-side cells going the same way are one mark (a wide door). */
  w: number;
  h: number;
  /** Said instead of the scene numbers: a way to another room of the same scene ("Booth 1"). */
  text?: string;
}

/**
 * The marks for a map: where the hero arrives in each of its scenes (the "to" block of every
 * link into it) and every way out (a link's "from" block, to the scenes it leads to; the end
 * of the game is its own kind). A cell in `hidden` is never marked.
 */
export function levelMarks(game: Game, scenes: number[], hidden: ReadonlySet<number> = new Set()): LevelMark[] {
  const marks = new Map<string, LevelMark>();
  const put = (kind: MarkKind, p: Point, scene: number) => {
    if (p.x < 0 || p.y < 0 || p.x >= MLEN || p.y >= MWID || hidden.has(p.y * MLEN + p.x)) return;
    const key = `${kind}:${p.x},${p.y}`;
    const m = marks.get(key) ?? { kind, x: p.x, y: p.y, scenes: [], w: 1, h: 1 };
    if (!m.scenes.includes(scene)) m.scenes.push(scene);
    marks.set(key, m);
  };
  const mine = new Set(scenes);
  const real = (n: number) => n !== NOSCENE && !!game.scenes[n] && game.scenes[n].gametype !== NOSCENE;
  game.scenes.forEach((s) => {
    for (const l of s.links) if (real(l.toScene) && mine.has(l.toScene)) put('start', l.to, l.toScene);
  });
  for (const i of scenes)
    for (const l of game.scenes[i].links) {
      if (!real(l.toScene)) continue;
      put(game.scenes[l.toScene].gametype === ENDTYPE ? 'end' : 'exit', l.from, l.toScene);
    }
  const order: Record<MarkKind, number> = { start: 0, exit: 1, end: 2 };
  const cells = [...marks.values()].map((m) => ({ ...m, scenes: m.scenes.sort((a, b) => a - b) }));
  return joinNeighbors(cells).sort((a, b) => order[a.kind] - order[b.kind] || a.y - b.y || a.x - b.x);
}

/** Marks of one kind to the same scenes on touching cells (a row of door blocks) as one mark round them all. */
function joinNeighbors(marks: LevelMark[]): LevelMark[] {
  const key = (m: LevelMark) => `${m.kind}:${m.scenes.join(',')}`;
  const left = [...marks];
  const out: LevelMark[] = [];
  while (left.length) {
    const group = [left.shift()!];
    for (let k = 0; k < group.length; k++) {
      const g = group[k];
      for (let j = left.length - 1; j >= 0; j--) {
        const o = left[j];
        if (key(o) === key(g) && Math.abs(o.x - g.x) <= 1 && Math.abs(o.y - g.y) <= 1) group.push(...left.splice(j, 1));
      }
    }
    const x0 = Math.min(...group.map((m) => m.x));
    const y0 = Math.min(...group.map((m) => m.y));
    const x1 = Math.max(...group.map((m) => m.x + m.w - 1));
    const y1 = Math.max(...group.map((m) => m.y + m.h - 1));
    out.push({ ...group[0], x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  return out;
}

/** A mark's label: the scene numbers (the title screen is ★, the end ⚑), "4, 7" or "4–9" for a run. */
export function markLabel(game: Game, scenes: number[]): string {
  const name = (n: number) => (game.scenes[n]?.gametype === ENDTYPE ? '⚑' : game.scenes[n]?.gametype === STARTTYPE ? '★' : String(n));
  const parts: string[] = [];
  for (let k = 0; k < scenes.length;) {
    let j = k;
    while (j + 1 < scenes.length && scenes[j + 1] === scenes[j] + 1 && game.scenes[scenes[j + 1]]?.gametype === ADVTYPE) j++;
    parts.push(
      j - k >= 2
        ? `${scenes[k]}–${scenes[j]}`
        : scenes
            .slice(k, j + 1)
            .map(name)
            .join(', '),
    );
    k = j + 1;
  }
  return parts.join(', ');
}
