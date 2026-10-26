// The block painter's mirror line for character blocks (.cbl): when the block has a linked
// mirror (made by the character editor's "as new mirrored blocks"), it says whether the two
// still match and offers "Apply to the mirror too", which redraws the linked block as this
// one mirrored left to right. The link lives in the companion file (the .cbl's 'mirrors').
import { h, clear } from '../../core/ui';
import type { Project } from '../../core/project';
import type { Block } from '../../../formats/blocks';
import { MIRROR, bakeOrient, mirrorInStep, mirrorOf, type BlockLink } from './characterMirror';

interface BlockMirrorBar {
  el: HTMLElement;
  /** Call after a paint or when another block is chosen. */
  refresh(): void;
}

export function blockMirrorBar(o: {
  project: Project;
  /** The .cbl file. */
  file: string;
  blocks: Block[];
  current: () => number;
  /** Replaces a block's pixels as one undo step of that block, and saves. */
  setPixels: (block: number, px: Uint8Array) => void;
}): BlockMirrorBar {
  const el = h('div', { class: 'toolbar blk-mirror', role: 'group', 'aria-label': 'Mirror block' });
  const links = () => o.project.extras<BlockLink[]>(o.file, 'mirrors', []);
  function refresh(): void {
    const n = o.current();
    const m = mirrorOf(links(), n);
    el.hidden = m === undefined || m >= o.blocks.length;
    if (m === undefined || m >= o.blocks.length) return clear(el);
    const inStep = mirrorInStep(o.blocks, n, m);
    clear(
      el,
      h('span', { class: 'meta' }, `⇆ Block ${m} is this one mirrored${inStep ? ', and matches' : ', but no longer matches'}.`),
      h(
        'button',
        {
          class: inStep ? '' : 'primary',
          disabled: inStep,
          title: `Redraw block ${m} as this block mirrored left to right`,
          onclick: () => {
            o.setPixels(m, bakeOrient(o.blocks[n].pixels, MIRROR));
            refresh();
          },
        },
        'Apply to the mirror too',
      ),
      h(
        'button',
        {
          title: `Forget that block ${m} is this one’s mirror (both pictures stay)`,
          onclick: () => {
            const rest = links().filter(([a, b]) => !((a === n && b === m) || (a === m && b === n)));
            o.project.setExtras(o.file, 'mirrors', rest.length ? rest : undefined);
            refresh();
          },
        },
        'Unlink',
      ),
    );
  }
  refresh();
  return { el, refresh };
}
