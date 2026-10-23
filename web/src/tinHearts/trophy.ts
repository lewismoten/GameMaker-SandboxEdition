// The tin heart hunt's trophy on the desk: once every counted tin heart is found (tinHearts.ts),
// the diamond heart the rotten egg's IOU promised appears at the end of the bottom shelf, on a
// riveted tin stand in Mystery Robot Joe's style with a brass plate: "Presented by Mystery
// Robot Joe". Until then there is nothing at all. Clicking it gives a closer look, the heart
// turning in the light, and a short note from Joe. A nod to the Tin Man; nothing more.
// With reduced motion the heart holds still (drag or ← → still turn it).
import './trophy.css';
import '../eggs/eggs.css';
import { h, clear } from '../editor/core/ui';
import { heartStates, watchHearts } from './tinHearts';

type Art = typeof import('../eggs/bonusArt');

/** The riveted tin stand and its brass plate, `w` wide, its foot on `baseY`, centered on `cx`. */
export function drawStand(g: CanvasRenderingContext2D, cx: number, baseY: number, w: number): { top: number } {
  const hgt = w * 0.42;
  const top = baseY - hgt;
  const x0 = cx - w / 2;
  // a tin box, lighter on its left like Joe
  const tin = g.createLinearGradient(x0, 0, x0 + w, 0);
  tin.addColorStop(0, '#d9dee3');
  tin.addColorStop(0.45, '#a7afb7');
  tin.addColorStop(1, '#6d757d');
  g.fillStyle = tin;
  g.fillRect(x0, top, w, hgt);
  // its lid, a step narrower and lighter
  g.fillStyle = '#c3c9cf';
  g.fillRect(x0 + w * 0.08, top - hgt * 0.16, w * 0.84, hgt * 0.16);
  g.strokeStyle = '#3c4248';
  g.lineWidth = Math.max(0.8, w * 0.02);
  g.strokeRect(x0, top, w, hgt);
  g.strokeRect(x0 + w * 0.08, top - hgt * 0.16, w * 0.84, hgt * 0.16);
  // rivets in the corners
  const rivet = (x: number, y: number) => {
    const r = Math.max(0.9, w * 0.03);
    g.fillStyle = '#eef1f4';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4d545b';
    g.beginPath();
    g.arc(x + r * 0.35, y + r * 0.35, r * 0.55, 0, Math.PI * 2);
    g.fill();
  };
  for (const [fx, fy] of [[0.07, 0.18], [0.93, 0.18], [0.07, 0.84], [0.93, 0.84]]) rivet(x0 + w * fx, top + hgt * fy);
  // the brass plate, with its words (legible when the stand is drawn large)
  const pw = w * 0.7;
  const ph = hgt * 0.5;
  const px = cx - pw / 2;
  const py = top + hgt * 0.26;
  const brass = g.createLinearGradient(0, py, 0, py + ph);
  brass.addColorStop(0, '#f7dc8a');
  brass.addColorStop(0.5, '#c99a3a');
  brass.addColorStop(1, '#8a6420');
  g.fillStyle = brass;
  g.fillRect(px, py, pw, ph);
  g.strokeStyle = '#5c4210';
  g.lineWidth = Math.max(0.6, w * 0.012);
  g.strokeRect(px, py, pw, ph);
  if (w >= 120) {
    g.fillStyle = '#3a2a08';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `600 ${Math.round(ph * 0.26)}px Georgia, 'Times New Roman', serif`;
    g.fillText('PRESENTED BY', cx, py + ph * 0.32);
    g.fillText('MYSTERY ROBOT JOE', cx, py + ph * 0.68);
  } else {
    g.fillStyle = 'rgba(58, 42, 8, 0.7)';
    g.fillRect(px + pw * 0.15, py + ph * 0.3, pw * 0.7, Math.max(0.7, ph * 0.12));
    g.fillRect(px + pw * 0.1, py + ph * 0.6, pw * 0.8, Math.max(0.7, ph * 0.12));
  }
  // a little tin cup on the lid that the heart sits in
  const cupY = top - hgt * 0.16;
  g.fillStyle = '#9aa2aa';
  g.beginPath();
  g.moveTo(cx - w * 0.16, cupY);
  g.lineTo(cx + w * 0.16, cupY);
  g.lineTo(cx + w * 0.1, cupY - hgt * 0.22);
  g.lineTo(cx - w * 0.1, cupY - hgt * 0.22);
  g.closePath();
  g.fill();
  g.strokeStyle = '#3c4248';
  g.stroke();
  return { top: cupY - hgt * 0.22 };
}

/** The whole trophy, w x h: the stand and the heart on it. */
function drawTrophy(art: Art, g: CanvasRenderingContext2D, w: number, hh: number, turn: number, time: number): void {
  const sw = w * 0.86;
  const { top } = drawStand(g, w / 2, hh * 0.98, sw);
  const size = Math.min(w * 0.9, (top - hh * 0.02) * 1.05);
  art.drawHeart(g, w / 2, top - size * 0.42, size, turn, time);
}

/** Shows the trophy once every counted heart is found; returns the function that takes it away. */
export function heartTrophy(place: (el: HTMLElement) => void): () => void {
  const btn = h('button', { type: 'button', class: 'heart-trophy', hidden: true });
  place(btn);
  let total = 0;
  let shown = false;
  let opening = false;

  const refresh = async () => {
    const states = await heartStates().catch(() => []);
    total = states.length;
    const done = total > 0 && states.every((s) => s.found);
    if (done === shown) return;
    shown = done;
    btn.hidden = !done;
    if (!done) return clear(btn);
    const art = await import('../eggs/bonusArt');
    const W = 44;
    const H = 60;
    const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1)) * 1.5;
    const c = h('canvas', { class: 'heart-trophy-art', width: W * k, height: H * k, 'aria-hidden': 'true' });
    const g = c.getContext('2d')!;
    g.scale(k, k);
    drawTrophy(art, g, W, H, 0.45, 0.3);
    btn.setAttribute('aria-label', 'A diamond heart on a riveted tin stand, presented by Mystery Robot Joe: take a closer look');
    btn.title = 'Presented by Mystery Robot Joe';
    clear(btn, c);
  };

  btn.addEventListener('click', async () => {
    if (opening || !shown) return;
    opening = true;
    try {
      await openTrophy(total);
    } finally {
      opening = false;
      btn.focus();
    }
  });

  const onChange = () => void refresh();
  const onVisible = () => document.visibilityState === 'visible' && onChange();
  const unwatch = watchHearts(onChange);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  // a heart found on the desk's PC (or in another tab) can complete the set
  const poll = setInterval(() => document.visibilityState === 'visible' && onChange(), 8000);
  void refresh();
  return () => {
    clearInterval(poll);
    unwatch();
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    btn.remove();
  };
}

const WORDS = 'Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty'.split(' ');
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty'];
/** A count as Joe writes it at the start of a sentence: "Twenty-four". */
export const countWord = (n: number): string => (n < 21 ? WORDS[n] : n < 50 ? `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${WORDS[n % 10].toLowerCase()}` : ''}` : String(n));

/** Joe's note, for `n` hearts. */
export const joeNote = (n: number): string =>
  `${countWord(n)} tin hearts, counted twice on my tally counter, and every one of them ticking. The Tin Man walked all the way to Oz for a heart and found he had been kind the whole way there. You went looking in every corner of every game, which is much the same thing. Here is the one I borrowed. Keep it where it can catch the light.`;

/** A closer look: the heart turning on its stand, and Joe's note. Esc closes. */
export async function openTrophy(n: number): Promise<void> {
  const art = await import('../eggs/bonusArt');
  return new Promise((resolve) => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let turn = 0.45;
    let spin = still ? 0 : 0.5;
    let clock = 0;
    let last = performance.now();
    let raf = 0;
    let drag: { x: number; turn: number } | undefined;
    const canvas = h('canvas', { class: 'eggv-canvas', tabindex: 0, role: 'img', 'aria-label': 'A heart cut from one diamond, caged in gold filigree, turning on a riveted tin stand with a brass plate: Presented by Mystery Robot Joe' });
    const stage = h('div', { class: 'eggv-stage' }, canvas, h('p', { class: 'eggv-hint', 'aria-hidden': 'true' }, 'Drag or use ← → to turn it'));
    const draw = () => {
      const r = stage.getBoundingClientRect();
      const k = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(160, Math.round(r.width));
      const hh = Math.max(160, Math.round(r.height));
      if (canvas.width !== w * k || canvas.height !== hh * k) {
        canvas.width = w * k;
        canvas.height = hh * k;
      }
      const g = canvas.getContext('2d')!;
      g.setTransform(k, 0, 0, k, 0, 0);
      g.clearRect(0, 0, w, hh);
      // the stand in proportion, low in the picture, the light the heart gives off behind it
      const tw = Math.min(w * 0.7, hh * 0.62);
      const glow = g.createRadialGradient(w / 2, hh * 0.38, 0, w / 2, hh * 0.38, tw * 0.8);
      glow.addColorStop(0, 'rgba(255, 236, 244, 0.22)');
      glow.addColorStop(1, 'rgba(255, 236, 244, 0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, w, hh);
      g.save();
      g.translate((w - tw) / 2, hh * 0.08);
      drawTrophy(art, g, tw, hh * 0.84, turn, still ? 0.3 : clock);
      g.restore();
    };
    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      clock += dt;
      if (!drag) turn += spin * dt;
      draw();
      raf = requestAnimationFrame(frame);
    };
    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, turn };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (drag) turn = drag.turn + ((e.clientX - drag.x) / Math.max(100, canvas.clientWidth)) * Math.PI * 2;
    });
    canvas.addEventListener('pointerup', () => {
      if (drag) spin = 0;
      drag = undefined;
    });
    const opener = document.activeElement as HTMLElement | null;
    const close = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      opener?.focus();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(e.target instanceof HTMLButtonElement)) {
        spin = 0;
        turn += e.key === 'ArrowLeft' ? -0.25 : 0.25;
        e.preventDefault();
      } else if (e.key === 'Tab') {
        const stops = [closeBtn, canvas];
        const i = stops.indexOf(document.activeElement as HTMLButtonElement);
        stops[(i + 1) % stops.length].focus();
        e.preventDefault();
      }
      e.stopImmediatePropagation(); // not for the PC underneath
    };
    window.addEventListener('keydown', onKey, true);
    const closeBtn = h('button', { type: 'button', onclick: close }, 'Close (Esc)');
    const card = h(
      'div',
      { class: 'eggv-card' },
      h('h2', { id: 'trophy-title' }, 'The Diamond Heart'),
      h('p', { class: 'eggv-where' }, `Presented by Mystery Robot Joe, for finding all ${n} tin hearts`),
      h('p', null, 'A heart cut from one flawless diamond, faceted like an imperial jeweled egg and caged in gold filigree, sitting in a tin cup on a riveted tin box that Joe made himself. The brass plate reads: PRESENTED BY MYSTERY ROBOT JOE.'),
      h('h3', null, 'A note from Joe'),
      h('p', { class: 'eggv-lore' }, `“${joeNote(n)}” — Joe`),
    );
    const overlay = h(
      'div',
      { class: 'eggv heart-trophy-view', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'trophy-title' },
      h('div', { class: 'eggv-bar' }, h('strong', null, 'On the shelf'), closeBtn),
      h('div', { class: 'eggv-main' }, stage, card),
    );
    document.body.append(overlay);
    raf = requestAnimationFrame(frame);
    canvas.focus();
  });
}
