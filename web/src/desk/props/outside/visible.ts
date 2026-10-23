// Whether the window on the desk can be seen right now: the page showing, the desk the view
// on screen, the window drawn (a narrow layout leaves it out) and nothing over it (a
// manual, a box, the zoomed monitor, any dialog). What happens outside it, and its sounds,
// only happens then (index.ts, outside.ts).

/** What the check needs to know, so a test can hand it a made-up page. */
export interface Sight {
  hidden: boolean;
  /** The window's box on the screen (zero-sized when it isn't drawn). */
  rect: { left: number; top: number; width: number; height: number } | undefined;
  view: { width: number; height: number };
  /** Whether the topmost thing at a point is the window (or something in it). */
  windowAt(x: number, y: number): boolean;
}

/** The points looked at: the open sky right of the monitor and above the lamp. */
const SPOTS: [number, number][] = [
  [0.75, 0.35],
  [0.62, 0.5],
  [0.85, 0.2],
];

export function canSee(s: Sight): boolean {
  if (s.hidden || !s.rect || s.rect.width < 2 || s.rect.height < 2) return false;
  const { left, top, width, height } = s.rect;
  return SPOTS.some(([fx, fy]) => {
    const x = left + width * fx;
    const y = top + height * fy;
    return x >= 0 && y >= 0 && x < s.view.width && y < s.view.height && s.windowAt(x, y);
  });
}

/** The real page's answer for the window `win`. */
export function windowVisible(win: HTMLElement): boolean {
  if (!win.isConnected) return false;
  return canSee({
    hidden: document.hidden,
    rect: win.getBoundingClientRect(),
    view: { width: innerWidth, height: innerHeight },
    windowAt: (x, y) => {
      const el = document.elementFromPoint(x, y);
      return !!el && win.contains(el);
    },
  });
}
