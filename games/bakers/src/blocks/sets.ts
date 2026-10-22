// Named blocks and monsters, resolved into Game-Maker block sets (.BBL/.MBL/.CBL) and monster
// lists (.MON), so a room can say "falseWall" instead of a raw number. A block's number is
// the order it was added, so the order of the add() calls is part of the file format.
import { emptyBlock, SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '../../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type Monster } from '../../../../web/src/formats/monster';
import type { Pixels } from '../../../kit/pixels';

export const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
export { SOLTOP, SOLRIG, SOLBOT, SOLLEF };

/** Gravity bits (Block.grav): 1 up, 2 right, 4 down, 8 left. */
export const GRAV = { n: 1, e: 2, s: 4, w: 8 } as const;

export interface BlockDef {
  solid?: number;
  score?: number;
  hp?: number;
  next?: string;
  ntime?: number;
  touch?: string;
  effect?: number;
  eamt?: number;
  birthMon?: number;
  birthTime?: number;
  grav?: number;
  obj?: boolean;
}

export class BlockSet {
  readonly names: string[] = [];
  readonly pics: Pixels[] = [];
  readonly defs: BlockDef[] = [];
  constructor(
    readonly count: number,
    readonly transparent: boolean,
  ) {}

  add(name: string, px: Pixels, def: BlockDef = {}): number {
    if (this.names.includes(name)) throw new Error(`Block ${name} twice`);
    if (this.names.length >= this.count) throw new Error(`Too many blocks (${name})`);
    if (px.w !== 20 || px.h !== 20) throw new Error(`Block ${name} is ${px.w}x${px.h}`);
    this.names.push(name);
    this.pics.push(px);
    this.defs.push(def);
    return this.names.length - 1;
  }

  id(name: string): number {
    const i = this.names.indexOf(name);
    if (i < 0) throw new Error(`No block ${name}`);
    return i;
  }

  has(name: string): boolean {
    return this.names.includes(name);
  }

  pic(name: string): Pixels {
    return this.pics[this.id(name)];
  }

  def(name: string): BlockDef {
    return this.defs[this.id(name)];
  }

  build(): Block[] {
    return Array.from({ length: this.count }, (_, i) => {
      const b = emptyBlock(i, this.transparent);
      const p = this.pics[i];
      const d = this.defs[i];
      if (!p || !d) return b;
      b.pixels = Uint8Array.from(p.px);
      b.solid = d.solid ?? 0;
      b.scorePts = d.score ?? 0;
      b.chHitPt = d.hp ?? 0;
      b.nextBl = d.next ? this.id(d.next) : i;
      b.ntime = d.ntime ?? 0;
      b.touchBl = d.touch ? this.id(d.touch) : i;
      b.effect = d.effect ?? 0;
      b.eamt = d.eamt ?? 0;
      b.birthMon = d.birthMon ?? 0;
      b.birthTime = d.birthTime ?? 0;
      b.grav = d.grav ?? 0;
      b.obj = d.obj ? 1 : 0;
      return b;
    });
  }
}

export interface MonDef {
  /** Monster block names and ticks to show each. */
  pics: [string, number][];
  power: number;
  /** 1..63 toward Doc Leo at that speed, negative away, >= 64 wander; 0 = follow `path`. */
  towards?: number;
  /** Corners as cumulative block offsets from the start: [x, y, speed, orient]. */
  path?: [number, number, number, number?][];
  /** -2 never dies, -1 dies after its path, 0 when beaten, > 0 lifetime in ticks. */
  end?: number;
  /** Stops at walls (Game-Maker's "thru" flag means the opposite of its name). */
  thru?: boolean;
  /** Monster this one turns into when beaten or when its life ends. */
  becomes?: string;
  upscore?: number;
}

/** A room's monster list, numbered by name, over the shared monster block set. */
export class Bestiary {
  readonly names: string[] = [];
  readonly defs: MonDef[] = [];
  constructor(readonly mb: BlockSet) {}

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
      d.path?.forEach(([x, y, speed, orient], i) => (m.march[0][i] = { x, y, pic: speed, orient: orient ?? 0 }));
      set[n] = m;
    });
    return set;
  }
}
