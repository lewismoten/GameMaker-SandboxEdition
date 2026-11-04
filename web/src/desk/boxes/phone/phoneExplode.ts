// How the phone's parts spread apart along its stacking axis (the height, y in the data, mm). Parts are
// gathered in stacks by group and side (the board is one stack, the anchor that stays put). Working out
// from the board, each stack moves just far enough to stand `gap` mm clear of the one inside it, so a
// shell, a dial or button caps added to the data need no code here: their own extents decide.
import type { Part } from './phoneData';

const GAP_MM = 30;

type Placed = Pick<Part, 'group' | 'side' | 'stack' | 'bbox'>;

interface Stack {
  key: string;
  /** Lowest and highest height of the stack's parts (mm). */
  lo: number;
  hi: number;
  /** Where a full explosion puts it (mm, up is positive). */
  offset: number;
}

/** The stack a part belongs to: the board in one piece, everything else by group and side. */
export const stackOf = (p: Pick<Part, 'group' | 'side' | 'stack'>): string =>
  p.group === 'board' ? 'board' : `${p.group}:${p.side}${p.stack ? `:${p.stack}` : ''}`;

/** Every stack and its offset for a full explosion. Front stacks rise above the board, outermost last (a shell reaching past a dial or the parts it covers goes beyond them); back stacks drop below it the same way. */
export function explodeStacks(parts: Placed[], gap = GAP_MM): Stack[] {
  const by = new Map<string, Stack>();
  for (const p of parts) {
    const key = stackOf(p);
    const s = by.get(key) ?? { key, lo: Infinity, hi: -Infinity, offset: 0 };
    s.lo = Math.min(s.lo, p.bbox[1]);
    s.hi = Math.max(s.hi, p.bbox[4]);
    by.set(key, s);
  }
  const all = [...by.values()];
  const mid = (s: Stack) => (s.lo + s.hi) / 2;
  const board = by.get('board');
  const anchor = board ? mid(board) : (Math.min(...all.map((s) => s.lo)) + Math.max(...all.map((s) => s.hi))) / 2;
  const up = all.filter((s) => s !== board && mid(s) >= anchor).sort((a, b) => a.hi - b.hi);
  const down = all.filter((s) => s !== board && mid(s) < anchor).sort((a, b) => b.lo - a.lo);
  let top = board ? board.hi : anchor;
  for (const s of up) {
    s.offset = Math.max(0, top + gap - s.lo);
    top = s.hi + s.offset;
  }
  let bottom = board ? board.lo : anchor;
  for (const s of down) {
    s.offset = Math.min(0, bottom - gap - s.hi);
    bottom = s.lo + s.offset;
  }
  return all;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** How far (mm) a stack with full offset `offset` has moved at explode amount `t` (0 assembled, 1 exploded), eased so it starts and lands gently. */
export const moved = (offset: number, t: number): number => offset * smooth(Math.max(0, Math.min(1, t)));
