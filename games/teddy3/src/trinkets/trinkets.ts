// TEDDY'S LITTLE BIGGEST ADVENTURE: its 3D-print trinkets, the designs (the shape is in cake.ts; the colors are the party
// screen's own: cream cake, pink frosting, red cherries, yellow flames).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { birthdayCake } from './cake';

export interface Teddy3Trinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: Teddy3Trinket[] = [
  {
    id: 'birthday-cake',
    title: 'The biggest cake',
    blurb: 'Three tiers, pink frosting, cherries and the bakery’s candles: the BIGGEST cake in the Tri-County area, for a corgi who didn’t know.',
    height: 34,
    maxWidth: 40,
    cell: 0.5,
    input: birthdayCake,
  },
];

export const makeTrinket = (def: Teddy3Trinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
