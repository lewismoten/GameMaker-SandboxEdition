// Dex Dynamo's science report, THE POCKET TELEPHONE (types.ts DexReportItem): a cover and twenty pages of
// pencil on lined and graph paper, written the way an eleven-year-old would. It is the report Sparky 3000
// ate in In The Year 2000!, and it really explains how to build the Phone of the Future kit
// (games/year2000/phone). Pages are in dexReportPagesA/B/C.ts; the pencil sketches are in dexReportArt.ts.
import './paper.css'; // first: this piece's own styles build on the paper's
import './dexReport.css';
import { h } from '../../editor/core/ui';
import { sheet, html, type Sheet } from './kit';
import { fnv1a, xorshift32 } from '../../seededRandom';
import type { DexReportItem } from './types';
import type { DrPage } from './dexReportParts';
import { pagesA } from './dexReportPagesA';
import { pagesB } from './dexReportPagesB';
import { pagesC } from './dexReportPagesC';

export const DEX_PAGES: DrPage[] = [...pagesA, ...pagesB, ...pagesC];

/** Smudges from a pencil hand, placed the same way every time. */
function wear(rnd: () => number): HTMLElement {
  const bits: HTMLElement[] = [];
  for (let i = 0; i < 3; i++)
    bits.push(
      h('i', {
        class: 'dr-smudge',
        'aria-hidden': 'true',
        style: `left:${(rnd() * 80 + 5).toFixed(1)}%;top:${(rnd() * 85 + 4).toFixed(1)}%;--s:${(8 + rnd() * 14).toFixed(1)}cqw;--r:${(rnd() * 80 - 40).toFixed(0)}deg`,
      }),
    );
  return h('div', { class: 'dr-wear' }, ...bits);
}

export async function dexReportSheets(it: DexReportItem): Promise<Sheet[]> {
  return DEX_PAGES.map((p, i) => {
    const rnd = xorshift32(fnv1a(`dex${i}${it.title}`));
    const body = html('div', 'dr-in', p.body);
    const head = p.paper === 'cover' ? null : h('p', { class: 'dr-head' }, 'Dex Dynamo', h('br'), h('span', null, 'Moon School Science Fair'));
    const no = p.paper === 'cover' ? null : h('span', { class: 'dr-no' }, String(i));
    const holes = p.paper === 'cover' ? null : h('i', { class: 'dr-holes', 'aria-hidden': 'true' });
    const s = sheet(8.5, 11, `dr dr-${p.paper}`, wear(rnd), head, body, no, holes);
    s.el.setAttribute('role', 'group');
    s.el.setAttribute('aria-label', i === 0 ? 'Cover of THE POCKET TELEPHONE' : `Page ${i} of THE POCKET TELEPHONE`);
    return s;
  });
}
