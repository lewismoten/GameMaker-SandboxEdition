// The Library's toy box (the chest on the room's floor, libraryPage.ts opens it in a dialog): every
// game's 3D-printable trinkets in one place, grouped by game. Each shows a real picture of itself
// (the box viewer's renderer, drawn once: desk/boxes/trinketSnap.ts, when it scrolls near), a 3MF colors /
// STL one color switch that redraws it, and links to both files. The desk's code loads only when the toy
// box opens (AGENTS.md "Loading"); which games are listed is toyBoxList.ts.
import './toyBox.css';
import { h } from '../editor/core/ui';
import { loadCatalog } from '../project/files';
import { toyBoxGames, type ToyGame } from './toyBoxList';
import type { TrinketItem } from '../desk/boxes/trinketData';

const SIZE = { w: 180, h: 180 };
const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;

type Data = typeof import('../desk/boxes/trinketData');
type Snap = typeof import('../desk/boxes/trinketSnap');

/** One trinket: its picture, name, switch and downloads. */
function card(base: string, item: TrinketItem, data: Data, snap: Snap, near: IntersectionObserver, watch: Map<Element, () => void>): HTMLElement {
  const dims = item.mm.map((v) => Math.round(v)).join(' × ');
  const img = h('img', {
    class: 'toy-pic',
    width: SIZE.w,
    height: SIZE.h,
    alt: `${item.title}: ${item.blurb} A rendered picture of the 3D print, ${dims} millimeters.`,
    hidden: '',
  });
  const note = h('span', { class: 'toy-note' }, 'Drawing it…');
  const pic = h('div', { class: 'toy-art' }, img, note);
  let colors = true;
  let drawing = 0;
  const paint = async () => {
    const mine = ++drawing;
    try {
      const url = await snap.snapTrinket(await data.trinketMesh(base, item, colors), SIZE.w, SIZE.h);
      if (mine !== drawing) return;
      if (!url) throw new Error('no WebGL');
      img.src = url;
      img.hidden = false;
      note.hidden = true;
    } catch {
      if (mine !== drawing) return;
      img.hidden = true;
      note.hidden = false;
      note.textContent = '3D is not available here; the files still download.';
    }
  };
  const mode = (label: string, on: boolean) =>
    h(
      'button',
      {
        class: 'toy-btn',
        type: 'button',
        'aria-pressed': String(on === colors),
        onclick: () => {
          if (colors === on) return;
          colors = on;
          for (const b of group.children) b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.colors === String(colors)));
          void paint();
        },
        'data-colors': String(on),
      },
      label,
    );
  const group = h('div', { class: 'toy-mode', role: 'group', 'aria-label': `Show ${item.title} as` }, mode('3MF: colors', true), mode('STL: one color', false));
  const swatches = item.colors.palette.map((c) => h('i', { style: `background: rgb(${c.join(',')})` }));
  const el = h(
    'li',
    { class: 'toy-card' },
    pic,
    h('strong', { class: 'toy-name' }, item.title),
    h('span', { class: 'toy-size' }, `${dims} mm`),
    group,
    h(
      'span',
      { class: 'toy-links' },
      h('a', { class: 'toy-dl', href: `${base}${item.file}`, download: item.file, title: `${item.file}: ${mb(item.bytes)}, one color` }, 'STL'),
      h(
        'a',
        {
          class: 'toy-dl',
          href: `${base}${item.colors.file}`,
          download: item.colors.file,
          title: `${item.colors.file}: ${mb(item.colors.bytes)}, one body for each of ${item.colors.palette.length} colors`,
        },
        '3MF',
      ),
      h('span', { class: 'toy-swatches', 'aria-hidden': 'true' }, ...swatches),
    ),
  );
  watch.set(el, () => void paint());
  near.observe(el);
  return el;
}

function section(game: ToyGame, data: Data, snap: Snap, near: IntersectionObserver, watch: Map<Element, () => void>): HTMLElement {
  const base = data.trinketBase(game.id);
  const id = `toy-h-${game.id}`;
  return h(
    'section',
    { class: 'toy-game', 'aria-labelledby': id },
    h('h3', { id }, game.title, h('span', { class: 'toy-count' }, ` · ${game.items.length}`)),
    h('ul', { class: 'toy-list' }, ...game.items.map((item) => card(base, item, data, snap, near, watch))),
  );
}

/** The toy box's contents: fills in once the manifests are read. */
export function makeToyBox(): HTMLElement {
  const root = h('div', { class: 'toy-box' }, h('p', { class: 'lead' }, 'Opening the toy box…'));
  void (async () => {
    const [entries, data, snap] = await Promise.all([loadCatalog().catch(() => []), import('../desk/boxes/trinketData'), import('../desk/boxes/trinketSnap')]);
    const games = await toyBoxGames(entries, data.loadTrinkets);
    const watch = new Map<Element, () => void>();
    const near = new IntersectionObserver(
      (seen) => {
        for (const e of seen)
          if (e.isIntersecting) {
            near.unobserve(e.target);
            watch.get(e.target)?.();
          }
      },
      { rootMargin: '300px' },
    );
    if (!games.length) {
      root.replaceChildren(h('p', { class: 'lead' }, 'The toy box is empty: no trinket files are on this site.'));
      return;
    }
    const total = games.reduce((n, g) => n + g.items.length, 0);
    root.replaceChildren(
      h(
        'p',
        { class: 'lead' },
        `${total} little figures from ${games.length} games, ready for a 3D printer. STL is one color; 3MF carries up to four filament colors.`,
      ),
      ...games.map((g) => section(g, data, snap, near, watch)),
    );
  })();
  return root;
}
