// A closer look at the felt eggs found so far: each turns slowly (drag, or the arrow keys, to
// turn it yourself; still when the system asks for reduced motion), with the game it was
// found in, the egg itself, the names it carries and its piece of the mystery. With the desk's
// black light on, the room stays dark and each egg shows its fluorescent ink (eggUv.ts).
// Once all three Teddy eggs are found, their cards show the one he laid himself, turning with
// its whiff rising (teddyEgg.ts, eggPile.ts).
import { h, clear } from '../editor/core/ui';
import { drawEgg, eggTexture, EGG_ASPECT } from './eggArt';
import { uvInk, uvTexture } from './eggUv';
import type { EggState } from './eggState';
import { drawOdor, drawPile } from './eggPile';
import { TEDDY_EGG, TEDDY_GAMES, hasTeddyEgg } from './teddyEgg';

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
      const eh = Math.min(hh * 0.78, (w * 0.8) / EGG_ASPECT);
      const ew = eh * EGG_ASPECT;
      const top = (hh - eh) / 2 - hh * 0.03;
      // its shadow on the table
      g.fillStyle = uv ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
      g.beginPath();
      g.ellipse(w / 2 + ew * 0.06, top + eh * 0.98, ew * 0.42, eh * 0.06, 0, 0, Math.PI * 2);
      g.fill();
      drawEgg(g, tex, turn, { x: (w - ew) / 2, y: top, w: ew, h: eh }, Math.round(Math.min(360, eh * k)));
    };
    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (!drag && spin) {
        turn += spin * dt;
        dirty = true;
      }
      if (dirty) draw();
      dirty = false;
      if (special && !still && specialCanvas?.isConnected) drawSpecial(t / 1000);
      raf = requestAnimationFrame(frame);
    };

    // with all three of Teddy's eggs found, the one he laid himself turns on their cards, its
    // whiff rising (still under reduced motion); a bonus, not one of the felt eggs
    const special = hasTeddyEgg(found.map((e) => e.egg.game));
    const SW = 72;
    const SH = 96;
    let specialCanvas: HTMLCanvasElement | undefined;
    const drawSpecial = (time?: number) => {
      const c = specialCanvas;
      if (!c) return;
      const k = c.width / SW;
      const g = c.getContext('2d')!;
      g.clearRect(0, 0, c.width, c.height);
      const box = { x: 0, y: 0, w: SW * k, h: SH * k };
      drawPile(g, time === undefined ? 0.35 : 0.35 + time * 0.6, box, 120);
      drawOdor(g, box, time);
    };
    const specialFigure = () => {
      const k = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      specialCanvas = h('canvas', {
        width: SW * k,
        height: SH * k,
        role: 'img',
        'aria-label': `${TEDDY_EGG.name}, a little pile of felt sausages with a whiff rising${still ? '' : ', turning'}`,
      });
      drawSpecial(still ? undefined : performance.now() / 1000);
      return h(
        'figure',
        { class: 'eggv-special' },
        specialCanvas,
        h(
          'figcaption',
          null,
          h('strong', null, TEDDY_EGG.name),
          h('span', null, `${TEDDY_EGG.caption}. ${TEDDY_EGG.description}`),
          h('span', { class: 'eggv-special-credits' }, `Stitched inside: ${TEDDY_EGG.credits.join('; ')}.`),
          h('span', { class: 'eggv-lore' }, TEDDY_EGG.lore),
        ),
      );
    };
    const show = () => {
      const e = found[at];
      tex = textureOf(at);
      turn = 0;
      dirty = true;
      const ink = uv ? uvInk(at) : undefined;
      canvas.setAttribute(
        'aria-label',
        `${e.egg.name}, a felt egg, turning${uv ? (ink ? ', glowing under the black light' : ', dark under the black light') : ''}`,
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
        special && (TEDDY_GAMES as readonly string[]).includes(e.egg.game) ? specialFigure() : null,
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
