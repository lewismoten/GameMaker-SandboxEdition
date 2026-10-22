// DEPTH PERCEPTION — builds every file of the game into games/depth/disk/.
//   cd web && npx vite-node ../games/depth/build.ts
// Everything you see is ray traced here: the blocks, the sprites, the title, the cartoons.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeGame } from '../../web/src/formats/game';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { Disk } from '../kit/disk';
import { buildSprites } from './src/sprites/sprites';
import { buildMonsters, monsterTouches } from './src/characters/monsters';
import { buildRay } from './src/characters/ray';
import { buildLevelSet, type LevelSet } from './src/levels/blocks';
import { LEVELS } from './src/levels/levels';
import { buildGame, levelFiles } from './src/game';
import { levelExtras } from './src/levels/extras';
import { buildScreens } from './src/screens/screens';
import { buildSounds } from './src/sound/sounds';
import { SONGS } from './src/sound/music';
import { demoRecording } from './src/demo';
import { readme } from './src/screens/text';
import { licenseText } from '../kit/license';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));
const t0 = Date.now();
const log = (s: string) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(6)} s  ${s}`);

const sprites = buildSprites();
monsterTouches(sprites, sprites.mbl);
disk.put('ray.cbl', serializeBlocks(sprites.cbl));
disk.put('depth.mbl', serializeBlocks(sprites.mbl));
disk.put('depth.mon', serializeMonsters(buildMonsters(sprites)));
disk.put('near.chr', serializeCharacter(buildRay(sprites, 'n')));
disk.put('far.chr', serializeCharacter(buildRay(sprites, 'f')));
log('sprites');

const sounds = buildSounds();
disk.put('depth.snd', sounds.set);
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);
for (const [name, make] of Object.entries(SONGS)) disk.put(`${name}.cmf`, make());
log('sound and music');

const sets: LevelSet[] = [];
const files = LEVELS.map((l, i) => levelFiles(i, l.song));
LEVELS.forEach((level, i) => {
  const x = levelExtras(level);
  const set = buildLevelSet(level, sprites.colors, x.rules, x.prepare);
  sets.push(set);
  const f = files[i];
  disk.put(f.pal, serializePalette(set.pal));
  disk.put(f.map.near, serializeMap(set.built.maps.near));
  disk.put(f.map.far, serializeMap(set.built.maps.far));
  disk.put(f.bbl.near, serializeBlocks(set.blocks.near));
  disk.put(f.bbl.far, serializeBlocks(set.blocks.far));
  disk.put(f.card, serializeSlideList([{ name: `card${i + 1}.gif`, pause: 7 }]));
  log(`${level.name}: ${set.book.used} blocks`);
});

const fast = !!process.env.DEPTH_FAST;
const screens = buildScreens({ sprites, sets }, fast);
for (const [name, bytes] of Object.entries(screens.files)) disk.put(name, bytes);
if (fast) {
  // keep the pictures from the last full build
  const dir = join(here, 'disk');
  if (existsSync(dir)) for (const n of readdirSync(dir)) if (!disk.files.has(n)) disk.put(n, new Uint8Array(readFileSync(join(dir, n))));
}
log('screens');

disk.put('demo.rec', demoRecording());
disk.put('readme.txt', readme('$15'));
disk.put('license.txt', licenseText('Depth Perception'));

disk.put('depth.gam', serializeGame(buildGame(sets, files, screens.extra)));
disk.write();
log('done');
