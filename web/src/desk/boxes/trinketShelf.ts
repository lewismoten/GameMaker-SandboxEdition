// The plastic trinkets that came in a game's box (the game's figures as 3D printable toys): each
// is a small shiny model to turn in the browser (drag, or the arrow keys) with a link to its STL
// for a 3D printer. The files are build output (games/<id>/tools/trinkets.ts writes them to
// trinkets/<id>/ on the site); a game without any gets no shelf. The viewer (trinketGl.ts) loads
// when the first card is shown.
import './trinketShelf.css';
import { h } from '../../editor/core/ui';

interface TrinketItem {
  id: string;
  title: string;
  blurb: string;
  file: string;
  triangles: number;
  bytes: number;
  mm: [number, number, number];
}

const TURN = 0.3;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const meshes = new Map<string, Promise<import('@lewismoten/gamemaker-sandbox-tools/mesh/mesh').Mesh>>();

/** One trinket: its canvas, the words under it and the download link. Starts loading when it scrolls into view. */
function card(base: string, item: TrinketItem): HTMLElement {
  const url = `${base}${item.file}`;
  const size = item.mm.map((v) => Math.round(v)).join(' × ');
  const canvas = h('canvas', {
    class: 'trk-canvas',
    tabindex: 0,
    role: 'img',
    'aria-label': `${item.title}: ${item.blurb} A plastic trinket, ${size} millimeters. Drag it, or use the arrow keys, to turn it; Home puts it back.`,
  });
  const link = h(
    'a',
    { class: 'trk-dl', href: url, download: item.file, title: `${item.file}: ${(item.bytes / 1e6).toFixed(1)} MB, ${size} mm` },
    'Download for a 3D printer (STL)',
  );
  const fig = h('figure', { class: 'trk' }, canvas, h('figcaption', null, h('strong', null, item.title), h('span', { class: 'trk-size' }, `${size} mm`)), link);

  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    fig.classList.add('loading');
    try {
      const [{ createTrinketView }, { readStl }] = await Promise.all([import('./trinketGl'), import('@lewismoten/gamemaker-sandbox-tools/mesh/stl')]);
      let mesh = meshes.get(url);
      if (!mesh) {
        mesh = fetch(url).then(async (res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return readStl(new Uint8Array(await res.arrayBuffer()));
        });
        meshes.set(url, mesh);
      }
      const view = createTrinketView(canvas, await mesh);
      if (!view) throw new Error('no WebGL');
      fig.classList.remove('loading');
      let visible = true;
      let spinning = !reduced();
      let last = 0;
      let raf = 0;
      const frame = (t: number) => {
        raf = 0;
        if (spinning && visible) {
          view.yaw += Math.min(t - last, 50) * 0.0006;
          last = t;
        }
        view.draw();
        if (spinning && visible) raf = requestAnimationFrame(frame);
      };
      const wake = () => {
        if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      const turn = (dyaw: number, dpitch: number) => {
        spinning = false;
        view.yaw += dyaw;
        view.pitch = Math.max(-1.2, Math.min(1.2, view.pitch + dpitch));
        wake();
      };
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) wake();
      }).observe(canvas);
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
      canvas.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') turn(-TURN, 0);
        else if (e.key === 'ArrowRight') turn(TURN, 0);
        else if (e.key === 'ArrowUp') turn(0, -0.2);
        else if (e.key === 'ArrowDown') turn(0, 0.2);
        else if (e.key === 'Home') {
          view.yaw = 0.6;
          view.pitch = 0.28;
          turn(0, 0);
        } else return;
        e.preventDefault();
      });
      wake();
    } catch {
      fig.classList.remove('loading');
      fig.classList.add('flat');
      canvas.remove();
      fig.prepend(h('span', { class: 'trk-flat' }, '3D is not available here; the STL still downloads.'));
    }
  };
  new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) {
      obs.disconnect();
      void start();
    }
  }).observe(fig);
  return fig;
}

/** The shelf for game `id`, or an empty element that stays hidden when the game has no trinkets. */
export function trinketShelf(id: string): HTMLElement {
  const base = `./trinkets/${id}/`;
  const shelf = h('section', { class: 'bc-trinkets', hidden: '', 'aria-label': 'Plastic trinkets' });
  void fetch(`${base}manifest.json`)
    .then((res) => (res.ok && res.headers.get('content-type')?.includes('json') ? (res.json() as Promise<{ items: TrinketItem[] }>) : undefined))
    .then((m) => {
      if (!m?.items.length) return;
      shelf.append(
        h('h2', null, 'Plastic trinkets'),
        h('p', { class: 'trk-note' }, 'Turn them with the mouse or arrow keys. Each downloads as an STL to print.'),
        h('div', { class: 'trk-row' }, ...m.items.map((item) => card(base, item))),
      );
      shelf.hidden = false;
    })
    .catch(() => undefined);
  return shelf;
}
