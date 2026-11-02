// The Disk space dialog's "Blocks that look the same": per block set, the groups of blocks drawn
// alike (picture of each, and how many map cells draw it), then the same-shape-other-color
// families, which are shown but never joined (a scene has one palette).
import { h } from '../core/ui';
import type { LevelPicture } from '../../gfx/levelPicture';
import { foldedCount, type LookSet } from './lookAlikes';
import { pictureCanvas } from './pictureCanvas';

function thumb(set: LookSet, n: number, caption?: string): HTMLElement {
  const pic: LevelPicture = { width: 20, height: 20, pixels: set.blocks[n].pixels, palette: set.palettes[0] };
  const c = pictureCanvas(pic);
  c.className = 'disk-block-thumb';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', `Block ${n}`);
  return h('figure', { class: 'disk-block' }, c, h('figcaption', null, caption ?? `${n}`));
}

const row = (set: LookSet, nums: number[], note: string, mark?: (n: number) => string) =>
  h('li', null, h('div', { class: 'disk-block-row' }, ...nums.map((n) => thumb(set, n, mark?.(n) ?? `${n}`))), h('p', { class: 'hint' }, note));

export function lookAlikeView(sets: LookSet[]): HTMLElement | null {
  const shown = sets.filter((s) => s.groups.length || s.colorVariants.length || s.pinnedGroups.length || s.skipped);
  if (!shown.length) return null;
  return h(
    'div',
    { class: 'disk-lookalike' },
    h('h3', null, 'Blocks that look the same'),
    h(
      'p',
      null,
      'Blocks drawn the same colors, with the same rules, can be one block. These are found by comparing the pixels in every palette the set is shown with. Nothing changes until you apply.',
    ),
    ...shown.map((s) => {
      const n = foldedCount(s.groups);
      return h(
        'details',
        null,
        h(
          'summary',
          null,
          s.skipped ? `${s.bbl}: not checked (${s.skipped})` : `${s.bbl}: ${n} block${n === 1 ? '' : 's'} ${n === 1 ? 'looks' : 'look'} like another`,
        ),
        h(
          'ul',
          { class: 'disk-lookalike-groups' },
          ...s.groups.map((g) =>
            row(
              s,
              [g.keep, ...g.fold],
              `Block ${g.fold.join(', ')} would become block ${g.keep}: ${g.fold.reduce((a, f) => a + (s.cells.get(f) ?? 0), 0)} map cells change number.`,
              (b) => (b === g.keep ? `${b} (stays)` : `${b}`),
            ),
          ),
          ...s.pinnedGroups.map((m) =>
            row(s, m, `Blocks ${m.join(', ')} look the same but each is a pickup, a required item or a starting item, so they keep their numbers.`),
          ),
          ...s.colorVariants.map((m) =>
            row(
              s,
              m.slice(0, 8),
              `Blocks ${m.join(', ')} share a shape in different colors. A scene has one palette, so they stay as they are${m.length > 8 ? ' (first eight shown)' : ''}.`,
            ),
          ),
        ),
      );
    }),
    h(
      'p',
      { class: 'hint' },
      'The tool compares the files only: it can’t see a palette you change while the game runs, or a level you meant to recolor later.',
    ),
  );
}
