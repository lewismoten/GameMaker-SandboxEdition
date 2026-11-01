// The Library's photocopier (libraryPage.ts), beside the card catalog: a beige '90s office copier
// drawn in CSS. "Copies: choose a paper" lists the print shop's pieces in the open drawer; COPY
// sweeps the green scan light across the glass (a still glow with reduced motion), then hands
// the chosen piece to the page to open in the print shop. It also does mugs (the sublimation page
// in desk/mug, loaded only when COPY is pressed on it) and stickers (the sticker sheets drawer). With nothing
// to print the display reads NO ORIGINAL and COPY does nothing.
import { h } from '../editor/core/ui';
import type { ShelfItem } from './shelf';

export interface Copier {
  el: HTMLElement;
  /** The open drawer's pieces: only those the print shop opens are offered. */
  update(items: readonly ShelfItem[]): void;
}

const SCAN_MS = 1100;
const STILL_MS = 400;

/** The papers besides the open drawer's pieces. */
const EXTRAS = [
  ['mug', 'Mug: sublimation print'],
  ['stickers', 'Stickers: sticker sheets'],
] as const;
type Extra = (typeof EXTRAS)[number][0];

export function makeCopier(onCopy: (item: ShelfItem, from: HTMLElement) => Promise<void>, onStickers: () => void): Copier {
  let papers: ShelfItem[] = [];
  let busy = false;
  const select = h('select', { id: 'lib-copies', class: 'lib-cp-pick' });
  const display = h('output', { class: 'lib-cp-display', id: 'lib-cp-display', role: 'status' }, 'READY');
  const button = h('button', { type: 'button', class: 'lib-cp-btn', 'aria-describedby': 'lib-cp-display', onclick: () => void copy() });
  button.textContent = 'COPY';
  const light = h('span', { class: 'lib-cp-light', 'aria-hidden': 'true' });
  const el = h(
    'section',
    { class: 'lib-copier', 'aria-label': 'Photocopier' },
    h('div', { class: 'lib-cp-lid', 'aria-hidden': 'true' }, h('span', { class: 'lib-cp-hinge' })),
    h('div', { class: 'lib-cp-glass', 'aria-hidden': 'true' }, light),
    h(
      'div',
      { class: 'lib-cp-panel' },
      h('label', { for: 'lib-copies', class: 'lib-cp-label' }, 'Copies: choose a paper'),
      select,
      h('div', { class: 'lib-cp-row' }, display, button),
    ),
    h('div', { class: 'lib-cp-tray', 'aria-hidden': 'true' }),
  );
  const says = (t: string) => (display.textContent = t);
  const copy = async () => {
    const at = select.selectedIndex;
    const item = papers[at];
    const extra: Extra | undefined = item ? undefined : EXTRAS[at - papers.length]?.[0];
    if (busy || (!item && !extra)) return;
    busy = true;
    button.setAttribute('aria-disabled', 'true');
    says('COPYING');
    el.classList.add('scanning');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await new Promise((r) => setTimeout(r, still ? STILL_MS : SCAN_MS));
    el.classList.remove('scanning');
    try {
      if (item) await onCopy(item, button);
      else if (extra === 'stickers') onStickers();
      else await openMug(papers[0]?.owner);
    } finally {
      busy = false;
      button.removeAttribute('aria-disabled');
      says('READY');
    }
  };
  return {
    el,
    update(items) {
      const keep = papers[select.selectedIndex]?.key;
      papers = items.filter((i) => i.open.via === 'print');
      const owners = new Set(papers.map((p) => p.owner));
      select.replaceChildren(
        ...papers.map((p) => h('option', { value: p.key }, owners.size > 1 ? `${p.ownerTitle}: ${p.title}` : p.title)),
        ...EXTRAS.map(([k, label]) => h('option', { value: k }, label)),
      );
      const i = papers.findIndex((p) => p.key === keep);
      if (i >= 0) select.selectedIndex = i;
      button.removeAttribute('data-empty');
      button.setAttribute('aria-disabled', String(busy));
      if (!busy) says('READY');
    },
  };
}

/** The mug page, with the open game's badge when it has one (loaded only now). */
async function openMug(game?: string): Promise<void> {
  const [{ openSublimation }, { MUG_DESIGNS }, { MUG_SIZES }] = await Promise.all([
    import('../desk/mug/mugPrint'),
    import('../desk/mug/mugArt'),
    import('../desk/mug/mugSizes'),
  ]);
  const own = MUG_DESIGNS.find((d) => d.id === `game-${game}`);
  await openSublimation({ design: own ? own.id : 'logo', size: MUG_SIZES[0].id });
}
