// AROUND THE ROOM (Sandbox Software, 1994): builds every file of the game into games/around-the-room/disk/.
//   cd web && npx vite-node ../games/around-the-room/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { clipEveryList } from '@lewismoten/gamemaker-sandbox-tools/kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { STARTER_STING, starterStingFli } from '../kit/starter/sting';
import { buildHeroBlocks, heroPicture } from '../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildRoomHero, buildRoomHeroBlocks } from './src/hero';
import { buildLevels } from './src/levels';
import { roomPalette } from './src/palettes';
import { song } from './src/song';
import { titlePicture } from './src/title';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { base, pal, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: an (empty) set of monsters, one set of sounds, one song
disk.put('room.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('room.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('room.snd', serializeSoundSet(buildSounds()));
disk.put('room.cmf', song());

// each level: its time of day, its map, its blocks turned to the room, the hero turned to the room, and its card
const turned = levels.map((l) => buildRoomHeroBlocks(pal, l.frame));
levels.forEach((l, i) => {
  disk.put(`${l.file}.pal`, serializePalette(roomPalette(pal, l.frame.k)));
  disk.put(`${l.file}.bbl`, serializeBlocks(l.book.finish()));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.cbl`, serializeBlocks(turned[i].finish()));
  disk.put(`${l.file}.chr`, serializeCharacter(buildRoomHero(turned[i], l.frame)));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, base, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// pictures and words
const text = (name: string, heading: string, body: string) => {
  disk.put(`${name}.gif`, gif(paper(pal, base, heading), pal));
  disk.put(`${name}.txt`, body);
  disk.put(`${name}.lst`, serializeSlideList([{ name: `${name}.gif`, pause: 0 }, { name: `${name}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, turned.map((b) => b.pics.get('fs')!), TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('around-the-room'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, base, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, base, 'LAP RUNNERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, base, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, base, 'SAVE GAME'), pal));
text('story', 'FOUR SIDES', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, base, cheer, 'ONE LAP!', 'FLOOR, WALL, CEILING, WALL', 'won'), pal));
disk.put('won.gif', gif(paper(pal, base, 'ALL DONE'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, base, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'BACK TO START', 'NOTHING HURTS HERE', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, base, 'BACK TO START'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('room.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Around the Room'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${base.index.size} blocks in the floor's set, ${levels.length} levels`);
