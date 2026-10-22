// QUEST FOR THE ROUND TUIT — builds every file of the game into games/realm/disk/.
//   cd web && npx vite-node ../games/realm/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { serializeGame } from '../../web/src/formats/game';
import { Disk } from '../kit/disk';
import { buildSounds } from './src/sound/sounds';
import { buildWorld } from './src/build/world';
import { buildCast } from './src/build/cast';
import { buildTowns } from './src/build/towns';
import { passFiles } from './src/levels/talk';
import { assemble, type SceneSpec } from './src/game';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cast = buildCast();
disk.put('pip.cbl', serializeBlocks(cast.cb.blocks));
disk.put('pip.chr', serializeCharacter(cast.pip));
const sounds = buildSounds();
disk.put('realm.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);
for (const f of passFiles()) disk.put(f.name, f.bytes);

const world = buildWorld(cast);
const towns = buildTowns(world.plan.spot);
for (const f of [...world.files, ...towns.files]) disk.put(f.name, f.bytes);

const specs: SceneSpec[] = [world.scene, ...towns.scenes];
// the world's doors into the towns
world.scene.links.push(...towns.worldLinks);
const { game } = assemble(specs, { start: { to: 'nowish', at: towns.start } });
disk.put('tuit.gam', serializeGame(game));
disk.write();
console.log(`${game.scenes.length} scenes`);
