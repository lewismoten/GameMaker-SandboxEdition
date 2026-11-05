// DIAGONAL WRAP (Sandbox Software, 1994): builds every file of the game into games/diagonal-wrap/disk/.
//   cd web && npx vite-node ../games/diagonal-wrap/build.ts
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
import { Book } from '../kit/starter/book';
import { addStarterBlocks } from '../kit/starter/blocks';
import { skyOf } from '../kit/starter/palette';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture, titlePicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildTopHero, buildTopHeroBlocks } from './src/topHero';
import { buildLevels } from './src/levels';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
const topBlocks = buildTopHeroBlocks(pal);
// the title shows Kit beside the side-view exit door (its sky made clear)
const starter = new Book('bbl');
addStarterBlocks(starter, pal);
const door = heroPicture(starter, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

// the game's shared data: one block set, one palette, one hero (Kit from above), an (empty) set of monsters, one song
disk.put('dw.pal', serializePalette(pal.pal));
disk.put('top.bbl', serializeBlocks(book.finish()));
disk.put('dw.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('dw.mon', serializeMonsters(buildMonsters(monsterBlocks)));
// Kit from above, one block, walking in four directions
disk.put('top.cbl', serializeBlocks(topBlocks.finish()));
disk.put('top.chr', serializeCharacter(buildTopHero(topBlocks)));
disk.put('dw.snd', serializeSoundSet(buildSounds()));
disk.put('dw.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, starter, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, starter, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, starter, hero, door, TITLE, 'A STARTER GAME', 'coins', 'atlas'), pal));
disk.put(STARTER_STING, starterStingFli('diagonal-wrap'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, starter, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, starter, 'WRAP RUNNERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, starter, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, starter, 'SAVE GAME'), pal));
text('story', 'AROUND THE MAP', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, starter, cheer, 'WRAPPED!', 'THE MAP WRAPS', 'won'), pal));
disk.put('won.gif', gif(paper(pal, starter, 'ALL DONE'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, starter, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'BACK TO START', 'NOTHING HURTS HERE', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, starter, 'BACK TO START'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('dw.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Diagonal Wrap'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${topBlocks.index.size} hero blocks`);
