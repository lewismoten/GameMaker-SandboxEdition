// VIRUS BLASTER: builds every file of the game into games/blaster/disk/.
//   cd web && npx vite-node ../games/blaster/build.ts
// BLASTER_START=<leg file, e.g. s1c> starts a play-test build on that leg.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { serializeGame } from '../../web/src/formats/game';
import { Disk } from '../kit/disk';
import { buildPalette } from './src/art/pal';
import { buildShip, shipBlocks } from './ship';
import { DRIFT } from './src/ids';
import { buildSounds } from './sounds';
import { buildGame } from './src/game';
import { STAGES } from './stages';
import { buildLeg } from './stage';
import { buildScreens } from './screens';
import { demoRecording } from './src/demo';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cb = shipBlocks(buildPalette('board'));
disk.put('ship.cbl', serializeBlocks(cb.build(undefined, true)));
disk.put('ship.chr', serializeCharacter(buildShip(cb, DRIFT)));
disk.put('shipfree.chr', serializeCharacter(buildShip(cb, 0)));
const sounds = buildSounds();
disk.put('blaster.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

const stages = STAGES.map((make) => make());
for (const s of stages) {
  disk.put(`s${s.n}.pal`, serializePalette(s.pal.pal));
  for (const l of s.legs) {
    const b = buildLeg(l);
    disk.put(`${l.file}.map`, serializeMap(b.map));
    disk.put(`${l.kitFile}.bbl`, serializeBlocks(b.bbl));
    disk.put(`${l.kitFile}.mbl`, serializeBlocks(b.mbl));
    disk.put(`${l.kitFile}.mon`, serializeMonsters(b.mon));
    console.log(
      `${l.file} ${l.title}: ${l.kit.bs.names.length} blocks, ${l.kit.beasts.mb.names.length} monster blocks, ${l.kit.beasts.names.length} monsters, ${l.grid.placed} placed`,
    );
  }
}

for (const [name, bytes] of Object.entries(buildScreens(stages))) disk.put(name, bytes);
disk.put('demo.rec', await demoRecording(stages[0]));
disk.put('blaster.gam', serializeGame(buildGame(stages, process.env.BLASTER_START)));
disk.write();
