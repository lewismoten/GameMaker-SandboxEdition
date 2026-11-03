// FINAL CURTAIN: its 3D-print trinkets, the designs (the shapes are in glass.ts and dagger.ts; the colors are the game's own
// grays, golds and blacks).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { trickDagger } from './dagger';
import { adaGlass } from './glass';

export interface SleuthTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: SleuthTrinket[] = [
  {
    id: 'magnifying-glass',
    title: 'Inspector Penn’s magnifying glass',
    blurb: 'The prop magnifying glass Inspector Ada Penn searches the empty Paragon with: a brass rim, a black handle and a ring hole for the keys.',
    height: 6,
    maxWidth: 76,
    cell: 0.5,
    input: adaGlass,
  },
  {
    id: 'trick-dagger',
    title: 'The trick dagger',
    blurb: 'The stage dagger that wasn’t: a bright, blunt blade with a gold guard and exhibit tag 1. Perfectly safe, which is the whole problem.',
    height: 6,
    maxWidth: 80,
    cell: 0.5,
    input: trickDagger,
  },
];

export const makeTrinket = (def: SleuthTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
