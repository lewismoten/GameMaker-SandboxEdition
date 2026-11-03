// The plastic trinkets that came in a game's box (the game's figures as 3D printable toys), listed as
// items under the box: choosing one takes the turning box's place in the viewer with that trinket, a
// shiny model to turn (drag, or the arrow keys), and choosing it again, or "Back to the box", brings
// the box back. A labeled STL / 3MF switch shows it in one color (the STL) or in the colors of the 3MF
// (the default). There are links to its files, and to the STL of its supports when a plain printer would
// need them. The files are build output (games/depth/tools/trinkets.ts and games/kit/pixelTrinkets.ts
// write them to trinkets/<id>/ on the site); a game without any gets no shelf. The viewer (trinketGl.ts)
// loads when a trinket is first chosen.
import './trinketShelf.css';
import { h } from '../../editor/core/ui';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import type { TrinketView } from './trinketGl';

interface TrinketItem {
  id: string;
  title: string;
  blurb: string;
  file: string;
  /** An STL that carries a color on each triangle, to show the 3MF's colors (the plain file may be one color). */
  preview?: string;
  triangles: number;
  bytes: number;
  mm: [number, number, number];
  overhangMm2: number;
  supports: { file: string; bytes: number } | null;
  colors: { file: string; bytes: number; palette: [number, number, number][] };
}

const TURN = 0.3;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const meshes = new Map<string, Promise<Mesh>>();

function loadMesh(url: string): Promise<Mesh> {
  let p = meshes.get(url);
  if (!p) {
    p = Promise.all([import('@lewismoten/gamemaker-sandbox-tools/mesh/stl'), fetch(url)]).then(async ([{ readStl }, res]) => {
      if (!res.ok) throw new Error(`${res.status}`);
      return readStl(new Uint8Array(await res.arrayBuffer()));
    });
    p.catch(() => meshes.delete(url));
    meshes.set(url, p);
  }
  return p;
}

/** The shelf for game `id`, or an element that stays hidden when the game has no trinkets. */
export function trinketShelf(id: string): HTMLElement {
  const base = `./trinkets/${id}/`;
  const shelf = h('section', { class: 'bc-trinkets', hidden: '', 'aria-label': 'Plastic trinkets' });
  void fetch(`${base}manifest.json`)
    .then((res) => (res.ok && res.headers.get('content-type')?.includes('json') ? (res.json() as Promise<{ items: TrinketItem[] }>) : undefined))
    .then((m) => {
      if (m?.items.length) {
        shelf.append(...viewer(base, m.items));
        shelf.hidden = false;
      }
    })
    .catch(() => undefined);
  return shelf;
}

function viewer(base: string, items: TrinketItem[]): HTMLElement[] {
  let at = -1; // -1: the box is showing
  let colors = true; // the 3MF's colors, or the STL's one color
  let view: TrinketView | undefined;
  let visible = true;
  let spinning = !reduced();
  let last = 0;
  let raf = 0;
  let showing = 0; // which load is current, so a slow file can't replace a later one

  const canvas = h('canvas', { class: 'trk-canvas', tabindex: 0, role: 'img', 'aria-describedby': 'trk-help' });
  const status = h('span', { class: 'trk-flat', hidden: '' }, '3D is not available here; the files still download.');
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
  const list = h('div', { class: 'trk-list', role: 'group', 'aria-label': 'Trinkets in this box' }, ...chips);

  const frame = (t: number) => {
    raf = 0;
    if (spinning && visible && view) {
      view.yaw += Math.min(t - last, 50) * 0.0006;
      last = t;
    }
    view?.draw();
    if (spinning && visible && at >= 0) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const turn = (dyaw: number, dpitch: number) => {
    if (!view) return;
    spinning = false;
    view.yaw += dyaw;
    view.pitch = Math.max(-1.2, Math.min(1.2, view.pitch + dpitch));
    wake();
  };

  /** The mesh shown: with the 3MF's colors, or the same shape in one color. */
  const meshOf = async (item: TrinketItem) => {
    const mesh = await loadMesh(`${base}${item.preview ?? item.file}`);
    return colors || !mesh.colors ? mesh : { positions: mesh.positions, indices: mesh.indices };
  };
  const show = async () => {
    const item = items[at];
    const mine = ++showing;
    canvas.classList.add('loading');
    try {
      const [{ createTrinketView }, mesh] = await Promise.all([import('./trinketGl'), meshOf(item)]);
      if (mine !== showing) return;
      const keep = view && { yaw: view.yaw, pitch: view.pitch };
      view?.dispose();
      view = createTrinketView(canvas, mesh);
      if (!view) throw new Error('no WebGL');
      if (keep) Object.assign(view, keep);
      status.hidden = true;
      canvas.hidden = false;
      canvas.classList.remove('loading');
      wake();
    } catch {
      if (mine !== showing) return;
      canvas.hidden = true;
      status.hidden = false;
    }
  };
  function setColors(on: boolean) {
    colors = on;
    modeColors.setAttribute('aria-pressed', String(on));
    modeOne.setAttribute('aria-pressed', String(!on));
    if (at >= 0) void show();
  }
  /** Chooses trinket `i` (in the box viewer's place), or -1 for the box again. */
  async function choose(i: number) {
    const was = at;
    at = i;
    chips.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));
    const viewer = list.closest('.box-viewer');
    viewer?.classList.toggle('trinket-on', i >= 0);
    float.hidden = info.hidden = i < 0;
    if (i < 0) {
      showing++;
      view?.dispose();
      view = undefined;
      if (was >= 0) chips[was].focus({ preventScroll: true });
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
    spinning = !reduced();
    await show();
    if (was < 0) canvas.focus({ preventScroll: true });
  }
  const step = (dir: 1 | -1) => void choose((at + dir + items.length) % items.length);

  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') turn(-TURN, 0);
    else if (e.key === 'ArrowRight') turn(TURN, 0);
    else if (e.key === 'ArrowUp') turn(0, -0.2);
    else if (e.key === 'ArrowDown') turn(0, 0.2);
    else if (e.key === 'Home' && view) {
      view.yaw = 0.6;
      view.pitch = 0.28;
      turn(0, 0);
    } else if (e.key === 'PageDown') step(1);
    else if (e.key === 'PageUp') step(-1);
    else return;
    e.preventDefault();
  });
  let drag: { x: number; y: number } | undefined;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('turning');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    turn((e.clientX - drag.x) * 0.012, (e.clientY - drag.y) * 0.008);
    drag = { x: e.clientX, y: e.clientY };
  });
  const release = () => {
    drag = undefined;
    canvas.classList.remove('turning');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  }).observe(canvas);

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
        'Choose one to see it in place of the box. Drag it, or use the arrow keys, to turn it; PageUp and PageDown change trinket.',
      ),
    ),
    float,
  ];
}
