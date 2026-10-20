// TEDDY'S LITTLE BIG ADVENTURE: builds every file of the game into games/teddy/disk/.
//   cd web && npx vite-node ../games/teddy/build.ts
// TEDDY_START=<level file> starts a play-test build on that level.
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
import { buildCharacter, CB } from './character';
import { buildPalette } from './pal';
import { buildSounds } from './sounds';
import { LEVELS, buildGame } from './game';
import { buildScreens } from './screens';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

disk.put('teddy.chr', serializeCharacter(buildCharacter()));
disk.put('teddy.cbl', serializeBlocks(CB.build()));
const sounds = buildSounds();
disk.put('teddy.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);

const levels = LEVELS.map((make) => make());
for (const l of levels) {
  disk.put(`${l.file}.pal`, serializePalette(buildPalette(l.time).pal));
  disk.put(`${l.file}.bbl`, serializeBlocks(l.bs.build()));
  disk.put(`${l.file}.mbl`, serializeBlocks(l.beasts.mb.build()));
  disk.put(`${l.file}.mon`, serializeMonsters(l.beasts.build()));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  console.log(
    `${l.title}: ${l.bs.names.length} blocks, ${l.beasts.mb.names.length} monster blocks, ${l.beasts.names.filter(Boolean).length} monsters, ${l.map.monsters} placed`,
  );
}

for (const [name, bytes] of Object.entries(buildScreens(levels))) disk.put(name, bytes);
disk.put('teddy.gam', serializeGame(buildGame(levels, process.env.TEDDY_START)));
disk.write();
