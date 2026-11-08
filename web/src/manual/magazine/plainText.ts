// A magazine page's words as plain items (no DOM), for the static magazine.html that search
// engines read (scripts/seoStaticPages.ts) and for tests. It reads the same blocks render.ts
// draws, and every block type is handled in the one switch below (a new one fails to compile
// until it is added here), so the two stay in step; magazineText.test.ts checks that every
// word a page's blocks hold is in the text. The words are the magazine's own, left as written
// (it is a 1990s magazine in the story). Pictures' alt text is not drawn and is left out.
import { plain } from './inline';
import type { Block, HalfAd, MagPage } from './types';

export interface TextItem {
  /** h3: a headline; h4: a smaller one; p: a paragraph or line; li: a list entry; q: a quotation or letter line. */
  tag: 'h3' | 'h4' | 'p' | 'li' | 'q';
  text: string;
}

const clean = (s: string) => plain(s).replace(/\s+/g, ' ').trim();

function adText(ad: Pick<HalfAd, 'head' | 'sub' | 'small' | 'blocks'> & { advertiser?: string; burst?: string }, out: TextItem[]): void {
  if (ad.advertiser) out.push({ tag: 'h4', text: clean(ad.advertiser) });
  if (ad.burst) out.push({ tag: 'p', text: clean(ad.burst) });
  out.push({ tag: 'h4', text: clean(ad.head) });
  if (ad.sub) out.push({ tag: 'p', text: clean(ad.sub) });
  blocksText(ad.blocks, out);
  if (ad.small) out.push({ tag: 'p', text: clean(ad.small) });
}

function blockText(b: Block, out: TextItem[]): void {
  const add = (tag: TextItem['tag'], text: string | undefined) => {
    const t = text === undefined ? '' : clean(text);
    if (t) out.push({ tag, text: t });
  };
  switch (b.t) {
    case 'head':
      add('p', b.kicker);
      add('h3', b.text);
      add('p', b.deck);
      break;
    case 'p':
    case 'note':
      add('p', b.text);
      break;
    case 'qa':
      add('q', b.who ? `${b.who}: ${plain(b.text)}` : b.text);
      break;
    case 'list':
      for (const i of b.items) add('li', i);
      break;
    case 'cols':
      blocksText(b.blocks, out);
      break;
    case 'grid':
      for (const cell of b.cells) blocksText(cell, out);
      break;
    case 'side':
      add('h4', b.title);
      blocksText(b.blocks, out);
      break;
    case 'pull':
      add('q', b.by ? `${plain(b.text)} (${b.by})` : b.text);
      break;
    case 'shot':
    case 'art':
    case 'cast':
    case 'disc':
    case 'floppy':
      add('p', b.caption);
      if ((b.t === 'disc' || b.t === 'floppy') && b.cover) add('p', b.cover.burst);
      break;
    case 'rows':
      for (const r of b.rows) {
        const by = [r.by, r.kind, r.price].filter(Boolean).join(', ');
        add('li', `${r.title}${by ? ` (${by})` : ''}${r.blurb ? `: ${plain(r.blurb)}` : ''}`);
        for (const [label] of r.more ?? []) add('li', label);
      }
      break;
    case 'hint':
      add('p', b.q);
      add('p', b.a);
      break;
    case 'card':
      add('h4', b.title);
      for (const l of b.lines) add('p', l);
      for (const f of b.fields ?? []) add('p', f);
      add('p', b.button);
      break;
    case 'adframe':
      adText({ ...b }, out);
      break;
    case 'halfad':
      adText(b, out);
      break;
    case 'beside':
      blocksText(b.blocks, out);
      adText(b.ad, out);
      break;
    case 'button':
      add('p', b.label);
      break;
    case 'masthead':
      add('h3', b.name);
      add('p', b.tagline);
      add('p', b.issue);
      add('p', b.price);
      break;
    case 'big':
      add('p', b.text);
      add('p', b.side);
      break;
    case 'callouts':
      for (const s of b.spots) {
        add('h4', s.title);
        add('p', s.text);
      }
      break;
    case 'covers':
      for (const c of b.covers) add('li', `${c.issue}: ${c.line}`);
      break;
    case 'reply':
      for (const t of b.to) add('p', t);
      break;
    case 'shelf':
      add('p', b.markText);
      for (const i of b.items) add('li', [i.title, i.by].filter(Boolean).join(', '));
      break;
    case 'pcnews':
      add('h4', b.banner);
      for (const i of b.items) {
        add('h4', i.title);
        for (const p of i.body) add('p', p);
        add('p', i.shot?.caption);
      }
      break;
    case 'jump':
      add('p', b.title);
      break;
    // the mugs' names are only their pictures' alt text (mugShelf.ts), which is not drawn
    case 'mugs':
    case 'piece':
    case 'rule':
      break;
    default: {
      const never: never = b;
      throw new Error(`a block with no text rule: ${JSON.stringify(never)}`);
    }
  }
}

/** The items of a list of blocks, in reading order. */
function blocksText(blocks: Block[], out: TextItem[] = []): TextItem[] {
  for (const b of blocks) blockText(b, out);
  return out;
}

/** A page's items. */
export const pageText = (pg: MagPage): TextItem[] => blocksText(pg.blocks);
