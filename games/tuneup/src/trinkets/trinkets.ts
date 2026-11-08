// TUNE-UP: its 3D-print trinkets, the designs (the shapes are the shared kinds and figure solids of web/packages/tools/src/mesh).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { rubberChicken } from './chicken';
import { clubPin } from './club';
import { chezPlate } from './plate';

export interface TuneUpTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: TuneUpTrinket[] = [
  {
    id: 'rubber-chicken',
    title: 'Sir Reginald III',
    blurb: 'The rubber chicken who does the fiddly bits, limp on his belly with his legs trailing and his beak open mid-squawk.',
    height: 25,
    maxWidth: 70,
    cell: 0.6,
    input: rubberChicken,
  },
  {
    id: 'chez-plate',
    title: 'THE CHEZ plate',
    blurb: 'A license plate for the keys: THE CHEZ in tomato red, ready to lead the parade.',
    height: 4,
    maxWidth: 58,
    cell: 0.5,
    input: chezPlate,
  },
  {
    id: 'club-pin',
    title: 'Clown Club pin',
    blurb: 'The Clown Club badge, the O of CLOWN a red rubber nose. A pocket in the back takes a pin.',
    height: 4,
    maxWidth: 40,
    cell: 0.5,
    input: clubPin,
  },
];

export const makeTrinket = (def: TuneUpTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
