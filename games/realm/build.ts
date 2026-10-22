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
import * as MUSIC from './src/sound/music';
import { screenFiles } from './src/build/screens';
import { demoRecording } from './src/demo';
import { autoArrange } from '../../web/src/editor/editors/integrator/integratorLayout';
import { untangle } from './src/layout';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const cast = buildCast();
disk.put('pip.cbl', serializeBlocks(cast.cb.blocks));
disk.put('pip.chr', serializeCharacter(cast.pip));
disk.put('chez.chr', serializeCharacter(cast.chez));
const sounds = buildSounds();
disk.put('realm.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);
for (const f of [...passFiles(), ...screenFiles('$15')]) disk.put(f.name, f.bytes);
for (const [name, make] of Object.entries(MUSIC)) disk.put(`${name.replace(/Song$/, '')}.cmf`, make());

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

const specs: SceneSpec[] = [world.scene, ...towns.scenes, ...dungeons.scenes, ...flats.scenes, ...world.talkScenes];
// the world's doors into the towns, the dungeons and onto the Flats
world.scene.links.push(
  ...towns.worldLinks,
  // (in this order the Game Integrator's Auto-arrange draws the game with no crossing arrows)
  { from: spot.barrows, to: 'barrows', at: dungeons.starts.barrows },
  { from: spot.keep, to: 'keep', at: dungeons.starts.keep },
  { from: spot.mines, to: 'mines', at: dungeons.starts.mines },
  { from: [70, 49], to: 'flats', at: flats.east },
);
const { game, ids } = assemble(specs, { start: { to: 'nowish', at: towns.start } });
// links in an order Auto-arrange draws without crossing arrows, and the scene boxes where it puts them
const left = untangle(game, ids.get('world')!);
if (left) throw new Error(`The scene graph still has ${left} crossing arrows`);
for (const [i, p] of autoArrange(game)) game.scenes[i].pos = p;
disk.put('tuit.gam', serializeGame(game));
disk.put('demo.rec', demoRecording());
disk.write();
console.log(`${game.scenes.length} scenes`);
