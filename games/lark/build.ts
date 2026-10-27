// The tin hearts' secret game: builds every file of it into games/lark/disk/.
//   cd web && npx vite-node ../games/lark/build.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeCharacter } from '../../web/src/formats/character';
import { parseSlideList } from '../../web/src/formats/graphicScripts';
import { serializeGame } from '../../web/src/formats/game';
import { serializeMap } from '../../web/src/formats/map';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializePalette } from '../../web/src/formats/palette';
import { serializeSoundSet } from '../../web/src/formats/sound';
import { Disk } from '../kit/disk';
import { clipEveryList } from '../kit/fliClips';
import { licenseText } from '../kit/license';
import { buildPalette } from './src/art/pal';
import { demoRecording } from './src/demo';
import { GAM, compile } from './src/game';
import { buildScreens } from './src/screens/screens';
import { TITLE, readme } from './src/screens/text';
import * as M from './src/sound/music';
import { buildSounds } from './src/sound/sounds';
import { walkPaths } from './src/walkPaths';
import { writeWalkPaths } from '../kit/walkPaths';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));
const all = compile();

disk.put('hero.chr', serializeCharacter(all.hero));
disk.put('side.chr', serializeCharacter(all.side));
disk.put('hero.cbl', serializeBlocks(all.cb.build()));
disk.put('side.cbl', serializeBlocks(all.cb.build()));
for (const [name, set] of Object.entries(all.sets)) disk.put(`${name}.bbl`, serializeBlocks(set.build()));
disk.put('lark.mbl', serializeBlocks(all.mb.build()));
for (const p of all.places) {
  disk.put(`${p.file}.pal`, serializePalette(buildPalette(p.light).pal));
  disk.put(`${p.file}.map`, serializeMap(p.stamped.map));
  if (p.mons) disk.put(`${p.file}.mon`, serializeMonsters(p.mons.build()));
}

const sounds = buildSounds();
disk.put('lark.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

const songs: Record<string, () => Uint8Array> = {
  title: M.titleSong,
  menu: M.menuSong,
  story: M.storySong,
  library: M.librarySong,
  road: M.roadSong,
  square: M.squareSong,
  tower: M.towerSong,
  parade: M.paradeSong,
  park: M.parkSong,
  musicbox: M.musicBoxSong,
  dance: M.danceSong,
  lot: M.lotSong,
  sea: M.seaSong,
  snow: M.snowSong,
  hive: M.hiveSong,
  loft: M.loftSong,
  rocks: M.rocksSong,
  fair: M.fairSong,
  plant: M.plantSong,
  home: M.homeSong,
  gold: M.goldSong,
  won: M.wonSong,
  lost: M.lostSong,
};
for (const [name, make] of Object.entries(songs)) disk.put(`${name}.cmf`, make());

for (const [name, bytes] of Object.entries(buildScreens())) disk.put(name, bytes);
disk.put('readme.txt', readme());
disk.put(GAM, serializeGame(all.game));
disk.put('demo.rec', await demoRecording(disk.files));
disk.put('license.txt', licenseText(TITLE));
// every file a scene names must be on the disk, and every file a slide list names
for (const s of all.game.scenes) for (const f of s.files) if (f && !disk.files.has(f)) throw new Error(`${s.desc} needs ${f}, which is not on the disk`);
for (const [name, bytes] of disk.files)
  if (name.endsWith('.lst'))
    for (const e of parseSlideList(bytes)) if (!disk.files.has(e.name)) throw new Error(`${name} names ${e.name}, which is not on the disk`);
clipEveryList(disk.files);
disk.write();
// the roads and walks the walkthrough's bot keeps to (not on the disk)
writeWalkPaths('lark', walkPaths(all.sets));
console.log(`${all.game.scenes.length} scenes`);
