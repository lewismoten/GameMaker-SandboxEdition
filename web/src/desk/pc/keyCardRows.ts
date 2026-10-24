// What goes on a game's handwritten key card (desk/pc/keyCard.ts): one line per thing you can
// do, with every key that does it, so "Fire" is written once however many keys fire. The
// small card taped to the monitor is shorter still: arrows for the arrow keys, which go
// unsaid when all they do is move (everyone knows), and the other keys that only move (W A S
// D, the pad) on one "Move" line.
import type { GameKeyMap } from '../../editor/keymap/keyMap';
import { isMac, macShort } from '../../input/macKeys';

interface CardRow {
  keys: string[];
  does: string;
}

type Binding = GameKeyMap['keys'][number];

/** What a key does, in a few words: the first ways it is used, plus "…" when levels differ. */
function keyDoes(k: Binding, max = 2): string {
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

/** A key that does nothing but walk the player around, in every level. */
const onlyMoves = (k: Binding) => k.uses.every((u) => u.action.kind === 'move' || u.action.kind === 'nothing');

/** The card's lines. `compact` is for the small card: short key names and moves merged.
 * On a Mac (`mac`) keys it lacks are written the way to make them: "↑+←" for Home, after
 * "Home / Pad 7" on the big card, as one more key that does the same. */
export function cardRows(keys: Binding[], compact = false, mac = isMac()): CardRow[] {
  const keyNames = (k: Binding): string[] => {
    const m = macShort(k.scan, mac);
    if (compact) return [m ?? shortKey(k.name)];
    return m ? [k.name, m] : [k.name];
  };
  const add = (row: CardRow, k: Binding) => row.keys.push(...keyNames(k).filter((n) => !row.keys.includes(n)));
  const rows: CardRow[] = [];
  const byDoes = new Map<string, CardRow>();
  let moves: CardRow | undefined;
  for (const k of keys) {
    if (!k.uses.some((u) => u.action.kind !== 'nothing')) continue;
    if (compact && onlyMoves(k)) {
      if (ARROWS[k.name.split(' / ')[0].trim()]) continue; // arrow keys move: no need to say
      if (!moves) rows.push((moves = { keys: [], does: 'Move' }));
      add(moves, k);
      continue;
    }
    // an arrow key that does more than move: say what else it does ("↑ Push up")
    const arrow = compact && !!ARROWS[k.name.split(' / ')[0].trim()];
    const does = keyDoes(arrow ? { ...k, uses: k.uses.filter((u) => u.action.kind !== 'move') } : k, compact ? 1 : 2);
    const row = byDoes.get(does);
    if (row) add(row, k);
    else {
      const r = { keys: keyNames(k), does };
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
