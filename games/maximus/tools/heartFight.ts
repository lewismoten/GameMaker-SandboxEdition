// The Heart Eye fight as a bot plays it (used by tools/route.ts and the Heart probe in
// tools/check.ts): stand near the seal, and whenever the eye (not while it reels) comes level
// within reach, turn to face it and fire the Plasma Lance. A touch cracks it too, for hit
// points. Done when the Core Light has charged the seal (or after `maxTicks`).
import type { World } from '../../../web/src/engine/world';
import type { MonsterSet } from '../src/characters/bestiary';
import { SCAN, SEAL_COUNTER, SEQ } from '../src/ids';

interface Body {
  readonly w: World;
  readonly dead: boolean;
  readonly pos: { bx: number; by: number };
  press(scan: number): void;
  release(scan: number): void;
  tick(): Promise<void>;
}

/** The eye's phases it can be hit in, as monster numbers of heart.mon. */
export function eyeTargets(heart: MonsterSet): Set<number> {
  return new Set(['Heart Eye', 'Wounded Eye', 'Failing Eye'].map((n) => heart.index.get(n)!));
}

/** True once the seal is charged (its counter above 1). */
export const sealCharged = (w: World) => w.ci.meter[SEAL_COUNTER] > 1;

export async function fightEye(d: Body, heart: MonsterSet, maxTicks = 4000): Promise<boolean> {
  const targets = eyeTargets(heart);
  const tap = async (k: number) => {
    d.press(k);
    await d.tick();
    d.release(k);
  };
  let last = -99;
  for (let t = 0; t < maxTicks && !d.dead && !sealCharged(d.w); t++) {
    const w = d.w;
    const at = w.mm.findIndex((m) => targets.has(m.monnum));
    if (at >= 0 && t - last > 8 && w.ci.meter[SEQ.plasma] > 0) {
      const dx = w.mi[at].curx[0] - d.pos.bx;
      const dy = w.mi[at].cury[0] - d.pos.by;
      if (dx !== 0 && Math.abs(dx) < 10 && dy >= -2 && dy <= 0) {
        last = t;
        const face = dx > 0 ? 1 : -1;
        if (w.ci.netx !== face) await tap(face > 0 ? SCAN.right : SCAN.left);
        await tap(SCAN.z);
        continue;
      }
    }
    await d.tick();
  }
  return sealCharged(d.w);
}
