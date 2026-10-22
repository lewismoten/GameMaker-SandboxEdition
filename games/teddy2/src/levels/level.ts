// What every level is made of: its blocks, monsters, map, and the place it starts and
// ends. Each level file fills one of these in.
import type { TimeOfDay } from '../art/pal';
import { BlockSet, GRAV, SOLID, type BlockDef } from '../blocks/blockset';
import { Bestiary } from '../characters/mons';
import { commonMonsters } from '../characters/sharedMonsters';
import { LevelMap } from './levelmap';
import type { GameMap } from '../../../../web/src/formats/map';
import { Pixels } from '../../../kit/pixels';
import { CTR, KEEPSAKE } from '../ids';
import { eggBlock } from '../sprites/egg';
import { P } from '../art/pal';
import { klownCar, propOn, wantBubble } from '../sprites/klown';
import { docLeo, halves } from '../sprites/people';

export interface Level {
  /** File name stem (8.3). */
  file: string;
  /** Who plays it: Teddy, or Gwinn in the "Meanwhile..." levels (gwinn.chr). */
  hero: 'teddy' | 'gwinn';
  /** The picture or cartoon shown on the way out (default: THE CHEZ driving on, for Teddy). */
  outro?: string;
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
  /**
   * A room kept on the same map: a link at `door` takes Teddy to `room` (a scene of its
   * own with no card), and the room's way out at `out` brings him back to `back` (in a
   * copy of the level's scene that shows `card` as it starts, plays on `after` (written as
   * `map`) and has no way back in).
   */
  nook?: { map: string; after: GameMap; door: Spot; room: Spot; out: Spot; back: Spot; title: string; card: string };
  /** Where the felt egg hides, when this level has it (its page shows on the way back). */
  egg?: Spot;
}

type Spot = { x: number; y: number };

/** A level's block set: non-solid blocks fall (gravity down) unless they say otherwise. */
export class Tiles extends BlockSet {
  constructor() {
    super(150, false);
    this.keepsake(new Pixels(20, 20, P.c('paint', 3)));
  }

  /** Block 149 in every set: the felt egg, over `base`; `after` is what is left when it is fetched. */
  keepsake(base: Pixels, after?: string): number {
    return this.pin(KEEPSAKE, 'keepsake', eggBlock(base), { obj: true, score: 500, touch: after, grav: GRAV.down });
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

  /** Something Gwinn dropped, to fetch (F), lying over `base` (already in the set). */
  clue(name: string, clue: string, base: string): number {
    return this.add(name, propOn(this.pic(base), clue), { obj: true, effect: CTR.clues, eamt: 1, score: 100, touch: base, grav: GRAV.down });
  }

  /**
   * THE CHEZ and Doc Leo beside it, over background blocks given per cell. The car door
   * only opens for the thing Gwinn dropped on this stop (the clues counter); the open door
   * is the way out. Doc Leo's thought bubble shows what he is waiting for.
   */
  chez(base: (bx: number, by: number) => Pixels, want: string, bubbleBase: Pixels, leoBase: (by: number) => Pixels): void {
    const shut = klownCar(base, false);
    const open = klownCar(base, true);
    this.ledge('carRoofL', shut[0][0]);
    this.ledge('carRoofR', shut[0][1]);
    this.air('carOpen', open[1][0]);
    this.wall('carDoor', shut[1][0], { effect: CTR.clues, eamt: -1, touch: 'carOpen', score: 250 });
    this.wall('carBack', shut[1][1]);
    const [head, body] = halves(docLeo(undefined, true), leoBase(0), leoBase(1));
    this.air('leoHead', head);
    this.air('leoBody', body);
    this.air('leoWant', wantBubble(bubbleBase, want));
  }
}

export function newBestiary(): Bestiary {
  const b = new Bestiary();
  commonMonsters(b);
  return b;
}

export { LevelMap, SOLID, GRAV };
