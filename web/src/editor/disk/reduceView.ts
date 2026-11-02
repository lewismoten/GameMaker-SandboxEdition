// The Optimize dialog's "Colors outside their range": per block file that draws with colors reserved for
// another kind of block, the blocks before and after (worst first), a difference score, and an Apply
// that is separate from the other steps because it changes how the game looks.
import { h } from '../core/ui';
import { FLAG_MEAN, FLAG_WORST } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import { pictureCanvas } from './pictureCanvas';
import type { Reduction } from './reduceColors';

function thumb(r: Reduction, pixels: Uint8Array, label: string): HTMLElement {
  const c = pictureCanvas({ width: 20, height: 20, pixels, palette: r.palette });
  c.className = 'disk-block-thumb';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', label);
  return c;
}

export function reduceView(list: Reduction[], apply: (r: Reduction) => void): HTMLElement | null {
  if (!list.length) return null;
  return h(
    'div',
    { class: 'disk-reduce' },
    h('h3', null, 'Colors outside their range'),
    h(
      'p',
      null,
      'Your palette reservations say which colors each kind of block may use: its own range plus the colors nobody reserved. These files draw with colors reserved for something else. Each would move those pixels to the nearest allowed color. This changes how the game looks, so it is never part of the automatic steps; look at the blocks first.',
    ),
    ...list.map((r) => {
      const big = r.score.flagged.length > 0;
      return h(
        'details',
        { class: 'disk-reduce-file' },
        h('summary', null, r.title, big ? ' (a big change)' : ''),
        h(
          'p',
          { role: 'status' },
          `Difference: the pixels that move change by ${r.score.mean.toFixed(1)} on average (CIELAB delta E) and ${r.score.worst.toFixed(1)} at most. ${
            big
              ? `${r.score.flagged.length} block${r.score.flagged.length === 1 ? ' is' : 's are'} flagged (average over ${FLAG_MEAN} or a pixel over ${FLAG_WORST}); `
              : ''
          }the first ${r.shown.length} changed blocks are shown, flagged ones first.`,
        ),
        h(
          'div',
          { class: 'disk-block-row' },
          ...r.shown.map((s) =>
            h(
              'figure',
              { class: 'disk-block' },
              h('div', { class: 'disk-reduce-pair' }, thumb(r, s.before, `Block ${s.n} before`), thumb(r, s.after, `Block ${s.n} after`)),
              h('figcaption', null, `${s.n}: before, after`),
            ),
          ),
        ),
        h('button', { type: 'button', onclick: () => apply(r) }, `Apply to ${r.file} (${r.changedBlocks} block${r.changedBlocks === 1 ? '' : 's'})`),
      );
    }),
    h(
      'p',
      { class: 'hint' },
      'The score measures the colors, not how a level reads: check contrast against the neighbors, and rerun the Color vision check afterward.',
    ),
  );
}
