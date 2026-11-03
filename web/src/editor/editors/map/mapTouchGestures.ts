// Touch gestures for the map and block canvases, whatever tool is chosen: two fingers pinch to zoom
// and drag their midpoint to pan; a first finger that lasted under 150 ms is taken back when a second
// arrives (so a pinch leaves no dot); one finger held still for 500 ms asks the editor for a
// long-press menu (the touch stand-in for a right click); the Hand tool scrolls with one finger.
// Editor-only behavior: it never touches saved bytes. Listeners sit first on the element, in the
// capture phase, so the tools' own pointer handlers never see a finger that belongs to a gesture.
import { clampZoom } from './mapZoom';

export const PINCH_JOIN_MS = 150;
export const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

interface Pt {
  x: number;
  y: number;
}

export interface TouchHost {
  /** The canvas the fingers touch. */
  el: HTMLElement;
  /** The scrolling box around it. */
  scroller: HTMLElement;
  zoom(): number;
  /** Zoom to `value` keeping the map point under `pointer` (pixels from the scroller's top left). */
  setZoom(value: number, pointer: Pt): void;
  /** The Hand tool is chosen: one finger scrolls. */
  hand?(): boolean;
  /** A first finger just went down: note where the undo history stands. */
  begin?(): void;
  /** A second finger arrived: stop the stroke; `undo` when it was only a moment old. */
  abort?(undo: boolean): void;
  /** A finger rested 500 ms: open a menu at these client coordinates; true when it did. */
  longPress?(at: Pt): boolean;
}

/** Pinch ratio and midpoint of two fingers. */
export function pinchOf(a: Pt, b: Pt): { distance: number; mid: Pt } {
  return { distance: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
}

export function touchGestures(host: TouchHost): () => void {
  const { el, scroller } = host;
  const fingers = new Map<number, Pt>();
  const ignored = new Set<number>();
  let first: { id: number; at: number; from: Pt } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pinch: { distance: number; zoom: number; mid: Pt } | undefined;
  let hand: Pt | undefined;

  const local = (p: Pt): Pt => {
    const r = scroller.getBoundingClientRect();
    return { x: p.x - r.left - scroller.clientLeft, y: p.y - r.top - scroller.clientTop };
  };
  const two = (): [Pt, Pt] => {
    const [a, b] = [...fingers.values()];
    return [a, b];
  };
  const stop = (e: Event) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  };
  const mine = (e: PointerEvent) => e.pointerType === 'touch';

  function down(e: PointerEvent): void {
    if (!mine(e)) return;
    const p = { x: e.clientX, y: e.clientY };
    fingers.set(e.pointerId, p);
    if (fingers.size === 1) {
      first = { id: e.pointerId, at: Date.now(), from: p };
      if (host.hand?.()) {
        hand = p;
        stop(e);
        return;
      }
      host.begin?.();
      timer = setTimeout(() => {
        timer = undefined;
        if (fingers.size !== 1 || !first) return;
        if (host.longPress?.(fingers.get(first.id)!)) {
          host.abort?.(true);
          ignored.add(first.id);
        }
      }, LONG_PRESS_MS);
      return;
    }
    clearTimeout(timer);
    timer = undefined;
    stop(e);
    ignored.add(e.pointerId);
    if (fingers.size === 2) {
      if (!hand) host.abort?.(!!first && Date.now() - first.at < PINCH_JOIN_MS);
      if (first) ignored.add(first.id);
      hand = undefined;
      const [a, b] = two();
      const s = pinchOf(a, b);
      pinch = { distance: Math.max(1, s.distance), zoom: host.zoom(), mid: local(s.mid) };
    }
  }

  function move(e: PointerEvent): void {
    if (!mine(e) || !fingers.has(e.pointerId)) return;
    const p = { x: e.clientX, y: e.clientY };
    fingers.set(e.pointerId, p);
    if (pinch && fingers.size >= 2) {
      stop(e);
      const [a, b] = two();
      const s = pinchOf(a, b);
      const mid = local(s.mid);
      // pan first by how far the midpoint moved, then zoom around the midpoint where it now is
      scroller.scrollLeft += pinch.mid.x - mid.x;
      scroller.scrollTop += pinch.mid.y - mid.y;
      pinch.mid = mid;
      host.setZoom(clampZoom(pinch.zoom * (s.distance / pinch.distance)), mid);
      return;
    }
    if (hand) {
      stop(e);
      scroller.scrollLeft += hand.x - p.x;
      scroller.scrollTop += hand.y - p.y;
      hand = p;
      return;
    }
    if (ignored.has(e.pointerId)) return stop(e);
    if (first && e.pointerId === first.id && timer && Math.hypot(p.x - first.from.x, p.y - first.from.y) > LONG_PRESS_SLOP) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function up(e: PointerEvent): void {
    if (!mine(e) || !fingers.has(e.pointerId)) return;
    const swallow = ignored.delete(e.pointerId) || !!hand;
    fingers.delete(e.pointerId);
    clearTimeout(timer);
    timer = undefined;
    if (fingers.size < 2) pinch = undefined;
    if (!fingers.size) {
      first = undefined;
      hand = undefined;
      ignored.clear();
    }
    if (swallow) stop(e);
  }

  const opts = { capture: true };
  el.addEventListener('pointerdown', down, opts);
  el.addEventListener('pointermove', move, opts);
  el.addEventListener('pointerup', up, opts);
  el.addEventListener('pointercancel', up, opts);
  return () => {
    clearTimeout(timer);
    el.removeEventListener('pointerdown', down, opts);
    el.removeEventListener('pointermove', move, opts);
    el.removeEventListener('pointerup', up, opts);
    el.removeEventListener('pointercancel', up, opts);
  };
}
