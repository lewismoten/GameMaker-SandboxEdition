// How a talk is laid out, the way Tune-Up's banter cards do it. PLAYGAME writes a .TXT over the
// picture before it (PLAYGAME.C Display_File): 8x8 letters from x 40, y 40, a row every 8 pixels,
// all in one ink, 16 rows at most. So the picture draws everything else (the bubbles, the names,
// the people), and the .TXT holds only the words, with a blank row left where each name goes.
import { TALKS, type Speaker, type TalkId, type Turn } from './text';

/** Letters across a row of words (PLAYGAME reads 31 at a time; a 31st would break a line of its own). */
export const COLS = 28;
/** Where PLAYGAME starts writing, and the height of a row. */
export const TX = 40;
export const TY = 40;
export const ROW = 8;
/** Rows PLAYGAME shows. */
export const ROWS = 16;

/** Words wrapped to `COLS` letters a row. */
function wrapRows(s: string): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    if (line && (line + ' ' + word).length > COLS) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

/** A turn placed on a card: who, the row its name is lettered on, and its rows of words. */
export interface Placed {
  who: Speaker;
  row: number;
  words: string[];
}

/** Where each turn of a card goes: a name row, the words, and a blank row between turns. */
export function layout(card: Turn[]): Placed[] {
  let row = 0;
  const out: Placed[] = [];
  for (const [who, say] of card) {
    const words = wrapRows(say);
    out.push({ who, row, words });
    row += 1 + words.length + 1;
  }
  if (row - 1 > ROWS) throw new Error(`a card needs ${row - 1} rows; PLAYGAME shows ${ROWS}: "${card[0][1]}"`);
  return out;
}

/** The card's .TXT: a blank row where each name is lettered, then the words. */
export function cardText(card: Turn[]): string {
  const lines: string[] = [];
  for (const p of layout(card)) {
    while (lines.length < p.row) lines.push('');
    lines.push('', ...p.words);
  }
  return lines.join('\n') + '\n';
}

/** Whole seconds to read a card: about 3 and a quarter second a word, never under 8. */
export function cardSeconds(card: Turn[]): number {
  const words = card
    .map((t) => t[1])
    .join(' ')
    .split(/\s+/).length;
  return Math.max(8, Math.ceil(3 + 0.25 * words));
}

/** Everyone in a talk, in the order they first speak: each keeps one place in every card's picture. */
export function cast(id: TalkId): Speaker[] {
  const out: Speaker[] = [];
  for (const card of TALKS[id]) for (const [who] of card) if (!out.includes(who)) out.push(who);
  return out;
}

/** File name of a card (its picture is the same base, `.gif`). */
export const cardFile = (id: TalkId, n: number) => `${id}${n + 1}`;
