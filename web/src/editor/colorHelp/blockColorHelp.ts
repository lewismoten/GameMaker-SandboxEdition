// Color help for the block, monster and character painters: the settings control, the preview as
// others might see it, and a note when two look-alike colors (the kind the person asked to be
// warned about) touch in the picture being drawn. The note is a suggestion; nothing is blocked.
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { h, clear } from '../core/ui';
import { touchingAlike } from './alike';
import { paletteColorName } from './colorNames';
import { colorHelpControl } from './colorHelpControl';
import { getColorHelp, onColorHelp } from './colorHelpPrefs';
import { seenPreview } from './seenPreview';

export function blockColorHelp(
  pal: () => Palette,
  transparent?: number,
): { el: HTMLElement; refresh(px: Uint8Array, w: number, h: number): void; dispose(): void } {
  const control = colorHelpControl();
  const preview = seenPreview();
  const note = h('p', { class: 'alike-note', role: 'status' });
  note.hidden = true;
  let last: { px: Uint8Array; w: number; h: number } | undefined;

  function refresh(px: Uint8Array, w: number, hh: number): void {
    last = { px, w, h: hh };
    const p = pal();
    preview.set(px, w, hh, p, transparent);
    const pairs = touchingAlike(px, w, hh, p, getColorHelp().warn, transparent);
    note.hidden = !pairs.length;
    if (!pairs.length) return clear(note);
    const chip = (i: number) =>
      h('span', { class: 'alike-chip', style: `background:rgb(${[0, 1, 2].map((k) => Math.round((p[i * 3 + k] * 255) / 63)).join(',')})` });
    clear(
      note,
      'Some colors touching here may look alike to some eyes: ',
      ...pairs
        .slice(0, 3)
        .flatMap(([a, b], n) => [n ? '; ' : '', chip(a), `color ${a} (${paletteColorName(p, a)}) and `, chip(b), `color ${b} (${paletteColorName(p, b)})`]),
      pairs.length > 3 ? `; and ${pairs.length - 3} more` : '',
      '. A darker or lighter shade of one can help.',
    );
  }
  const stop = onColorHelp(() => last && el.isConnected && refresh(last.px, last.w, last.h));
  const el = h('div', { class: 'stack' }, control, preview.el, note);
  return { el, refresh, dispose: stop };
}
