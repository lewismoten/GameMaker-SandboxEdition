// NEAR AND FAR (Sandbox Software, 1994): builds every file of the game into games/near-far/disk/.
//   cd web && npx vite-node ../games/near-far/build.ts
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
import { buildHero } from '../kit/starter/heroChar';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { CARDS, buildLevels } from './src/levels';
import { farHero } from './src/farHero';
import { farPalette, hazeMap } from './src/haze';
import { song } from './src/song';
import { titlePicture } from './src/title';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, levels, rooms } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: one block set, one palette, one hero, an (empty) set of monsters, one song
disk.put('near.pal', serializePalette(pal.pal));
disk.put('far.pal', serializePalette(farPalette(pal)));
disk.put('nearfar.bbl', serializeBlocks(book.finish()));
disk.put('nearfar.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('nearfar.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const nearKit = buildHero(heroBlocks);
const farKit = farHero(heroBlocks, nearKit);
disk.put('hero.chr', serializeCharacter(nearKit));
disk.put('far.cbl', serializeBlocks(farKit.blocks.finish()));
disk.put('far.chr', serializeCharacter(farKit.character));
disk.put('nearfar.snd', serializeSoundSet(buildSounds()));
disk.put('nearfar.cmf', song());

// each room's map, and each level's card
for (const l of levels) disk.put(`${l.file}.map`, serializeMap(l.map.done()));
for (const c of CARDS) {
  disk.put(`${c.file}.gif`, gif(cardPicture(pal, book, hero, c.n, CARDS.length, c.title, c.hint), pal));
  disk.put(`${c.file}.lst`, serializeSlideList([{ name: `${c.file}.gif`, pause: 3 }]));
}

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, hero, hazeMap(pal), TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'THE FAR SEERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'NEAR AND FAR', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'FAR AND AWAY!', 'TWO PLANES, TWO LEVELS', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'NEAR AND FAR'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'THE CLIFF WON', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('nearfar.gam', serializeGame(buildGame(rooms)));
disk.put('license.txt', licenseText('Near and Far'));
clipEveryList(disk.files);
disk.write();
console.log(
  `${TITLE}: ${book.index.size} blocks, ${monsterBlocks.index.size} monster blocks, ${heroBlocks.index.size} hero blocks, ${levels.length} maps, ${rooms.length} scenes`,
);
