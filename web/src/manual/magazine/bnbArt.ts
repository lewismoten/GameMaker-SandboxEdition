// The pictures for the Bits & Bytes Software spread (sections/bitsBytesAd.ts): three turned
// retail boxes, the store's logo, a price with its cents raised, a title lockup, a vertical
// section tab and Bitsy the floppy disk. The boxes are real renders of the desk's own box art
// (public/magazine/box-<name>.webp, 800 x 920, clear background).
//
// To render them again: run the dev server on a spare port (`npx vite --port 5190 --strictPort`
// in web/), then with playwright-core (channel 'chrome') open `#/desk` in a fresh context, wait
// for the Game-Maker box's `.tile canvas`s, and in the page `import('/src/desk/boxes/boxViewer.ts')`
// `boxModel(faces)` with faces from `drawBox(entry)` (gameBox.ts, entries from
// `loadCatalog()`) or `drawGmBox(tiles)` (gmBox.ts), set `--u:78px` and
// `transform: rotateX(-14deg) rotateY(-34deg)` (teddy3, gm; snowbound 34deg) inside a
// `perspective:1500px` stage, hide the rest of the page, and screenshot `{ omitBackground: true,
// clip: { x: 400, y: 60, width: 800, height: 920 } }`; `cwebp -q 82 -m 6 -alpha_q 90`.
import './bnbAd.css';
import { h } from '../../editor/core/ui';
import { svgArt } from './svgArt';
import type { ArtId } from './types';

export type BnbArt = Extract<ArtId, `bnb-${string}`>;

const box = (name: string, alt: string, cls = '') =>
  h('img', { src: `./magazine/box-${name}.webp`, alt, width: 800, height: 920, class: `bnb-box ${cls}`.trim() });

/** Bitsy: a smiling floppy disk in sneakers, one arm up. */
const BITSY =
  '<path d="M20 14H78a4 4 0 0 1 4 4V76a4 4 0 0 1-4 4H26L16 70V18a4 4 0 0 1 4-4Z" fill="#1346c8" stroke="#0b1a33" stroke-width="3"/>' +
  '<rect x="34" y="58" width="32" height="22" fill="#c9ccd2" stroke="#0b1a33" stroke-width="2"/><rect x="38" y="62" width="8" height="14" fill="#1346c8"/>' +
  '<rect x="26" y="20" width="48" height="32" fill="#fff6e0" stroke="#0b1a33" stroke-width="2"/><rect x="26" y="25" width="48" height="4" fill="#e0242b"/>' +
  '<circle cx="39" cy="38" r="3.4" fill="#0b1a33"/><circle cx="61" cy="38" r="3.4" fill="#0b1a33"/><path d="M38 44q12 9 24 0" fill="none" stroke="#0b1a33" stroke-width="3" stroke-linecap="round"/>' +
  '<path d="M82 40q14-4 12-22" fill="none" stroke="#0b1a33" stroke-width="4" stroke-linecap="round"/><circle cx="94" cy="16" r="5" fill="#ffd21f" stroke="#0b1a33" stroke-width="2"/>' +
  '<path d="M16 54q-12 6-12 18" fill="none" stroke="#0b1a33" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M34 80v14M62 80v14" stroke="#0b1a33" stroke-width="4"/><path d="M26 98q0-6 8-6t8 6v2H26ZM54 98q0-6 8-6t8 6v2H54Z" fill="#e0242b" stroke="#0b1a33" stroke-width="2"/>';

const bitsy = (alt: string, cls: string) => svgArt('0 0 100 104', BITSY, alt, cls);

/** Dollars with raised cents, as the 1993 catalogs set a price. */
const price = (dollars: string, cents: string, label: string, was?: string) =>
  h(
    'div',
    { class: 'bnb-price', role: 'group', 'aria-label': `${label}: $${dollars}.${cents}${was ? `, was ${was}` : ''}` },
    h('span', { class: 'bnb-price-label', 'aria-hidden': 'true' }, label),
    h('span', { class: 'bnb-price-num', 'aria-hidden': 'true' }, `$${dollars}`, h('sup', null, cents)),
    was ? h('s', { 'aria-hidden': 'true' }, was) : null,
  );

/** The store's mark: Bitsy, the name over SOFTWARE, and a phone number to call. */
const logo = (alt: string) =>
  h(
    'div',
    { class: 'bnb-logo', role: 'img', 'aria-label': alt },
    bitsy('', 'bnb-logo-mascot'),
    h(
      'span',
      { class: 'bnb-logo-words', 'aria-hidden': 'true' },
      h('b', null, 'BITS & BYTES'),
      h('i', null, 'SOFTWARE'),
      h('em', null, 'Call 1-412-555-0147 for the store nearest you!'),
    ),
  );

/** A picture for an `art` block of the spread. */
export function bnbElement(id: BnbArt, alt: string): Element {
  switch (id) {
    case 'bnb-teddy3':
      return box('teddy3', alt);
    case 'bnb-pair':
      return h('div', { class: 'bnb-pair', role: 'img', 'aria-label': alt }, box('gm', '', 'gm'), box('snowbound', '', 'snow'));
    case 'bnb-title':
      return h(
        'div',
        { class: 'bnb-title', role: 'img', 'aria-label': alt },
        h('small', { 'aria-hidden': 'true' }, 'SANDBOX SOFTWARE PRESENTS'),
        h('b', { 'aria-hidden': 'true' }, 'TEDDY’S LITTLE BIGGEST ADVENTURE'),
        h('i', { 'aria-hidden': 'true' }, 'The last of the trilogy!'),
      );
    case 'bnb-price-teddy':
      return price('4', '99', 'ONLY', undefined);
    case 'bnb-price-gm':
      return price('48', '00', 'SALE', '$59.95');
    case 'bnb-tab-left':
      return h('div', { class: 'bnb-tab', 'aria-hidden': 'true' }, h('span', null, 'SANDBOX'), h('b', null, '+'), h('span', null, 'BIZARRE'));
    case 'bnb-tab-right':
      return h('div', { class: 'bnb-tab', 'aria-hidden': 'true' }, h('span', null, 'BUILD'), h('b', null, '+'), h('span', null, 'PLAY'));
    case 'bnb-logo':
      return logo(alt);
    case 'bnb-bitsy':
      return h('div', { class: 'bnb-says' }, bitsy(alt, 'bnb-bitsy'), h('span', { class: 'bnb-bubble', 'aria-hidden': 'true' }, 'Make your own!'));
  }
}
