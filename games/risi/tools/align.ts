// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the couches of
// the senators, doors under their tops, the columns, the bust on its pedestal, Lucius at his
// amphora, the scrolls, the tents, the palisade, the archers' tower, the gate, THE CHEZ, the
// tavern, the diva's basin, and that their art joins up across the block edges. Run by
// tools/check.ts.
import { alignGame, namesOf, pair, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { LEVELS } from '../src/levels/levels';

const RULES: PartRule[] = [
  ...pair('couch', /^senL[01]$/, 'senR', 1, 0),
  ...pair('door', 'doorTop', /^door(Open)?$/, 0, 1),
  ...pair('way in', 'entryTop', 'entry', 0, 1),
  ...pair('bust', 'bust', 'pedestal', 0, 1),
  ...pair('Lucius', /^lucius[01]$/, 'amphora', 1, 0),
  { part: 'colTop', need: [[0, 1, 'col']] },
  { part: 'colBase', need: [[0, -1, 'col']] },
  { part: 'bcolTop', need: [[0, 1, 'bcol']] },
  { part: 'bcolBase', need: [[0, -1, 'bcol']] },
  { part: 'scrollTop', what: 'scrolls', need: [[0, 1, 'scrolls']] },
  ...pair('tent', 'tentL', 'tentR', 1, 0),
  { part: 'stakeTop', what: 'palisade', need: [[0, 1, 'stakes']] },
  ...pair('tower', 'towerTop', 'tower', 0, 1),
  ...pair('gate', 'gateTop', 'gateWay', 0, 1),
  ...pair('THE CHEZ', 'chezL', 'chezR', 1, 0),
  ...pair('tavern', 'tavernSign', /^tavern(Open)?$/, 0, 1),
  ...pair('basin', /^basinL[01]$/, /^basin(R|Done)$/, 1, 0),
];

/** Joins drawn as edges on purpose (looked at). */
const SEAM_OK = [
  'colTop/col',
  'bcolTop/bcol',
  'col/colBase',
  'bcol/bcolBase',
  'bust/pedestal',
  'tavernSign/tavern',
  'towerTop/tower',
  'stakeTop/stakes',
  'gateTop/gateWay',
  'basinL0|basinR',
  'scrollTop/scrolls',
  'doorTop/door',
  'entryTop/entry',
  'lucius0|amphora',
  'tentL|tentR',
  'senL0|senR',
  'senL1|senR',
];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(buildBlocks(l.set, buildPalette(l.light)).index)]));
  return alignGame('risi', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
