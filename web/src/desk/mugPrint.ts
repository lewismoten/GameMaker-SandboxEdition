// The sublimation print sheet: make your own Sandbox BBS mug. The wraps are printed mirrored
// (the ink faces the mug in the press), at the real size of a blank's printable area, as many
// to a page as fit. Print it from the browser at actual size, or download 300 dpi PNGs.
import { h } from '../editor/core/ui';
import { pngWithDpi } from '../manual/printables/stickerArt';
import { MUG_DESIGNS, designCanvas, type MugDesignId } from './mugArt';
import { MUG_SIZES, PAPERS, layoutSheet, paginateWraps, type MugSize, type Paper, type SheetLayout } from './mugSizes';
import { wrapCanvas } from './mug3d';

export const PRINT_DPI = 300;

/** One page of wraps on a canvas at `ppi` pixels an inch. */
export function drawSheet(layout: SheetLayout, size: MugSize, wraps: MugDesignId[], ppi: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(layout.pageW * ppi);
  c.height = Math.round(layout.pageH * ppi);
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  const textures = new Map<MugDesignId, HTMLCanvasElement>();
  wraps.forEach((id, i) => {
    const slot = layout.slots[i];
    if (!slot) return;
    let tex = textures.get(id);
    if (!tex) textures.set(id, (tex = wrapCanvas(id, size, ppi, true)));
    g.save();
    g.translate(slot.x * ppi, slot.y * ppi);
    if (slot.rotated) {
      // a quarter turn: the wrap's top edge runs down the page's left side
      g.translate(size.wrapH * ppi, 0);
      g.rotate(Math.PI / 2);
    }
    const w = size.wrapW * ppi;
    const hh = size.wrapH * ppi;
    g.drawImage(tex, 0, 0, w, hh);
    // a hairline to cut along, just outside the print
    g.strokeStyle = '#b8b8b8';
    g.lineWidth = Math.max(1, ppi / 150);
    g.setLineDash([ppi * 0.06, ppi * 0.04]);
    g.strokeRect(-ppi * 0.04, -ppi * 0.04, w + ppi * 0.08, hh + ppi * 0.08);
    g.setLineDash([]);
    g.fillStyle = '#8a8a8a';
    g.font = `${Math.round(ppi * 0.1)}px Arial, sans-serif`;
    g.textBaseline = 'top';
    const name = MUG_DESIGNS.find((d) => d.id === id)?.name ?? id;
    g.fillText(`${size.name} · ${size.wrapW} × ${size.wrapH} in · ${name} · MIRRORED: printed side against the mug`, 0, hh + ppi * 0.08);
    // a one inch ruler at the end of the label, to check the printer kept the size
    g.strokeStyle = '#555';
    g.lineWidth = Math.max(1, ppi / 150);
    g.beginPath();
    g.moveTo(w - ppi, hh + ppi * 0.08);
    g.lineTo(w - ppi, hh + ppi * 0.2);
    g.moveTo(w - ppi, hh + ppi * 0.14);
    g.lineTo(w, hh + ppi * 0.14);
    g.moveTo(w, hh + ppi * 0.08);
    g.lineTo(w, hh + ppi * 0.2);
    g.stroke();
    g.textAlign = 'right';
    g.fillText('1 inch', w - ppi - ppi * 0.05, hh + ppi * 0.08);
    g.textAlign = 'left';
    g.restore();
  });
  return c;
}

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('no picture'))), 'image/png'));
}

async function pngBlob(c: HTMLCanvasElement, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await (await toBlob(c)).arrayBuffer());
  return new Blob([pngWithDpi(bytes, dpi) as Uint8Array<ArrayBuffer>], { type: 'image/png' });
}

function download(blob: Blob, name: string): void {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/**
 * Puts the pages in the document for printing: each a picture exactly the page's size, the
 * page size set with @page and no margins. Returns the undo.
 */
export async function preparePrint(layout: SheetLayout, pages: HTMLCanvasElement[]): Promise<() => void> {
  const style = h('style', { id: 'mug-print-style' });
  style.textContent = `@page { size: ${layout.pageW}in ${layout.pageH}in; margin: 0; }
@media screen { .mug-print-root { display: none; } }
@media print {
  html.mug-printing body > :not(.mug-print-root) { display: none !important; }
  html.mug-printing, html.mug-printing body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  html.mug-printing body > .mug-print-root.mug-print-root { display: block !important; position: static !important; }
  html.mug-printing .mug-print-root img { display: block; max-width: none; width: ${layout.pageW}in; height: ${layout.pageH}in; break-after: page; }
  .mug-print-root img:last-child { break-after: auto; }
}`;
  const urls = await Promise.all(pages.map(async (p) => URL.createObjectURL(await toBlob(p))));
  const root = h('div', { class: 'mug-print-root' }, ...urls.map((src, i) => h('img', { src, alt: `Sublimation sheet ${i + 1}` })));
  document.head.append(style);
  document.body.append(root);
  document.documentElement.classList.add('mug-printing');
  await Promise.all([...root.querySelectorAll('img')].map((i) => i.decode().catch(() => undefined)));
  return () => {
    document.documentElement.classList.remove('mug-printing');
    style.remove();
    root.remove();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}

/** The sublimation sheet dialog. `design` is ticked to start with. */
export function openSublimation(start: { design: MugDesignId; size: string }): Promise<void> {
  return new Promise((resolve) => {
    let paper: Paper = PAPERS[0];
    let size: MugSize = MUG_SIZES.find((s) => s.id === start.size) ?? MUG_SIZES[0];
    const counts = new Map<MugDesignId, number>(MUG_DESIGNS.map((d) => [d.id, d.id === start.design ? 1 : 0]));
    const preview = h('div', { class: 'subl-pages' });
    const status = h('p', { class: 'subl-status', 'aria-live': 'polite' });
    const printBtn = h('button', { class: 'subl-primary', type: 'button' }, '🖨 Print at actual size');
    const pngBtn = h('button', { type: 'button' }, '⬇ PNG, 300 dpi');

    const wraps = () => MUG_DESIGNS.flatMap((d) => Array<MugDesignId>(counts.get(d.id) ?? 0).fill(d.id));
    const plan = () => {
      const layout = layoutSheet(paper, size);
      return { layout, pages: layout ? paginateWraps(wraps(), layout.slots.length) : [] };
    };
    const refresh = () => {
      const { layout, pages } = plan();
      const n = wraps().length;
      printBtn.disabled = pngBtn.disabled = !layout || !n;
      if (!layout) {
        status.textContent = `A ${size.name} wrap (${size.wrapW} × ${size.wrapH} in) doesn’t fit on ${paper.name} with the printer’s margins. Try Letter, or a smaller mug.`;
        preview.replaceChildren();
        return;
      }
      status.textContent = n
        ? `${n} mug${n > 1 ? 's' : ''}: ${layout.slots.length} to a page, ${pages.length} page${pages.length > 1 ? 's' : ''}, ${layout.landscape ? 'landscape' : 'portrait'}.`
        : 'Choose at least one picture.';
      preview.replaceChildren(
        ...pages.map((p, i) => {
          const c = drawSheet(layout, size, p, 48);
          c.className = 'subl-page';
          c.style.aspectRatio = `${layout.pageW} / ${layout.pageH}`;
          return h('figure', null, c, h('figcaption', null, `Page ${i + 1}`));
        }),
      );
    };

    const designRows = MUG_DESIGNS.map((d) => {
      const out = h('output', null, String(counts.get(d.id)));
      const set = (n: number) => {
        counts.set(d.id, Math.max(0, Math.min(12, n)));
        out.textContent = String(counts.get(d.id));
        refresh();
      };
      const thumb = designCanvas(d.id);
      const img = h('img', { src: thumb.toDataURL(), alt: '', width: thumb.width, height: thumb.height });
      return h(
        'div',
        { class: 'subl-design' },
        img,
        h('span', null, h('b', null, d.name), h('small', null, d.note)),
        h(
          'span',
          { class: 'subl-qty' },
          h('button', { type: 'button', 'aria-label': `One fewer ${d.name}`, onclick: () => set((counts.get(d.id) ?? 0) - 1) }, '−'),
          out,
          h('button', { type: 'button', 'aria-label': `One more ${d.name}`, onclick: () => set((counts.get(d.id) ?? 0) + 1) }, '+'),
        ),
      );
    });

    const select = <T extends { id: string; name: string }>(label: string, list: T[], value: T, change: (v: T) => void) =>
      h(
        'label',
        null,
        label,
        h(
          'select',
          { onchange: (e: Event) => (change(list.find((x) => x.id === (e.target as HTMLSelectElement).value)!), refresh()) },
          ...list.map((x) => h('option', { value: x.id, selected: x.id === value.id }, x.name)),
        ),
      );

    printBtn.addEventListener('click', async () => {
      const { layout, pages } = plan();
      if (!layout) return;
      printBtn.disabled = true;
      try {
        const undo = await preparePrint(
          layout,
          pages.map((p) => drawSheet(layout, size, p, PRINT_DPI)),
        );
        const done = () => (undo(), window.removeEventListener('afterprint', done));
        window.addEventListener('afterprint', done);
        window.print();
      } finally {
        printBtn.disabled = false;
      }
    });
    pngBtn.addEventListener('click', async () => {
      const { layout, pages } = plan();
      if (!layout) return;
      pngBtn.disabled = true;
      try {
        for (const [i, p] of pages.entries())
          download(
            await pngBlob(drawSheet(layout, size, p, PRINT_DPI), PRINT_DPI),
            `sandbox-mug-${size.id}-${paper.id}${pages.length > 1 ? `-${i + 1}` : ''}.png`,
          );
      } finally {
        pngBtn.disabled = false;
      }
    });

    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (e.preventDefault(), close());
      e.stopImmediatePropagation(); // not for the PC underneath
    };
    window.addEventListener('keydown', onKey, true);

    const overlay = h(
      'div',
      { class: 'mugv subl', role: 'dialog', 'aria-label': 'Sublimation print sheet' },
      h(
        'header',
        { class: 'mugv-bar' },
        h('strong', null, 'Make your own mug: sublimation print sheet'),
        h('span', { class: 'mugv-spacer' }),
        h('button', { type: 'button', onclick: close }, 'Close (Esc)'),
      ),
      h(
        'div',
        { class: 'subl-main' },
        h(
          'div',
          { class: 'subl-side' },
          h(
            'div',
            { class: 'subl-row' },
            select('Mug', MUG_SIZES, size, (v) => (size = v)),
            select('Paper', PAPERS, paper, (v) => (paper = v)),
          ),
          h('h3', null, 'Pictures (how many mugs of each)'),
          ...designRows,
          status,
          h('div', { class: 'subl-actions' }, printBtn, pngBtn),
          h(
            'details',
            { class: 'subl-help' },
            h('summary', null, 'How to press a mug'),
            h(
              'ol',
              null,
              h(
                'li',
                null,
                'Load sublimation ink and paper. Print with scaling at ',
                h('b', null, '100% / Actual size'),
                ' (not “Fit to page”). Check the 1 inch mark under each picture with a ruler.',
              ),
              h('li', null, 'The pictures are already mirrored: don’t mirror them again in the print dialog.'),
              h(
                'li',
                null,
                'Cut along the dashed line. Wrap it round a sublimation blank, printed side against the mug, the gap under the handle, and tape it with heat tape.',
              ),
              h(
                'li',
                null,
                'Press it in a mug press (a common setting for ceramic mugs is 400 °F / 200 °C for about 3 to 4 minutes: follow your blank’s instructions). Careful: it comes out hot.',
              ),
              h('li', null, 'Sublimation needs a polyester-coated blank. A plain kitchen mug won’t take the ink.'),
            ),
          ),
        ),
        preview,
      ),
    );
    document.body.append(overlay);
    refresh();
  });
}
