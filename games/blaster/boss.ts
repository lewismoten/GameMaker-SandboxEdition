// Boss helpers. A boss is built from many monsters: its weak points are chains of
// monsters (each hit turns a part into the next, more damaged one, until it bursts), its
// armor soaks shots up, its guns are turret mounts and hatches hidden in its body (blocks
// that give birth to bullets), and its body is drawn into the arena's background.
//
// The arena's way out sits right behind the boss's weak points: the parts burn the ship
// badly enough that the only way through is to shoot them away first.
import { Pixels } from '../kit/pixels';
import { BlockSet, CLEAR } from './art';
import { HURT } from './common';
import { POWER } from './ids';
import type { Bestiary } from './mons';

/** Slices a big picture into 20x20 pieces named `${prefix}${row}${col}`. */
export function slicesOf(big: Pixels, w: number, h: number): Pixels[][] {
  const out: Pixels[][] = [];
  for (let r = 0; r < h; r++) {
    out.push([]);
    for (let c = 0; c < w; c++) out[r].push(big.crop(c * 20, r * 20, 20, 20));
  }
  return out;
}

export function addSlices(bs: BlockSet, prefix: string, big: Pixels, w: number, h: number, props: object = {}, skip?: (r: number, c: number) => boolean): void {
  const s = slicesOf(big, w, h);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (!skip?.(r, c)) bs.add(`${prefix}${r}${c}`, s[r][c], props);
}

/** Is any pixel of this slice drawn? */
export const opaque = (p: Pixels) => p.px.some((c) => c !== CLEAR);

/**
 * A weak point: `hp` monsters in a chain. pics(h) gives the two animation frames for a
 * part with h hits left (the art can crack and glow as it weakens).
 */
export function weakPoint(
  b: Bestiary,
  name: string,
  hp: number,
  frames: (h: number) => [Pixels, Pixels],
  o: { score?: number; hurt?: number; anim?: number } = {},
): void {
  const made = new Map<string, string>();
  for (let h = hp; h >= 1; h--) {
    const [f0, f1] = frames(h);
    const key = `${f0.px.join()}`;
    let pic = made.get(key);
    if (!pic) {
      pic = `${name}p${h}`;
      b.mb.add(`${pic}0`, f0, { chHitPt: o.hurt ?? HURT.core });
      b.mb.add(`${pic}1`, f1, { chHitPt: o.hurt ?? HURT.core });
      made.set(key, pic);
    }
    b.add(h === hp ? name : `${name}_${h}`, {
      power: POWER.core,
      becomes: h === 1 ? 'bigBoom' : `${name}_${h - 1}`,
      score: h === 1 ? (o.score ?? 1000) : 20,
      pics: [
        [`${pic}0`, o.anim ?? 5],
        [`${pic}1`, o.anim ?? 5],
      ],
    });
  }
}

/** Armor: soaks up shots, never breaks. */
export function armor(b: Bestiary, name: string, pic: Pixels, hurt: number = HURT.core): void {
  b.mb.add(name, pic, { chHitPt: hurt });
  b.add(name, { power: POWER.armor, pics: [[name, 50]] });
}

/** Tints a picture toward a ramp (for damaged parts): every opaque pixel goes to ramp[k]. */
export function tint(p: Pixels, map: (c: number) => number): Pixels {
  const q = new Pixels(p.w, p.h, CLEAR);
  q.px.set(p.px);
  return q.map((_x, _y, c) => (c === CLEAR ? c : map(c)));
}
