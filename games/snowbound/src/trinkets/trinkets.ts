// SNOWBOUND: THE $89 SHOVEL: its 3D-print trinkets, the designs (the shapes are the shared kinds and figure solids of
// web/packages/tools/src/mesh; the colors are the game's own).
import { meshFieldTrinket, type FieldTrinket, type FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { TrinketToolDef } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketTool';
import { scoopCoin } from './coin';
import { jamieSled } from './sled';
import { snowShovel } from './shovel';

export interface SnowboundTrinket extends TrinketToolDef {
  input: () => FieldTrinketInput;
  /** Mesh cell in mm. */
  cell: number;
}

export const TRINKETS: SnowboundTrinket[] = [
  {
    id: 'shovel',
    title: 'The $89 shovel',
    blurb: 'A dollar a scoop, and every scoop is on the blade. The D grip takes a key ring.',
    height: 5,
    maxWidth: 98,
    cell: 0.6,
    input: snowShovel,
  },
  {
    id: 'sled',
    title: 'The Jamie Street sled',
    blurb: 'Red deck, gold slats, steel runners curled up at the front and a coil of rope. Hold on.',
    height: 17,
    maxWidth: 75,
    cell: 0.6,
    input: jamieSled,
  },
  {
    id: 'scoop-coin',
    title: 'Snow-to-Software coin',
    blurb: 'Good for one scoop at Moten Snow-to-Software Operations. One dollar, every driveway.',
    height: 4,
    maxWidth: 40,
    cell: 0.5,
    input: scoopCoin,
  },
];

export const makeTrinket = (def: SnowboundTrinket): FieldTrinket => meshFieldTrinket(def.input(), def.cell);
