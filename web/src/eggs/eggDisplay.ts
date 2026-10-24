// The felt eggs on the desk's wall: a small shadow box standing on the top game shelf that
// holds each egg found so far (two rows, seven and six, when all thirteen are in), and, once
// all three Teddy eggs are, his little trophy at the end (teddyTrophy.ts). Until the first
// one, there is nothing at all; the box only ever shows the eggs that are in it (never how
// many could be). Clicking it opens the viewer (eggViewer.ts). Once every felt egg is in, a
// little cake stand beside it holds the eggs kept apart from them, if any are found (bonus.ts,
// loaded only then; bonusViewer.ts).
import './eggs.css';
import { h, clear } from '../editor/core/ui';
import { EGGS_CHANGED, eggStates, type EggState } from './eggState';
import { drawEgg, eggTexture } from './eggArt';
import { TROPHY_CAPTION, drawTeddyTrophy, hasTeddyTrophy } from './teddyTrophy';

const CELL_W = 30;
const CELL_H = 40;

export function eggDisplay(place: (el: HTMLElement) => void): () => void {
  const box = h('button', { type: 'button', class: 'egg-perch', hidden: true });
  const row = h('span', { class: 'egg-row', 'aria-hidden': 'true' });
  box.append(row);
  place(box);
  // once every felt egg is in, a little cake stand beside it for any eggs kept apart (bonus.ts)
  const stand = h('button', { type: 'button', class: 'egg-stand', hidden: true });
  box.after(stand);
  let found: EggState[] = [];
  let shown = '';
  let opening = false;
  let extra: import('./bonus').BonusState[] = [];
  let standShown = '';

  const refreshStand = async (complete: boolean) => {
    if (!complete) {
      extra = [];
      stand.hidden = true;
      standShown = '';
      return;
    }
    const [{ bonusStates, eggTaps, TAPS }, { drawCakeStand }] = await Promise.all([import('./bonus'), import('./bonusArt')]);
    extra = (await bonusStates()).filter((e) => e.found);
    // how far the rotten egg was tapped (the viewer, or EGG.EXE): its cracks, or the IOU inside
    const taps = eggTaps();
    const items = extra.map((e) => (e.egg.id === 'rotten' ? (taps >= TAPS ? 'iou' : 'rotten') : 'pastry'));
    const key = `${items.join(',')}:${taps}`;
    if (key === standShown) return;
    standShown = key;
    stand.hidden = !items.length;
    if (!items.length) return;
    const names = items.map((i) =>
      i === 'rotten' ? (taps ? `a rotten egg, cracked by ${taps} of ${TAPS} taps` : 'a rotten egg') : i === 'iou' ? 'an IOU note' : 'a pastry egg',
    );
    stand.setAttribute('aria-label', `Cake stand with ${names.join(' and ')}: take a closer look`);
    stand.title = 'A cake stand';
    const W = 56;
    const H = 46;
    const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1)) * 1.5;
    const c = h('canvas', { class: 'egg-stand-art', width: W * k, height: H * k, 'aria-hidden': 'true' });
    drawCakeStand(c.getContext('2d')!, W * k, H * k, items, taps);
    clear(stand, c, items.includes('rotten') ? h('span', { class: 'egg-stand-wisp', 'aria-hidden': 'true' }) : null);
  };

  const refresh = async () => {
    const all = await eggStates();
    found = all.filter((e) => e.found);
    void refreshStand(all.length > 0 && found.length === all.length).catch(() => undefined);
    const key = found.map((e) => e.egg.game).join(',');
    if (key === shown) return;
    shown = key;
    box.hidden = !found.length;
    const n = found.length;
    const trophy = hasTeddyTrophy(found.map((e) => e.egg.game));
    const eggs = n === 1 ? 'a felt egg' : `${n} felt eggs`;
    box.setAttribute('aria-label', `Shadow box with ${eggs}${trophy ? ' and a little trophy of Teddy' : ''}: take a closer look`);
    box.title = trophy ? `${n} felt eggs. ${TROPHY_CAPTION}.` : n === 1 ? 'A felt egg' : `${n} felt eggs`;
    const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    const teddy = () => {
      const c = h('canvas', { class: 'egg-trophy', width: CELL_W * k, height: CELL_H * k });
      const g = c.getContext('2d')!;
      g.scale(k, k);
      drawTeddyTrophy(g, CELL_W, CELL_H);
      return c;
    };
    clear(
      row,
      ...found.map((e, i) => {
        const c = h('canvas', { class: 'egg-mini', width: CELL_W * k, height: CELL_H * k });
        const g = c.getContext('2d')!;
        // each sits turned a little its own way, showing its appliqué
        drawEgg(g, eggTexture(e.egg.look), (i % 3) * 0.35 - 0.35, { x: 2 * k, y: 4 * k, w: (CELL_W - 4) * k, h: (CELL_H - 6) * k }, 80);
        return c;
      }),
      trophy ? teddy() : null,
    );
  };

  box.addEventListener('click', async () => {
    if (opening || !found.length) return;
    opening = true;
    try {
      const { openEggViewer } = await import('./eggViewer');
      await openEggViewer(found);
    } finally {
      opening = false;
      box.focus();
    }
  });

  stand.addEventListener('click', async () => {
    if (opening || !extra.length) return;
    opening = true;
    try {
      const { openBonusViewer } = await import('./bonusViewer');
      await openBonusViewer(extra);
    } finally {
      opening = false;
      stand.focus();
      void refresh();
    }
  });

  const onChange = () => void refresh();
  const onVisible = () => document.visibilityState === 'visible' && onChange();
  window.addEventListener(EGGS_CHANGED, onChange);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  // a game saved on the desk's PC (or in another tab) can bring an egg home
  const poll = setInterval(() => document.visibilityState === 'visible' && onChange(), 8000);
  void refresh();
  return () => {
    clearInterval(poll);
    window.removeEventListener(EGGS_CHANGED, onChange);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    box.remove();
    stand.remove();
  };
}
