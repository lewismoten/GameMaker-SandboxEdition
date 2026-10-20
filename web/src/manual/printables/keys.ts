// The keys for the quick-reference card: every key bound in the game's .CHR files, worded
// from printables.json or, failing that, from the manual's own key tables, plus the keys
// PLAYGAME always has.

/** What PLAYGAME itself does with these keys, whatever the game. */
export const PLAYGAME_KEYS: [string, string][] = [
  ['F1', 'Help'],
  ['F2', 'Status: score, hit points, lives, inventory'],
  ['F3', 'Music on / off'],
  ['F4', 'Sound effects on / off'],
  ['F5', 'Save the game'],
  ['F6', 'Load a saved game'],
  ['Esc', 'Quit to the menu'],
];

const ALIASES: Record<string, string> = { '↑': 'Up', '↓': 'Down', '←': 'Left', '→': 'Right', spacebar: 'Space', escape: 'Esc' };

/** "Up / Pad 8" -> "Up"; "↑" -> "Up"; "z" -> "Z". */
export function keyLabel(name: string): string {
  const first = name.split(' / ')[0].trim();
  const alias = ALIASES[first] ?? ALIASES[first.toLowerCase()];
  if (alias) return alias;
  return first.length === 1 ? first.toUpperCase() : first;
}

/**
 * Pairs of key labels and what they do, read from manual HTML tables whose first cell holds
 * <kbd> keys and whose second cell says what they do.
 */
export function manualKeyText(html: string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const [, row] of html.join('').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1]);
    if (cells.length < 2) continue;
    const kbds = [...cells[0].matchAll(/<kbd[^>]*>([\s\S]*?)<\/kbd>/gi)].map((m) => plain(m[1]));
    const text = plain(cells[1]);
    if (!kbds.length || !text) continue;
    // "P / D" in one cell with "Pick up / drop" splits in two
    const keys = kbds.flatMap((k) => k.split(/\s*\/\s*|\s+/).filter(Boolean));
    const parts = text.split(/\s*\/\s*/);
    keys.forEach((k, i) => {
      const label = keyLabel(k.replace(/[()]/g, ''));
      if (!out.has(label)) out.set(label, keys.length === parts.length ? parts[i] : text);
    });
  }
  return out;
}

const ENTITIES: Record<string, string> = { uarr: '↑', darr: '↓', larr: '←', rarr: '→', amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ' };

/** Text of a bit of HTML. */
function plain(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&(\w+);/g, (m, e: string) => ENTITIES[e] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CardKey {
  key: string;
  does: string;
}

/** The card's rows: bound keys first (in the order found), then PLAYGAME's own. */
export function cardKeys(bound: string[], fromManual: Map<string, string>, overrides: Record<string, string> = {}): CardKey[] {
  const seen = new Set<string>();
  const rows: CardKey[] = [];
  for (const raw of bound) {
    const key = keyLabel(raw);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ key, does: overrides[key] ?? fromManual.get(key) ?? 'Special move' });
  }
  for (const [key, does] of PLAYGAME_KEYS) {
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ key, does: overrides[key] ?? fromManual.get(key) ?? does });
  }
  return rows;
}

// ------------------------------------------------------------------ moving

export type Dir = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

/** A key bound in a .CHR file, with how its sequence moves the character. */
export interface BoundKey {
  /** PLAYGAME's name for it ("Up / Pad 8", "Home / Pad 7", "W"). */
  name: string;
  /** Total motion of the sequence, in pixels. */
  dx: number;
  dy: number;
  /** The sequence's frames, so two keys running the same moves can be matched. */
  sig: string;
}

/** Keys that are directions whatever they do. */
const DIR_OF_KEY: Record<string, Dir> = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
  Home: 'up-left',
  PgUp: 'up-right',
  End: 'down-left',
  PgDn: 'down-right',
};

/** Letters that stand in for directions when their moves agree. */
const LETTER_DIR: Record<string, Dir> = { W: 'up', A: 'left', S: 'down', D: 'right', Q: 'up-left', E: 'up-right', Z: 'down-left', C: 'down-right' };

export const DIR_ORDER: Dir[] = ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];
export const DIR_ARROW: Record<Dir, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  'up-left': '↖',
  'up-right': '↗',
  'down-left': '↙',
  'down-right': '↘',
};
/** Number pad key for each direction. */
export const DIR_PAD: Record<Dir, string> = { up: '8', down: '2', left: '4', right: '6', 'up-left': '7', 'up-right': '9', 'down-left': '1', 'down-right': '3' };

function dirOfMotion(dx: number, dy: number): Dir | undefined {
  const h = dx > 0 ? 'right' : dx < 0 ? 'left' : '';
  const v = dy < 0 ? 'up' : dy > 0 ? 'down' : '';
  return ((v && h ? `${v}-${h}` : v || h) || undefined) as Dir | undefined;
}

export interface MoveRow {
  dir: Dir;
  /** Card labels of the keys that move this way ("Up", "W"); the pad key is implied for arrows. */
  keys: string[];
  /** Also on the number pad (arrows always are: Up is Pad 8). */
  pad: boolean;
  does: string;
}

/**
 * Splits the bound keys into directions (arrows, number pad corners, and letters such as
 * W A S D Q E that run the same moves as an arrow or move the way their place on the keyboard
 * says) and everything else.
 */
export function splitKeys(
  bound: BoundKey[],
  fromManual: Map<string, string>,
  overrides: Record<string, string> = {},
): { moves: MoveRow[]; actions: CardKey[] } {
  const dirSig = new Map<string, Dir>();
  for (const b of bound) {
    const d = DIR_OF_KEY[keyLabel(b.name)];
    if (d && !dirSig.has(b.sig)) dirSig.set(b.sig, d);
  }
  const rows = new Map<Dir, MoveRow>();
  const other: string[] = [];
  const seen = new Set<string>();
  for (const b of bound) {
    const key = keyLabel(b.name);
    if (seen.has(key)) continue;
    seen.add(key);
    let dir = DIR_OF_KEY[key];
    if (!dir && LETTER_DIR[key]) {
      const same = dirSig.get(b.sig);
      if (same) dir = same;
      else if (dirOfMotion(Math.sign(b.dx), Math.sign(b.dy)) === LETTER_DIR[key]) dir = LETTER_DIR[key];
    }
    if (!dir) {
      other.push(b.name);
      continue;
    }
    let row = rows.get(dir);
    if (!row) rows.set(dir, (row = { dir, keys: [], pad: false, does: '' }));
    if (b.name.includes('Pad')) row.pad = true;
    row.keys.push(key);
    row.does ||= overrides[key] ?? fromManual.get(key) ?? '';
  }
  const moves = DIR_ORDER.filter((d) => rows.has(d)).map((d) => {
    const r = rows.get(d)!;
    // arrows first, then letters
    r.keys.sort((a, b) => Number(!DIR_OF_KEY[a]) - Number(!DIR_OF_KEY[b]));
    r.does ||= `Move ${d}`;
    return r;
  });
  return { moves, actions: cardKeys(other, fromManual, overrides) };
}
