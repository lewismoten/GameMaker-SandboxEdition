// QUEST FOR THE ROUND TUIT — builds every file of the game into games/realm/disk/.
//   cd web && npx vite-node ../games/realm/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { serializeGame } from '../../web/src/formats/game';
import { Disk } from '../kit/disk';
import { buildSounds } from './src/sound/sounds';
import { buildWorld } from './src/build/world';
import { buildCast } from './src/build/cast';
import { assemble } from './src/game';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cast = buildCast();
disk.put('pip.cbl', serializeBlocks(cast.cb.blocks));
disk.put('pip.chr', serializeCharacter(cast.pip));
const sounds = buildSounds();
disk.put('realm.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

const world = buildWorld(cast);
for (const f of world.files) disk.put(f.name, f.bytes);

const { game } = assemble([world.scene], { start: { to: 'world', at: [22, 83] } });
disk.put('tuit.gam', serializeGame(game));
void [serializeMap, serializeMonsters];
disk.write();
