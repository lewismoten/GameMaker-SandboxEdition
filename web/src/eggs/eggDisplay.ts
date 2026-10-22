// The felt eggs on the desk's wall: a narrow shadow box under the poster that holds each egg
// found so far. Until the first one, there is nothing at all; the box only ever shows the
// eggs that are in it (never how many could be). Clicking it opens the viewer (eggViewer.ts).
import './eggs.css';
import { h, clear } from '../editor/core/ui';
import { EGGS_CHANGED, eggStates, type EggState } from './eggState';
import { drawEgg, eggTexture } from './eggArt';

const CELL_W = 30;
const CELL_H = 40;

export function eggDisplay(place: (el: HTMLElement) => void): () => void {
  const box = h('button', { type: 'button', class: 'egg-perch', hidden: true });
  const row = h('span', { class: 'egg-row', 'aria-hidden': 'true' });
  box.append(row);
  place(box);
  let found: EggState[] = [];
  let shown = '';
  let opening = false;

  const refresh = async () => {
    found = (await eggStates()).filter((e) => e.found);
    const key = found.map((e) => e.egg.game).join(',');
    if (key === shown) return;
    shown = key;
    box.hidden = !found.length;
    const n = found.length;
    box.setAttribute('aria-label', `Shadow box with ${n === 1 ? 'a felt egg' : `${n} felt eggs`}: take a closer look`);
    box.title = n === 1 ? 'A felt egg' : `${n} felt eggs`;
    const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    clear(
      row,
      ...found.map((e, i) => {
        const c = h('canvas', { class: 'egg-mini', width: CELL_W * k, height: CELL_H * k });
        const g = c.getContext('2d')!;
        // each sits turned a little its own way, showing its appliqué
        drawEgg(g, eggTexture(e.egg.look), (i % 3) * 0.35 - 0.35, { x: 2 * k, y: 4 * k, w: (CELL_W - 4) * k, h: (CELL_H - 6) * k }, 80);
        return c;
      }),
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
  };
}
