// BAKER'S DOZEN: THE THIRTEENTH INGREDIENT: builds every file of the game into games/bakers/disk/.
//   cd web && npx vite-node ../games/bakers/build.ts
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { serializeGame } from '../../web/src/formats/game';
import { parseSlideList } from '../../web/src/formats/graphicScripts';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { buildPalette } from './src/art/pal';
import { compileAll } from './src/compile';
import { GAM } from './src/game';
import { buildScreens } from './src/screens/screens';
import { readme } from './src/screens/text';
import { buildSounds } from './src/sound/sounds';
import * as M from './src/sound/music';
import { demoRecording } from './src/demo';
import { printables } from './src/printables';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));
const all = compileAll();
const { cb, chr, mb, sets, rooms, game } = all;

disk.put('leo.chr', serializeCharacter(chr));
disk.put('leo.cbl', serializeBlocks(cb.build()));
disk.put('mons.mbl', serializeBlocks(mb.build()));
for (const set of Object.values(sets)) disk.put(`${set.style}.bbl`, serializeBlocks(set.tiles.build()));
for (const room of rooms) {
  const s = room.spec;
  disk.put(`${s.file}.pal`, serializePalette(buildPalette(s.theme).pal));
  disk.put(`${s.file}.map`, serializeMap(room.map));
  disk.put(`${s.file}.mon`, serializeMonsters(room.mons.build()));
  console.log(`${s.file}: level ${s.level}, ${room.mons.names.filter(Boolean).length} monsters`);
}

const sounds = buildSounds();
disk.put('leo.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

disk.put('title.cmf', M.titleSong());
disk.put('menu.cmf', M.menuSong());
disk.put('story.cmf', M.storySong());
disk.put('won.cmf', M.wonSong());
disk.put('lost.cmf', M.lostSong());
for (const id of new Set(rooms.map((r) => r.spec.song))) disk.put(`${id}.cmf`, M.roomSong(id));

for (const [name, bytes] of Object.entries(buildScreens(rooms, sets))) disk.put(name, bytes);
disk.put('demo.rec', await demoRecording(all));
disk.put('readme.txt', readme());
disk.put(GAM, serializeGame(game));
disk.put('license.txt', licenseText("BAKER'S DOZEN: The Thirteenth Ingredient"));
// every file a scene names must be on the disk
for (const s of game.scenes) for (const f of s.files) if (f && !disk.files.has(f)) throw new Error(`${s.desc} needs ${f}, which is not on the disk`);
// ...and every file a slide list names
for (const [name, bytes] of disk.files)
  if (name.endsWith('.lst'))
    for (const e of parseSlideList(bytes)) if (!disk.files.has(e.name)) throw new Error(`${name} names ${e.name}, which is not on the disk`);
disk.write();
writeFileSync(join(here, 'printables.json'), JSON.stringify(printables(), null, 2) + '\n');
console.log(`${game.scenes.length} scenes`);
