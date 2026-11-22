// What a touch action button says. A game's controls.json names what each key does ("Throw a
// star"); the button shows that name, with the key as a small second line (a player with a
// keyboard learns it there) and the aria-label says the same ("Throw a star (Enter)"). Pure:
// touch.ts draws what this returns.
//
// The rule, so the name fits a round 58 to 64 px button: at most MAX_NAME characters, no word
// longer than MAX_WORD, and it wraps at spaces (two lines). A name that is too long, or a key
// with no entry, falls back to the key's own name; the aria-label still carries the full name.

/** The longest name drawn on a button, in characters. */
const MAX_NAME = 12;
/** The longest single word drawn on a button (a longer word would not fit the circle's width). */
const MAX_WORD = 8;

/** A controls.json (or any value) as scan code -> short name; entries without a usable short name are left out. */
export function keyNames(controls: unknown): Map<number, string> {
  const out = new Map<number, string>();
  const keys = controls && typeof controls === 'object' ? (controls as { keys?: unknown }).keys : undefined;
  if (!keys || typeof keys !== 'object') return out;
  for (const [scan, d] of Object.entries(keys)) {
    const short = d && typeof d === 'object' ? (d as { short?: unknown }).short : undefined;
    const n = Number(scan);
    if (typeof short === 'string' && short.trim() && Number.isInteger(n)) out.set(n, short.trim().replace(/\s+/g, ' '));
  }
  return out;
}

/** True when `name` fits a button (see MAX_NAME and MAX_WORD). */
export function nameFits(name: string): boolean {
  return name.length <= MAX_NAME && name.split(' ').every((w) => w.length <= MAX_WORD);
}

interface ActionLabel {
  /** The big text: the game's name for the key when it fits, else the key's name. */
  main: string;
  /** The small text under it: the key's name, only when `main` is the game's name. */
  key?: string;
  /** What assistive tech hears on an action button: exactly its visible text ("Throw a star (Enter)"), or the key's name, then the game's name ("G, Throw a star at the boss"). */
  aria: string;
  /** The same for a button that shows only the key's name (the fixed row): the key first, then what it does ("Enter, Pick up"). */
  plainAria: string;
}

/** The label for a key, given its short key name (touchLabel), its full key name and the game's name for it (if any). The accessible name always starts with the visible text (WCAG 2.5.3). */
export function actionLabel(keyShort: string, keyFull: string, name: string | undefined): ActionLabel {
  if (!name) return { main: keyShort, aria: keyFull, plainAria: keyFull };
  const plainAria = `${keyShort}, ${name}`;
  if (!nameFits(name)) return { main: keyShort, aria: plainAria, plainAria };
  if (name.toLowerCase() === keyShort.toLowerCase()) return { main: name, aria: name, plainAria };
  return { main: name, key: keyShort, aria: `${name} (${keyShort})`, plainAria };
}
