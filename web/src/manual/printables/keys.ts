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
