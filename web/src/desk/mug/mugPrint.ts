// The sublimation order form: make your own Sandbox mugs. Choose how many mugs of each
// picture, in each size, and every wrap is laid out over as many pages as it takes (mixed
// sizes share a page where they fit). The wraps are printed mirrored (the ink faces the mug
// in the press), at the real size of a blank's printable area. Print them from the browser
// at actual size, or download each page as a 300 dpi PNG.
import { h } from '../../editor/core/ui';
import { pngWithDpi } from '../../manual/printables/stickerArt';
import { MUG_DESIGNS, designCanvas, loadDesign, loadDesigns, type MugDesignId } from './mugArt';
import { MUG_SIZES, PAPERS, packWraps, type MugSize, type Packed, type PackedSheets, type Paper } from './mugSizes';
import { wrapCanvas } from './mug3d';

/** One mug to print: its picture and size. */
export interface Wrap {
  design: MugDesignId;
  size: MugSize;
}

export const PRINT_DPI = 300;

/** One page of wraps on a canvas at `ppi` pixels an inch. */
export function drawSheet(sheets: Pick<PackedSheets<Wrap>, 'pageW' | 'pageH'>, page: Packed<Wrap>[], ppi: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(sheets.pageW * ppi);
  c.height = Math.round(sheets.pageH * ppi);
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  const textures = new Map<string, HTMLCanvasElement>();
  for (const { item, x, y, rotated } of page) {
    const { design, size } = item;
    const key = `${design}/${size.id}`;
    let tex = textures.get(key);
    if (!tex) textures.set(key, (tex = wrapCanvas(design, size, ppi, true)));
    g.save();
    g.translate(x * ppi, y * ppi);
    if (rotated) {
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
    const name = MUG_DESIGNS.find((d) => d.id === design)?.name ?? design;
    g.fillText(`${size.name} · ${size.wrapW} × ${size.wrapH} in · ${name} · MIRRORED: printed side against the mug, ends under the handle`, 0, hh + ppi * 0.08);
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
  }
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
export async function preparePrint(layout: Pick<PackedSheets<Wrap>, 'pageW' | 'pageH'>, pages: HTMLCanvasElement[]): Promise<() => void> {
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

/** The order form: how many mugs of each picture in each size. `start` gets one to begin with. */
export function openSublimation(start: { design: MugDesignId; size: string }): Promise<void> {
  return new Promise((resolve) => {
    let paper: Paper = PAPERS[0];
    const key = (d: MugDesignId, s: string) => `${d}/${s}`;
    const counts = new Map<string, number>([[key(start.design, MUG_SIZES.some((s) => s.id === start.size) ? start.size : MUG_SIZES[0].id), 1]]);
    const preview = h('div', { class: 'subl-pages', 'aria-live': 'polite' });
    const status = h('p', { class: 'subl-status', 'aria-live': 'polite' });
    const printBtn = h('button', { class: 'subl-primary', type: 'button' }, '🖨 Print every page at actual size');
    const pngBtn = h('button', { type: 'button' }, '⬇ Every page as a PNG, 300 dpi');
    const totals = MUG_SIZES.map(() => h('td'));
    const total = h('td');

    /** One entry per mug, in the form's order. */
    const wraps = (): Wrap[] =>
      MUG_DESIGNS.flatMap((d) => MUG_SIZES.flatMap((size) => Array.from({ length: counts.get(key(d.id, size.id)) ?? 0 }, () => ({ design: d.id, size }))));
    const plan = () => packWraps(paper, wraps(), (w) => w.size);
    const pageName = (i: number, n: number) => `sandbox-mugs-${paper.id}${n > 1 ? `-page-${i + 1}-of-${n}` : ''}.png`;
    const savePage = async (sheets: PackedSheets<Wrap>, i: number) => {
      await loadDesigns();
      download(await pngBlob(drawSheet(sheets, sheets.pages[i], PRINT_DPI), PRINT_DPI), pageName(i, sheets.pages.length));
    };

    let drawn = 0;
    const refresh = () => {
      const all = wraps();
      const sheets = all.length ? plan() : undefined;
      MUG_SIZES.forEach((s, i) => {
        const n = all.filter((w) => w.size === s).length;
        totals[i].textContent = n ? String(n) : '';
      });
      total.textContent = String(all.length);
      printBtn.disabled = pngBtn.disabled = !sheets;
      if (!all.length) {
        status.textContent = 'Choose how many mugs of each picture you want.';
        preview.replaceChildren();
        return;
      }
      if (!sheets) {
        const big = MUG_SIZES.filter((s) => all.some((w) => w.size === s) && !packWraps(paper, [s], (x) => x));
        status.textContent = `A ${big.map((s) => `${s.name} wrap (${s.wrapW} × ${s.wrapH} in)`).join(' or ')} doesn’t fit on ${paper.name} with the printer’s margins. Try Letter.`;
        preview.replaceChildren();
        return;
      }
      const n = sheets.pages.length;
      status.textContent = `${all.length} mug${all.length > 1 ? 's' : ''} on ${n} page${n > 1 ? 's' : ''} of ${paper.name}, ${sheets.landscape ? 'landscape' : 'portrait'}.`;
      // draw the previews once the numbers stop changing
      const ticket = ++drawn;
      setTimeout(() => {
        if (ticket !== drawn) return;
        preview.replaceChildren(
          ...sheets.pages.map((p, i) => {
            const c = drawSheet(sheets, p, 48);
            c.className = 'subl-page';
            c.style.aspectRatio = `${sheets.pageW} / ${sheets.pageH}`;
            const mugs = p.length === 1 ? '1 mug' : `${p.length} mugs`;
            return h(
              'figure',
              null,
              c,
              h(
                'figcaption',
                null,
                `Page ${i + 1} of ${n} · ${mugs} `,
                h('button', { type: 'button', class: 'subl-png', onclick: () => void savePage(sheets, i), 'aria-label': `Page ${i + 1} as a PNG` }, '⬇ PNG'),
              ),
            );
          }),
        );
      }, 120);
    };

    // the order form: a row for each picture, a column for each mug
    const cell = (d: MugDesignId, size: MugSize) => {
      const k = key(d, size.id);
      const input = h('input', {
        type: 'number',
        min: '0',
        max: '24',
        inputmode: 'numeric',
        value: counts.get(k) ? String(counts.get(k)) : '',
        placeholder: '0',
        'aria-label': `${MUG_DESIGNS.find((x) => x.id === d)?.name}: how many ${size.name}s`,
        oninput: (e: Event) => {
          const v = Math.max(0, Math.min(24, Math.floor(Number((e.target as HTMLInputElement).value) || 0)));
          counts.set(k, v);
          refresh();
        },
        onchange: (e: Event) => ((e.target as HTMLInputElement).value = counts.get(k) ? String(counts.get(k)) : ''),
      });
      return h('td', null, input);
    };
    const rows = MUG_DESIGNS.map((d) => {
      const art = designCanvas(d.id);
      const img = h('img', { src: art.toDataURL(), alt: '', width: art.width, height: art.height });
      void loadDesign(d.id).then((c) => {
        if (c === art) return;
        img.src = c.toDataURL();
        img.width = c.width;
        img.height = c.height;
        refresh(); // its wraps in the previews
      });
      return h('tr', { title: d.note }, h('th', { scope: 'row' }, img, h('span', null, d.name)), ...MUG_SIZES.map((s) => cell(d.id, s)));
    });
    const shortName = (s: MugSize) => s.name.replace(/ mug$/, '').replace('skinny tumbler', 'tumbler');
    const form = h(
      'table',
      { class: 'subl-order' },
      h('caption', null, 'How many mugs of each picture, in each size'),
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          h('th', { scope: 'col' }, 'Picture'),
          ...MUG_SIZES.map((s) => h('th', { scope: 'col', title: `${s.name}: wrap ${s.wrapW} × ${s.wrapH} in` }, shortName(s))),
        ),
      ),
      h('tbody', null, ...rows),
      h('tfoot', null, h('tr', null, h('th', { scope: 'row' }, 'Mugs: ', total), ...totals)),
    );

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
      const sheets = plan();
      if (!sheets) return;
      printBtn.disabled = true;
      try {
        await loadDesigns();
        const undo = await preparePrint(
          sheets,
          sheets.pages.map((p) => drawSheet(sheets, p, PRINT_DPI)),
        );
        const done = () => (undo(), window.removeEventListener('afterprint', done));
        window.addEventListener('afterprint', done);
        window.print();
      } finally {
        printBtn.disabled = false;
      }
    });
    pngBtn.addEventListener('click', async () => {
      const sheets = plan();
      if (!sheets) return;
      pngBtn.disabled = true;
      try {
        for (let i = 0; i < sheets.pages.length; i++) await savePage(sheets, i);
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
      { class: 'mugv subl', role: 'dialog', 'aria-label': 'Sublimation order form' },
      h(
        'header',
        { class: 'mugv-bar' },
        h('strong', null, 'Make your own mugs: sublimation order form'),
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
            select('Paper', PAPERS, paper, (v) => (paper = v)),
          ),
          form,
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
