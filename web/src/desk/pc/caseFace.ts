// Two printed-on parts of the case front: the key lock (a chrome ring with a red arrow, the open and
// closed padlocks above it) and the SANDBOX badge with its sand castle. Both are only drawn.
import { h } from '../../editor/core/ui';

const NS = 'http://www.w3.org/2000/svg';

const el = (tag: string, attrs: Record<string, string>, ...kids: Element[]): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e;
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
 * center island (the cylinder) with a red index arrow, the open padlock above the left and the
 * closed one above the right. The arrow lies along the upper left notch, the one the key's nub
 * comes out of when unlocked, so it points toward the open padlock: the key is long lost, so it
 * stays unlocked.
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
    // the index arrow, turned 45 degrees to the upper left: in line with the notch at the upper left
    el(
      'g',
      { transform: 'rotate(-45)' },
      el('rect', { x: '-0.9', y: '-3', width: '1.8', height: '7', fill: '#d6291f' }),
      el('path', { d: 'M-2.8 -3 L0 -7 L2.8 -3 Z', fill: '#d6291f' }),
    ),
  );
  return h('span', { class: 'keylock' }, h('span', { class: 'lock-icons' }, padlock(true), padlock(false)), ring);
}

/**
 * The brand badge: a sand castle in a few flat colors over the one word SANDBOX, on a navy plate
 * with a gold rule. Sandbox is this project's own pretend maker, not any real brand.
 */
export function brandBadge(): HTMLElement {
  const sand = '#e3b866';
  const castle = el(
    'svg',
    { viewBox: '0 0 40 30', class: 'badge-art', 'aria-hidden': 'true' },
    el('rect', { x: '0', y: '0', width: '40', height: '30', fill: '#4aa3d8' }),
    el('circle', { cx: '33', cy: '6', r: '3.4', fill: '#ffd84a' }),
    // the keep and two towers with battlements, a door and a flag, on a sand beach
    el('path', { d: 'M12 25 V11 h3 v2 h2 v-2 h3 v2 h2 v-2 h3 v14 Z', fill: sand }),
    el('path', { d: 'M5 25 V15 h2.4 v-2 h2.4 v2 H12 v10 Z M28 25 V15 h2.4 v-2 h2.4 v2 H35 v10 Z', fill: sand }),
    el('path', { d: 'M17.5 25 v-5 a2.5 2.5 0 0 1 5 0 v5 Z', fill: '#a8772f' }),
    el('rect', { x: '19.7', y: '5', width: '0.7', height: '6', fill: '#5b574d' }),
    el('path', { d: 'M20.4 5 l4 1.6 -4 1.6 Z', fill: '#d6291f' }),
    el('path', { d: 'M0 25 Q10 23 20 25 T40 25 V30 H0 Z', fill: '#f0d08a' }),
  );
  return h('span', { class: 'brand-badge', role: 'img', 'aria-label': 'Sandbox' }, castle, h('b', null, 'SANDBOX'));
}
