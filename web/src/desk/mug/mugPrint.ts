// The sublimation page composer: make your own Sandbox mugs one page at a time. Add mugs and
// tumblers, choose each one's front and back picture (or leave a side blank), and every mug
// gets a strip cropped to its pictures, stacked down a Letter or Legal page with cut lines
// and alignment marks; a 3D mug shows where the front and back land. Printed at actual size
// (the page is an SVG in real inches) or saved as a 300 dpi PNG. The setup is remembered.
import { h } from '../../editor/core/ui';
import { MUG_DESIGNS, designCanvas, loadDesigns, type MugDesignId } from './mugArt';
import { pageLayout, type PageLayout, type StripInput } from './mugLayout';
import { MUG_SIZES, PAPERS, type MugSize } from './mugSizes';
import { MUG_COLORS, drawMug, stripTexture, wrapAngle } from './mug3d';
import { MAX_MUGS, loadSetup, newMug, saveSetup, type PageMug, type PageSetup } from './mugPageStore';
import { PRINT_DPI, preparePrint, sheetPng, sheetSvg, type SideDesigns } from './mugSheet';

const sizeOf = (id: string): MugSize => MUG_SIZES.find((s) => s.id === id) ?? MUG_SIZES[0];
const aspect = (id: MugDesignId | '') => {
  if (!id) return undefined;
  const c = designCanvas(id);
  return c.width / c.height;
};

/** The page's layout for a setup. */
export function planPage(setup: PageSetup): PageLayout {
  const paper = PAPERS.find((p) => p.id === setup.paper) ?? PAPERS[0];
  const mugs: StripInput[] = setup.mugs.map((m) => ({ size: sizeOf(m.size), front: aspect(m.front), back: aspect(m.back), lift: m.lift, leftHanded: setup.leftHanded }));
  return pageLayout(paper, setup.orientation, mugs, setup.mirrored);
}

const designsOf = (setup: PageSetup): SideDesigns[] => setup.mugs.map((m) => ({ front: m.front || undefined, back: m.back || undefined }));

function download(blob: Blob, name: string): void {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** A choice of picture: blank, a BBS design or a game's. */
function designSelect(label: string, value: MugDesignId | '', change: (v: MugDesignId | '') => void): HTMLLabelElement {
  const opt = (id: string, name: string) => h('option', { value: id, selected: id === value }, name);
  const group = (g: 'bbs' | 'game', name: string) => h('optgroup', { label: name }, ...MUG_DESIGNS.filter((d) => d.group === g).map((d) => opt(d.id, d.name)));
  return h(
    'label',
    null,
    label,
    h(
      'select',
      { onchange: (e: Event) => change((e.target as HTMLSelectElement).value as MugDesignId | '') },
      opt('', 'Blank (nothing printed)'),
      group('bbs', 'The Sandbox BBS'),
      group('game', 'Sandbox Software games'),
    ),
  );
}

/** The composer. `start` is the mug for a page that has none yet. */
export function openSublimation(start: { design: MugDesignId; size: string }): Promise<void> {
  return new Promise((resolve) => {
    const setup = loadSetup(newMug(MUG_SIZES.some((s) => s.id === start.size) ? start.size : MUG_SIZES[0].id, start.design));
    let shown = 0; // the mug in the 3D preview
    const changed = () => (saveSetup(setup), refresh());

    const status = h('p', { class: 'subl-status', 'aria-live': 'polite' });
    const sheet = h('div', { class: 'subl-sheet' });
    const list = h('ol', { class: 'subl-mugs' });
    const printBtn = h('button', { class: 'subl-primary', type: 'button' }, '🖨 Print this page at actual size');
    const pngBtn = h('button', { type: 'button' }, '⬇ This page as a PNG, 300 dpi');
    const addBtn = h('button', { type: 'button', class: 'subl-add' }, '+ Add a mug');
    const views = (['front', 'back'] as const).map((side) => ({
      side,
      canvas: h('canvas', { class: 'subl-3d', width: 240, height: 260, role: 'img' }),
    }));
    const viewCaption = h('p', { class: 'mugv-note' });
    const handNote = h('span');

    // ---- the page's settings
    const select = <T extends { id: string; name: string }>(label: string, items: T[], value: string, change: (v: string) => void) =>
      h(
        'label',
        null,
        label,
        h('select', { onchange: (e: Event) => (change((e.target as HTMLSelectElement).value), changed()) }, ...items.map((x) => h('option', { value: x.id, selected: x.id === value }, x.name))),
      );
    const mirror = h('input', { type: 'checkbox', checked: setup.mirrored, onchange: (e: Event) => ((setup.mirrored = (e.target as HTMLInputElement).checked), changed()) });
    const settings = h(
      'div',
      { class: 'subl-settings' },
      h(
        'div',
        { class: 'subl-row' },
        select('Paper', PAPERS, setup.paper, (v) => (setup.paper = v)),
        select('Page', [{ id: 'portrait', name: 'Portrait' }, { id: 'landscape', name: 'Landscape' }], setup.orientation, (v) => (setup.orientation = v === 'landscape' ? 'landscape' : 'portrait')),
        select(
          'Handle hand',
          [
            { id: 'right', name: 'Right-handed' },
            { id: 'left', name: 'Left-handed' },
          ],
          setup.leftHanded ? 'left' : 'right',
          (v) => (setup.leftHanded = v === 'left'),
        ),
      ),
      h('label', { class: 'subl-check' }, mirror, ' Mirror the print (most sublimation paper wants it mirrored; check your paper’s instructions)'),
    );

    // ---- the mugs on the page
    const mugCard = (m: PageMug, i: number) => {
      const size = sizeOf(m.size);
      const sizePick = h(
        'select',
        {
          'aria-label': `Mug ${i + 1}: size`,
          onchange: (e: Event) => {
            m.size = (e.target as HTMLSelectElement).value;
            shown = i;
            rebuild(`size-${i}`);
          },
          dataset: { focus: `size-${i}` },
        },
        ...MUG_SIZES.map((s) => h('option', { value: s.id, selected: s.id === m.size }, `${s.name} (wrap ${s.wrapW} × ${s.wrapH} in)`)),
      );
      const pick = (side: 'front' | 'back') =>
        designSelect(side === 'front' ? 'Front' : 'Back', m[side], (v) => {
          m[side] = v;
          shown = i;
          changed();
        });
      const lift = size.handle
        ? null
        : h(
            'label',
            null,
            'Pictures’ middle, inches up from the bottom of the cup',
            h('input', {
              type: 'number',
              min: '1',
              max: '8',
              step: '0.25',
              value: String(m.lift),
              inputmode: 'decimal',
              oninput: (e: Event) => {
                const v = Number((e.target as HTMLInputElement).value);
                if (Number.isFinite(v) && v > 0) ((m.lift = Math.min(12, v)), (shown = i), changed());
              },
            }),
          );
      return h(
        'li',
        { class: 'subl-mug', 'aria-label': `Mug ${i + 1}` },
        h(
          'div',
          { class: 'subl-mug-head' },
          h('b', null, `${i + 1}.`),
          sizePick,
          h('button', { type: 'button', 'aria-pressed': String(i === shown), dataset: { show: String(i) }, onclick: () => ((shown = i), refresh()), 'aria-label': `Show mug ${i + 1} in 3D` }, '3D'),
          h(
            'button',
            {
              type: 'button',
              'aria-label': `Remove mug ${i + 1}`,
              disabled: setup.mugs.length < 2,
              onclick: () => {
                setup.mugs.splice(i, 1);
                shown = Math.min(shown, setup.mugs.length - 1);
                rebuild(`size-${Math.min(i, setup.mugs.length - 1)}`);
              },
            },
            '✕',
          ),
        ),
        h('div', { class: 'subl-sides' }, pick('front'), pick('back')),
        lift,
      );
    };
    const rebuild = (focus?: string) => {
      list.replaceChildren(...setup.mugs.map(mugCard));
      addBtn.disabled = setup.mugs.length >= MAX_MUGS;
      changed();
      if (focus) (list.querySelector(`[data-focus="${focus}"]`) as HTMLElement | null)?.focus();
    };
    addBtn.addEventListener('click', () => {
      const last = setup.mugs[setup.mugs.length - 1];
      setup.mugs.push(last ? { ...last } : newMug(MUG_SIZES[0].id, start.design));
      shown = setup.mugs.length - 1;
      rebuild(`size-${shown}`);
    });

    // ---- the previews
    const draw3d = (page: PageLayout) => {
      const placed = page.strips.find((p) => p.index === shown) ?? page.strips[0];
      const m = placed && setup.mugs[placed.index];
      for (const v of views) {
        const g = v.canvas.getContext('2d')!;
        g.clearRect(0, 0, v.canvas.width, v.canvas.height);
        if (!placed || !m) continue;
        const { strip } = placed;
        const size = strip.size;
        const texture = stripTexture(strip, { front: m.front || undefined, back: m.back || undefined }, 100);
        const bodyH = size.height / size.diameter;
        const radius = Math.min(v.canvas.width * 0.3, (v.canvas.height * 0.8) / (2 * bodyH + 0.4));
        const H = radius * 2 * bodyH;
        drawMug(g, { texture, size, colors: MUG_COLORS[0].colors, rot: -wrapAngle(size, strip.centers[v.side]), cx: v.canvas.width / 2, top: (v.canvas.height - H) / 2 + radius * 0.1, radius });
        const name = MUG_DESIGNS.find((d) => d.id === m[v.side])?.name ?? 'blank';
        v.canvas.setAttribute('aria-label', `Mug ${placed.index + 1}, ${v.side}: ${name}`);
      }
      viewCaption.textContent = placed
        ? `Mug ${placed.index + 1}, ${placed.strip.size.name}: the front straight on (handle ${setup.leftHanded ? 'right' : 'left'}), then the back, half way round.`
        : 'Nothing on the page yet.';
      for (const b of list.querySelectorAll<HTMLButtonElement>('[data-show]')) b.setAttribute('aria-pressed', String(Number(b.dataset.show) === placed?.index));
    };

    let ticket = 0;
    const refresh = () => {
      const page = planPage(setup);
      const n = page.strips.length;
      const parts = [`${n} mug${n === 1 ? '' : 's'} on this page, ${inchesLeft(page.left)} of paper left at the bottom.`];
      if (page.blank.length) parts.push(`Mug ${page.blank.map((i) => i + 1).join(', ')} ${page.blank.length > 1 ? 'are' : 'is'} blank on both sides: nothing to print.`);
      if (page.overflow.length)
        parts.push(`Mug ${page.overflow.map((i) => i + 1).join(', ')} won’t fit: ${setup.paper === 'legal' ? 'remove one' : 'try Legal paper, or remove one'}, or print it on the next page.`);
      status.textContent = parts.join(' ');
      handNote.textContent = setup.leftHanded ? 'left hand (the handle on the right as you look at it)' : 'right hand (the handle on the left as you look at it)';
      printBtn.disabled = pngBtn.disabled = !n;
      draw3d(page);
      const t = ++ticket;
      setTimeout(() => {
        if (t !== ticket) return;
        const svg = sheetSvg(page, designsOf(setup), 60, setup.leftHanded, `Preview of the page: ${n} mug strip${n === 1 ? '' : 's'}`);
        sheet.replaceChildren(svg);
      }, 60);
    };
    const inchesLeft = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)} in`;

    printBtn.addEventListener('click', async () => {
      printBtn.disabled = true;
      try {
        await loadDesigns();
        const page = planPage(setup);
        const undo = preparePrint(page, sheetSvg(page, designsOf(setup), PRINT_DPI, setup.leftHanded));
        const done = () => (undo(), window.removeEventListener('afterprint', done));
        window.addEventListener('afterprint', done);
        window.print();
      } finally {
        printBtn.disabled = false;
      }
    });
    pngBtn.addEventListener('click', async () => {
      pngBtn.disabled = true;
      try {
        await loadDesigns();
        const page = planPage(setup);
        download(await sheetPng(page, designsOf(setup), setup.leftHanded), `sandbox-mugs-${setup.paper}-${page.strips.length}.png`);
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
      { class: 'mugv subl', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'subl-title' },
      h(
        'header',
        { class: 'mugv-bar' },
        h('h2', { id: 'subl-title' }, 'Make your own mugs: one sublimation page'),
        h('span', { class: 'mugv-spacer' }),
        h('button', { type: 'button', onclick: close }, 'Close (Esc)'),
      ),
      h(
        'div',
        { class: 'subl-main' },
        h(
          'div',
          { class: 'subl-side' },
          h('p', { class: 'subl-actual' }, h('b', null, 'Print at 100% / Actual size'), ', not “Fit to page”. Check the 1 inch ruler under each mug with a real ruler.'),
          settings,
          h(
            'p',
            { class: 'mugv-note' },
            h('b', null, 'Front'),
            ' is the side that faces out when you hold the mug in your ',
            handNote,
            '. ',
            h('b', null, 'Back'),
            ' is straight opposite, half way round. Each picture is centered a quarter of the way round from the handle and kept to a third of the way round, the part you see straight on, so it isn’t bent out of shape.',
          ),
          h('h3', null, 'Mugs on this page'),
          list,
          addBtn,
          status,
          h('div', { class: 'subl-actions' }, printBtn, pngBtn),
          h(
            'details',
            { class: 'subl-help' },
            h('summary', null, 'How to press a mug'),
            h(
              'ol',
              null,
              h('li', null, 'Load sublimation ink and paper. Print with scaling at 100% / Actual size and check the 1 inch ruler.'),
              h('li', null, 'Mirroring is set here: don’t mirror again in the print dialog.'),
              h(
                'li',
                null,
                'Cut along the dashed lines above and below each mug. The ticks marked FRONT middle and BACK middle stop at the cut: snip a tiny notch at each so you can still see them.',
              ),
              h(
                'li',
                null,
                'Printed side against the mug, line the FRONT notch up with the middle of the front (a quarter of the way round from the handle) and the gap under the handle. Tape it with heat tape. A tumbler: the bottom cut sits the height shown above the bottom of the cup.',
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
        h(
          'div',
          { class: 'subl-preview', tabindex: '0', role: 'region', 'aria-label': 'Previews: the mug and the page' },
          h('figure', { class: 'subl-views' }, ...views.map((v) => h('div', null, v.canvas, h('span', null, v.side === 'front' ? 'Front' : 'Back'))), h('figcaption', null, viewCaption)),
          h('figure', { class: 'subl-page-fig' }, sheet, h('figcaption', null, 'The page, as it prints. Gray marks are outside the pressed piece.')),
        ),
      ),
    );
    document.body.append(overlay);
    rebuild();
    (overlay.querySelector('select') as HTMLSelectElement | null)?.focus();
    // a game's picture comes from its files on the CD
    void loadDesigns().then(() => overlay.isConnected && refresh());
  });
}
