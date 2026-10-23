// The block painter's look-and-check panel: the block tiled 3 x 3 (to see its seams), its
// animation playing with PLAYGAME's timing (background blocks), and where it is used. Only
// shows things; the block set is never changed here.
import { h, clear } from '../../core/ui';
import { paintIndexed } from '../../core/draw';
import { BLEN, type Block } from '../../../formats/blocks';
import type { Palette } from '../../../formats/palette';
import type { Project } from '../../core/project';
import { blockUses } from '../../core/uses';
import { blockAnim, describeAnim, TICK_HZ } from './blockAnim';

export interface Insight {
  el: HTMLElement;
  /** Redraws the tiles after a paint; `all` also restarts the animation and lists the uses (another block, or its settings changed). */
  refresh(all?: boolean): void;
  dispose(): void;
}

export function blockInsight(o: {
  project: Project;
  file: string;
  blocks: Block[];
  current: () => number;
  pal: () => Palette;
  sprites: boolean;
  open: (file: string) => void;
}): Insight {
  const tile = h('canvas', {
    class: `pixel blk-tile${o.sprites ? ' checker' : ''}`,
    role: 'img',
    'aria-label': 'The block repeated 3 by 3, to check that its edges meet',
  });
  const anim = h('canvas', { class: `pixel blk-anim${o.sprites ? ' checker' : ''}`, role: 'img', 'aria-label': 'The block’s animation as the game plays it' });
  const animText = h('p', { class: 'meta blk-anim-text', 'aria-live': 'off' });
  const usesList = h('ul', { class: 'blk-uses' });
  const usesHead = h('h3', null, 'Used in');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let refreshUses: ReturnType<typeof setTimeout> | undefined;

  function drawTile(): void {
    const px = o.blocks[o.current()].pixels;
    const big = new Uint8Array(BLEN * 3 * BLEN * 3);
    for (let y = 0; y < BLEN * 3; y++) for (let x = 0; x < BLEN * 3; x++) big[y * BLEN * 3 + x] = px[(y % BLEN) * BLEN + (x % BLEN)];
    paintIndexed(tile, big, BLEN * 3, BLEN * 3, o.pal(), o.sprites);
  }

  function playAnim(): void {
    clearTimeout(timer);
    const a = blockAnim(o.blocks, o.current());
    animText.textContent = describeAnim(a);
    let k = 0;
    const show = () => {
      const s = a.steps[k];
      paintIndexed(anim, o.blocks[s.block].pixels, BLEN, BLEN, o.pal(), o.sprites);
      if (!Number.isFinite(s.ticks)) return;
      k = k + 1 < a.steps.length ? k + 1 : a.loopTo;
      if (k < 0) return;
      timer = setTimeout(show, (s.ticks * 1000) / TICK_HZ);
    };
    show();
  }

  function listUses(): void {
    const uses = blockUses(o.project, o.file, o.current());
    usesHead.textContent = `Block ${o.current()} is used in`;
    clear(
      usesList,
      ...(uses.length
        ? uses.map((u) =>
            h('li', null, u.file === o.file ? u.text : h('button', { class: 'blk-use-link', title: `Open ${u.file}`, onclick: () => o.open(u.file) }, u.text)),
          )
        : [
            h(
              'li',
              { class: 'meta' },
              o.project.usesOf(o.file).length
                ? 'Nothing yet: no map, monster or hero of the scenes that use this set shows it.'
                : 'No scene uses this block set yet, so nothing shows it.',
            ),
          ]),
    );
  }

  const el = h(
    'details',
    { class: 'panel blk-insight', open: true },
    h('summary', null, 'Preview & uses'),
    h(
      'div',
      { class: 'blk-insight-row' },
      h('figure', null, tile, h('figcaption', { class: 'meta' }, 'Tiled 3 × 3')),
      o.file.endsWith('.bbl') ? h('figure', null, anim, h('figcaption', { class: 'meta' }, 'In the game')) : null,
    ),
    o.file.endsWith('.bbl') ? animText : null,
    usesHead,
    usesList,
  );

  return {
    el,
    refresh(all = false) {
      drawTile();
      if (!all) return;
      if (o.file.endsWith('.bbl')) playAnim();
      // map and monster files are read again, so only once a burst of changes settles
      clearTimeout(refreshUses);
      refreshUses = setTimeout(listUses, 300);
    },
    dispose() {
      clearTimeout(timer);
      clearTimeout(refreshUses);
    },
  };
}
