// The matching rules for Overview › Files search: case-insensitive "contains" on whitespace-split
// words (every word must appear in the same part), and a snippet cut around the first hit for
// showing under a card. No DOM, so it is unit tested on its own.

/** One searchable piece of an entry: a short label ("Line 3") and its text. */
export interface Part {
  label: string;
  text: string;
}

/** The words of a query, lower case; empty when there is nothing to look for. */
export function queryWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** True when the text holds every word of the query. */
export function matches(text: string, words: string[]): boolean {
  if (!words.length) return false;
  const low = text.toLowerCase();
  return words.every((w) => low.includes(w));
}

/** The parts that match, in order. */
export function matchingParts(parts: Part[], words: string[]): Part[] {
  return parts.filter((p) => matches(p.text, words));
}

/** A piece of a snippet, `hit` when it is matched text. */
export interface Piece {
  text: string;
  hit: boolean;
}

/** The text split into hit and plain pieces, cut to about `max` characters around the first hit (… marks a cut). */
export function snippet(text: string, words: string[], max = 60): Piece[] {
  const flat = text.replace(/\s+/g, ' ').trim();
  const low = flat.toLowerCase();
  const spots: [number, number][] = [];
  for (const w of words) {
    for (let at = low.indexOf(w); at >= 0; at = low.indexOf(w, at + w.length)) spots.push([at, at + w.length]);
  }
  spots.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const s of spots) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([...s]);
  }
  let from = 0;
  let to = flat.length;
  if (flat.length > max) {
    const first = merged[0]?.[0] ?? 0;
    from = Math.max(0, Math.min(first - Math.floor(max / 4), flat.length - max));
    to = Math.min(flat.length, from + max);
  }
  const out: Piece[] = [];
  const push = (t: string, hit: boolean) => t && out.push({ text: t, hit });
  if (from > 0) push('…', false);
  let at = from;
  for (const [a, b] of merged) {
    if (b <= from || a >= to) continue;
    const s = Math.max(a, from);
    const e = Math.min(b, to);
    push(flat.slice(at, s), false);
    push(flat.slice(s, e), true);
    at = e;
  }
  push(flat.slice(at, to), false);
  if (to < flat.length) push('…', false);
  return out;
}
