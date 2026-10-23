// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): every picture
// cut into parts named <object>:<col>,<row> (castles, towers, houses, ships, the throne...)
// stands whole on the world, the town, the port, the flats and the dungeons, and its art joins
// up across the block edges. Run by tools/check.ts.
import { alignGame, gridParts, namesOf, sizesOf } from '../../kit/align';
import { buildWorld } from '../src/build/world';
import { peopleSheet } from '../src/build/people';
import { dungeonBook } from '../src/blocks/dungeonSet';
import { flatsBook } from '../src/blocks/flatsSet';
import { portBook } from '../src/blocks/portSet';
import { townBook } from '../src/blocks/townSet';
import { MonBook } from '../src/characters/monbook';
import { flatsPlan } from '../src/levels/flats';
import { streetBridges } from '../src/levels/plan';
import { portMap } from '../src/levels/portMap';

const PART = /^(.*):(\d+),(\d+)$/;

/** Joins drawn as edges on purpose (looked at): the falls beside their cliff, awnings' stripes,
 * roofs over walls, the lighthouse's lamp room. */
const SEAM_OK = [
  'laterburg:0,1|laterburg:1,1',
  'kennel:0,0/kennel:0,1',
  'kennel:1,0/kennel:1,1',
  'stallR:0,0|stallR:1,0',
  'stallG:0,0|stallG:1,0',
  'stallB:0,0|stallB:1,0',
  'falls:1,0|falls:2,0',
  'falls:1,1|falls:2,1',
  'falls:1,2|falls:2,2',
  'lighthouse:0,0/lighthouse:0,1',
  'tent:0,0|tent:1,0',
];

export function align(): number {
  const people = () => new MonBook(peopleSheet());
  // the flats' plan only needs a number for each monster it names (its book is the same either way)
  const any = () => {
    const ids = new Map<string, number>();
    const n = (k: string) => ids.get(k) ?? (ids.set(k, 50 + ids.size), ids.get(k)!);
    return { n, npc: n } as unknown as MonBook;
  };
  const books: Record<string, Map<string, number>> = {
    world: buildWorld(undefined as never).book.index,
    town: townBook().index,
    port: portBook(streetBridges(portMap(people()).plan.cm)).index,
    flats: flatsBook(streetBridges(flatsPlan(any()).plan.cm, 'road')).index,
    barrows: dungeonBook('barrows').index,
    vaults: dungeonBook('vaults').index,
    mines: dungeonBook('mines').index,
    keep: dungeonBook('keep').index,
  };
  const names = new Map(Object.entries(books).map(([k, v]) => [`${k}.map`, namesOf(v)]));
  // (each area's own sizes: the world's falls are not the flats')
  const rules = (m: string) => [gridParts(PART, sizesOf(names.get(m)!.filter(Boolean), PART), (o, c, r) => `${o}:${c},${r}`)];
  return alignGame('realm', (m) => names.get(m), rules, { seamOk: SEAM_OK });
}
