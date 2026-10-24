// Builders for the magazine's blocks (types.ts Block), so a section reads like the page it
// makes: head('…'), p('…'), side('…', [...]), shot('teddy', 'level', '…'), card(…), ad(…).
import type { Block, Inline, ListingRow, MagPage, Tone, ArtId } from './types';
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
export const side = (title: string, blocks: Block[], tone: Tone = 'yellow'): Block => ({ t: 'side', title, tone, blocks });
export const pull = (text: Inline, by?: string): Block => ({ t: 'pull', text, by });
/** A screenshot drawn from the game itself: its title screen or the first level. */
export const shot = (game: string, view: 'title' | 'level', alt: string, caption?: Inline, tilt?: number): Block => ({
  t: 'shot',
  game,
  view,
  alt,
  caption,
  tilt,
});
export const art = (id: ArtId, alt: string, caption?: Inline): Block => ({ t: 'art', art: id, alt, caption });
export const rows = (r: ListingRow[]): Block => ({ t: 'rows', rows: r });
/** A hint: the answer is printed upside down under the question. */
export const hint = (q: Inline, a: string, game?: string): Block => ({ t: 'hint', q, a, game });
/** An order card with a dotted cut line: lines of text, blank fields to fill in, and a link. */
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
