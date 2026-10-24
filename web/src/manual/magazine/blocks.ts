// Builders for the magazine's blocks (types.ts Block), so a section reads like the page it
// makes: head('…'), p('…'), side('…', [...]), shot('teddy', 'level', '…'), card(…), ad(…).
import type { Block, Inline, ListingRow, MagPage, Tone, ArtId, ShotView } from './types';
import type { Go } from './go';

type HeadOpts = { kicker?: string; deck?: Inline; size?: 'xl' | 'l' | 'm' | 's'; level?: 1 | 2 | 3 };

export const head = (text: string, o: HeadOpts = {}): Block => ({ t: 'head', text, ...o });
export const p = (text: Inline, o: { drop?: boolean; lead?: boolean } = {}): Block => ({ t: 'p', text, ...o });
/** The magazine asks (bold, no name). */
export const q = (text: Inline): Block => ({ t: 'qa', text });
/** Someone answers: their name in capitals before the words. */
export const a = (who: string, text: Inline): Block => ({ t: 'qa', who, text });
export const list = (items: Inline[], ordered = false): Block => ({ t: 'list', items, ordered });
export const cols = (n: 2 | 3, blocks: Block[]): Block => ({ t: 'cols', n, blocks });
/** Cells side by side, wrapping below `min` (a fraction of the page width, default 0.28). */
export const grid = (cells: Block[][], min?: number): Block => ({ t: 'grid', cells, min });
/** A boxed sidebar; `level` is its heading's level (3 by default; 2 on a page whose only heading is its title). */
export const side = (title: string, blocks: Block[], tone: Tone = 'yellow', level?: 2 | 3): Block => ({ t: 'side', title, tone, blocks, level });
export const pull = (text: Inline, by?: string): Block => ({ t: 'pull', text, by });
/** A screenshot drawn from the game itself: its title screen, the first level, or a design tool on it. */
export const shot = (game: string, view: ShotView, alt: string, caption?: Inline, tilt?: number): Block => ({
  t: 'shot',
  game,
  view,
  alt,
  caption,
  tilt,
});
export const art = (id: ArtId, alt: string, caption?: Inline): Block => ({ t: 'art', art: id, alt, caption });
/** A cast member's portrait (public/cast/<id>.png), at its own pixel size `w` x `h`. */
export const portrait = (id: string, alt: string, w: number, h: number, caption?: Inline): Block => ({ t: 'cast', id, alt, w, h, caption });
export const rows = (r: ListingRow[]): Block => ({ t: 'rows', rows: r });
/** A hint: the answer is printed upside down under the question. */
export const hint = (q: Inline, a: string, game?: string): Block => ({ t: 'hint', q, a, game });
/**
 * An order card with a dotted cut line: lines of text, blank fields to fill in, and a link. Order
 * forms, postcards and registration cards are white card stock (the default); give `tone` only
 * to a small coupon.
 */
export const card = (title: string, lines: Inline[], o: { fields?: string[]; go?: Go; button?: string; tone?: Tone } = {}): Block => ({
  t: 'card',
  title,
  lines,
  ...o,
});
/** A full-page ad's frame: a starburst, a headline, what it says, and the small print. */
export const adframe = (head: string, blocks: Block[], o: { burst?: string; sub?: Inline; small?: Inline; tone?: Tone } = {}): Block => ({
  t: 'adframe',
  head,
  blocks,
  ...o,
});
export const button = (go: Go, label: string): Block => ({ t: 'button', go, label });
export const note = (text: Inline): Block => ({ t: 'note', text });
/** A piece of the paper in a game's box drawn small (a hint book's cover), linking to `go`. */
export const piece = (game: string, what: 'hintbook', alt: string, o: { go?: Go; float?: 'left' | 'right' } = {}): Block => ({
  t: 'piece',
  game,
  piece: what,
  alt,
  ...o,
});
/** The Ultimate Owner's Guide's front cover drawn small, linking to `go`. */
export const ultimatePiece = (alt: string, o: { go?: Go; float?: 'left' | 'right' } = {}): Block => ({ t: 'piece', piece: 'ultimate', alt, ...o });
/** A line set huge (a price, a phone number), with a small note beside it. */
export const big = (text: string, side?: Inline): Block => ({ t: 'big', text, side });
export const rule = (): Block => ({ t: 'rule' });

/** A full-page ad: no running head, listed in the advertiser index under `advertiser`. */
export const adPage = (id: string, advertiser: string, blocks: Block[], tone: Tone = 'white'): MagPage => ({ id, kind: 'ad', title: advertiser, tone, blocks });

/** A section agent's placeholder page: what will be here, so the issue has its shape already. */
export function stubPage(title: string, what: string[], id?: string): MagPage {
  return {
    id,
    kind: 'dept',
    stub: true,
    tone: 'news',
    blocks: [
      head(title, { kicker: 'Coming in this section', size: 'l' }),
      list(what),
      note('This page is being written. Its links will open the games and pages it names.'),
    ],
  };
}
