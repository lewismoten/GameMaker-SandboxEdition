// One page of NO CARRIER #3 (zinePages.ts) as a printed leaf: quarter-letter paper, 4.25 x 5.5
// inches, the same size on screen and in print (zineItem.ts lays four on a letter sheet). The
// text is real text; the cut-out ransom-note headings are read as their words. Each page's type
// is set as large as lets everything on it fit.
import './zine.css';
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from '../printables/kit';
import type { ZinePage } from './zinePages';

export const LEAF_W = 4.25;
export const LEAF_H = 5.5;

/** The type size, in hundredths of the leaf's width: the largest tried first, the smallest a page may need. */
const MOST = 4.2;
const LEAST = 1.8;
/** The width a leaf is measured at. */
const MEASURE_PX = 320;

/** A heading cut out of magazines: each letter its own scrap, read as the plain word. */
function ransom(text: string): HTMLElement {
  const looks = ['zr-a', 'zr-b', 'zr-c', 'zr-d', 'zr-e'];
  let n = 0;
  const letter = (ch: string) => h('span', { class: `zr ${looks[(n++ * 7 + ch.charCodeAt(0)) % looks.length]}`, style: `--r:${((n * 37) % 11) - 5}deg` }, ch);
  return h(
    'h2',
    { class: 'zine-ransom', 'aria-label': text },
    // each word kept together on its line
    ...text.split(' ').map((w) => h('span', { class: 'zr-word', 'aria-hidden': 'true' }, ...[...w].map(letter))),
  );
}

function pageBody(p: ZinePage, i: number): HTMLElement {
  return h(
    'article',
    { class: `zine-page${i === 0 ? ' cover' : ''}` },
    ransom(p.title),
    ...p.lines.map((l) => h('p', null, l)),
    p.list
      ? h(
          'ul',
          { class: 'zine-phones' },
          ...p.list.map(([who, num, what]) =>
            h('li', null, h('b', null, who), ' ', h('span', { class: 'zine-num' }, num), ' ', h('span', { class: 'zine-what' }, `— ${what}`)),
          ),
        )
      : null,
    ...(p.scrawl ?? []).map((s) => h('p', { class: 'zine-scrawl' }, h('span', { class: 'zine-arrow', 'aria-hidden': 'true' }, '➜ '), s)),
  );
}

/** Page `i` (from 0) on its leaf, its folio at the foot, its type fitted to the leaf. */
export function zineLeaf(p: ZinePage, i: number): Sheet {
  const s = sheet(LEAF_W, LEAF_H, 'zine', pageBody(p, i), h('p', { class: 'zine-folio', 'aria-hidden': 'true' }, `${i + 1}`));
  const inner = s.el.firstElementChild as HTMLElement;
  const size = (f: number) => inner.style.setProperty('--zf', String(f));
  // measured off screen at about a phone's width, where rounding makes text run longest
  const host = h('div', { class: 'gmb-measure' });
  document.body.append(host);
  s.el.style.width = `${MEASURE_PX}px`;
  host.append(s.el);
  const over = () => inner.scrollHeight > inner.clientHeight + 1;
  size(MOST);
  if (over()) {
    let lo = LEAST;
    let hi = MOST;
    for (let k = 0; k < 8; k++) {
      const mid = (lo + hi) / 2;
      size(mid);
      if (over()) hi = mid;
      else lo = mid;
    }
    // a little under the largest that fits: text wraps a hair differently at other sizes
    size(lo * 0.97);
  }
  host.remove();
  s.el.style.width = '';
  return s;
}

/** A blank leaf, to fill out the last letter sheet. */
export function blankLeaf(): Sheet {
  return sheet(LEAF_W, LEAF_H, 'zine zine-blank');
}
