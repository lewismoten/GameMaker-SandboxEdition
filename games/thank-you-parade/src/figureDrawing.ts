// Shared poster-style hero poses, strokes, faces and whole-figure rendering.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { inkLine, type Pal } from './print';

const T = 255;
export type XY = [number, number];
export type Face = 'smile' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'look';

/** One pose: where the hands and feet are (feet as [x, lift]), the face, and whether we see the back (climbing). */
export interface Pose {
  face: Face;
  back?: boolean;
  hands: [XY, XY]; // the far hand, the near hand
  feet: [XY, XY]; // the far foot, the near foot: [x, lift off the ground]
  /** The whole figure a pixel lower (a step's dip). */
  dip?: number;
  /** Penny's mace: the point its brass head reaches, held in the near hand (none when absent). */
  mace?: XY;
}

/** A thick stroke from (x0, y0) to (x1, y1), `w` pixels across. */
export function limb(p: Pixels, x0: number, y0: number, x1: number, y1: number, w: number, c: number): void {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  const h = Math.floor(w / 2);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    p.rect(x - h, y - h, w, w, c);
  }
}

/** What one hero wears: the colors and the head, drawn by the hero's own code. */
export interface Outfit {
  coat: number[];
  coatEdge?: number[];
  trousers: number[];
  stripe: number;
  boots: number[];
  skin: number[];
  cuff: number;
  /** The head and hat (or helmet), with the face, onto `p` with the figure lowered by `dy`. */
  head: (p: Pixels, pose: Pose, dy: number) => void;
  /** Details on the coat (belts, buttons, a scarf), after the arms behind and before the near arm. */
  coatDetail: (p: Pixels, pose: Pose, dy: number) => void;
  /** Top of the torso and bottom of the hips (Penny's coat is longer than Marge's jacket). */
  torso: [number, number];
}

export function face(p: Pixels, pal: Pal, f: Face, ex: number, ey: number, skin: number[]): void {
  const ink = pal.c('ink', 0);
  switch (f) {
    case 'blink':
      p.rect(ex - 1, ey + 1, 2, 1, ink);
      break;
    case 'ouch':
      p.set(ex - 1, ey, ink)
        .set(ex, ey + 1, ink)
        .set(ex - 1, ey + 2, ink);
      p.rect(ex, ey + 3, 2, 2, ink);
      break;
    case 'cheer':
      p.set(ex - 1, ey + 1, ink)
        .set(ex, ey, ink)
        .set(ex + 1, ey + 1, ink);
      p.rect(ex - 1, ey + 3, 3, 2, ink).set(ex, ey + 4, pal.c('red', 3));
      break;
    case 'oh':
      p.rect(ex, ey - 1, 1, 2, ink);
      p.rect(ex, ey + 3, 2, 2, ink);
      break;
    case 'look':
      p.rect(ex - 2, ey, 1, 2, ink);
      p.rect(ex - 1, ey + 4, 2, 1, skin[0]);
      break;
    default:
      p.rect(ex, ey, 1, 2, ink);
      p.set(ex - 1, ey + 4, skin[0])
        .set(ex, ey + 4, skin[0])
        .set(ex + 1, ey + 3, skin[0]);
  }
  // a dash of blush, printed as two dots
  if (f !== 'ouch') p.set(ex - 2, ey + 3, pal.c('pink', 2));
}

export function draw(pal: Pal, o: Outfit, pose: Pose): Pixels {
  const p = new Pixels(20, 40, T);
  const dy = pose.dip ?? 0;
  const ink = pal.c('ink', 0);
  const [top, hip] = o.torso;
  const sh: XY = [10, top + 1 + dy];
  // legs: the far one in the trousers' shadow, then the near one
  pose.feet.forEach(([fx, lift], i) => {
    const hx = i ? 11 : 9;
    const fy = 37 - lift;
    const tr = o.trousers;
    limb(p, hx, hip + dy, fx, fy - 1, 3, i ? tr[2] : tr[1]);
    if (i) limb(p, hx + 1, hip + 1 + dy, fx + 1, fy - 1, 1, o.stripe);
    const b = o.boots;
    p.rect(fx - 1, fy, 4, 3, i ? b[1] : b[0]);
    p.rect(fx + (pose.back ? -1 : 2), fy + 1, 1, 2, i ? b[1] : b[0]);
    if (i) p.set(fx, fy, b[3] ?? b[2]);
  });
  // the far arm, behind the body
  const far = pose.hands[0];
  limb(p, sh[0] - 1, sh[1], far[0], far[1] + dy, 3, o.coat[1]);
  p.rect(far[0] - 1, far[1] + dy - 1, 3, 3, o.cuff);
  // the torso
  const c = o.coat;
  p.rect(6, top + dy, 9, hip - top + 1, c[2]);
  p.rect(6, top + dy, 2, hip - top + 1, c[1]);
  p.rect(13, top + 1 + dy, 1, hip - top - 1, c[3]);
  if (o.coatEdge) p.rect(6, hip + dy, 9, 1, o.coatEdge[1]);
  o.coatDetail(p, pose, dy);
  o.head(p, pose, dy);
  // the near arm, and the mace in its hand
  const near = pose.hands[1];
  if (pose.mace) {
    const [mx, my] = pose.mace;
    const hx = near[0];
    const hy = near[1] + dy;
    const bx = Math.round(hx - (mx - hx) * 0.35);
    const by = Math.round(hy - (my - hy) * 0.35);
    limb(p, bx, by, mx, my + dy, 1, pal.c('blue', 1));
    for (let k = 1; k < 5; k++) p.set(Math.round(hx + ((mx - hx) * k) / 5), Math.round(hy + ((my + dy - hy) * k) / 5), pal.c('gold', 3)); // the cord
    p.disc(mx, my + dy, 1.6, pal.c('gold', 3)).set(mx - 1, my + dy - 1, pal.c('gold', 5));
    p.set(bx, by, pal.c('gold', 4));
  }
  limb(p, sh[0], sh[1], near[0], near[1] + dy, 3, c[3]);
  p.rect(sh[0] - 1, sh[1] - 1, 3, 2, c[3]);
  p.rect(near[0] - 1, near[1] + dy - 1, 3, 3, o.cuff);
  void ink;
  return inkLine(p, pal.c('ink', 0));
}
