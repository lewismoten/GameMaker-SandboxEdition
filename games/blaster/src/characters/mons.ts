// Monsters by name: their pictures (in the stage's .mbl), powers, paths and what they turn
// into, built into a 64-monster .mon file.
import { LASTMON, MAXMARCH, emptyMonster, type March, type Monster } from '../../../../web/src/formats/monster';
import { BlockSet } from '../art/draw';

/** One leg of a path: move (x, y) blocks at `speed` pixels a tick. */
export type Leg = [x: number, y: number, speed: number];

export interface MonDef {
  /** Animation: [monster block name, ticks]. */
  pics: [string, number][];
  power: number;
  /** Stops at (and, for the player's shots, dies on) solid blocks. */
  thru?: boolean;
  /** What it turns into when it dies. */
  becomes?: string;
  score?: number;
  /** -2 never dies, -1 dies at the end of its path, 0 only when killed, > 0 lifetime in ticks. */
  end?: number;
  /** 1..63: flies at the character at this speed (negative: away); >= 64 random. */
  towards?: number;
  /** The normal path, leg by leg (relative moves). */
  path?: Leg[];
  /** Attack when the character comes within 8 columns and 5 rows. */
  attack?: { mode: 'own' | 'player'; legs: Leg[] };
}

function marches(legs: Leg[] | undefined, cumulative: boolean, lead?: March): March[] {
  const out: March[] = [];
  if (lead) out.push(lead);
  let x = 0;
  let y = 0;
  for (const [dx, dy, speed] of legs ?? []) {
    if (cumulative) {
      x += dx;
      y += dy;
    } else {
      x = dx;
      y = dy;
    }
    out.push({ x, y, pic: speed, orient: 0 });
  }
  if (out.length > MAXMARCH) throw new Error(`Path with ${out.length} corners (max ${MAXMARCH})`);
  while (out.length < MAXMARCH) out.push({ x: 0, y: 0, pic: 0, orient: 0 });
  return out;
}

export class Bestiary {
  readonly mb = new BlockSet(100, 'mbl');
  readonly names: string[] = [];
  private defs: MonDef[] = [];

  add(name: string, def: MonDef): number {
    if (this.names.includes(name)) throw new Error(`Monster ${name} twice`);
    if (this.names.length >= LASTMON) throw new Error(`More than ${LASTMON} monsters (${name})`);
    if (def.pics.length > 20) throw new Error(`${name}: more than 20 pictures`);
    this.names.push(name);
    this.defs.push(def);
    return this.names.length - 1;
  }

  has(name: string): boolean {
    return this.names.includes(name);
  }

  id(name: string): number {
    const i = this.names.indexOf(name);
    if (i < 0) throw new Error(`No monster ${name}`);
    return i;
  }

  def(name: string): MonDef {
    return this.defs[this.id(name)];
  }

  build(): Monster[] {
    const out: Monster[] = this.defs.map((d) => {
      const m = emptyMonster();
      m.used = 1;
      m.fly = 1;
      m.power = d.power;
      m.thru = d.thru ? 1 : 0;
      d.pics.forEach(([pic, t], i) => (m.pic[i] = [this.mb.id(pic), t]));
      m.newmon = d.becomes ? this.id(d.becomes) : LASTMON;
      m.upscore = d.score ?? 0;
      m.end = d.end ?? 0;
      m.towards = d.towards ?? 0;
      m.march[0] = marches(d.path, true);
      if (d.attack) {
        m.activate = d.attack.mode === 'own' ? 1 : 2;
        // the attack path starts at corner 1; corner 0 is the reference point
        m.march[1] = marches(d.attack.legs, d.attack.mode === 'own', { x: 0, y: 0, pic: 1, orient: 0 });
      }
      return m;
    });
    while (out.length < LASTMON) out.push(emptyMonster());
    return out;
  }
}
