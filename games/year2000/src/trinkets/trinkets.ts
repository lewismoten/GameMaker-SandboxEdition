// IN THE YEAR 2000!: its 3D-print trinkets, the designs (the shapes are the shared kinds and figure solids of web/packages/tools/src/mesh).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { wrongNumberDie } from './die';
import { sparkyDog } from './sparky';
import { quarterToken } from './token';
import { pocketPhone } from './pocketPhone';

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
    height: 35,
    maxWidth: 60,
    cell: 0.6,
    input: sparkyDog,
  },
  {
    id: 'quarter',
    title: 'Teleport-A-Phone quarter',
    blurb: 'Only 25 cents a call. A plastic one, so it will not work in a booth.',
    height: 4,
    maxWidth: 40,
    cell: 0.5,
    input: quarterToken,
  },
  {
    id: 'pocket-phone',
    title: 'Teleport-A-Phone',
    blurb: 'A pocket phone from the future: dial 2000, drop in a quarter and hope it sends you somewhere useful.',
    height: 14,
    maxWidth: 80,
    cell: 0.5,
    input: pocketPhone,
  },
  {
    id: 'wrong-number-die',
    title: 'The wrong-number die',
    blurb: 'Roll it to choose which booth to dial. Most numbers in the exchange are wrong.',
    height: 20,
    maxWidth: 20,
    cell: 0.5,
    input: wrongNumberDie,
  },
];

export const makeTrinket = (def: Year2000Trinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
