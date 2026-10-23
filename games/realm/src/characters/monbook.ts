// A .MON built by name: the eight shared monsters first (characters/mon.ts), then whatever a
// scene adds, numbered in the order they're added. Chains (a foe that turns into its hurt self,
// then into a gem) name what they become, resolved when the book is finished.
import { LASTMON, type Monster } from '../../../../web/src/formats/monster';
import { MON_FREE, POWER } from '../ids';
import { baseMonsters, monster, type MonSpec } from './mon';
import type { SpriteSheet } from '../sprites/sheet';

export class MonBook {
  readonly mons: Monster[];
  readonly index = new Map<string, number>();
  private next = MON_FREE;
  private chains: [number, string][] = [];

  constructor(readonly mb: SpriteSheet) {
    this.mons = baseMonsters(mb);
  }

  /** Adds a monster; `becomes` names what it turns into when killed (or touched, if weaker than Pip). */
  add(name: string, spec: MonSpec, becomes?: string | number): number {
    if (this.index.has(name)) return this.index.get(name)!;
    if (this.next >= LASTMON) throw new Error(`Out of monsters at ${name}`);
    const n = this.next++;
    this.index.set(name, n);
    this.mons[n] = monster(spec);
    if (typeof becomes === 'number') this.mons[n].newmon = becomes;
    else if (becomes) this.chains.push([n, becomes]);
    return n;
  }

  n(name: string): number {
    const v = this.index.get(name);
    if (v === undefined) throw new Error(`No monster ${name}`);
    return v;
  }

  /** Someone standing still, blinking now and then; nothing hurts them and they hurt no one. */
  npc(key: string): number {
    const b = this.mb;
    return this.add(`npc:${key}`, {
      pics: [
        [b.n(`${key}0`), 60 + ((key.length * 7) % 30)],
        [b.n(`${key}1`), 3],
      ],
      power: POWER.npc,
    });
  }

  finish(): Monster[] {
    for (const [n, name] of this.chains) this.mons[n].newmon = this.n(name);
    return this.mons;
  }
}
