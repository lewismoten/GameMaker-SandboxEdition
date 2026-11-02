// The Optimize dialog's palette reservation parts: the proposal for a game that has none (a strip of
// the palette with the ranges named under it, what moving the colors in would do, a button that
// saves them to the companion) and "Make a reserved range the same in every palette" (before and
// after blocks, a delta E score, Apply). Previews are real renders of the game's own blocks.
import { FLAG_MEAN, FLAG_WORST } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { h } from '../core/ui';
import { pictureCanvas } from './pictureCanvas';
import type { RangeSync } from './rangeSync';
import type { ReservationProposal } from './reservePlan';

const LABEL = { monster: 'Monsters', character: 'Characters' } as const;

function strip(p: ReservationProposal): HTMLElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 1;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(256, 1);
  for (let i = 0; i < 256; i++) img.data.set([vga8(p.palette[i * 3]), vga8(p.palette[i * 3 + 1]), vga8(p.palette[i * 3 + 2]), 255], i * 4);
  ctx.putImageData(img, 0, 0);
  c.setAttribute('role', 'img');
  c.setAttribute(
    'aria-label',
    `The game's first palette, 256 colors, with ${p.ranges.map((r) => `${LABEL[r.role].toLowerCase()} ${r.first} to ${r.last}`).join(' and ')} proposed`,
  );
  return h(
    'div',
    { class: 'disk-strip' },
    c,
    h(
      'div',
      { class: 'disk-strip-ranges', 'aria-hidden': 'true' },
      ...p.ranges.map((r, i) =>
        h(
          'span',
          { class: 'disk-strip-range', style: `left:${(r.first / 256) * 100}%;width:${((r.last - r.first + 1) / 256) * 100}%;top:${i % 2 ? 1.3 : 0}em` },
          `${LABEL[r.role]} ${r.first}-${r.last}`,
        ),
      ),
    ),
  );
}

function thumb(pixels: Uint8Array, palette: Uint8Array, label: string): HTMLElement {
  const c = pictureCanvas({ width: 20, height: 20, pixels, palette });
  c.className = 'disk-block-thumb';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', label);
  return c;
}

function syncBody(s: RangeSync, apply?: (s: RangeSync) => void): HTMLElement[] {
  const big = s.score.flagged.length > 0;
  const out: HTMLElement[] = [
    h(
      'p',
      { role: 'status' },
      s.lossless
        ? 'No scene draws differently: the colors already match wherever it is drawn.'
        : `Difference: the pixels that change look different by ${s.score.mean.toFixed(1)} on average (CIELAB delta E) and ${s.score.worst.toFixed(1)} at most. ${
            big
              ? `${s.score.flagged.length} block${s.score.flagged.length === 1 ? ' is' : 's are'} flagged (average over ${FLAG_MEAN} or a pixel over ${FLAG_WORST}). `
              : ''
          }`,
      s.changedBlocks ? ` ${s.changedBlocks} block${s.changedBlocks === 1 ? '' : 's'} change; the first ${s.shown.length} are shown, worst first.` : '',
    ),
    h(
      'div',
      { class: 'disk-block-row' },
      ...s.shown.map((x) =>
        h(
          'figure',
          { class: 'disk-block' },
          h(
            'div',
            { class: 'disk-reduce-pair' },
            thumb(x.before, s.palette, `Block ${x.n} of ${x.file} before`),
            thumb(x.after, s.paletteAfter, `Block ${x.n} of ${x.file} after`),
          ),
          h('figcaption', null, `${x.file} ${x.n}: before, after`),
        ),
      ),
    ),
  ];
  if (apply) out.push(h('button', { type: 'button', onclick: () => apply(s) }, `Apply to the ${s.role} colors`));
  return out;
}

/** The proposal for a game with no reservations; `save` writes them to the companion. */
export function reserveProposalView(p: ReservationProposal | undefined, save: (p: ReservationProposal) => void): HTMLElement | null {
  if (!p) return null;
  return h(
    'div',
    { class: 'disk-reserve' },
    h('h3', null, 'Reserve colors for sprites'),
    h(
      'p',
      null,
      'This game has no palette reservations. From the colors its monsters and characters draw, here is a range of color numbers for each, the same in every scene’s palette; the colors nobody reserves stay free for backgrounds. Saving only records the ranges (in the project, not the game files). Moving the colors in is a separate step below.',
    ),
    strip(p),
    h(
      'ul',
      null,
      ...p.ranges.map((r) =>
        h(
          'li',
          null,
          h('strong', null, `${LABEL[r.role]} ${r.first}-${r.last}`),
          `: ${r.last - r.first + 1} colors for ${r.files.join(', ')}, shown with ${r.palettes} palette${r.palettes === 1 ? '' : 's'}.`,
          r.conflicts
            ? ` Other blocks draw ${r.conflicts} pixel${r.conflicts === 1 ? '' : 's'} with colors in this range; “Colors outside their range” would move them.`
            : '',
        ),
      ),
    ),
    ...p.syncs.flatMap((s) => [h('h4', null, `If the ${s.role} colors moved in`), ...syncBody(s)]),
    ...p.stuck.map((s) => h('p', { class: 'hint' }, `${s.role}: ${s.why}.`)),
    h('button', { type: 'button', onclick: () => save(p) }, 'Save these reservations'),
  );
}

/** Reserved ranges that differ between palettes. */
export function rangeSyncView(list: RangeSync[], stuck: { role: string; why: string }[], apply: (s: RangeSync) => void): HTMLElement | null {
  const open = list.filter((s) => !s.lossless);
  if (!open.length && !stuck.length) return null;
  return h(
    'div',
    { class: 'disk-reserve' },
    h('h3', null, 'Reserved colors that differ between palettes'),
    h(
      'p',
      null,
      'A reserved range should hold the same colors in every palette its blocks are shown with, so a monster or character keeps its colors from scene to scene and block sets can join. Each change below would look different in some scene; look at the blocks first.',
    ),
    ...open.flatMap((s) => [h('h4', null, s.title), ...syncBody(s, apply)]),
    ...stuck.map((s) => h('p', { class: 'hint' }, `${s.role}: ${s.why}.`)),
  );
}
