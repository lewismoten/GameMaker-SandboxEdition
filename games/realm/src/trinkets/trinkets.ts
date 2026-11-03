// QUEST FOR THE ROUND TUIT: its 3D-print trinkets, the designs (the shapes are the shared kinds of
// web/packages/tools/src/mesh/trinketKinds.ts, the coins and tags of its own world).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { crownCoin } from './coin';
import { keyTag } from './tag';
import { tuit } from './tuit';

export interface RealmTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: RealmTrinket[] = [
  {
    id: 'round-tuit',
    title: 'The Royal Round Tuit',
    blurb: 'An old oak disc ringed in brass, broken in three by Lord Deadline. Press the three pieces back together, one at a time.',
    height: 5,
    maxWidth: 40,
    pieces: 3,
    cell: 0.26,
    input: tuit,
  },
  {
    id: 'crown-coin',
    title: 'Coin of the realm',
    blurb: "King Dillydally IX's crown over his numeral. Good anywhere in Procrastia, eventually.",
    height: 4,
    maxWidth: 38,
    cell: 0.5,
    input: crownCoin,
  },
  {
    id: 'key-tag',
    title: "Pip's key tag",
    blurb: 'Do it today. A key-chain tag with a hole for the ring.',
    height: 4,
    maxWidth: 52,
    cell: 0.5,
    input: keyTag,
  },
];

export const makeTrinket = (def: RealmTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
