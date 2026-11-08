// WHERE'S THE REMOTE?!: its 3D-print trinkets, the designs (the shape is in remote.ts; the colors are a 1994 clicker's own).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { theRemote } from './remote';

export interface RemoteTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: RemoteTrinket[] = [
  {
    id: 'remote',
    title: 'The remote',
    blurb: 'Power, a number pad, volume and channel rockers, and a lanyard hole so it never goes missing again. There you are, you sneaky guy.',
    height: 10,
    maxWidth: 104,
    cell: 0.5,
    input: theRemote,
  },
];

export const makeTrinket = (def: RemoteTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
