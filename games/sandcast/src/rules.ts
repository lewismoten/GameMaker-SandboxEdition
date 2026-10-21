// The numbers that tie Sandcastle Knight's blocks, monsters, character and maps together.
import { emptyBlock, type Block } from '../../../web/src/formats/blocks';
import type { Pixels } from '../../kit/pixels';

/** Character sequences (0-4 are Game-Maker's fixed ones). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  drop: 4,
  // Walking: the arrows, then the same four steps on W/A/S/D (Game-Maker runs one
  // sequence per key, so each key needs its own copy).
  right: 5,
  left: 6,
  up: 7,
  down: 8,
  rightD: 9,
  leftA: 10,
  upW: 11,
  downS: 12,
  /** Space: fling a clod of sand (needs the shovel). */
  fling: 13,
  /** B: throw a water splash (needs the bucket; its counter is the water supply). */
  splash: 14,
  /** F: toss a tennis ball (its counter is the balls you carry). Gwinn can't resist one. */
  fetch: 15,
  // Teddy's tricks, on the number keys (the same numbers as in Teddy's Little Big Adventure).
  /** 2: sit. */
  sit: 16,
  /** 3: spin, kicking up a little whirl of sand that bowls over ants and beetles. */
  spin: 17,
  /** 4: play dead. */
  playDead: 18,
  /** 5: roll over. */
  roll: 19,
} as const;

/** Counters ("repetition meters"). 3 is money; 20-29 are free for the game. */
export const CTR = {
  lives: 1,
  /** Sand you carry (shown as Money on the F2 status screen). */
  sand: 3,
  /** 1 + uses left in your bucket: walls you can still pack (pickup gives plenty). */
  bucket: 20,
  /** 1 + digs left in your shovel. */
  shovel: 21,
  /** Tower flags planted in Anthill Keep (its gate takes 4). */
  flags: 22,
  /** Golden shells (the lagoon's sea gate takes 3). */
  shells: 23,
  /** Acorn keys for root doors underground. */
  acorns: 24,
  /** Tower flags planted in the Hosewater Moat (its own count, so Anthill Keep's leftovers don't open it). */
  flags2: 25,
  /** Teddy's toys found (squeaky bones and flying discs), for the F2 status screen. */
  toys: 26,
} as const;

/** Sound effects in the .SND set (0-8 are played by Game-Maker for counter changes). */
export const SND = {
  help: 0,
  kill: 1,
  addSand: 2,
  useSand: 3,
  addLife: 4,
  addScore: 5,
  subScore: 6,
  addOther: 7,
  useOther: 8,
  fling: 9,
  splash: 10,
  hurt: 11,
  die: 12,
  pickup: 13,
  noCarrier: 14,
  bark: 15,
  squeak: 16,
  trick: 17,
  whirl: 18,
  none: 30,
} as const;

/** Monster numbers in sandcast.mon. */
export const MON = {
  clod: 0,
  splash: 1,
  puff: 2,
  ant: 3,
  antRow: 4,
  beetleH: 5,
  beetleV: 6,
  beetleLoop: 7,
  beetleFlip: 8,
  crabH: 9,
  crabV: 10,
  crabFlip: 11,
  /** Slobbery tennis balls Gwinn drops in her sleep; they roll after you. */
  slobber: 12,
  /** Rope toys flung out of Gwinn's toy box. */
  rope: 13,
  pawL: 14,
  pawLAngry: 15,
  pawLRetreat: 16,
  pawR: 17,
  pawRAngry: 18,
  pawRRetreat: 19,
  tail: 20,
  droplet: 21,
  gremlin: 22,
  beetleChase: 23,
  crabBox: 24,
  antRowV: 25,
  beetleBig: 26,
  /** Teddy's tossed tennis ball. */
  ball: 27,
  /** The sand whirl from Teddy's spin. */
  whirl: 28,
  /** Gwinn on the loose, galumphing about. */
  gwinRoam: 29,
  /** Gwinn flopped across a doorway, fast asleep. */
  gwinNap: 30,
  /** Gwinn with a ball in her mouth, too pleased to bother anyone (for a while). */
  gwinHappy: 31,
  none: 64,
} as const;

/** Background block attributes by name; next/touch refer to other blocks by name. */
export interface BlockDef {
  solid?: number;
  score?: number;
  hp?: number;
  next?: string;
  ntime?: number;
  touch?: string;
  grav?: number;
  obj?: boolean;
  effect?: number;
  eamt?: number;
  birthMon?: number;
  birthTime?: number;
}

/** Collects named 20x20 blocks in order, then resolves names into a block set. */
export class BlockSet {
  readonly names: string[] = [];
  private pics: Pixels[] = [];
  private defs: BlockDef[] = [];
  constructor(
    readonly count: number,
    readonly transparent: boolean,
  ) {}

  add(name: string, px: Pixels, def: BlockDef = {}): number {
    if (this.names.includes(name)) throw new Error(`Block ${name} twice`);
    if (this.names.length >= this.count) throw new Error(`Too many blocks (${name})`);
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
      b.grav = d.grav ?? 0;
      b.obj = d.obj ? 1 : 0;
      b.effect = d.effect ?? 0;
      b.eamt = d.eamt ?? 0;
      b.birthMon = d.birthMon ?? MON.none;
      b.birthTime = d.birthTime ?? 0;
      return b;
    });
  }
}
