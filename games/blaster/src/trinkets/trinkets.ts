// VIRUS BLASTER: its 3D-print trinkets, the designs (the shapes are the shared kinds of
// web/packages/tools/src/mesh/trinketKinds.ts; the colors are the game's own ramps).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { decoderCoin } from './decoder';
import { floppyTag } from './floppy';
import { blasterShip } from './ship';

export interface BlasterTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: BlasterTrinket[] = [
  {
    id: 'decoder-coin',
    title: 'VACCINE decoder coin',
    blurb: 'Sixteen hex digits ring a 486 chip. Turn it to read an address before GLITCH gets there.',
    height: 4,
    maxWidth: 40,
    cell: 0.5,
    input: decoderCoin,
  },
  {
    id: 'floppy-tag',
    title: 'VACCINE.EXE key tag',
    blurb: 'The floppy your uncle gave you, marked "Only in an emergency". A ring tab for the keys.',
    height: 4,
    maxWidth: 52,
    cell: 0.5,
    input: floppyTag,
  },
  {
    id: 'blaster-ship',
    title: 'The BLASTER',
    blurb: 'The nano-fighter off the VACCINE floppy: steel delta, twin guns, cyan canopy and a flame out the back.',
    height: 13,
    maxWidth: 56,
    cell: 0.7,
    input: blasterShip,
  },
];

export const makeTrinket = (def: BlasterTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
