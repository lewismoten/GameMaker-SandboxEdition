// The level check's maze check: on a map seen from above (no gravity), a big area of one-block
// passages with many dead ends is a maze; it should have landmarks (blocks that differ from
// the plain floor) and dead ends worth the walk (a pickup in them).
import { BACKBL, type Block } from '../../../formats/blocks';
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import type { SceneData } from '../sceneData';

const open = (b: Block | undefined) => !!b && b.solid !== 15;

export interface Maze {
  cells: number[];
  deadEnds: number[];
  junctions: number[];
  /** Blocks used in the maze other than its floor. */
  landmarks: number;
  /** Dead ends with something to pick up in or next to them. */
  paying: number;
  floor: number;
}

/** Open neighbors of a cell (4 ways). */
function ways(blocks: Uint8Array, bg: Block[], i: number): number[] {
  const x = i % MLEN;
  const y = Math.floor(i / MLEN);
  const out: number[] = [];
  if (x > 0 && open(bg[blocks[i - 1]])) out.push(i - 1);
  if (x < MLEN - 1 && open(bg[blocks[i + 1]])) out.push(i + 1);
  if (y > 0 && open(bg[blocks[i - MLEN]])) out.push(i - MLEN);
  if (y < MWID - 1 && open(bg[blocks[i + MLEN]])) out.push(i + MLEN);
  return out;
}

/** The mazes of a map: open areas made mostly of narrow passages with many dead ends. */
export function findMazes(blocks: Uint8Array, bg: Block[]): Maze[] {
  const seen = new Uint8Array(blocks.length);
  const out: Maze[] = [];
  for (let s = 0; s < blocks.length; s++) {
    if (seen[s] || !open(bg[blocks[s]])) continue;
    const cells: number[] = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      cells.push(c);
      for (const n of ways(blocks, bg, c)) if (!seen[n]) ((seen[n] = 1), stack.push(n));
    }
    if (cells.length < 40) continue;
    const deadEnds = cells.filter((c) => ways(blocks, bg, c).length === 1);
    const narrow = cells.filter((c) => ways(blocks, bg, c).length <= 2).length;
    if (deadEnds.length < 6 || narrow / cells.length < 0.6) continue;
    const use = new Map<number, number>();
    for (const c of cells) use.set(blocks[c], (use.get(blocks[c]) ?? 0) + 1);
    const floor = [...use].sort((a, b) => b[1] - a[1])[0][0];
    const pickup = (c: number) => {
      const b = bg[blocks[c]];
      return b.obj || b.scorePts > 0 || b.chHitPt > 0 || (b.effect > 0 && b.eamt > 0);
    };
    out.push({
      cells,
      deadEnds,
      junctions: cells.filter((c) => ways(blocks, bg, c).length >= 3),
      landmarks: [...use.keys()].filter((n) => n !== floor && n < BACKBL && !pickup(cells.find((c) => blocks[c] === n)!)).length,
      paying: deadEnds.filter((c) => pickup(c) || ways(blocks, bg, c).some(pickup)).length,
      floor,
    });
  }
  return out;
}

export function mazes(d: SceneData): Finding[] {
  if (d.bbl.some((b) => b.grav)) return [];
  const out: Finding[] = [];
  for (const m of findMazes(d.map.blocks, d.bbl)) {
    const bare = m.landmarks === 0;
    const poor = m.paying < m.deadEnds.length / 4;
    if (!bare && !poor) continue;
    out.push({
      check: 'maze',
      severity: bare ? 'warning' : 'info',
      title: `A maze of ${m.cells.length} cells near ${at(m.cells[0])}: ${m.deadEnds.length} dead ends, ${m.paying} with a prize${bare ? ', and every passage looks the same' : ''}`,
      detail: bare ? 'Give each wing its own floor, or put a landmark at the crossroads.' : 'Put something worth the walk in more of the dead ends.',
      where: { scene: d.scene, map: d.names.map, cell: m.junctions[0] ?? m.cells[0], cells: [...m.deadEnds] },
      fix: bare ? 'landmark' : undefined,
    });
  }
  return out;
}
