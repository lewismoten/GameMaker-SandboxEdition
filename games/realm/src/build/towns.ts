// The towns: TOWN.MAP (Nowish, Laterburg) and later PORT.MAP (Someday Harbor, Eventually
// Falls), their scenes, and the doors between them and the world.
import { townBook } from '../blocks/townSet';
import { MonBook } from '../characters/monbook';
import { peopleSheet } from './people';
import { townMap } from '../levels/townMap';
import { portMap } from '../levels/portMap';
import { portBook } from '../blocks/portSet';
import { streetBridges } from '../levels/plan';
import { buildArea } from './area';
import { cellHash } from '../levels/ground';
import type { LinkSpec, SceneSpec } from '../game';
import type { Pt } from '../levels/plan';
import type { AreaFile } from './world';

const grassBase = (x: number, y: number) => {
  const h = cellHash(x, y, 3);
  return h < 0.25 ? 'grass1' : h < 0.5 ? 'grass2' : h < 0.7 ? 'grass3' : 'grass';
};

/** Where Pip comes back out onto the world from each place. */
export const WORLD_ARRIVE: Record<string, Pt> = {
  nowish: [22, 78],
  laterburg: [31, 47],
  harbor: [16, 48],
  falls: [80, 58],
  barrows: [40, 26],
  mines: [78, 40],
  keep: [76, 78],
  post: [71, 51],
};
/** Coming back to Someday Harbor: out of the Vaults onto the pier, out of THE CHEZ by the garage. */
export const HARBOR_ARRIVE: Record<string, Pt> = { vaults: [16, 46], flats: [31, 13] };

export function buildTowns(spot: Record<string, Pt>, harborDoors: { flats: Pt; vaults: Pt }): { files: AreaFile[]; scenes: SceneSpec[]; worldLinks: LinkSpec[]; start: Pt } {
  const mb = peopleSheet();
  const files: AreaFile[] = [];
  const scenes: SceneSpec[] = [];
  const worldLinks: LinkSpec[] = [];

  const tm = new MonBook(mb);
  const t = townMap(tm);
  const town = buildArea({
    name: 'town',
    plan: t.plan,
    book: townBook(),
    mons: tm,
    layers: ['wall', 'hedge', 'street'],
    base: grassBase,
    scenes: [
      {
        id: 'nowish',
        desc: 'Nowish',
        owns: ([x]) => x < 50,
        extra: [21, 22, 23].map((x) => ({ from: [x, 39] as Pt, to: 'world', at: WORLD_ARRIVE.nowish })),
      },
      {
        id: 'laterburg',
        desc: 'Laterburg',
        owns: ([x]) => x >= 50,
        extra: [73, 74, 75, 76].map((x) => ({ from: [x, 67] as Pt, to: 'world', at: WORLD_ARRIVE.laterburg })),
      },
    ],
  });
  files.push(...town.files);
  scenes.push(...town.scenes);
  const pm = new MonBook(mb);
  const pp = portMap(pm);
  const port = buildArea({
    name: 'port',
    plan: pp.plan,
    book: portBook(streetBridges(pp.plan.cm)),
    mons: pm,
    layers: ['water', 'hedge', 'street'],
    base: grassBase,
    scenes: [
      {
        id: 'harbor',
        desc: 'Someday Harbor',
        owns: ([x]) => x < 50,
        extra: [
          ...[23, 24, 25].map((x) => ({ from: [x, 1] as Pt, to: 'world', at: WORLD_ARRIVE.harbor })),
          { from: pp.plan.spot.garage, to: 'flats', at: harborDoors.flats },
          { from: pp.plan.spot.vaults, to: 'vaults', at: harborDoors.vaults },
        ],
      },
      {
        id: 'falls',
        desc: 'Eventually Falls',
        owns: ([x]) => x >= 50,
        extra: [70, 71, 72].map((x) => ({ from: [x, 64] as Pt, to: 'world', at: WORLD_ARRIVE.falls })),
      },
    ],
  });
  files.push(...port.files);
  scenes.push(...port.scenes);
  // the world's town icons lead in
  for (const x of [21, 22]) worldLinks.push({ from: [x, 81], to: 'nowish', at: t.nowish.arrive });
  worldLinks.push({ from: spot.laterburg, to: 'laterburg', at: t.laterburg.arrive });
  for (const x of [13, 14, 15]) worldLinks.push({ from: [x, 47], to: 'harbor', at: pp.harbor.arrive });
  for (const x of [79, 80]) worldLinks.push({ from: [x, 61], to: 'falls', at: pp.falls.arrive });
  return { files, scenes, worldLinks, start: t.plan.spot.home };
}
