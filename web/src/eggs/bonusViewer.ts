// A closer look at the eggs on the cake stand (bonus.ts). The rotten egg sits in a haze of
// its own stench; tap it (click, touch, or Enter / Space) thirteen times and it wobbles,
// cracks, and crumbles to a diamond heart that then turns in the light (and stays open after).
// The pastry egg turns on its spun-sugar holder while the clockwork baker on top spins and a
// music box plays (with a mute button). Drag, or ← →, turns either; Esc closes. With reduced
// motion: no wobble, no rising clouds, no falling shards, no spinning; the sound still plays.
import { h, clear } from '../editor/core/ui';
import { isHatched, setHatched, TAPS, type BonusState } from './bonus';
import { drawHeart, drawPastryEgg, drawRestingShards, drawShell, EGG_ASPECT, rottenShell, stinkPuff, type Box } from './bonusArt';
import { musicBox } from './musicBox';

const HEART = {
  name: 'The Diamond Heart',
  description: 'Under thirteen taps of rotten shell: a heart cut from one flawless diamond, faceted in the Fabergé manner and caged in gold filigree scrolls, with a little gold loop on top for a chain. The smell, it turns out, was a guard dog.',
};

/** What a tap says, for those who cannot see the egg crack. */
export function tapMessage(taps: number): string {
  if (taps >= TAPS) return `Tap ${TAPS} of ${TAPS}. The rotten egg crumbles to pieces! Inside is a diamond heart in gold filigree, turning in the light.`;
  if (taps <= 1) return `Tap 1 of ${TAPS}. The rotten egg wobbles. A hairline crack, and a smell.`;
  if (taps <= 4) return `Tap ${taps} of ${TAPS}. It wobbles and cracks a little more.`;
  if (taps <= 8) return `Tap ${taps} of ${TAPS}. The cracks spread, and the smell gets worse.`;
  return `Tap ${taps} of ${TAPS}. Flakes of shell fall away. Something inside glints.`;
}

type Shard = { pts: [number, number][]; cx: number; cy: number; vx: number; vy: number; spin: number };
type Puff = { born: number; life: number; x: number; phase: number; sprite: number; behind: boolean; /** held at this point of its rise (reduced motion) */ at?: number };

export function openBonusViewer(found: BonusState[], start = 0): Promise<void> {
  return new Promise((resolve) => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let at = Math.max(0, Math.min(found.length - 1, start));
    let turn = 0;
    let spin = still ? 0 : 0.5;
    let drag: { x: number; y: number; turn: number; moved: boolean } | undefined;
    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let dirty = true;
    let taps = 0;
    let hatched = isHatched();
    let wobbleAt = -10;
    let crumble: { at: number; shards: Shard[]; snap: HTMLCanvasElement; box: Box } | undefined;
    let puffs: Puff[] = [];
    let nextPuff = 0;
    const sprites = [0, 1, 2, 3].map(stinkPuff);
    const music = musicBox();

    const canvas = h('canvas', { class: 'eggv-canvas', tabindex: 0 });
    const hint = h('p', { class: 'eggv-hint', 'aria-hidden': 'true' });
    const stage = h('div', { class: 'eggv-stage' }, canvas, hint);
    const card = h('div', { class: 'eggv-card' });
    const say = h('p', { class: 'eggv-sr', 'aria-live': 'polite' });
    const prev = h('button', { type: 'button', onclick: () => go(-1) }, '← Previous egg');
    const next = h('button', { type: 'button', onclick: () => go(1) }, 'Next egg →');
    const count = h('span');
    const mute = h('button', { type: 'button', class: 'eggv-mute', 'aria-pressed': String(music.muted()), onclick: () => setMute(!music.muted()) }, 'Mute music box');
    const extra = h('div', { class: 'eggv-extra' });

    const egg = () => found[at].egg;
    const rotten = () => egg().id === 'rotten';
    const tappable = () => rotten() && !hatched && !crumble;

    const setMute = (off: boolean) => {
      music.setMuted(off);
      mute.setAttribute('aria-pressed', String(off));
      if (!off && !rotten()) music.play();
      say.textContent = off ? 'Music box muted.' : 'Music box playing.';
    };

    // ---- drawing ----
    const layout = (w: number, hh: number) => {
      if (rotten()) {
        // low in the picture, with room above for what rises off it
        const eh = Math.min(hh * 0.56, (w * 0.56) / EGG_ASPECT);
        const ew = eh * EGG_ASPECT;
        return { x: (w - ew) / 2, y: hh * 0.92 - eh, w: ew, h: eh };
      }
      // the pastry egg: a baker on top, a sugar foot below
      const eh = Math.min(hh * 0.62, (w * 0.62) / EGG_ASPECT);
      const ew = eh * EGG_ASPECT;
      return { x: (w - ew) / 2, y: (hh - eh * 1.42) / 2 + eh * 0.32, w: ew, h: eh };
    };

    const startCrumble = (box: Box, k: number) => {
      const snap = document.createElement('canvas');
      snap.width = Math.round(box.w * k);
      snap.height = Math.round(box.h * k);
      drawShell(snap.getContext('2d')!, rottenShell(TAPS), turn, { x: 0, y: 0, w: snap.width, h: snap.height }, Math.round(Math.min(360, box.h * k)));
      const shards: Shard[] = [];
      const cols = 7;
      const rows = 9;
      const pt = (c: number, r: number): [number, number] => {
        // jitter inside, keep the outline's corners on the box edge
        const j = (s: number) => (Math.sin(c * 12.9898 + r * 78.233 + s) * 43758.5453) % 1;
        const jx = c > 0 && c < cols ? j(1) * 0.35 : 0;
        const jy = r > 0 && r < rows ? j(2) * 0.35 : 0;
        return [((c + jx) / cols) * box.w, ((r + jy) / rows) * box.h];
      };
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const a = pt(c, r);
          const b = pt(c + 1, r);
          const cc = pt(c + 1, r + 1);
          const d = pt(c, r + 1);
          for (const tri of [[a, b, cc], [a, cc, d]] as [number, number][][]) {
            const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
            const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
            // only pieces of the egg itself
            const ex = (cx - box.w / 2) / (box.w / 2);
            const ey = (cy - box.h / 2) / (box.h / 2);
            if (ex * ex + ey * ey > 1.05) continue;
            const rnd = Math.abs(Math.sin(cx * 3.1 + cy * 7.7)) % 1;
            shards.push({ pts: tri, cx, cy, vx: ex * box.w * (0.6 + rnd), vy: -box.h * (0.25 + rnd * 0.5) * (1 - ey) * 0.6, spin: (rnd - 0.5) * 9 });
          }
        }
      crumble = { at: clock, shards, snap, box };
    };

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
      const box = layout(w, hh);
      const res = Math.round(Math.min(360, box.h * k));
      const cx = box.x + box.w / 2;
      const floor = rotten() ? box.y + box.h * 0.98 : box.y + box.h * 1.05;
      const shadow = (rx: number, a: number) => {
        g.fillStyle = `rgba(0, 0, 0, ${a})`;
        g.beginPath();
        g.ellipse(cx + box.w * 0.05, floor, rx, box.h * 0.05, 0, 0, Math.PI * 2);
        g.fill();
      };
      if (!rotten()) {
        shadow(box.w * 0.48, 0.4);
        const bakerTurn = still ? 0.5 : clock * 1.4;
        drawPastryEgg(g, box, turn, bakerTurn, res);
        return;
      }
      if (hatched || crumble) {
        const since = crumble ? clock - crumble.at : 99;
        const grow = still ? 1 : Math.min(1, since / 1.1);
        const ease = 1 - Math.pow(1 - grow, 3);
        const size = box.w * 1.3 * (0.35 + 0.65 * ease);
        const bob = still ? 0 : Math.sin(clock * 1.2) * box.h * 0.015;
        const hy = box.y + box.h * 0.4 + bob;
        shadow(box.w * 0.34 * (0.5 + 0.5 * ease), 0.32);
        if (since > 1 || !crumble) drawRestingShards(g, cx, floor, box.w * 0.95);
        // the light that comes out of it
        const glow = g.createRadialGradient(cx, hy, 0, cx, hy, size * 0.9);
        const flash = crumble && !still ? Math.max(0, 1 - since / 0.8) : 0;
        glow.addColorStop(0, `rgba(255, 236, 244, ${0.18 + flash * 0.6})`);
        glow.addColorStop(1, 'rgba(255, 236, 244, 0)');
        g.fillStyle = glow;
        g.fillRect(0, 0, w, hh);
        drawHeart(g, cx, hy, size, turn, still ? 0.3 : clock);
        if (crumble && !still) {
          const { snap, box: b0 } = crumble;
          const grav = box.h * 3.2;
          const fade = Math.max(0, 1 - Math.max(0, since - 0.9) / 0.7);
          if (fade <= 0) crumble = undefined;
          else
            for (const s of crumble.shards) {
              let x = b0.x + s.cx + s.vx * since;
              let y = b0.y + s.cy + s.vy * since + 0.5 * grav * since * since;
              if (y > floor) y = floor;
              x = Math.max(-50, Math.min(w + 50, x));
              g.save();
              g.globalAlpha = fade;
              g.translate(x, y);
              g.rotate(s.spin * since);
              g.translate(-s.cx, -s.cy);
              g.beginPath();
              s.pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
              g.closePath();
              g.clip();
              g.drawImage(snap, 0, 0, b0.w, b0.h);
              g.restore();
            }
        }
        return;
      }
      // the rotten egg, wobbling after a tap, in its own haze
      shadow(box.w * 0.42, 0.4);
      const stink = 0.55 + (taps / TAPS) * 0.6;
      const drawPuffs = (behind: boolean) => {
        for (const p of puffs) {
          if (p.behind !== behind) continue;
          const t = p.at ?? (clock - p.born) / p.life;
          const age = t * p.life;
          if (t < 0 || t > 1) continue;
          const size = box.w * (0.32 + t * 0.95);
          const x = cx + p.x * box.w * 0.32 + Math.sin(age * 1.3 + p.phase) * box.w * 0.1 * t;
          const y = box.y + box.h * 0.16 - t * box.h * 0.52;
          g.save();
          // thinning out toward the top of the picture, so no cloud is cut off by its edge
          const edge = Math.max(0, Math.min(1, (y - size * 0.4) / (hh * 0.12)));
          g.globalAlpha = Math.min(1, Math.sin(Math.PI * t) * 1.05 * stink * edge);
          g.translate(x, y);
          g.rotate(p.phase + age * 0.15);
          g.drawImage(sprites[p.sprite], -size / 2, -size / 2, size, size * 0.8);
          g.restore();
        }
      };
      drawPuffs(true);
      const wt = clock - wobbleAt;
      const wob = still || wt > 1.2 ? 0 : Math.exp(-wt * 4) * Math.sin(wt * 26) * (0.06 + taps * 0.006);
      g.save();
      g.translate(cx, floor);
      g.rotate(wob);
      g.translate(-cx, -floor);
      drawShell(g, rottenShell(taps), turn, box, res);
      g.restore();
      drawPuffs(false);
    };

    const updatePuffs = () => {
      if (!rotten() || hatched || crumble) return;
      if (still) {
        // a haze that holds still
        if (!puffs.length) puffs = [0.12, 0.3, 0.46, 0.22, 0.38].map((t, i) => ({ born: 0, life: 4, at: t, x: [-0.6, 0.3, -0.1, 0.7, -0.4][i], phase: i, sprite: i % 4, behind: i % 2 === 0 }));
        return;
      }
      puffs = puffs.filter((p) => clock - p.born < p.life);
      while (nextPuff <= clock) {
        const r = Math.random();
        puffs.push({ born: nextPuff, life: 3.2 + r * 1.8, x: Math.random() * 2 - 1, phase: Math.random() * 6, sprite: Math.floor(Math.random() * 4), behind: Math.random() < 0.4 });
        nextPuff += Math.max(0.18, 0.5 - taps * 0.02);
      }
    };

    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      clock += dt;
      if (!drag && spin) {
        turn += spin * dt;
        dirty = true;
      }
      if (!still) dirty = true; // haze, wobble, sparkle, the baker
      if (dirty) {
        updatePuffs();
        draw();
      }
      dirty = false;
      raf = requestAnimationFrame(frame);
    };

    // ---- the card, and tapping ----
    const label = () => {
      if (tappable()) {
        canvas.setAttribute('role', 'button');
        canvas.setAttribute('aria-label', taps ? `The Rotten Egg, cracked ${taps} of ${TAPS} times: press Enter to tap it again` : `The Rotten Egg, giving off green clouds of stench: press Enter to tap it`);
        hint.textContent = taps ? `${TAPS - taps} more ${TAPS - taps === 1 ? 'tap' : 'taps'}…` : 'Tap the egg · drag or ← → to turn it';
      } else {
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', rotten() ? 'A diamond heart in gold filigree, turning in the light' : 'A pastry egg in rose glaze and piped icing on a nest of spun sugar, a tiny clockwork baker turning on top');
        hint.textContent = 'Drag or use ← → to turn it';
      }
    };

    const show = () => {
      const e = found[at];
      const open = rotten() && hatched;
      turn = 0;
      taps = 0;
      puffs = [];
      // already hazy when it comes into view
      nextPuff = clock - 4;
      crumble = undefined;
      dirty = true;
      clear(
        card,
        h('h2', { id: 'eggv-title' }, open ? HEART.name : e.egg.name),
        h('p', { class: 'eggv-where' }, `${e.status === 'added' ? 'From' : 'Found in'} ${e.egg.gameTitle}${open ? ', inside the Rotten Egg' : ''}${e.status === 'added' ? ' (added by hand)' : ''}`),
        h('p', null, open ? HEART.description : e.egg.description),
        h('h3', null, 'Credits'),
        h('ul', null, ...e.egg.credits.map((c) => h('li', null, c))),
        h('h3', null, 'Tucked in with it'),
        h('p', { class: 'eggv-lore' }, e.egg.lore),
      );
      clear(extra, rotten() ? (open ? h('button', { type: 'button', onclick: mend }, 'Glue the shell back') : null) : mute);
      prev.disabled = next.disabled = found.length < 2;
      count.textContent = found.length > 1 ? `${at + 1} of ${found.length}` : '';
      label();
      if (rotten()) music.stop();
      else music.play();
    };

    const tap = () => {
      if (!tappable()) return;
      taps++;
      wobbleAt = clock;
      say.textContent = tapMessage(taps);
      if (taps >= TAPS) {
        hatched = true;
        setHatched(true);
        const keep = turn;
        show();
        turn = keep;
        say.textContent = tapMessage(TAPS);
        if (!still) {
          const r = stage.getBoundingClientRect();
          startCrumble(layout(Math.max(160, Math.round(r.width)), Math.max(160, Math.round(r.height))), Math.min(2, window.devicePixelRatio || 1));
        }
      }
      label();
      dirty = true;
    };

    const mend = () => {
      hatched = false;
      setHatched(false);
      show();
      say.textContent = 'The shell is glued back together, smell and all.';
      canvas.focus();
    };

    const go = (d: number) => {
      at = (at + d + found.length) % found.length;
      show();
    };

    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, turn, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
      if (!drag.moved) return;
      turn = drag.turn + ((e.clientX - drag.x) / Math.max(100, canvas.clientWidth)) * Math.PI * 2;
      dirty = true;
    });
    canvas.addEventListener('pointerup', () => {
      if (drag && !drag.moved) tap();
      else if (drag) spin = 0; // leave it where it was put
      drag = undefined;
    });
    canvas.addEventListener('pointercancel', () => (drag = undefined));
    const onResize = () => (dirty = true);
    window.addEventListener('resize', onResize);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') music.stop();
      else if (!rotten()) music.play();
    };
    document.addEventListener('visibilitychange', onVisible);

    const opener = document.activeElement as HTMLElement | null;
    const close = () => {
      cancelAnimationFrame(raf);
      music.dispose();
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisible);
      overlay.remove();
      opener?.focus();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if ((e.key === 'Enter' || e.key === ' ') && e.target === canvas) {
        tap();
        e.preventDefault();
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(e.target instanceof HTMLButtonElement)) {
        spin = 0;
        turn += e.key === 'ArrowLeft' ? -0.25 : 0.25;
        dirty = true;
        e.preventDefault();
      } else if (e.key === 'PageDown' || e.key === 'PageUp') {
        go(e.key === 'PageDown' ? 1 : -1);
        e.preventDefault();
      } else if (e.key === 'Tab') {
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
      { class: 'eggv eggv-bonus', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'eggv-title' },
      h('div', { class: 'eggv-bar' }, h('strong', null, 'On the cake stand'), closeBtn),
      h('div', { class: 'eggv-main' }, stage, h('div', null, card, extra, h('div', { class: 'eggv-nav' }, prev, next, count)), say),
    );
    show();
    document.body.append(overlay);
    raf = requestAnimationFrame(frame);
    canvas.focus();
  });
}
