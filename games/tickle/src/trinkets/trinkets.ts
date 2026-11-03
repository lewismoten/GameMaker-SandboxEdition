// CERTIFIED RAT TICKLER: its 3D-print trinkets, the designs (the shapes are the shared kinds and figure solids of web/packages/tools/src/mesh).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { chirpTag } from './chirp';
import { tickleMedal } from './medal';
import { labRat } from './rat';

export interface TickleTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: TickleTrinket[] = [
  {
    id: 'lab-rat',
    title: 'The tickled rat',
    blurb: 'A white lab rat on its belly, pink ears up and tail curled, in the middle of a good laugh. No rats were harmed.',
    height: 10,
    maxWidth: 58,
    cell: 0.55,
    input: labRat,
  },
  {
    id: 'tickler-medal',
    title: 'Certified Rat Tickler medal',
    blurb: 'Doc Leo, PhD (Comedic Science), has the certificate. This is the feather that earned it.',
    height: 4,
    maxWidth: 40,
    cell: 0.5,
    input: tickleMedal,
  },
  {
    id: 'chirp-tag',
    title: '50 kHz key tag',
    blurb: 'The pitch of a rat laughing, too high for people to hear. A ring tab for the keys.',
    height: 4,
    maxWidth: 56,
    cell: 0.5,
    input: chirpTag,
  },
];

export const makeTrinket = (def: TickleTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
