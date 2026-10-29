// Where the tour puts things, as plain math (no DOM): a host beside the control it points at,
// on top of one it presses, and a speech bubble near its speaker that stays on screen and off
// the control being shown.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Size {
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, hi < lo ? lo : v));

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Where a host of `size` stands by `target` in a `view` (whose bottom `floor` pixels the
 * captions bar covers): beside it on the side with room, its feet level with the target's
 * bottom; under it when the target is up in the header; at its corner when it is wide.
 * A press puts the host on top of it instead.
 */
export function standBy(target: Rect, size: Size, view: Size, floor: number, press = false): Point {
  const pad = 6;
  const maxY = view.h - floor - size.h;
  const maxX = view.w - size.w;
  if (press) {
    const top = target.y - size.h + Math.min(10, target.h / 3);
    return { x: clamp(target.x + target.w / 2 - size.w / 2, 0, maxX), y: clamp(top < 0 ? target.y + target.h - 4 : top, 0, maxY) };
  }
  // up in the bar: stand just under it
  if (target.y + target.h < size.h + pad) return { x: clamp(target.x + target.w / 2 - size.w / 2, 0, maxX), y: clamp(target.y + target.h + pad, 0, maxY) };
  const feet = clamp(target.y + target.h - size.h, 0, maxY);
  if (target.x - size.w - pad >= 0 && target.w < view.w * 0.6) return { x: target.x - size.w - pad, y: feet };
  if (target.x + target.w + pad + size.w <= view.w && target.w < view.w * 0.6) return { x: target.x + target.w + pad, y: feet };
  // wide, or no room at either side: over its bottom-left corner, or under it when that is on screen
  if (target.y + target.h + pad + size.h <= view.h - floor) return { x: clamp(target.x + 8, 0, maxX), y: target.y + target.h + pad };
  return { x: clamp(target.x + 8, 0, maxX), y: feet };
}

export type Side = 'above' | 'below' | 'right' | 'left';

/**
 * A speech bubble of `size` for a speaker at `anchor`: above it if there is room, else below,
 * right or left, preferring a place that doesn't cover `avoid` (the control being shown), and
 * always inside the view with a margin. `tail` is where along the bubble's edge its tail
 * points at the speaker.
 */
export function placeBubble(anchor: Rect, size: Size, view: Size, floor: number, avoid?: Rect, margin = 8): Point & { side: Side; tail: number } {
  const bottom = view.h - floor - margin;
  const cx = anchor.x + anchor.w / 2;
  const cy = anchor.y + anchor.h / 2;
  const gap = 12;
  const options: (Point & { side: Side })[] = [
    { side: 'above', x: cx - size.w / 2, y: anchor.y - gap - size.h },
    { side: 'below', x: cx - size.w / 2, y: anchor.y + anchor.h + gap },
    { side: 'right', x: anchor.x + anchor.w + gap, y: cy - size.h / 2 },
    { side: 'left', x: anchor.x - gap - size.w, y: cy - size.h / 2 },
  ];
  const fits = (p: Point) => p.x >= margin && p.y >= margin && p.x + size.w <= view.w - margin && p.y + size.h <= bottom;
  const inView = options.map((o) => ({ ...o, x: clamp(o.x, margin, view.w - margin - size.w), y: clamp(o.y, margin, bottom - size.h) }));
  const cost = (o: Point & { side: Side }, i: number) => {
    const r = { x: o.x, y: o.y, w: size.w, h: size.h };
    // covering the speaker or the control costs most; moving a bubble from where it wanted to be a little
    return overlap(r, anchor) * 4 + (avoid ? overlap(r, avoid) * 2 : 0) + (fits(options[i]) ? 0 : 500) + i * 10;
  };
  let best = 0;
  inView.forEach((o, i) => {
    if (cost(o, i) < cost(inView[best], best)) best = i;
  });
  const p = inView[best];
  const along = p.side === 'above' || p.side === 'below' ? cx - p.x : cy - p.y;
  const length = p.side === 'above' || p.side === 'below' ? size.w : size.h;
  return { ...p, tail: clamp(along, 16, length - 16) };
}

/** Where a host waits off the stage: just past the left or right edge, standing on the floor. */
export const offStage = (size: Size, view: Size, floor: number, right: boolean): Point => ({
  x: right ? view.w + 8 : -size.w - 8,
  y: view.h - floor - size.h - 8,
});

/** How long a walk from `a` to `b` takes: a steady pace, never a crawl or a jump. */
export const walkMs = (a: Point, b: Point): number => clamp(Math.hypot(b.x - a.x, b.y - a.y) / 0.6, 250, 1800);
