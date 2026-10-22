// FOE.MBL and the overworld's monsters: the shared effects first (every .MBL starts with them),
// then the foes, the royal hounds and Doc Leo's runaway chicken.
import { LASTMON, type Monster } from '../../../../web/src/formats/monster';
import type { GameMap } from '../../../../web/src/formats/map';
import { rng } from '../../../kit/pixels';
import { SpriteSheet } from '../sprites/sheet';
import { addFx } from '../sprites/fx';
import { foePics } from '../sprites/foes';
import { baseMonsters, monster } from '../characters/mon';
import { MON, MON_FREE, POWER } from '../ids';
import type { WorldPlan } from '../levels/world';

export function foeSheet(): SpriteSheet {
  const mb = new SpriteSheet('mbl');
  addFx(mb);
  const pics = foePics();
  const bite = { hp: -1 };
  for (const name of ['slime0', 'slime1', 'slimeHit', 'bat0', 'bat1', 'batHit']) mb.add(name, pics.get(name)!, bite);
  return mb;
}

/** A foe that wanders until Pip comes near, then comes at him; each hit takes it one step down a chain to a dropped gem. */
export function chaser(pics: [number, number][], hurtPics: [number, number][], power: number, wander: number, rush: number, drop: number, score: number): [Monster, Monster] {
  const base = { power, towards: 64 * wander, activate: 2, attack: [[0, 0, 0], [0, 0, rush]] as [number, number, number][], upscore: score };
  const hurt = monster({ ...base, pics: hurtPics, newmon: drop });
  const whole = monster({ ...base, pics });
  return [whole, hurt];
}

export const WMON = {
  slime: MON_FREE,
  slimeHurt: MON_FREE + 1,
  bat: MON_FREE + 2,
  batHurt: MON_FREE + 3,
} as const;

export function worldMonsters(mb: SpriteSheet): Monster[] {
  const mons = baseMonsters(mb);
  const n = (s: string) => mb.n(s);
  const [slime, slimeHurt] = chaser(
    [
      [n('slime0'), 8],
      [n('slime1'), 8],
    ],
    [
      [n('slimeHit'), 2],
      [n('slime1'), 2],
    ],
    POWER.foeEasy,
    1,
    1,
    MON.gem,
    10,
  );
  slime.newmon = WMON.slimeHurt;
  mons[WMON.slime] = slime;
  mons[WMON.slimeHurt] = slimeHurt;
  const [bat, batHurt] = chaser(
    [
      [n('bat0'), 3],
      [n('bat1'), 3],
    ],
    [
      [n('batHit'), 2],
      [n('bat1'), 2],
    ],
    POWER.foeEasy,
    2,
    2,
    MON.gem,
    15,
  );
  bat.newmon = WMON.batHurt;
  mons[WMON.bat] = bat;
  mons[WMON.batHurt] = batHurt;
  void LASTMON;
  return mons;
}

/** Places the overworld's foes on open ground, away from the towns. */
export function placeWorldMonsters(map: GameMap, plan: WorldPlan, solid?: (x: number, y: number) => boolean): void {
  const r = rng(77);
  let slot = 0;
  const put = (mon: number, x0: number, y0: number, x1: number, y1: number, count: number) => {
    for (let k = 0, tries = 0; k < count && tries < 500; tries++) {
      const x = x0 + Math.floor(r() * (x1 - x0));
      const y = y0 + Math.floor(r() * (y1 - y0));
      if (solid?.(x, y)) continue;
      map.monsters[slot++] = { monnum: mon, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
      k++;
    }
  };
  void plan;
  put(WMON.slime, 24, 54, 34, 72, 4);
  put(WMON.slime, 14, 36, 28, 44, 3);
  put(WMON.bat, 34, 26, 44, 34, 3);
  put(WMON.slime, 70, 40, 78, 56, 4);
  put(WMON.bat, 72, 62, 80, 72, 4);
}
