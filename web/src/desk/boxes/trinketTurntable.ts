// A plastic trinket turning on a canvas: it spins slowly (not with reduced motion) until it is dragged
// or turned with the arrow keys (Home puts it back), and stops drawing while it is out of sight. Used
// in place of the box in the box viewer (trinketShelf.ts) and for a close look in the Library's toy box
// (library/toyBox.ts). The viewer (trinketGl.ts) loads with the first trinket shown.
import { h } from '../../editor/core/ui';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import type { TrinketView } from './trinketGl';

const TURN = 0.3;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface Turntable {
  canvas: HTMLCanvasElement;
  /** Says 3D isn't available, in the canvas's place, when the browser has no WebGL. */
  status: HTMLElement;
  /** Shows a mesh at the angle of the one before (or the first angle, `fresh`), spinning again with `spin`. */
  show(mesh: () => Promise<Mesh>, opts?: { fresh?: boolean; spin?: boolean }): Promise<void>;
  /** Shows any model: `make` loads it and gives the function that builds its view on the canvas (feelieModels.ts). */
  showModel(make: () => Promise<(canvas: HTMLCanvasElement) => TrinketView | undefined>, opts?: { fresh?: boolean; spin?: boolean }): Promise<void>;
  /** Lets the trinket go (its GPU buffers too). */
  clear(): void;
}

/** A turntable; `keys` sees each key the canvas gets first and returns true for one it used. */
export function trinketTurntable(keys?: (e: KeyboardEvent) => boolean, { zoom = false } = {}): Turntable {
  let view: TrinketView | undefined;
  let visible = true;
  let spinning = !reduced();
  let last = 0;
  let raf = 0;
  let showing = 0; // which load is current, so a slow file can't replace a later one

  const canvas = h('canvas', { class: 'trk-canvas', tabindex: 0, role: 'img' });
  const status = h('span', { class: 'trk-flat', hidden: '' }, '3D is not available here; the files still download.');

  const frame = (t: number) => {
    raf = 0;
    if (spinning && visible && view) {
      view.yaw += Math.min(t - last, 50) * 0.0006;
      last = t;
    }
    view?.draw();
    if (spinning && visible && view) raf = requestAnimationFrame(frame);
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

  canvas.addEventListener('keydown', (e) => {
    if (keys?.(e)) return void e.preventDefault();
    if (e.key === 'ArrowLeft') turn(-TURN, 0);
    else if (e.key === 'ArrowRight') turn(TURN, 0);
    else if (e.key === 'ArrowUp') turn(0, -0.2);
    else if (e.key === 'ArrowDown') turn(0, 0.2);
    else if (e.key === 'Home' && view) {
      view.yaw = 0.6;
      view.pitch = 0.28;
      view.zoom = 1;
      turn(0, 0);
    } else return;
    e.preventDefault();
  });
  let drag: { x: number; y: number } | undefined;
  // with `zoom`: the wheel and a two-finger pinch come closer or go back, + and - too
  const zoomBy = (k: number) => {
    if (!view) return;
    spinning = false;
    view.zoom = Math.max(0.5, Math.min(4, view.zoom * k));
    wake();
  };
  const fingers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  if (zoom) {
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY / 400));
      },
      { passive: false },
    );
    canvas.addEventListener('keydown', (e) => {
      if (e.key === '+' || e.key === '=') zoomBy(1.2);
      else if (e.key === '-') zoomBy(1 / 1.2);
      else return;
      e.preventDefault();
    });
  }
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('turning');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (zoom && fingers.size === 2) {
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...fingers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomBy(dist / pinch);
      pinch = dist;
      return;
    }
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    turn((e.clientX - drag.x) * 0.012, (e.clientY - drag.y) * 0.008);
    drag = { x: e.clientX, y: e.clientY };
  });
  const release = (e: PointerEvent) => {
    fingers.delete(e.pointerId);
    pinch = 0;
    if (fingers.size) return;
    drag = undefined;
    canvas.classList.remove('turning');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  }).observe(canvas);

  async function showModel(make: () => Promise<(c: HTMLCanvasElement) => TrinketView | undefined>, { fresh = false, spin = false } = {}) {
    const mine = ++showing;
    if (spin) spinning = !reduced();
    canvas.classList.add('loading');
    try {
      const build = await make();
      if (mine !== showing) return;
      const keep = !fresh && view && { yaw: view.yaw, pitch: view.pitch };
      view?.dispose();
      view = build(canvas);
      if (!view) throw new Error('no WebGL');
      if (keep) Object.assign(view, keep);
      status.hidden = true;
      canvas.hidden = false;
      canvas.classList.remove('loading');
      wake();
    } catch {
      if (mine !== showing) return;
      canvas.hidden = true;
      status.hidden = false;
    }
  }

  return {
    canvas,
    status,
    show(mesh, opts) {
      return showModel(async () => {
        const [{ createTrinketView }, m] = await Promise.all([import('./trinketGl'), mesh()]);
        return (c) => createTrinketView(c, m);
      }, opts);
    },
    showModel,
    clear() {
      showing++;
      view?.dispose();
      view = undefined;
    },
  };
}
