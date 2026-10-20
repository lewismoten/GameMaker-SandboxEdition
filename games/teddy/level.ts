// What every level is made of: its blocks, monsters, map, and the place it starts and
// ends. Each level file fills one of these in.
import type { TimeOfDay } from './pal';
import { BlockSet, GRAV, SOLID, type BlockDef } from './blockset';
import { Bestiary } from './mons';
import { commonMonsters } from './common';
import { LevelMap } from './levelmap';
import { Pixels } from '../kit/pixels';
import { CTR } from './ids';
import { klownCar, pockets, propOn, wantBubble } from './klown';

export interface Level {
  /** File name stem (8.3). */
  file: string;
  title: string;
  time: TimeOfDay;
  bs: BlockSet;
  beasts: Bestiary;
  map: LevelMap;
  /** Where Teddy starts (bottom block). */
  start: { x: number; y: number };
  /** The link cell that leaves the level. */
  exit: { x: number; y: number };
  /** For the level card: the top-left block [x, y] of a 15x5 view. */
  view: [number, number];
  /** Teddy drawn into the card: block [x, y] and his pose. */
  pose?: [number, number, string];
}

/** A level's block set: non-solid blocks fall (gravity down) unless they say otherwise. */
export class Tiles extends BlockSet {
  constructor() {
    super(150, false);
  }

  /** Scenery Teddy walks in front of (falls through). */
  air(name: string, px: Pixels, def: BlockDef = {}): number {
    return this.add(name, px, { grav: GRAV.down, ...def });
  }

  /** Solid on every side. */
  wall(name: string, px: Pixels, def: BlockDef = {}): number {
    return this.add(name, px, { solid: SOLID, ...def });
  }

  /** Solid on top only: stand on it, hop up through it. */
  ledge(name: string, px: Pixels, def: BlockDef = {}): number {
    return this.add(name, px, { solid: 1, grav: GRAV.down, ...def });
  }

  /** A sprite (clear background) drawn over another block of this set. */
  on(name: string, px: Pixels, base: string, kind: 'air' | 'wall' | 'ledge' = 'air', def: BlockDef = {}): number {
    const p = new Pixels(20, 20);
    p.px.set(this.pic(base).px);
    p.blit(px, 0, 0, 255);
    return this[kind](name, p, def);
  }

  /** A piece of Doc Leo's costume to fetch (F), lying over `base` (already in the set). */
  prop(name: string, prop: string, base: string): number {
    return this.add(name, propOn(this.pic(base), prop), { obj: true, effect: CTR.props, eamt: 1, score: 100, touch: base, grav: GRAV.down });
  }

  /**
   * The Klown Car and Pockets, over background blocks given per cell. The car door only
   * opens for one costume piece (the props counter); the open door is the way out.
   */
  klownCar(base: (bx: number, by: number) => Pixels, want: string, bubbleBase: Pixels, pocketsBase: (by: number) => Pixels): void {
    const shut = klownCar(base, false);
    const open = klownCar(base, true);
    this.ledge('carRoofL', shut[0][0]);
    this.ledge('carRoofR', shut[0][1]);
    this.air('carOpen', open[1][0]);
    this.wall('carDoor', shut[1][0], { effect: CTR.props, eamt: -1, touch: 'carOpen', score: 250 });
    this.wall('carBack', shut[1][1]);
    const [head, body] = pockets(pocketsBase);
    this.air('pocketsHead', head);
    this.air('pocketsBody', body);
    this.air('pocketsWant', wantBubble(bubbleBase, want));
  }
}

export function newBestiary(): Bestiary {
  const b = new Bestiary();
  commonMonsters(b);
  return b;
}

export { LevelMap, SOLID, GRAV };
