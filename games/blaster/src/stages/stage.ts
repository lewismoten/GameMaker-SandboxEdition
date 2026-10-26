// What a stage is made of: a palette, its blocks and virus for the two scrolling legs, its
// boss arena (with its own block and monster sets), and the maps.
import type { Block } from '../../../../web/src/formats/blocks';
import type { GameMap } from '../../../../web/src/formats/map';
import type { Monster } from '../../../../web/src/formats/monster';
import { BlockSet } from '../art/draw';
import { addCommon } from '../characters/sharedMonsters';
import { ARENA_START, STRIP_START, type Grid } from './mapkit';
import { Bestiary } from '../characters/mons';
import type { Pal, Theme } from '../art/pal';
import type { DiagTrack } from './diagTrack';
import { addStageTiles, pad, type StageArt, type TileOpts } from '../blocks/tiles';
import { EGG_BLOCK, eggPic } from '../blocks/egg';

interface Kit {
  bs: BlockSet;
  beasts: Bestiary;
}

export interface Leg {
  /** File name base (8.3): s1a, s1b, s1c... */
  file: string;
  /** File name base of its .pal/.bbl/.mon/.mbl (shared by the scrolling legs of a stage). */
  kitFile: string;
  title: string;
  /** A strip scrolling up, a fixed boss arena, or the ribbon cable's slanted, wrapping track. */
  kind: 'scroll' | 'boss' | 'diag';
  grid: Grid;
  kit: Kit;
  /** Card lines shown before the leg. */
  card: string[];
  /** Its own palette (<file>.pal), when not the stage's. */
  pal?: Pal;
  /** Where the ship starts, when not on a strip's launch pad or in an arena. */
  start?: { x: number; y: number };
  /** The top-left map cell of the card's 16x5 look at the leg, when not the strip's. */
  cardView?: { x: number; y: number };
  /** A diagonal leg's track, and where Right hops a lane early: [lap, first column, columns]. */
  diag?: { track: DiagTrack; shortcuts: [number, number, number][] };
}

/**
 * A room off the beaten path: a link cell in one leg (not one of its gate's links, so the
 * bot never takes it) leads in; its way out shows a page, then plays the next leg again.
 */
interface SideRoom {
  /** The leg with the way in, and the map cell of the way in. */
  from: string;
  cell: { x: number; y: number };
  /** The room itself: one fixed screen (kind 'boss', but no boss). */
  room: Leg;
  /** The leg the way out leads to. */
  then: string;
  /** File base of the page shown on the way out (<outro>.lst). */
  outro: string;
}

export interface Stage {
  n: number;
  id: string;
  title: string;
  theme: Theme;
  pal: Pal;
  art: StageArt;
  legs: Leg[];
  song: string;
  bossSong: string;
  side?: SideRoom;
}

/** A fresh kit: floors and edges, then the stage's own blocks, then the shared ones. */
export function kit(art: StageArt, own: (bs: BlockSet) => void, virus: (b: Bestiary) => void, opts: TileOpts, late?: (bs: BlockSet) => void): Kit {
  const bs = new BlockSet(150, 'bbl');
  for (let v = 0; v < art.floors; v++) bs.add(`floor${v}`, art.floor(v));
  for (let v = 0; v < art.edges; v++) {
    bs.add(`edgeL${v}`, art.edge('L', v));
    bs.add(`edgeR${v}`, art.edge('R', v));
  }
  own(bs);
  addStageTiles(bs, art, opts);
  late?.(bs);
  // the same number in every set: the inventory keeps only block numbers
  bs.addAt(EGG_BLOCK, 'egg', eggPic(art.pal, pad(art)), { obj: 1, touch: 'pad' });
  const beasts = new Bestiary();
  addCommon(beasts, art.pal);
  virus(beasts);
  return { bs, beasts };
}

interface BuiltLeg {
  map: GameMap;
  bbl: Block[];
  mbl: Block[];
  mon: Monster[];
}

export function buildLeg(l: Leg): BuiltLeg {
  const names = l.kit.beasts;
  return {
    map: l.grid.done(),
    bbl: l.kit.bs.build((n) => names.id(n)),
    mbl: l.kit.beasts.mb.build(undefined, true),
    mon: l.kit.beasts.build(),
  };
}

export const startOf = (l: Leg) => l.start ?? (l.kind === 'boss' ? ARENA_START : STRIP_START);
