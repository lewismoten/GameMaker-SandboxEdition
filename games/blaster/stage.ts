// What a stage is made of: a palette, its blocks and virus for the two scrolling legs, its
// boss arena (with its own block and monster sets), and the maps.
import type { Block } from '../../web/src/formats/blocks';
import type { GameMap } from '../../web/src/formats/map';
import type { Monster } from '../../web/src/formats/monster';
import { BlockSet } from './art';
import { addCommon } from './common';
import { ARENA_START, STRIP_START, type Grid } from './mapkit';
import { Bestiary } from './mons';
import type { Pal, Theme } from './pal';
import { addStageTiles, type StageArt, type TileOpts } from './tiles';

export interface Kit {
  bs: BlockSet;
  beasts: Bestiary;
}

export interface Leg {
  /** File name base (8.3): s1a, s1b, s1c... */
  file: string;
  /** File name base of its .pal/.bbl/.mon/.mbl (shared by the scrolling legs of a stage). */
  kitFile: string;
  title: string;
  kind: 'scroll' | 'boss';
  grid: Grid;
  kit: Kit;
  /** Card lines shown before the leg. */
  card: string[];
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
}

/** A fresh kit: floors and edges, then the stage's own blocks, then the shared ones. */
export function kit(art: StageArt, own: (bs: BlockSet) => void, virus: (b: Bestiary) => void, opts: TileOpts): Kit {
  const bs = new BlockSet(150, 'bbl');
  for (let v = 0; v < art.floors; v++) bs.add(`floor${v}`, art.floor(v));
  for (let v = 0; v < art.edges; v++) {
    bs.add(`edgeL${v}`, art.edge('L', v));
    bs.add(`edgeR${v}`, art.edge('R', v));
  }
  own(bs);
  addStageTiles(bs, art, opts);
  const beasts = new Bestiary();
  addCommon(beasts, art.pal);
  virus(beasts);
  return { bs, beasts };
}

export interface BuiltLeg {
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

export const startOf = (l: Leg) => (l.kind === 'boss' ? ARENA_START : STRIP_START);
