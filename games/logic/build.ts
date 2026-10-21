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
import { PAL } from './pal';
import { STYLES, buildTiles } from './tiles';
import { buildMonsterBlocks, buildWattBlocks } from './sprites';
import { buildWatt } from './watt';
import { BOARDS } from './boards';
import { compileBoard } from './board';
import { buildSounds } from './sounds';
import * as M from './music';
import { buildScreens } from './screens';
import { buildGame } from './game';
import { demoRecording } from './demo';
import { readme } from './text';
import { writePrintables } from './printables';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const mb = buildMonsterBlocks();
const cb = buildWattBlocks();
const tiles = Object.fromEntries(Object.values(STYLES).map((st) => [st.id, buildTiles(st)]));
disk.put('watt.pal', serializePalette(PAL.pal));
disk.put('parts.mbl', serializeBlocks(mb.build()));
disk.put('watt.cbl', serializeBlocks(cb.build()));
for (const [room, bs] of Object.entries(tiles)) disk.put(`${room}.bbl`, serializeBlocks(bs.build()));

const boards = BOARDS.map((spec) => compileBoard(spec, tiles[spec.room], mb));
// every board's .MON has the reboot burst at the same number, so one .CHR serves them all
const boom = boards[0].mons.id('boom');
if (boards.some((b) => b.mons.id('boom') !== boom)) throw new Error('The reboot monster moved');
const chr = buildWatt(cb, boom);
disk.put('watt.chr', serializeCharacter(chr));
for (const b of boards) {
  disk.put(`${b.spec.file}.map`, serializeMap(b.map));
  disk.put(`${b.spec.file}.mon`, serializeMonsters(b.mons.build()));
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
    boards.map((b) => ({ b, tiles: tiles[b.spec.room] })),
  ),
))
  disk.put(name, bytes);
disk.put('demo.rec', await demoRecording(boards[0], tiles[boards[0].spec.room], mb, cb, chr));
disk.put('readme.txt', readme('$12'));
const start = process.env.OHM_START ? BOARDS.findIndex((s) => s.file === process.env.OHM_START) : 0;
disk.put('ohmsweet.gam', serializeGame(buildGame(boards, Math.max(0, start))));
disk.write();
console.log(
  `${boards.length} boards; ${tiles.kitchen.names.length} board blocks, ${mb.names.length} part blocks, ${cb.names.length} Watt blocks, ${boards[0].mons.names.filter(Boolean).length - 1}+ monsters a board`,
);
writePrintables(join(here, 'printables.json'));
