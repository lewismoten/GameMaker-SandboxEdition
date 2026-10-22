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
import { buildTowns, WORLD_ARRIVE, HARBOR_ARRIVE } from './src/build/towns';
import { buildDungeons } from './src/build/dungeons';
import { buildFlats } from './src/build/flats';
import { passFiles } from './src/levels/talk';
import { assemble, type SceneSpec } from './src/game';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cast = buildCast();
disk.put('pip.cbl', serializeBlocks(cast.cb.blocks));
disk.put('pip.chr', serializeCharacter(cast.pip));
disk.put('chez.chr', serializeCharacter(cast.chez));
const sounds = buildSounds();
disk.put('realm.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);
for (const f of passFiles()) disk.put(f.name, f.bytes);

const world = buildWorld(cast);
const spot = world.plan.spot;
const dungeons = buildDungeons({
  out: {
    barrows: { to: 'world', at: WORLD_ARRIVE.barrows },
    vaults: { to: 'harbor', at: HARBOR_ARRIVE.vaults },
    mines: { to: 'world', at: WORLD_ARRIVE.mines },
    keep: { to: 'world', at: WORLD_ARRIVE.keep },
  },
});
const flats = buildFlats({ west: { to: 'harbor', at: HARBOR_ARRIVE.flats }, east: { to: 'world', at: WORLD_ARRIVE.post } });
const towns = buildTowns(spot, { flats: flats.west, vaults: dungeons.starts.vaults });
for (const f of [...world.files, ...towns.files, ...dungeons.files, ...flats.files]) disk.put(f.name, f.bytes);

const specs: SceneSpec[] = [world.scene, ...towns.scenes, ...dungeons.scenes, ...flats.scenes];
// the world's doors into the towns, the dungeons and onto the Flats
world.scene.links.push(
  ...towns.worldLinks,
  { from: spot.barrows, to: 'barrows', at: dungeons.starts.barrows },
  { from: spot.mines, to: 'mines', at: dungeons.starts.mines },
  { from: spot.keep, to: 'keep', at: dungeons.starts.keep },
  { from: [70, 49], to: 'flats', at: flats.east },
);
const { game } = assemble(specs, { start: { to: 'nowish', at: towns.start } });
disk.put('tuit.gam', serializeGame(game));
disk.write();
console.log(`${game.scenes.length} scenes`);
