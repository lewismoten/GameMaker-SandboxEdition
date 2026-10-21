// What goes on a game's handwritten key card (desk/keyCard.ts): one line per thing you can
// do, with every key that does it, so "Fire" is written once however many keys fire. The
// small card taped to the monitor is shorter still: arrows for the arrow keys, and the four
// ways to move on one line.
import type { GameKeyMap } from '../editor/keyMap';

export interface CardRow {
  keys: string[];
  does: string;
}

type Binding = GameKeyMap['keys'][number];

/** What a key does, in a few words: the first ways it is used, plus "…" when levels differ. */
export function keyDoes(k: Binding, max = 2): string {
  const titles = [...new Set(k.uses.map((u) => u.action.title))];
  return titles.length > max ? `${titles.slice(0, max).join(' / ')} …` : titles.join(' / ');
}

const ARROWS: Record<string, string> = { Up: '↑', Down: '↓', Left: '←', Right: '→' };
const DIRECTIONS = new Set(['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right']);

/** "Up / Pad 8" → "↑", "Space" → "Space": the first name of a key, as on its key cap. */
export function shortKey(name: string): string {
  const first = name.split(' / ')[0].trim();
  return ARROWS[first] ?? first;
}

/** The card's lines. `compact` is for the small card: short key names and moves merged. */
export function cardRows(keys: Binding[], compact = false): CardRow[] {
  const rows: CardRow[] = [];
  const byDoes = new Map<string, CardRow>();
  for (const k of keys) {
    if (!k.uses.some((u) => u.action.kind !== 'nothing')) continue;
    const does = keyDoes(k, compact ? 1 : 2);
    const name = compact ? shortKey(k.name) : k.name;
    const row = byDoes.get(does);
    if (row) {
      if (!row.keys.includes(name)) row.keys.push(name);
    } else {
      const r = { keys: [name], does };
      byDoes.set(does, r);
      rows.push(r);
    }
  }
  if (!compact) return rows;
  // "Move up", "Move left", … become one "Move" line (when there are at least two of them)
  const verb = (r: CardRow) => {
    const [v, dir, ...rest] = r.does.split(' ');
    return !rest.length && dir && DIRECTIONS.has(dir.toLowerCase()) ? v : undefined;
  };
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = verb(r);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const merged: CardRow[] = [];
  const into = new Map<string, CardRow>();
  for (const r of rows) {
    const v = verb(r);
    if (!v || (counts.get(v) ?? 0) < 2) {
      merged.push(r);
      continue;
    }
    const m = into.get(v);
    if (m) m.keys.push(...r.keys.filter((k) => !m.keys.includes(k)));
    else {
      const n = { keys: [...r.keys], does: v };
      into.set(v, n);
      merged.push(n);
    }
  }
  return merged;
}
