// Two printed-on parts of the case front: the key lock (a chrome ring with an index mark between an
// open and a closed padlock) and the brand badge (a one inch square). Both are only drawn.
import { h } from '../../editor/core/ui';

const NS = 'http://www.w3.org/2000/svg';

const el = (tag: string, attrs: Record<string, string>, ...kids: Element[]): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e as SVGElement;
};

const stops = (...s: [string, string][]): SVGElement[] => s.map(([offset, c]) => el('stop', { offset, 'stop-color': c }));

/** A padlock icon: shackle swung open (up and to the side) or closed. */
function padlock(open: boolean): SVGElement {
  return el(
    'svg',
    { viewBox: '0 0 10 13', class: `lock-icon ${open ? 'open' : 'closed'}`, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3' },
    el('path', { d: open ? 'M2.4 6V3.6a2.6 2.6 0 0 1 5 -0.9' : 'M2.4 6V3.6a2.6 2.6 0 0 1 5.2 0V6' }),
    el('rect', { x: '1', y: '6', width: '8', height: '6', rx: '1', fill: 'currentColor', stroke: 'none' }),
  );
}

/**
 * The key lock: a chrome ring with two keyway notches at 45 degrees at the top left and right, a
 * center island (the cylinder) with a red index mark, an open padlock printed on the left and a
 * closed one on the right. The mark points at the open one: the key is long lost, so it stays
 * unlocked.
 */
export function keyLock(): HTMLElement {
  const notch = (deg: number) => el('rect', { x: '-1.3', y: '-13.4', width: '2.6', height: '4.4', fill: '#2b2924', transform: `rotate(${deg})` });
  const ring = el(
    'svg',
    { viewBox: '-14 -14 28 28', class: 'keylock-svg' },
    el(
      'defs',
      {},
      el('radialGradient', { id: 'kl-chrome', cx: '0.35', cy: '0.3', r: '0.9' }, ...stops(['0', '#fbfbf7'], ['0.45', '#b9b6ad'], ['1', '#6f6c64'])),
      el('radialGradient', { id: 'kl-island', cx: '0.4', cy: '0.35', r: '0.8' }, ...stops(['0', '#f1eee4'], ['1', '#9c988c'])),
    ),
    el('circle', { r: '13', fill: 'url(#kl-chrome)', stroke: '#6f6c64', 'stroke-width': '0.6' }),
    notch(-45),
    notch(45),
    el('circle', { r: '8.4', fill: '#7a766b' }),
    el('circle', { r: '7.6', fill: 'url(#kl-island)', stroke: '#5b574d', 'stroke-width': '0.5' }),
    // the index mark on the island, turned toward the open padlock on the left
    el('rect', { x: '-7', y: '-1', width: '7', height: '2', rx: '0.6', fill: '#d6291f' }),
  );
  return h('span', { class: 'keylock' }, padlock(true), ring, padlock(false));
}

/**
 * The brand badge, 25.4 mm square. The maker is made up, a plain 1990s clone builder: TRIVALE,
 * with the model under it. Not any real brand.
 */
export function brandBadge(): HTMLElement {
  return h('span', { class: 'brand-badge', role: 'img', 'aria-label': 'Trivale 486 DX2' }, h('b', null, 'TRIVALE'), h('small', null, '486 DX2'));
}
