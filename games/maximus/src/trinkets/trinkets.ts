// MAXIMUS: THE HUNDRED WORLDS: its 3D-print trinkets, the designs (the shapes are the shared kinds of web/packages/tools/src/mesh).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { courierPin } from './pin';
import { sapphireShard } from './shard';
import { worldsCoin } from './world';

export interface MaximusTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: MaximusTrinket[] = [
  {
    id: 'sapphire-shard',
    title: 'Sapphire star-shard',
    blurb: 'One of the ten shards of the dead Core, cut as an eight-sided gem. It opens a gate in the Deep Black.',
    height: 22,
    maxWidth: 31,
    cell: 0.55,
    input: sapphireShard,
  },
  {
    id: 'worlds-coin',
    title: 'Hundred Worlds coin',
    blurb: 'A courier fare for any of the Hundred Worlds, a jade planet and its pearl ring in the middle.',
    height: 4,
    maxWidth: 40,
    cell: 0.5,
    input: worldsCoin,
  },
  {
    id: 'courier-pin',
    title: 'Courier Max pin',
    blurb: 'A star over MAX on a teal hexagon. Couriers deliver. A pocket in the back takes a pin.',
    height: 4,
    maxWidth: 42,
    cell: 0.5,
    input: courierPin,
  },
];

export const makeTrinket = (def: MaximusTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
