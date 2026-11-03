// The plastic trinkets that came in a game's box (the game's figures as 3D printable toys), listed as
// items under the box: choosing one takes the turning box's place in the viewer with that trinket, a
// shiny model to turn (drag, or the arrow keys), and choosing it again, or "Back to the box", brings
// the box back (the turning is trinketTurntable.ts). A labeled STL / 3MF switch shows it in one color (the STL) or in the colors of the 3MF
// (the default). There are links to its files, and to the STL of its supports when a plain printer would
// need them. The files are build output (games/depth/tools/trinkets.ts and games/kit/pixelTrinkets.ts
// write them to trinkets/<id>/ on the site); a game without any gets no shelf.
import './trinketShelf.css';
import { h } from '../../editor/core/ui';
import { trinketTurntable } from './trinketTurntable';
import { loadTrinkets, trinketBase, trinketMesh, type TrinketItem } from './trinketData';
import { hasPhone } from './phone/phoneData';
import type { PhoneViewer } from './phone/phoneViewer';

/** The game whose box also holds the phone kit, shown in 3D with its own views (phone/phoneViewer.ts). */
const PHONE_GAME = 'year2000';
const PHONE_TITLE = 'The Phone of the Future (kit)';

/** The shelf for game `id`, or an element that stays hidden when the game has no trinkets. */
export function trinketShelf(id: string): HTMLElement {
  const base = trinketBase(id);
  const shelf = h('section', { class: 'bc-trinkets', hidden: '', 'aria-label': 'Plastic trinkets' });
  void Promise.all([loadTrinkets(id), id === PHONE_GAME ? hasPhone() : false]).then(([items, phone]) => {
    if (items.length || phone) {
      shelf.append(...viewer(base, items, phone));
      shelf.hidden = false;
    }
  });
  return shelf;
}

function viewer(base: string, items: TrinketItem[], phone: boolean): HTMLElement[] {
  const PHONE = items.length; // the phone kit's place after the trinkets, when there is one
  const total = items.length + (phone ? 1 : 0);
  let at = -1; // -1: the box is showing
  let pv: PhoneViewer | undefined;
  let colors = true; // the 3MF's colors, or the STL's one color

  // PageUp and PageDown change trinket; the turntable has the rest of the keys
  const table = trinketTurntable((e) => {
    if (e.key !== 'PageDown' && e.key !== 'PageUp') return false;
    step(e.key === 'PageDown' ? 1 : -1);
    return true;
  });
  const { canvas, status } = table;
  canvas.setAttribute('aria-describedby', 'trk-help');
  const back = h('button', { class: 'trk-btn', type: 'button', onclick: () => void choose(-1) }, 'Back to the box');
  const float = h('div', { class: 'trk-float', hidden: '' }, canvas, status);
  const title = h('strong', { class: 'trk-title' });
  const blurb = h('span', { class: 'trk-blurb' });
  const size = h('span', { class: 'trk-size' });
  const print = h('span', { class: 'trk-print' });
  const dl = h('a', { class: 'trk-dl', download: '' }, '3D printer, one color (STL)');
  const dlColors = h('a', { class: 'trk-dl', download: '' }, '3D printer, up to 4 colors (3MF)');
  const swatches = h('span', { class: 'trk-swatches', 'aria-hidden': 'true' });
  const dlSupports = h('a', { class: 'trk-dl', download: '' }, 'Supports for a second material (STL)');
  const mode = (label: string, on: boolean) =>
    h('button', { class: 'trk-btn', type: 'button', 'aria-pressed': String(on), onclick: () => setColors(on) }, label);
  const modeColors = mode('3MF: colors', true);
  const modeOne = mode('STL: one color', false);
  const info = h(
    'div',
    { class: 'trk-info', hidden: '' },
    title,
    blurb,
    size,
    print,
    h('div', { class: 'trk-mode', role: 'group', 'aria-label': 'Show the trinket as' }, modeColors, modeOne),
    back,
    h('span', { class: 'trk-links' }, dl, h('span', { class: 'trk-colorline' }, dlColors, swatches), dlSupports),
  );
  const chips = items.map((item, i) =>
    h('button', { class: 'trk-chip', type: 'button', 'aria-pressed': 'false', title: item.blurb, onclick: () => void choose(at === i ? -1 : i) }, item.title),
  );
  if (phone) {
    chips.push(
      h(
        'button',
        { class: 'trk-chip', type: 'button', 'aria-pressed': 'false', title: 'An untested build-it-yourself phone, in 3D', onclick: () => void choose(at === PHONE ? -1 : PHONE) },
        PHONE_TITLE,
      ),
    );
  }
  const list = h('div', { class: 'trk-list', role: 'group', 'aria-label': 'Trinkets in this box' }, ...chips);

  const meshOf = (item: TrinketItem) => trinketMesh(base, item, colors);
  function setColors(on: boolean) {
    colors = on;
    modeColors.setAttribute('aria-pressed', String(on));
    modeOne.setAttribute('aria-pressed', String(!on));
    if (at >= 0) void table.show(() => meshOf(items[at]));
  }
  /** Chooses trinket `i` (in the box viewer's place), or -1 for the box again. */
  async function choose(i: number) {
    const was = at;
    at = i;
    chips.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));
    const viewer = list.closest('.box-viewer');
    viewer?.classList.toggle('trinket-on', i >= 0);
    const onPhone = phone && i === PHONE;
    float.hidden = i < 0;
    info.hidden = i < 0 || onPhone;
    if (pv) pv.info.hidden = !onPhone;
    if (phone && was === PHONE && !onPhone) {
      pv?.close();
      float.replaceChildren(canvas, status);
    }
    if (i < 0) {
      table.clear();
      if (was >= 0) chips[was].focus({ preventScroll: true });
      return;
    }
    if (onPhone) {
      table.clear();
      const { createPhoneViewer } = await import('./phone/phoneViewer');
      if (at !== i) return;
      if (!pv) {
        pv = createPhoneViewer();
        pv.canvas.setAttribute('aria-describedby', 'trk-help');
        info.after(pv.info);
      }
      pv.info.hidden = false;
      float.replaceChildren(pv.canvas, pv.status);
      await pv.open();
      if (was < 0) pv.canvas.focus({ preventScroll: true });
      return;
    }
    const item = items[i];
    const dims = item.mm.map((v) => Math.round(v)).join(' × ');
    title.textContent = item.title;
    blurb.textContent = item.blurb;
    size.textContent = `${dims} mm · ${(item.bytes / 1e6).toFixed(1)} MB`;
    print.textContent = item.supports
      ? 'On a plain printer it needs supports: print the supports body in a second material, or let your slicer add them.'
      : 'Prints without supports.';
    dl.href = `${base}${item.file}`;
    dl.setAttribute('download', item.file);
    dlColors.href = `${base}${item.colors.file}`;
    dlColors.setAttribute('download', item.colors.file);
    dlColors.title = `${item.colors.file}: ${(item.colors.bytes / 1e6).toFixed(1)} MB, one body for each of ${item.colors.palette.length} colors, for a printer that changes filament`;
    swatches.replaceChildren(...item.colors.palette.map((c) => h('i', { style: `background: rgb(${c.join(',')})` })));
    dlSupports.hidden = !item.supports;
    if (item.supports) {
      dlSupports.href = `${base}${item.supports.file}`;
      dlSupports.setAttribute('download', item.supports.file);
    }
    canvas.setAttribute(
      'aria-label',
      `${item.title}: ${item.blurb} A plastic trinket, ${dims} millimeters. Drag it, or use the arrow keys, to turn it; Home puts it back.`,
    );
    await table.show(() => meshOf(item), { spin: true });
    if (was < 0) canvas.focus({ preventScroll: true });
  }
  const step = (dir: 1 | -1) => void choose((at + dir + total) % total);

  return [
    h(
      'div',
      { class: 'trk-panel' },
      h('h2', null, 'Plastic trinkets'),
      list,
      info,
      h(
        'p',
        { class: 'trk-help', id: 'trk-help' },
        `Choose one to see it in place of the box. Drag it, or use the arrow keys, to turn it; PageUp and PageDown change trinket.${phone ? ' The phone also zooms (scroll or pinch), pans (shift-drag or two fingers) and resets (double-click or Home).' : ''}`,
      ),
    ),
    float,
  ];
}
