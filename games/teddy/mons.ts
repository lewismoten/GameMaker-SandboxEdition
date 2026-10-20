// Building .MON monsters by name: a picture loop, a path or a pull toward/away from Teddy,
// a power on the ladder of who scares whom, and what each becomes when beaten.
import { emptyMonster, newMonsterSet, type Monster } from '../../web/src/formats/monster';
import { BlockSet, type BlockDef } from './blockset';
import type { Pixels } from '../kit/pixels';

export interface MonDef {
  /** Monster block names and ticks to show each. */
  pics: [string, number][];
  power: number;
  /** 1..63 toward Teddy at that speed, negative away, >= 64 wander; 0 = follow `path`. */
  towards?: number;
  /** Corners as block offsets from where the monster starts, and the speed to each. */
  path?: [number, number, number, number?][];
  /** A second path started when Teddy comes near (`activate`: 1 absolute, 2 relative to Teddy). */
  attack?: [number, number, number, number?][];
  activate?: number;
  /** -2 never dies, -1 dies after its path, 0 when beaten, > 0 lifetime in ticks. */
  end?: number;
  /** Stops at walls (and Teddy's own shots vanish there). */
  thru?: boolean;
  /** Monster name this one turns into when beaten (or when its path/life ends). */
  becomes?: string;
  upscore?: number;
}

/** The monster block set and the monster list of one level, built together by name. */
export class Bestiary {
  readonly mb = new BlockSet(100, true);
  readonly names: string[] = [];
  private defs: MonDef[] = [];

  /** Adds a monster block (a 20x20 picture) with its touch attributes. */
  pic(name: string, px: Pixels, def: BlockDef = {}): this {
    this.mb.add(name, px, def);
    return this;
  }

  /** Adds monster `name` at the next number (or at `at`). */
  add(name: string, def: MonDef, at?: number): number {
    const n = at ?? this.names.length;
    if (this.names[n]) throw new Error(`Monster slot ${n} taken by ${this.names[n]}`);
    if (n >= 64) throw new Error(`Too many monsters (${name})`);
    if (this.names.includes(name)) throw new Error(`Monster ${name} twice`);
    this.names[n] = name;
    this.defs[n] = def;
    return n;
  }

  id(name: string): number {
    const i = this.names.indexOf(name);
    if (i < 0) throw new Error(`No monster ${name}`);
    return i;
  }

  has(name: string): boolean {
    return this.names.includes(name);
  }

  def(name: string): MonDef {
    return this.defs[this.id(name)];
  }

  build(): Monster[] {
    const set = newMonsterSet();
    this.defs.forEach((d, n) => {
      if (!d) return;
      const m = emptyMonster();
      m.used = 1;
      m.power = d.power;
      m.thru = d.thru ? 1 : 0;
      d.pics.forEach(([pic, t], i) => (m.pic[i] = [this.mb.id(pic), t]));
      m.newmon = d.becomes ? this.id(d.becomes) : 64;
      m.upscore = d.upscore ?? 0;
      m.end = d.end ?? 0;
      m.towards = d.towards ?? 0;
      m.activate = d.activate ?? 0;
      const corners = (list: [number, number, number, number?][] | undefined, into: Monster['march'][0]) =>
        list?.forEach(([x, y, speed, orient], i) => (into[i] = { x, y, pic: speed, orient: orient ?? 0 }));
      corners(d.path, m.march[0]);
      corners(d.attack, m.march[1]);
      set[n] = m;
    });
    return set;
  }
}

/** Orientation for a picture mirrored left-right. */
export const FLIP = 4;
