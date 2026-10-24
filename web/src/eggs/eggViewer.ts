// A closer look at the felt eggs found so far: each turns slowly (drag, or the arrow keys, to
// turn it yourself; still when the system asks for reduced motion), with the game it was
// found in, the egg itself, the names it carries and its piece of the mystery. With the desk's
// black light on, the room stays dark and each egg shows its fluorescent ink (eggUv.ts).
// Teddy's third egg is a little pile of felt sausages instead (eggPile.ts), with a whiff rising.
// Once all three Teddy eggs are found, their cards show his little trophy (teddyTrophy.ts).
import { h, clear } from '../editor/core/ui';
import { drawEgg, eggTexture, EGG_ASPECT } from './eggArt';
import { drawOdor, drawPile } from './eggPile';
import { uvInk, uvTexture } from './eggUv';
import type { EggState } from './eggState';
import { TEDDY_GAMES, TROPHY_CAPTION, drawTeddyTrophy, hasTeddyTrophy } from './teddyTrophy';

const UV_WORDS = ['dots', 'stripes', 'a zigzag', 'little stars', 'a tiny smiling face'];

export function openEggViewer(found: EggState[], start = 0): Promise<void> {
  return new Promise((resolve) => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let at = Math.max(0, Math.min(found.length - 1, start));
    const uv = !!document.querySelector('.desk.bl-uv');
    const textureOf = (i: number) => (uv ? uvTexture(eggTexture(found[i].egg.look), i) : eggTexture(found[i].egg.look));
    let tex = textureOf(at);
    let turn = 0;
    let spin = still ? 0 : 0.6; // radians a second
    let drag: { x: number; turn: number } | undefined;
    let raf = 0;
    let last = performance.now();
    let dirty = true;
    const canvas = h('canvas', { class: 'eggv-canvas', tabindex: 0, role: 'img' });
    const stage = h('div', { class: 'eggv-stage' }, canvas, h('p', { class: 'eggv-hint', 'aria-hidden': 'true' }, 'Drag or use ← → to turn it'));
    const card = h('div', { class: 'eggv-card', 'aria-live': 'polite' });
    const prev = h('button', { type: 'button', onclick: () => go(-1) }, '← Previous egg');
    const next = h('button', { type: 'button', onclick: () => go(1) }, 'Next egg →');
    const count = h('span');

    const pile = () => found[at].egg.look.shape === 'pile';
    const draw = (t: number) => {
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
      const eh = Math.min(hh * 0.78, (w * 0.8) / EGG_ASPECT);
      const ew = eh * EGG_ASPECT;
      const top = (hh - eh) / 2 - hh * 0.03;
      // its shadow on the table
      g.fillStyle = uv ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
      g.beginPath();
      g.ellipse(w / 2 + ew * 0.06, top + eh * 0.98, ew * 0.42, eh * 0.06, 0, 0, Math.PI * 2);
      g.fill();
      const box = { x: (w - ew) / 2, y: top, w: ew, h: eh };
      const res = Math.round(Math.min(360, eh * k));
      if (pile()) {
        drawPile(g, turn, box, res, uv ? tex : undefined);
        drawOdor(g, box, still ? undefined : t / 1000);
      } else drawEgg(g, tex, turn, box, res);
    };
    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (!drag && spin) {
        turn += spin * dt;
        dirty = true;
      }
      if (dirty || (pile() && !still)) draw(t);
      dirty = false;
      raf = requestAnimationFrame(frame);
    };

    // with all three of Teddy's eggs found, his trophy shows on their cards
    const trophy = hasTeddyTrophy(found.map((e) => e.egg.game));
    const trophyFigure = () => {
      const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
      const c = h('canvas', { width: 48 * k, height: 64 * k, 'aria-hidden': 'true' });
      const g = c.getContext('2d')!;
      g.scale(k, k);
      drawTeddyTrophy(g, 48, 64);
      return h('figure', { class: 'eggv-trophy' }, c, h('figcaption', null, `${TROPHY_CAPTION}.`));
    };
    const show = () => {
      const e = found[at];
      tex = textureOf(at);
      turn = 0;
      dirty = true;
      const ink = uv ? uvInk(at) : undefined;
      canvas.setAttribute(
        'aria-label',
        `${e.egg.name}, ${e.egg.look.shape === 'pile' ? 'a little pile of felt sausages with a whiff rising' : 'a felt egg'}, turning${uv ? (ink ? ', glowing under the black light' : ', dark under the black light') : ''}`,
      );
      clear(
        card,
        h('h2', { id: 'eggv-title' }, e.egg.name),
        h('p', { class: 'eggv-where' }, e.status === 'added' ? `From ${e.egg.gameTitle} (added by hand)` : `Found in ${e.egg.gameTitle}`),
        h('p', null, e.egg.description),
        uv
          ? h(
              'p',
              { class: 'eggv-uv-note' },
              ink ? `Under the black light: ${UV_WORDS[ink.pattern]} in glowing ink.` : 'Under the black light: nothing hidden on this one.',
            )
          : null,
        h('h3', null, 'Stitched inside'),
        h('ul', null, ...e.egg.credits.map((c) => h('li', null, c))),
        h('h3', null, 'Tucked in with it'),
        h('p', { class: 'eggv-lore' }, e.egg.lore),
        trophy && (TEDDY_GAMES as readonly string[]).includes(e.egg.game) ? trophyFigure() : null,
      );
      prev.disabled = next.disabled = found.length < 2;
      count.textContent = found.length > 1 ? `${at + 1} of ${found.length} found` : '';
    };
    const go = (d: number) => {
      at = (at + d + found.length) % found.length;
      show();
    };

    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, turn };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      turn = drag.turn + ((e.clientX - drag.x) / Math.max(100, canvas.clientWidth)) * Math.PI * 2;
      dirty = true;
    });
    const endDrag = () => {
      if (drag) spin = 0; // leave it where it was put
      drag = undefined;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    const onResize = () => (dirty = true);
    window.addEventListener('resize', onResize);

    const opener = document.activeElement as HTMLElement | null;
    const close = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
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
        dirty = true;
        e.preventDefault();
      } else if (e.key === 'PageDown' || e.key === 'PageUp') {
        go(e.key === 'PageDown' ? 1 : -1);
        e.preventDefault();
      } else if (e.key === 'Tab') {
        // keep Tab inside the viewer
        const stops = [...overlay.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')];
        const i = stops.indexOf(document.activeElement as HTMLElement);
        const j = e.shiftKey ? (i <= 0 ? stops.length - 1 : i - 1) : (i + 1) % stops.length;
        stops[j]?.focus();
        e.preventDefault();
      }
      e.stopImmediatePropagation(); // not for the PC underneath
    };
    window.addEventListener('keydown', onKey, true);

    const closeBtn = h('button', { type: 'button', onclick: close }, 'Close (Esc)');
    const overlay = h(
      'div',
      { class: uv ? 'eggv uv' : 'eggv', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'eggv-title' },
      h('div', { class: 'eggv-bar' }, h('strong', null, 'Felt eggs'), closeBtn),
      h('div', { class: 'eggv-main' }, stage, h('div', null, card, h('div', { class: 'eggv-nav' }, prev, next, count))),
    );
    show();
    document.body.append(overlay);
    raf = requestAnimationFrame(frame);
    canvas.focus();
  });
}
