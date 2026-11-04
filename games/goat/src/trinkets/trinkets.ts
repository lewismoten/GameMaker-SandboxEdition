// THIRD GOAT FROM THE LEFT: its 3D-print trinket design, a horned and bearded goat standing at the manger.
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { thirdGoatAtManger } from './thirdGoatAtManger';

export interface GoatTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: GoatTrinket[] = [
  {
    id: 'third-goat-at-manger',
    title: 'The third goat at the manger',
    blurb: 'The gray-and-white goat nobody painted, with broad horns and beard, standing with the others at a low hay-lined manger.',
    height: 47,
    maxWidth: 68,
    cell: 0.5,
    input: thirdGoatAtManger,
  },
];

export const makeTrinket = (def: GoatTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
