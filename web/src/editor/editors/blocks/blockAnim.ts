// A background block's animation as PLAYGAME's changeblks plays it: the block shows for its
// own ticks (1/18.2 s), then changes into its "changes into" block, which shows for its own
// ticks, and so on. A block with no time never starts changing; a block that changes into
// itself stops the chain. Once a block with no time has been passed, every later change comes
// on the very next tick (nxtchg is set to 0), as in the DOS game.
import type { Block } from '../../../formats/blocks';

interface AnimStep {
  block: number;
  /** Ticks shown; Infinity when the chain stops here. */
  ticks: number;
}

interface BlockAnim {
  steps: AnimStep[];
  /** The step the chain goes back to after the last one, or -1 when it stops. */
  loopTo: number;
}

export const TICK_HZ = 18.2;

export function blockAnim(blocks: Pick<Block, 'nextBl' | 'ntime'>[], start: number): BlockAnim {
  const b = (i: number) => blocks[i];
  if (!b(start) || b(start).ntime <= 0 || b(start).nextBl === start) return { steps: [{ block: start, ticks: Infinity }], loopTo: -1 };
  const steps: AnimStep[] = [];
  const seen = new Map<string, number>();
  let block = start;
  let fast = false;
  let dwell = b(start).ntime;
  for (;;) {
    const key = `${block}|${fast}`;
    const again = seen.get(key);
    if (again !== undefined) return { steps, loopTo: again };
    seen.set(key, steps.length);
    const next = b(block)?.nextBl;
    if (next === undefined || next === block || !b(next)) {
      steps.push({ block, ticks: Infinity });
      return { steps, loopTo: -1 };
    }
    steps.push({ block, ticks: dwell });
    if (b(block).ntime <= 0) fast = true;
    block = next;
    dwell = fast ? 1 : Math.max(1, b(block).ntime);
  }
}

/** A one-line summary: "12 → 13 → 14, then back to 12; 1.4 s around". */
export function describeAnim(a: BlockAnim): string {
  if (a.steps.length === 1 && a.loopTo < 0) return 'Does not change over time.';
  const chain = a.steps.map((s) => s.block).join(' → ');
  if (a.loopTo < 0) {
    const t = a.steps.slice(0, -1).reduce((n, s) => n + s.ticks, 0);
    return `${chain}, then stays (${(t / TICK_HZ).toFixed(1)} s).`;
  }
  const t = a.steps.slice(a.loopTo).reduce((n, s) => n + s.ticks, 0);
  return `${chain}, then back to ${a.steps[a.loopTo].block}; ${(t / TICK_HZ).toFixed(1)} s around.`;
}
