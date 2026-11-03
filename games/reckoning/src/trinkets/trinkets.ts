// THE GREAT DAIRY RECKONING OF 3:17 A.M.: its 3D-print trinkets, the designs (the shape is in cheesecake.ts; the colors are the
// game's own: a porcelain plate, a graham crust, cream cheese and a berry glaze).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { cheesecakeSlice } from './cheesecake';

export interface ReckoningTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: ReckoningTrinket[] = [
  {
    id: 'cheesecake',
    title: 'The slice of cheesecake',
    blurb:
      'A slice of New York cheesecake on its porcelain plate: graham crust, cream cheese, a berry glaze and one berry on top. It is 3:17 a.m. Think of the celery.',
    height: 20,
    maxWidth: 58,
    cell: 0.5,
    input: cheesecakeSlice,
  },
];

export const makeTrinket = (def: ReckoningTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
