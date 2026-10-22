// Making .MON records: a helper for the fields the realm uses, and the eight monsters every
// .MON starts with (the character file fires the first five; foes drop the last three).
import { emptyMonster, newMonsterSet, LASTMON, type Monster, type March } from '../../../../web/src/formats/monster';
import { MON, POWER } from '../ids';
import type { SpriteSheet } from '../sprites/sheet';

export interface MonSpec {
  /** [block, ticks] animation frames. */
  pics: [number, number][];
  power: number;
  /** 0 path, 1..63 chase at that speed (negative flees), 64+ wander at (towards >> 6). */
  towards?: number;
  /** -2 never dies, -1 at the end of its path, 0 when killed, > 0 lifetime in ticks. */
  end?: number;
  newmon?: number;
  upscore?: number;
  /** Stops at solid blocks (default yes). */
  thru?: number;
  /** Path corners: [dx, dy, speed, orient] offsets from the start. */
  path?: [number, number, number, number?][];
  /** Attack path when Pip comes near: 1 absolute, 2 relative to Pip. */
  activate?: number;
  attack?: [number, number, number, number?][];
}

export function monster(s: MonSpec): Monster {
  const m = emptyMonster();
  m.used = 1;
  m.power = s.power;
  m.thru = s.thru ?? 1;
  s.pics.forEach((p, i) => (m.pic[i] = [p[0], p[1]]));
  m.towards = s.towards ?? 0;
  m.end = s.end ?? 0;
  m.newmon = s.newmon ?? LASTMON;
  m.upscore = s.upscore ?? 0;
  m.activate = s.activate ?? 0;
  const fill = (dst: March[], src?: [number, number, number, number?][]) =>
    src?.forEach(([x, y, pic, orient], i) => (dst[i] = { x, y, pic, orient: orient ?? 0 }));
  fill(m.march[0], s.path);
  fill(m.march[1], s.attack);
  return m;
}

/** A .MON with the shared monsters in place; the rest is filled by the scene. */
export function baseMonsters(mb: SpriteSheet): Monster[] {
  const mons = newMonsterSet();
  const n = (s: string) => mb.n(s);
  // the slashes fly a block the way Pip last walked and are gone in 5 ticks
  mons[MON.slashWood] = monster({ pics: [[n('slash'), 2], [n('slash2'), 3]], power: POWER.slashWood, towards: 4, end: 5 });
  mons[MON.slashSteel] = monster({ pics: [[n('steel'), 2], [n('steel2'), 3]], power: POWER.slashSteel, towards: 4, end: 5 });
  mons[MON.note] = monster({ pics: [[n('note'), 3], [n('note2'), 3]], power: POWER.note, towards: 6, end: 40 });
  // a tonic: a sparkle fired at Pip's feet that turns, a tick later, into one that can touch him
  mons[MON.tonicA] = monster({ pics: [[n('sparkle'), 1]], power: POWER.drop, end: 1, newmon: MON.tonicB });
  mons[MON.tonicB] = monster({ pics: [[n('heal'), 2], [n('sparkle'), 2]], power: POWER.drop, end: 30 });
  // what foes leave behind: gone in about 20 seconds
  mons[MON.gem] = monster({ pics: [[n('gem'), 9], [n('gem2'), 3]], power: POWER.drop, end: 360 });
  mons[MON.bigGem] = monster({ pics: [[n('ruby'), 9], [n('ruby2'), 3]], power: POWER.drop, end: 360 });
  mons[MON.heart] = monster({ pics: [[n('heart'), 6], [n('heart2'), 6]], power: POWER.drop, end: 360 });
  return mons;
}
