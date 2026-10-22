// The Sandbox BBS mug on the desk, full of pencils and pens: printed with the design chosen in
// the mug viewer (click it to turn it round, pick another picture, or print your own). It
// stands with its handle round to the right, the picture on its side facing the room.
import './mug.css';
import { h } from '../../editor/core/ui';
import { designCanvas, isDesign, loadDesign, type MugDesignId } from './mugArt';
import { MUG_SIZES, printPlacement, type MugSize } from './mugSizes';
import { MUG_COLORS, drawMug, wrapAngle, wrapCanvas, type MugColors } from './mug3d';

export interface MugChoice {
  design: MugDesignId;
  color: string;
  size: string;
}

const KEY = 'gm-mug';
const CHANGED = 'gm-mug-change';

export function loadMug(): MugChoice {
  const fallback: MugChoice = { design: 'scene', color: 'white', size: '11oz' };
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<MugChoice>;
    return {
      design: isDesign(v.design) ? v.design : fallback.design,
      color: MUG_COLORS.some((c) => c.id === v.color) ? v.color! : fallback.color,
      size: MUG_SIZES.some((s) => s.id === v.size) ? v.size! : fallback.size,
    };
  } catch {
    return fallback;
  }
}

export function saveMug(choice: MugChoice): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    // private window: the mug just won't remember
  }
  window.dispatchEvent(new CustomEvent(CHANGED));
}

export const sizeOf = (id: string): MugSize => MUG_SIZES.find((s) => s.id === id) ?? MUG_SIZES[0];
export const colorsOf = (id: string): MugColors => (MUG_COLORS.find((c) => c.id === id) ?? MUG_COLORS[0]).colors;

const W = 90;
const H = 150;

const PENCILS = `<g stroke="#1a1a1a" stroke-width="0.6">
  <g transform="rotate(-14 30 70)"><rect x="24" y="8" width="7" height="70" fill="#f2c200"/><polygon points="24,8 31,8 27.5,0" fill="#e8c9a0"/><polygon points="26.5,2.5 28.5,2.5 27.5,0" fill="#333"/><rect x="24" y="72" width="7" height="6" fill="#d33"/></g>
  <g transform="rotate(8 50 70)"><rect x="46" y="4" width="6" height="74" fill="#1f4fbf"/><rect x="46" y="4" width="6" height="12" fill="#e9e9e9"/><rect x="51" y="8" width="1.6" height="16" fill="#c0c0c0"/></g>
  <g transform="rotate(-3 40 70)"><rect x="37" y="14" width="6" height="64" fill="#c22"/><rect x="37" y="14" width="6" height="8" fill="#222"/></g>
  <g transform="rotate(18 62 70)"><rect x="58" y="12" width="7" height="66" fill="#2c8a3c"/><polygon points="58,12 65,12 61.5,4" fill="#e8c9a0"/><polygon points="60.5,6.5 62.5,6.5 61.5,4" fill="#333"/></g>
</g>`;

/** The mug as it stands on the desk: handle round to the right, a little behind. */
export function deskMug(open: () => void): HTMLElement {
  const back = h('canvas', { class: 'mug-layer' });
  const front = h('canvas', { class: 'mug-layer' });
  const pencils = h('div', { class: 'mug-layer' });
  pencils.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${PENCILS}</svg>`;
  const el = h('div', { class: 'desk-mug mug-prop', role: 'button', tabindex: '0' }, back, pencils, front);
  const paint = () => {
    const choice = loadMug();
    const size = sizeOf(choice.size);
    const k = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
    const texture = wrapCanvas(choice.design, size, 60);
    // turned so the back copy of the picture faces the room
    const art = designCanvas(choice.design);
    const at = printPlacement(size, art.width / art.height);
    const rot = -wrapAngle(size, at.centers[1]);
    // the body fills the same space whatever the size: a taller mug is drawn a little narrower
    const radius = Math.min(31, (70 * size.diameter) / (2 * size.height));
    for (const [c, layer] of [
      [back, 'back'],
      [front, 'front'],
    ] as const) {
      c.width = W * k;
      c.height = H * k;
      const g = c.getContext('2d')!;
      g.scale(k, k);
      drawMug(g, {
        texture,
        size,
        colors: colorsOf(choice.color),
        rot,
        cx: 41,
        top: 144 - (radius * 2 * size.height) / size.diameter,
        radius,
        layer,
      });
    }
    el.setAttribute('aria-label', 'The Sandbox mug: look closer, choose its picture (the BBS or a Sandbox game), print your own');
    el.title = 'The Sandbox mug: click to turn it round';
  };
  paint();
  // a game's picture comes from its files: paint again once it's here
  void loadDesign(loadMug().design).then(() => el.isConnected && paint());
  const changed = () => (el.isConnected ? paint() : window.removeEventListener(CHANGED, changed));
  window.addEventListener(CHANGED, changed);
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open()));
  return el;
}
