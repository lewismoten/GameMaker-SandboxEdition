// What goes on a game's handwritten key card (desk/pc/keyCard.ts): one line per thing you can
// do, with every key that does it, so "Fire" is written once however many keys fire. Moving
// comes first, on one "Move" line with a little 3×3 drawing of the arrow keys that move (the
// four arrows, and the corners between them: Home ↖, PgUp ↗, End ↙, PgDn ↘), then the
// actions. A corner is drawn as a diagonal arrow; the player makes it with that key, or by
// holding the two arrows either side of it at once (input/chords.ts, on every keyboard, for
// any corner the game uses), which a Mac, having no Home or keypad, writes only that way.
import type { GameKeyMap } from '../../editor/keymap/keyMap';
import { isMac, macShort } from '../../input/macKeys';

/** A key as written on the card ("Space", "Home ↖"), and on the big card how to make it on a Mac. */
export interface Cap {
  key: string;
  how?: string;
}

export interface CardRow {
  keys: Cap[];
  does: string;
  /** The Move line's arrow pad: 9 cells, row by row (↖ ↑ ↗ / ← · → / ↙ ↓ ↘), each the arrow it moves, or empty. */
  pad?: (string | undefined)[];
}

export interface Card {
  rows: CardRow[];
  /** How to make the corners with two arrows ("↖ ↗ = two arrows at once"), when there are any. */
  note?: string;
}

type Binding = GameKeyMap['keys'][number];

/** The arrow keys and the keypad corners, by scan code, and where each sits on the 3×3 pad. */
const ARROWS: Record<number, string> = { 72: '↑', 80: '↓', 75: '←', 77: '→' };
const CORNERS: Record<number, string> = { 71: '↖', 73: '↗', 79: '↙', 81: '↘' };
const PAD_CELL: Record<number, number> = { 71: 0, 72: 1, 73: 2, 75: 3, 76: 4, 77: 5, 79: 6, 80: 7, 81: 8 };
/** The two arrows held together that make a corner (or the keypad's center, 5). */
const TOGETHER: Record<number, string> = { 71: '↑ and ←', 73: '↑ and →', 79: '↓ and ←', 81: '↓ and →', 76: '↑ and ↓' };
const PAD5 = 76;
const DIRECTIONS = new Set(['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right']);

/** What a key does, in a few words: the first ways it is used, plus "…" when levels differ. */
function keyDoes(k: Binding, max = 2): string {
  const titles = [...new Set(k.uses.map((u) => u.action.title))];
  return titles.length > max ? `${titles.slice(0, max).join(' / ')} …` : titles.join(' / ');
}

/** "Up / Pad 8" → "Up", "Space" → "Space": the first name of a key, as on its key cap. */
function shortKey(name: string): string {
  return name.split(' / ')[0].trim();
}

const used = (k: Binding) => k.uses.some((u) => u.action.kind !== 'nothing');

/** A key that does nothing but walk the player around, in every level. */
const onlyMoves = (k: Binding) => used(k) && k.uses.every((u) => u.action.kind === 'move' || u.action.kind === 'nothing');

/** The one way a key moves the player ("↖"), when every level agrees. */
function moveArrow(k: Binding): string | undefined {
  const arrows = new Set(k.uses.filter((u) => u.action.kind === 'move').map((u) => u.action.short));
  return arrows.size === 1 ? [...arrows][0] : undefined;
}

/** "Move", "Push" or "Move / Push": what the Move line's keys do. */
function moveWord(keys: Binding[]): string {
  const verbs = new Set(keys.flatMap((k) => k.uses.filter((u) => u.action.kind === 'move').map((u) => u.action.title.split(' ')[0])));
  return verbs.size === 1 ? [...verbs][0] : 'Move';
}

/**
 * A key as the card writes it. The arrow keys are arrows, a corner is its diagonal arrow
 * after the key ("Home ↖", "Home ↖ / Pad 7"), and on a Mac, which lacks those keys, the
 * diagonal arrow alone (the big card says which two arrows make it).
 */
function capsOf(k: Binding, compact: boolean, mac: boolean): Cap[] {
  const name = compact ? shortKey(k.name) : k.name;
  const arrow = ARROWS[k.scan];
  if (arrow) return [{ key: compact ? arrow : name.replace(/^\w+/, arrow) }];
  const corner = CORNERS[k.scan];
  if (corner || k.scan === PAD5) {
    if (mac) return [{ key: corner ?? '↑↓', how: compact ? undefined : `${TOGETHER[k.scan]} together` }];
    return [{ key: corner ? name.replace(/^\S+/, (n) => `${n} ${corner}`) : compact ? '5' : name }];
  }
  const m = macShort(k.scan, mac); // fn ⌫ for Del, ⌥ option for Alt
  if (compact) return [{ key: m ?? name }];
  return m ? [{ key: name }, { key: m }] : [{ key: name }];
}

/**
 * The card's lines, Move first. `compact` is the small card taped to the monitor: short key
 * names, and "Move up", "Move left" … merged into one line. `mac` writes the keys a Mac lacks
 * the way a Mac makes them.
 */
export function keyCard(keys: Binding[], compact = false, mac = isMac()): Card {
  const add = (row: CardRow, caps: Cap[]) => row.keys.push(...caps.filter((c) => !row.keys.some((r) => r.key === c.key)));
  // the keys that only move: on the pad (arrows and corners) or written beside it
  const movers = keys.filter(onlyMoves);
  const pad: (string | undefined)[] = Array(9).fill(undefined);
  const move: CardRow = { keys: [], does: moveWord(movers), pad };
  for (const k of movers) {
    const cell = PAD_CELL[k.scan];
    if (cell !== undefined && k.scan !== PAD5) {
      pad[cell] = moveArrow(k) ?? ARROWS[k.scan] ?? CORNERS[k.scan];
      // the big card on a PC names the corner keys too (the pad shows what the arrows do)
      if (!compact && !mac && CORNERS[k.scan]) add(move, [{ key: `${shortKey(k.name)} ${CORNERS[k.scan]}` }]);
      continue;
    }
    // a letter that moves: the big card says which way ("W ↑")
    const arrow = compact ? undefined : moveArrow(k);
    add(
      move,
      capsOf(k, compact, mac).map((c) => (arrow ? { ...c, key: `${c.key} ${arrow}` } : c)),
    );
  }
  if (!pad.some(Boolean)) delete move.pad;
  const rows: CardRow[] = move.pad || move.keys.length ? [move] : [];

  const byDoes = new Map<string, CardRow>();
  for (const k of keys) {
    if (!used(k) || onlyMoves(k)) continue;
    const does = keyDoes(k, compact ? 1 : 2);
    const row = byDoes.get(does);
    if (row) add(row, capsOf(k, compact, mac));
    else {
      const r = { keys: capsOf(k, compact, mac), does };
      byDoes.set(does, r);
      rows.push(r);
    }
  }
  const card: Card = { rows: compact ? mergeMoves(rows) : rows };
  // the corners on the card, and on a Mac the keypad's center (↑↓): two arrows held at once
  const chords = keys.filter((k) => used(k) && (CORNERS[k.scan] || (mac && k.scan === PAD5)));
  if (chords.length === 1) card.note = `${CORNERS[chords[0].scan] ?? '↑↓'} = ${TOGETHER[chords[0].scan]} at once`;
  else if (chords.length > 1) card.note = `${chords.map((k) => CORNERS[k.scan] ?? '↑↓').join(' ')} = two arrows at once`;
  return card;
}

/** "Jump left", "Jump right" (two or more with the same verb, and a plain "Jump") become one "Jump" line on the small card. */
function mergeMoves(rows: CardRow[]): CardRow[] {
  const directed = (r: CardRow) => {
    if (r.pad) return undefined;
    const [v, dir, ...rest] = r.does.split(' ');
    return !rest.length && dir && DIRECTIONS.has(dir.toLowerCase()) ? v : undefined;
  };
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = directed(r);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  // a plain "Jump" joins "Jump left" and "Jump right" on their line
  const verb = (r: CardRow) => directed(r) ?? (!r.pad && counts.has(r.does) ? r.does : undefined);
  const merged: CardRow[] = [];
  const into = new Map<string, CardRow>();
  for (const r of rows) {
    const v = verb(r);
    if (!v || (counts.get(v) ?? 0) < 2) {
      merged.push(r);
      continue;
    }
    const m = into.get(v);
    if (m) m.keys.push(...r.keys.filter((k) => !m.keys.some((c) => c.key === k.key)));
    else {
      const n = { keys: [...r.keys], does: v };
      into.set(v, n);
      merged.push(n);
    }
  }
  return merged;
}
