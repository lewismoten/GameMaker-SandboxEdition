// Kit seen small and slim: one 20x20 block a pose, about 12 pixels wide and 19 tall, in eight facings: the four
// straight ones (down, up, right, left) for top-down maps and the four diagonal ones (dr, dl, ur, ul: down-right and
// so on) for boards drawn on the diagonal. He is clearly taller than wide, and the beanie is narrower than his
// shoulders. The diagonals come from games/corner-view/src/cornerHero.ts (the proportions Lewis approved), now
// drawn with Kit's palette ramps so a helper's palette recolors them. Right-hand facings are drawn; left are mirrors.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { kitRamp } from './heroLook';
import type { Pal } from './palette';

const T = 255;
export type SlimFacing = 'down' | 'up' | 'right' | 'left' | 'dr' | 'dl' | 'ur' | 'ul';
/** A step: 0 and 1 are the two strides, 2 is standing. */
export type Step = 0 | 1 | 2;
export const SLIM_FACINGS: SlimFacing[] = ['down', 'up', 'right', 'left', 'dr', 'dl', 'ur', 'ul'];

const MIRROR: Partial<Record<SlimFacing, SlimFacing>> = { left: 'right', dl: 'dr', ul: 'ur' };

/** One slim pose, 20x20. */
export function slimPose(pal: Pal, facing: SlimFacing, step: Step): Pixels {
  const mirrored = MIRROR[facing];
  if (mirrored) return slimPose(pal, mirrored, step).flipX();
  const { c, r } = pal;
  const g = new Pixels(20, 20, T);
  const skin = kitRamp(pal, 'skin');
  const hat = kitRamp(pal, 'hat');
  const hair = kitRamp(pal, 'hair');
  const hood = kitRamp(pal, 'hood');
  const pants = kitRamp(pal, 'pants');
  const white = r('white');
  const ink = c('ink', 0);
  const fwd = step === 0 ? 1 : step === 1 ? -1 : 0; // how far the near leg is ahead of the far one
  const straight = facing === 'down' || facing === 'up';
  const side = facing === 'right';
  const diag = facing === 'dr' || facing === 'ur';
  const faceOn = facing === 'down' || facing === 'dr' || side; // the face shows
  // legs and shoes
  const leg = (x: number, ahead: number, near: boolean, w: number) => {
    const lift = ahead < 0 ? 1 : 0;
    g.rect(x, 13, w, 3 - lift, pants[near ? 3 : 2]);
    g.rect(x - 1 + (ahead > 0 ? 2 : ahead < 0 ? -1 : 0), 16 - lift, w + 1, 2, near ? white[3] : white[2]);
  };
  if (straight) {
    leg(7, -fwd, false, 3);
    leg(10, fwd, true, 3);
  } else if (side) {
    leg(7, -fwd * 2, false, 3);
    leg(9, fwd * 2, true, 3);
  } else {
    leg(7, -fwd, false, 3);
    leg(10, fwd, true, 3);
  }
  // the hoodie, arms and hands
  if (straight) {
    const sw = step === 2 ? [0, 0] : step === 0 ? [-1, 1] : [1, -1];
    g.rect(6, 8, 8, 5, hood[3]).rect(6, 8, 2, 5, hood[2]).rect(12, 8, 2, 5, hood[4]).rect(6, 12, 8, 1, hood[1]);
    g.rect(4, 9 + sw[0], 2, 4, hood[2]).rect(14, 9 + sw[1], 2, 4, hood[3]);
    g.rect(4, 13 + sw[0], 2, 1, skin[2]).rect(14, 13 + sw[1], 2, 1, skin[2]);
    if (facing === 'down') {
      g.rect(9, 8, 1, 3, white[2]).rect(11, 8, 1, 3, white[2]).rect(9, 11, 3, 1, hood[2]);
    } else {
      g.rect(7, 8, 6, 2, hood[4]).rect(8, 10, 4, 1, hood[2]); // the hood's back
    }
  } else if (side) {
    g.rect(7, 8, 6, 5, hood[3]).rect(7, 8, 2, 5, hood[2]).rect(11, 8, 2, 5, hood[4]).rect(7, 12, 6, 1, hood[1]);
    const a = step === 2 ? 0 : fwd * 2;
    g.rect(8 + a, 9, 3, 4, hood[4]).rect(8 + a, 13, 3, 1, skin[2]);
    g.rect(11, 8, 1, 2, white[2]);
  } else {
    g.set(5, 9 + (fwd > 0 ? 1 : 0), hood[1]);
    g.rect(5, 9 + (fwd > 0 ? 1 : 0), 1, 4, hood[1]).set(5, 13 + (fwd > 0 ? 1 : 0), skin[1]);
    const nearUp = fwd < 0 ? 1 : 0;
    g.rect(14, 9 - nearUp, 1, 4, hood[3]).set(14 + (fwd > 0 ? 1 : 0), 13 - nearUp, skin[2]);
    g.rect(6, 8, 8, 5, hood[3]).rect(6, 8, 2, 5, hood[2]).rect(12, 8, 2, 5, hood[4]).rect(6, 12, 8, 1, hood[1]);
    if (facing === 'dr') {
      g.rect(10, 8, 1, 2, white[2]).rect(12, 8, 1, 2, white[2]).rect(9, 11, 3, 1, hood[2]);
    } else g.rect(7, 8, 6, 1, hood[4]).rect(7, 9, 6, 1, hood[3]);
  }
  // the head: three rows under the cuff
  if (facing === 'down') {
    g.rect(7, 5, 6, 3, skin[3]).rect(7, 5, 6, 1, hair[2]);
    g.set(8, 6, ink).set(11, 6, ink).set(9, 7, skin[1]).set(10, 7, skin[1]);
  } else if (facing === 'up') {
    g.rect(7, 5, 6, 3, hair[1]).rect(7, 5, 6, 1, hair[2]);
  } else if (side) {
    g.rect(8, 5, 6, 3, skin[3]).rect(7, 5, 3, 3, hair[1]).rect(8, 5, 6, 1, hair[2]);
    g.set(12, 6, ink).set(14, 6, skin[2]).set(13, 7, skin[1]);
  } else if (diag && facing === 'dr') {
    g.rect(7, 5, 6, 3, skin[3]).rect(7, 5, 2, 3, hair[1]);
    g.set(10, 6, ink).set(12, 6, ink).set(11, 7, ink);
  } else {
    g.rect(7, 5, 6, 3, hair[1]).rect(7, 5, 6, 1, hair[2]);
    g.rect(12, 6, 1, 2, skin[2]);
  }
  // the beanie: a dome, a ribbed cuff narrower than the shoulders, and a fuzzy pom-pom on top
  const px = straight ? 9 : side ? 8 : 11;
  g.rect(8, 2, 5, 1, hat[3]).rect(7, 3, 7, 1, hat[3]).rect(8, 2, 3, 1, hat[4]);
  g.rect(straight ? 7 : 6, 4, straight ? 6 : 8, 1, hat[2]);
  for (let x = 7; x < 14; x += 2) g.set(x, 4, hat[1]);
  g.rect(px, 1, 3, 2, white[3])
    .set(px, 1, white[2])
    .set(px + 2, 2, white[2]);
  void faceOn;
  const p = new Pixels(20, 20, T);
  p.blit(g, 0, 1, T);
  return outline(p, ink, { transparent: T });
}
