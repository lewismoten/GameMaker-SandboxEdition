// The plastic trinkets that came in a game's box (the game's figures as 3D printable toys), one at a
// time: a shiny model to turn in the browser (drag, or the arrow keys) with buttons (and PageUp and
// PageDown) to go to the next, and links to its STL, and to the STL of its supports when a plain
// printer would need them. The files are build output (games/<id>/tools/trinkets.ts writes them to
// trinkets/<id>/ on the site); a game without any gets no shelf. The viewer (trinketGl.ts) loads when
// the shelf first shows.
import './trinketShelf.css';
import { h } from '../../editor/core/ui';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import type { TrinketView } from './trinketGl';

interface TrinketItem {
  id: string;
  title: string;
  blurb: string;
  file: string;
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
  let at = 0;
  let view: TrinketView | undefined;
  let visible = true;
  let spinning = !reduced();
  let last = 0;
  let raf = 0;
  let showing = 0; // which load is current, so a slow file can't replace a later one

  const canvas = h('canvas', {
    class: 'trk-canvas',
    tabindex: 0,
    role: 'img',
    'aria-describedby': 'trk-help',
  });
  const title = h('strong', { class: 'trk-title' });
  const blurb = h('span', { class: 'trk-blurb' });
  const size = h('span', { class: 'trk-size' });
  const print = h('span', { class: 'trk-print' });
  const dl = h('a', { class: 'trk-dl', download: '' }, '3D printer, one color (STL)');
  const dlColors = h('a', { class: 'trk-dl', download: '' }, '3D printer, up to 4 colors (3MF)');
  const swatches = h('span', { class: 'trk-swatches', 'aria-hidden': 'true' });
  const dlSupports = h('a', { class: 'trk-dl', download: '' }, 'Supports for a second material (STL)');
  const count = h('span', { class: 'trk-count', 'aria-live': 'polite' });
  const status = h('span', { class: 'trk-flat', hidden: '' }, '3D is not available here; the STL still downloads.');
  const nav = (dir: 1 | -1) =>
    h(
      'button',
      {
        class: 'trk-nav',
        type: 'button',
        'aria-label': dir > 0 ? 'Next trinket' : 'Previous trinket',
        title: dir > 0 ? 'Next trinket (PageDown)' : 'Previous trinket (PageUp)',
        onclick: () => step(dir),
      },
      dir > 0 ? '▶' : '◀',
    );

  const frame = (t: number) => {
    raf = 0;
    if (spinning && visible && view) {
      view.yaw += Math.min(t - last, 50) * 0.0006;
      last = t;
    }
    view?.draw();
    if (spinning && visible) raf = requestAnimationFrame(frame);
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

  const show = async (i: number) => {
    at = (i + items.length) % items.length;
    const item = items[at];
    const mine = ++showing;
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
    count.textContent = `${at + 1} of ${items.length}`;
    canvas.setAttribute(
      'aria-label',
      `${item.title}: ${item.blurb} A plastic trinket, ${dims} millimeters. Drag it, or use the arrow keys, to turn it; Home puts it back.`,
    );
    canvas.classList.add('loading');
    try {
      const [{ createTrinketView }, mesh] = await Promise.all([import('./trinketGl'), loadMesh(`${base}${item.file}`)]);
      if (mine !== showing) return;
      view?.dispose();
      view = createTrinketView(canvas, mesh);
      if (!view) throw new Error('no WebGL');
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
  const step = (dir: 1 | -1) => void show(at + dir);

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
  void show(0);

  return [
    h('h2', null, 'Plastic trinkets'),
    h(
      'div',
      { class: 'trk-body' },
      nav(-1),
      h('div', { class: 'trk-stage' }, canvas, status),
      nav(1),
      h(
        'div',
        { class: 'trk-info' },
        title,
        blurb,
        size,
        print,
        h('span', { class: 'trk-links' }, dl, h('span', { class: 'trk-colorline' }, dlColors, swatches), dlSupports),
        count,
      ),
    ),
    h('p', { class: 'trk-help', id: 'trk-help' }, 'Drag it, or use the arrow keys, to turn it. PageUp and PageDown, or the buttons, change trinket.'),
  ];
}
