// SNOW TRAILS: builds real DOS files into games/snow/disk/.
//   cd web && npx vite-node ../games/snow/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
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
import { buildHero } from '../kit/starter/heroChar';
import { buildTopHeroBlocks } from '../kit/starter/topHero';
import { buildPrintBlocks, buildPrintHero, buildPrints } from './src/prints';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { skyOf } from '../kit/starter/palette';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { finishBlocks } from './src/levels';
import { song } from '../twinkle/src/song';
import { snowTitle } from './src/title';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const book = levels[0].book; // the pictures on the title and cards use the first level's blocks
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
// the exit door as a picture to stand in the scenes: its sky made clear
const door = heroPicture(book, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

// the game's shared data: one block set, one palette, one hero, one set of monsters, one song
disk.put('snow.pal', serializePalette(pal.pal));
disk.put('snow.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('snow.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const character = buildHero(heroBlocks);
character.meter[20] = INF_REPEAT; // no keys or locked doors
disk.put('hero.chr', serializeCharacter(character));
// level 3 is seen from above: its own hero (four facings), and prints that are monsters born at his feet
const topBlocks = buildTopHeroBlocks(pal);
const printBlocks = buildPrintBlocks(pal);
disk.put('top.cbl', serializeBlocks(topBlocks.finish()));
disk.put('top.chr', serializeCharacter(buildPrintHero(topBlocks)));
disk.put('prints.mbl', serializeBlocks(printBlocks.finish()));
disk.put('prints.mon', serializeMonsters(buildPrints(printBlocks)));
disk.put('snow.snd', serializeSoundSet(buildSounds()));
disk.put('snow.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBlocks(l)));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, book, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(snowTitle(pal, book, hero, door), pal));
disk.put(STARTER_STING, starterStingFli('snow'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'SNOW WALKERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'SNOW TRAILS', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'NICE TRAIL!', 'LOOK BEHIND YOU', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'A TRAIL IN THE SNOW'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'EVERYONE FALLS SOMETIMES', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('snow.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Snow Trails'));
clipEveryList(disk.files);
disk.write();
console.log(
  `${TITLE}: ${levels.map((l) => `${l.file} ${l.book.index.size} blocks`).join(', ')}, ${monsterBlocks.index.size} monster blocks, ${heroBlocks.index.size} hero blocks`,
);
