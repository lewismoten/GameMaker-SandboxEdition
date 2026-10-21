// OHM SWEET OHM: builds every file of the game into games/logic/disk/.
//   cd web && npx vite-node ../games/logic/build.ts
// OHM_START=<board file> starts a play-test build on that board.
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
import { PAL } from './src/art/pal';
import { buildMonsterBlocks, buildWattBlocks } from './sprites';
import { buildWatt } from './watt';
import { BOARDS } from './boards';
import { compileHouse } from './board';
import { buildSounds } from './sounds';
import * as M from './music';
import { buildScreens } from './screens';
import { buildGame } from './src/game';
import { demoRecording } from './src/demo';
import { readme } from './text';
import { writePrintables } from './src/printables';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const mb = buildMonsterBlocks();
const cb = buildWattBlocks();
const rooms = compileHouse(BOARDS, mb);
const boards = rooms.flatMap((r) => r.boards);
// every room's .MON has the reboot burst at the same number, so one .CHR serves them all
const boom = rooms[0].mons.id('boom');
if (rooms.some((r) => r.mons.id('boom') !== boom)) throw new Error('The reboot monster moved');
const chr = buildWatt(cb, boom);
disk.put('watt.chr', serializeCharacter(chr));
disk.put('watt.pal', serializePalette(PAL.pal));
disk.put('parts.mbl', serializeBlocks(mb.build()));
disk.put('watt.cbl', serializeBlocks(cb.build()));
for (const r of rooms) {
  disk.put(`${r.room}.bbl`, serializeBlocks(r.tiles.build()));
  disk.put(`${r.room}.map`, serializeMap(r.map));
  disk.put(`${r.room}.mon`, serializeMonsters(r.mons.build()));
}

const sounds = buildSounds();
disk.put('watt.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

const songs: Record<string, () => Uint8Array> = {
  title: M.titleSong,
  menu: M.menuSong,
  story: M.storySong,
  kitchen: M.kitchenSong,
  living: M.livingSong,
  garage: M.garageSong,
  attic: M.atticSong,
  won: M.wonSong,
  lost: M.lostSong,
};
for (const [name, make] of Object.entries(songs)) disk.put(`${name}.cmf`, make());

const art = { watt: cb, parts: mb };
for (const [name, bytes] of Object.entries(
  buildScreens(
    art,
    rooms.flatMap((r) => r.boards.map((b) => ({ b, tiles: r.tiles }))),
  ),
))
  disk.put(name, bytes);
disk.put('demo.rec', await demoRecording(boards[0], rooms[0].tiles, mb, cb, chr));
disk.put('readme.txt', readme('$12'));
const start = process.env.OHM_START ? BOARDS.findIndex((s) => s.file === process.env.OHM_START) : 0;
disk.put('ohmsweet.gam', serializeGame(buildGame(rooms, Math.max(0, start))));
disk.write();
for (const r of rooms)
  console.log(
    `${r.room}: ${r.boards.length} boards, ${r.tiles.names.length} blocks, ${r.mons.names.length} monsters, ${r.map.monsters.filter((m) => m.monnum < 64).length} parts placed`,
  );
writePrintables(join(here, 'printables.json'));
