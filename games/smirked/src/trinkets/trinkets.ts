// I SCREAMED, SHE SMIRKED: its 3D-print trinkets, the designs (the shapes are in sword.ts and badge.ts; the colors are the
// game's own: the foam sword's gray, yellow and red, and Lily's unicorn-hoodie pink).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { braveryBadge } from './badge';
import { foamSword } from './sword';

export interface SmirkedTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: SmirkedTrinket[] = [
  {
    id: 'foam-sword',
    title: 'The $12 foam sword',
    blurb:
      'Gray blade, yellow guard, red grip, and the price still on it. Only a foam sword knocks a cardboard knight’s helmet off. A ring hole in the pommel.',
    height: 6,
    maxWidth: 100,
    cell: 0.55,
    input: foamSword,
  },
  {
    id: 'bravery-badge',
    title: 'The Bravery Badge',
    blurb: 'Lily gets the Bravery Badge. A pink rosette with a gold star, and room on the back for a pin.',
    height: 4,
    maxWidth: 42,
    cell: 0.4,
    input: braveryBadge,
  },
];

export const makeTrinket = (def: SmirkedTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
