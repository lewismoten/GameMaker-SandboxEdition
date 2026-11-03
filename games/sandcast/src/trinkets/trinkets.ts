// SANDCASTLE KNIGHT: its 3D-print trinkets, the designs: two little pails that really mold sand (the shapes are in
// tower.ts and wall.ts; the colors are the game's own ramps).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { towerPail } from './tower';
import { wallPail } from './wall';

export interface SandcastTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: SandcastTrinket[] = [
  {
    id: 'tower-pail',
    title: 'Tower mold pail',
    blurb: 'A real sand mold: pack damp sand in, flip it over and lift for a little crenellated tower. Print it open side up.',
    height: 28,
    maxWidth: 42,
    cell: 0.55,
    input: towerPail,
  },
  {
    id: 'wall-pail',
    title: 'Battlement mold pail',
    blurb: 'Damp sand in, flip, lift: a wall section with four battlements to join Teddy’s towers. Print it open side up.',
    height: 26,
    maxWidth: 46,
    cell: 0.55,
    input: wallPail,
  },
];

export const makeTrinket = (def: SandcastTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
