// KEEP IT BRIEF! THE TINY POCKETS LIBRARY: builds every file of the game into games/brief/disk/.
//   cd web && npx vite-node ../games/brief/build.ts
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
import { PAL } from './src/art/pal';
import { compileAll } from './src/compile';
import { GAM } from './src/game';
import { buildScreens } from './src/screens/screens';
import { readme } from './src/screens/text';
import { buildSounds } from './src/sound/sounds';
import * as M from './src/sound/music';
import { demoRecording } from './src/demo';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));
const all = compileAll();
const { cb, chr, wings, hub, game } = all;

disk.put('brief.pal', serializePalette(PAL.pal));
disk.put('joe.chr', serializeCharacter(chr));
disk.put('joe.cbl', serializeBlocks(cb.build()));
for (const a of [hub.area, ...wings.map((w) => w.area)]) {
  disk.put(`${a.file}.map`, serializeMap(a.done()));
  disk.put(`${a.file}.bbl`, serializeBlocks(a.tiles.build()));
  disk.put(`${a.file}.mbl`, serializeBlocks(a.mb.build()));
  disk.put(`${a.file}.mon`, serializeMonsters(a.mons.build()));
  console.log(`${a.file}: ${a.tiles.names.length} blocks, ${a.mb.names.length} monster blocks, ${a.mons.names.filter(Boolean).length} monsters`);
}

const sounds = buildSounds();
disk.put('joe.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

disk.put('title.cmf', M.titleSong());
disk.put('menu.cmf', M.menuSong());
disk.put('story.cmf', M.storySong());
disk.put('library.cmf', M.librarySong());
disk.put('won.cmf', M.wonSong());
disk.put('lost.cmf', M.lostSong());
for (const w of wings) disk.put(`${w.area.file}.cmf`, M.wingSong(w.spec.wing.id));

for (const [name, bytes] of Object.entries(buildScreens(cb, wings))) disk.put(name, bytes);
disk.put('demo.rec', await demoRecording(all));
disk.put('readme.txt', readme());
disk.put(GAM, serializeGame(game));
disk.put('license.txt', licenseText('KEEP IT BRIEF! The Tiny Pockets Library'));
// every file a scene names must be on the disk
for (const s of game.scenes) for (const f of s.files) if (f && !disk.files.has(f)) throw new Error(`${s.desc} needs ${f}, which is not on the disk`);
// ...and every file a slide list names
for (const [name, bytes] of disk.files)
  if (name.endsWith('.lst'))
    for (const e of parseSlideList(bytes)) if (!disk.files.has(e.name)) throw new Error(`${name} names ${e.name}, which is not on the disk`);
disk.write();
console.log(`${game.scenes.length} scenes`);
