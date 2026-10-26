// A hint book's cover (also drawn small in the magazine's hint book ads, magazine/piece.ts).
// Every Sandbox Software hint book wears the same trade dress: the red OFFICIAL band, the
// title, the price sticker on the picture's corner, the how-to box and the publisher's logo
// at the foot. Between them is the game's own art (hintCoverArt.ts): its hero drawn large in
// front of one of its scenes, on a ground in the box's colors, so each book is known at a
// glance.
import './paper.css'; // first: this piece's own styles build on the paper's
import './hintCover.css';
import { h } from '../../editor/core/ui';
import { sandboxLogo, sheet, type PrintContext, type Sheet } from './kit';
import { redCode } from './redFilm';
import { coverArt } from './hintCoverArt';
import type { HintBookItem } from './types';

/** What a hint book costs on its cover (the magazine's order cards say the same). */
const PRICE = '$5.95';

export async function hintBookCover(ctx: PrintContext, it: HintBookItem): Promise<Sheet> {
  const art = await coverArt(ctx.entry, it.cover);
  const picture = h(
    'div',
    { class: `hb-art${art.scene ? '' : ' empty'}` },
    art.scene ? h('img', { class: 'hb-scene', src: art.scene, alt: '' }) : null,
    art.hero ? h('img', { class: 'hb-hero', src: art.hero.src, alt: '', style: `aspect-ratio:${art.hero.w} / ${art.hero.h}` }) : null,
    h('div', { class: 'hb-price' }, h('span', null, 'ONLY'), h('b', null, PRICE)),
  );
  const s = sheet(
    5.5,
    8.5,
    'hb hb-cover',
    h('div', { class: 'hb-band' }, 'OFFICIAL'),
    h('h2', null, it.title),
    h('p', { class: 'hb-sub' }, ctx.entry.title),
    picture,
    h(
      'div',
      { class: 'hb-howto' },
      h('b', null, 'HOW TO USE THIS BOOK'),
      h('p', null, it.intro ?? 'Find your question, then lay the red film over the answer below it. Only read what you need!'),
      redCode('Like this: you found it!'),
    ),
    ctx.printables.skip?.includes('worldmap')
      ? null
      : h(
          'p',
          { class: 'hb-mapref' },
          h('b', null, 'LOST? '),
          'Unfold the World Map that came in your box: it shows every scene, numbered, and every way from one to the next.',
        ),
    h('div', { class: 'hb-foot' }, sandboxLogo('hb-logo'), h('span', null, 'RED FILM INCLUDED')),
  );
  const sec = s.el.firstElementChild as HTMLElement;
  sec.style.setProperty('--hb-bg', art.background);
  sec.style.setProperty('--hb-acc', art.accent);
  return s;
}
