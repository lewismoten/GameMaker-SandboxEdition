// What every one of Max's characters shares: the CharSet a build produces, the starting
// meters, the weapon sequences (each weapon is a sequence whose counter is its ammunition,
// and its frames give birth to the shot monster), and the explosion when Max is destroyed.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, Mask, fill, shade } from '../art/draw';
import { WHITE, shared } from '../art/palette';
import { INF_REPEAT, type Character } from '../../../../web/src/formats/character';
import { BlockList, setSeq, type F } from './chrkit';
import { MON, SEQ, SND, itemBlock } from '../ids';

export interface CharSet {
  name: string;
  chr: Character;
  cbl: ReturnType<BlockList['full']>;
  used: number;
}

/** Facing left: both blocks mirrored. */
export const L = 4;

/** Start values shared by every character (the first scene's .CHR sets them for the game). */
export function meters(c: Character): void {
  c.meter.fill(INF_REPEAT);
  c.meter[0] = 100; // hit points
  c.meter[1] = 3; // lives
  c.meter[3] = 1; // credits (shown as meter - 1)
  for (let i = 20; i < 30; i++) c.meter[i] = 0; // star-shards
  c.meter[SEQ.plasma] = 20;
  c.meter[SEQ.nova] = 3;
  c.meter[SEQ.shield] = 3;
  c.meter[SEQ.mine] = 6;
  c.meter[SEQ.medkit] = 2;
  c.meter[SEQ.flak] = 10;
}

/**
 * The weapon sequences every vehicle has (the frames that fire are the same). The ground
 * (uninterruptible) ones - nova, shield, mine, med kit - start with a picture frame that
 * lasts a tick: PLAYGAME only reads waiting keys when such a sequence stands on its first
 * frame, so one whose first frame fires (and so takes no time) would never let go of a held
 * key. The blaster, the lance and the flak cannon are not ground: letting go of the key pops
 * them at once, so they fire on their first frame - with a picture frame first, a tap that
 * let go before the next tick spent a round and fired nothing.
 */
export function weapons(c: Character, pose: (name: string) => F, extra: { fireY?: number } = {}): void {
  const fy = extra.fireY ?? 0;
  setSeq(c, SEQ.fire, { key: 'space', sound: SND.fire, joy: [9, 1], frames: [{ birth: MON.bolt, y: fy }, pose('fire'), { ...pose('fire2'), pause: 3 }] });
  setSeq(c, SEQ.plasma, {
    key: 'z',
    sound: SND.plasma,
    bloc: itemBlock('plasma'),
    joy: [9, 2],
    frames: [{ birth: MON.plasma, y: fy }, pose('lance'), { ...pose('lance2'), pause: 5 }],
  });
  setSeq(c, SEQ.nova, {
    key: 'x',
    sound: SND.nova,
    bloc: itemBlock('nova'),
    norepeat: true,
    frames: [pose('nova'), ...Array.from({ length: 8 }, (_, k) => ({ birth: MON.nova + k, y: fy })), { ...pose('nova2'), pause: 4 }],
  });
  setSeq(c, SEQ.shield, {
    key: 'c',
    sound: SND.shield,
    bloc: itemBlock('shield'),
    norepeat: true,
    frames: [
      { ...pose('shield'), pause: 2 },
      { birth: MON.shield, y: fy },
      { ...pose('shield2'), pause: 4 },
    ],
  });
  setSeq(c, SEQ.mine, {
    key: 'v',
    sound: SND.mine,
    bloc: itemBlock('mine'),
    norepeat: true,
    frames: [
      { ...pose('mine'), pause: 2 },
      { birth: MON.mine, y: 20 },
      { ...pose('mine2'), pause: 4 },
    ],
  });
  setSeq(c, SEQ.medkit, {
    key: 'r',
    sound: SND.medkit,
    bloc: itemBlock('medkit'),
    norepeat: true,
    frames: [
      { ...pose('medkit'), pause: 3 },
      { birth: MON.healPod, y: fy },
      { ...pose('medkit2'), pause: 3 },
    ],
  });
  setSeq(c, SEQ.flak, {
    key: 'w',
    sound: SND.flak,
    bloc: itemBlock('flak'),
    frames: [{ birth: MON.flakL, y: fy }, { birth: MON.nova, y: fy }, { birth: MON.flakR, y: fy }, pose('flak'), { ...pose('flak'), pause: 4 }],
  });
}

/** A 20x40 explosion in four steps plus debris, as character blocks. */
export function explosionFrames(cb: BlockList): number[] {
  const out: number[] = [];
  for (let k = 0; k < 3; k++) {
    const p = drawBoom(k);
    out.push(cb.add(p.crop(0, 0, 20, 20)), cb.add(p.crop(0, 20, 20, 20)));
  }
  out.push(cb.add(drawBoom(3).crop(0, 20, 20, 20)));
  return out;
}

export function drawBoom(k: number, w = 20, h = 40): Pixels {
  const c = new Pixels(w, h, CLEAR);
  const flame = shared.get('flame')!;
  const r = rng(11 + k);
  const cy = h * 0.6;
  if (k < 3) {
    const rad = [6, 9, 8][k];
    const m = new Mask(w, h);
    for (let i = 0; i < 9; i++) m.ellipse(w / 2 + (r() - 0.5) * rad, cy + (r() - 0.5) * rad * 1.6, rad * (0.4 + r() * 0.5), rad * (0.4 + r() * 0.5));
    shade(c, m, k === 2 ? flame.slice(0, 4) : flame.slice(1, 6), { dither: true, seed: k });
    if (k < 2) fill(c, new Mask(w, h).ellipse(w / 2, cy, rad * 0.35, rad * 0.35), WHITE);
    if (k === 2) {
      const smoke = new Mask(w, h);
      for (let i = 0; i < 5; i++) smoke.ellipse(w / 2 + (r() - 0.5) * 14, cy - 8 + (r() - 0.5) * 10, 3, 3);
      shade(c, smoke, shared.get('metal')!.slice(0, 4));
    }
  } else {
    for (let i = 0; i < 14; i++) c.set(2 + r() * (w - 4), h - 3 - r() * 8, shared.get('metal')![Math.floor(r() * 4)]);
    for (let i = 0; i < 6; i++) c.set(2 + r() * (w - 4), h - 2 - r() * 4, flame[2 + Math.floor(r() * 3)]);
  }
  return c;
}
