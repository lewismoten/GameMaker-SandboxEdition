// Which block each cell shows `tick` ticks after the level starts, worked out from the timed blocks the same way PLAYGAME
// does (block k of a ring turns into the next after its ticks; the first change is its own ticks after the start).
import type { Level } from '../src/levels';

/** The block name each timed block shows `tick` ticks in. */
export function shownAt(level: Level, tick: number): Map<string, string> {
  const next = new Map(level.timed.map((t) => [t.name, t]));
  const out = new Map<string, string>();
  for (const t of level.timed) {
    let name = t.name;
    let due = t.ticks;
    // a chain is short; walk it until the time is reached or it ends on a block that never changes
    for (let i = 0; i < 1000 && due <= tick; i++) {
      const at = next.get(name)!;
      name = at.next;
      const following = next.get(name);
      if (!following) break;
      due += following.ticks;
    }
    out.set(t.name, name);
  }
  return out;
}

/** The level's map with every timed block swapped for the one it shows at `tick`. */
export function mapAt(level: Level, tick: number) {
  const m = level.map.done();
  const shown = shownAt(level, tick);
  const blocks = Uint8Array.from(m.blocks);
  const names = [...level.book.index.keys()];
  for (let i = 0; i < blocks.length; i++) {
    const to = shown.get(names[blocks[i]]);
    if (to) blocks[i] = level.book.n(to);
  }
  return { ...m, blocks };
}
