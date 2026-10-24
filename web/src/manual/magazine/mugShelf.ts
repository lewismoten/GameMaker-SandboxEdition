// A `mugs` block (types.ts): white mugs in a row on a shelf, each wearing one of the desk mug's
// pictures (desk/mug/mugArt.ts: a Sandbox Software game's badge or the BBS's), for the mug ad
// (sections/mugAd.ts). The pictures are drawn by the mug's own code, loaded when the page is,
// and handed over as images so they print; a mug whose picture can't be had is left plain.
import './mugShelf.css';
import { h } from '../../editor/core/ui';
import type { Block } from './types';

type MugsBlock = Extract<Block, { t: 'mugs' }>;

export function mugShelf(b: MugsBlock, pending: Promise<unknown>[]): HTMLElement {
  const pictures = b.mugs.map(({ name }) => h('img', { alt: `A white mug with ${name}`, width: 344, height: 240 }));
  pending.push(
    import('../../desk/mug/mugArt')
      .then(({ isDesign, loadDesign }) =>
        Promise.all(
          b.mugs.map(async ({ design }, i) => {
            if (!isDesign(design)) return;
            pictures[i].src = (await loadDesign(design)).toDataURL();
          }),
        ),
      )
      .catch(() => {}),
  );
  return h(
    'div',
    { class: 'mag-mugs' },
    ...pictures.map((img) =>
      h('span', { class: 'mag-mug' }, h('span', { class: 'mag-mug-body' }, img), h('span', { class: 'mag-mug-handle', 'aria-hidden': 'true' })),
    ),
  );
}
