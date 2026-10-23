// The overworld's monsters (WORLD.MON): Procrastislimes, Snooze Bats and (south of Eventually
// Falls) Gloom Goblins, and, standing where you find them, the royal hounds and Sir Reginald.
import type { GameMap } from '../../../../web/src/formats/map';
import { rng } from '../../../kit/pixels';
import { MonBook } from '../characters/monbook';
import { MON, POWER } from '../ids';
import type { SpriteSheet } from '../sprites/sheet';

/**
 * A foe that wanders until Pip comes within a few blocks, then comes straight at him; a hit turns
 * it into its flashing hurt self, a second hit into what it drops. Touching Pip bites (its
 * blocks' hit points); with power 100 or more it never dies of touching him.
 */
export function addChaser(
  mons: MonBook,
  name: string,
  o: { pics: [string, number][]; hurt: [string, number][]; power: number; wander: number; rush: number; drop: number; score: number; hits?: number },
): number {
  const p = (l: [string, number][]) => l.map(([b, t]) => [mons.mb.n(b), t] as [number, number]);
  const base = {
    power: o.power,
    towards: 64 * o.wander,
    activate: 2,
    attack: [
      [0, 0, 0],
      [0, 0, o.rush],
    ] as [number, number, number][],
    upscore: o.score,
  };
  const hits = o.hits ?? 2;
  // the last stage drops the gem; earlier stages become the next one
  let next: number = o.drop;
  for (let k = hits - 1; k >= 1; k--) next = mons.add(`${name}${k}`, { ...base, pics: p(o.hurt) }, next);
  return mons.add(name, { ...base, pics: p(o.pics) }, next);
}

export function worldMons(mb: SpriteSheet): MonBook {
  const mons = new MonBook(mb);
  addChaser(mons, 'slime', {
    pics: [
      ['slime0', 8],
      ['slime1', 8],
    ],
    hurt: [
      ['slimeHit', 2],
      ['slime1', 2],
    ],
    power: POWER.foeEasy,
    wander: 1,
    rush: 1,
    drop: MON.gem,
    score: 10,
  });
  addChaser(mons, 'bat', {
    pics: [
      ['bat0', 3],
      ['bat1', 3],
    ],
    hurt: [
      ['batHit', 2],
      ['bat1', 2],
    ],
    power: POWER.foeEasy,
    wander: 2,
    rush: 2,
    drop: MON.gem,
    score: 15,
  });
  addChaser(mons, 'goblin', {
    pics: [
      ['goblin0', 6],
      ['goblin1', 6],
    ],
    hurt: [
      ['goblinHit', 2],
      ['goblin1', 2],
    ],
    power: POWER.foeEasy,
    wander: 2,
    rush: 2,
    drop: MON.bigGem,
    score: 25,
  });
  mons.npc('teddy');
  mons.npc('gwinn');
  mons.npc('chick');
  return mons;
}

/** Scatters foes on open ground inside boxes. */
export function scatter(map: GameMap, solid: (x: number, y: number) => boolean, seed: number, list: [number, number, number, number, number, number][]): void {
  const r = rng(seed);
  let slot = map.monsters.findIndex((m) => m.monnum >= 64);
  for (const [mon, x0, y0, x1, y1, count] of list)
    for (let k = 0, tries = 0; k < count && tries < 500; tries++) {
      const x = x0 + Math.floor(r() * (x1 - x0));
      const y = y0 + Math.floor(r() * (y1 - y0));
      if (solid(x, y)) continue;
      map.monsters[slot++] = { monnum: mon, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
      k++;
    }
}

/** Puts a monster at one spot. */
export function place(map: GameMap, mon: number, x: number, y: number): void {
  const slot = map.monsters.findIndex((m) => m.monnum >= 64);
  if (slot < 0) throw new Error('Out of placed monsters');
  map.monsters[slot] = { monnum: mon, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
}
