// A small orbit-and-zoom camera for the 3D feelie views: drag to turn, wheel, pinch, + and - to zoom, arrows to turn, Home to reset,
// and the labeled button bar (Zoom in, Zoom out, Reset view) with 44 px targets. The cryptex view (desk/boxes/kitAssemblyViewer.ts)
// and the die's fold view (balloonCubeFoldView.ts) share the bar and the limits; the die draws from this camera, the cryptex from the turntable's.
import { h } from '../../editor/core/ui';

export interface OrbitCam {
  yaw: number;
  pitch: number;
  zoom: number;
}
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;
const TURN = 0.2;

/** Zoom by a factor, kept between half size and four times. */
export const zoomCam = (cam: OrbitCam, k: number): void => void (cam.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom * k)));
/** Turn by yaw and pitch amounts; the pitch stops short of straight up or down. */
export function turnCam(cam: OrbitCam, dyaw: number, dpitch: number, limit = 1.2): void {
  cam.yaw += dyaw;
  cam.pitch = Math.max(-limit, Math.min(limit, cam.pitch + dpitch));
}
/** Back to the start (a copy of `home`). */
export const resetCam = (cam: OrbitCam, home: OrbitCam): void => void Object.assign(cam, home);

/** Drag, wheel, pinch and keys on `el` turn and zoom `cam`; `changed` redraws. Returns a function that lets go of the listeners. */
export function attachOrbit(el: HTMLElement | SVGElement, cam: OrbitCam, home: OrbitCam, changed: () => void, pitchLimit = 1.2): () => void {
  const fingers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const spread = () => {
    const [a, b] = [...fingers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const down = (e: Event) => {
    const p = e as PointerEvent;
    fingers.set(p.pointerId, { x: p.clientX, y: p.clientY });
    el.setPointerCapture?.(p.pointerId);
    pinch = fingers.size === 2 ? spread() : 0;
  };
  const move = (e: Event) => {
    const p = e as PointerEvent;
    const last = fingers.get(p.pointerId);
    if (!last) return;
    if (fingers.size === 2) {
      fingers.set(p.pointerId, { x: p.clientX, y: p.clientY });
      const now = spread();
      if (pinch && now) zoomCam(cam, now / pinch);
      pinch = now;
    } else {
      turnCam(cam, (p.clientX - last.x) * 0.012, (p.clientY - last.y) * 0.012, pitchLimit);
      fingers.set(p.pointerId, { x: p.clientX, y: p.clientY });
    }
    changed();
  };
  const up = (e: Event) => {
    fingers.delete((e as PointerEvent).pointerId);
    pinch = 0;
  };
  const wheel = (e: Event) => {
    e.preventDefault();
    zoomCam(cam, Math.exp(-(e as WheelEvent).deltaY / 400));
    changed();
  };
  const key = (e: Event) => {
    const k = e as KeyboardEvent;
    if (k.altKey || k.ctrlKey || k.metaKey) return;
    if (k.key === 'ArrowLeft') turnCam(cam, -TURN, 0, pitchLimit);
    else if (k.key === 'ArrowRight') turnCam(cam, TURN, 0, pitchLimit);
    else if (k.key === 'ArrowUp') turnCam(cam, 0, -TURN, pitchLimit);
    else if (k.key === 'ArrowDown') turnCam(cam, 0, TURN, pitchLimit);
    else if (k.key === '+' || k.key === '=') zoomCam(cam, 1.2);
    else if (k.key === '-') zoomCam(cam, 1 / 1.2);
    else if (k.key === 'Home') resetCam(cam, home);
    else return;
    k.preventDefault();
    changed();
  };
  const on: [string, (e: Event) => void, AddEventListenerOptions?][] = [
    ['pointerdown', down],
    ['pointermove', move],
    ['pointerup', up],
    ['pointercancel', up],
    ['wheel', wheel, { passive: false }],
    ['keydown', key],
  ];
  for (const [t, f, o] of on) el.addEventListener(t, f, o);
  return () => {
    for (const [t, f] of on) el.removeEventListener(t, f);
  };
}

/** The labeled Zoom in, Zoom out and Reset view buttons. */
export function cameraBar(act: { zoomIn: () => void; zoomOut: () => void; reset: () => void }): HTMLElement {
  const b = (label: string, text: string, fn: () => void) =>
    h('button', { type: 'button', class: 'oc-btn', 'aria-label': label, title: label, onclick: fn }, text);
  return h(
    'div',
    { class: 'oc-bar', role: 'group', 'aria-label': 'View' },
    b('Zoom in', '+', act.zoomIn),
    b('Zoom out', '−', act.zoomOut),
    b('Reset view', 'Reset view', act.reset),
  );
}
