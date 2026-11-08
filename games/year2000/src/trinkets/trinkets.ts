// IN THE YEAR 2000!: its 3D-print trinkets, the designs (the shapes are the shared kinds and figure solids of web/packages/tools/src/mesh).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { wrongNumberDie } from './die';
import { sparkyDog } from './sparky';

export interface Year2000Trinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: Year2000Trinket[] = [
  {
    id: 'sparky',
    title: 'Sparky 3000',
    blurb: "Dex's chrome robot dog, antenna wagging, with the cover of the science report still in his mouth.",
    height: 42,
    maxWidth: 60,
    cell: 0.6,
    input: sparkyDog,
  },
  {
    id: 'wrong-number-die',
    title: 'The wrong-number die',
    blurb:
      'Roll it to choose which booth to dial. Nothing about it is right: a 7, a blank 0, a 4 whose last pip is out of order, and opposite faces that never add up to 7.',
    height: 20,
    maxWidth: 20,
    cell: 0.5,
    input: wrongNumberDie,
  },
];

export const makeTrinket = (def: Year2000Trinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
