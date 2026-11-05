// HOME KEYS (Sandbox Software, 1994): builds every file of the game into games/home-keys/disk/.
//   cd web && npx vite-node ../games/home-keys/build.ts
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
import { KEYS } from '../kit/starter/blocks';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture, titlePicture } from '../kit/starter/screens';
import { skyOf } from '../kit/starter/palette';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { HERO_HIT_POINTS, HERO_LIVES, buildKeyHero } from './src/hero';
import { keyboardPicture } from './src/keyboardArt';
import { finishMonsterPictures, monsterPictures, monsterSet } from './src/monsters';
import { throwSounds } from './src/sounds';
import { buildLevels } from './src/levels';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = monsterPictures(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
// the exit door as a picture to stand in the title: its sky made clear
const door = heroPicture(book, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

// the game's shared data: one block set, one palette, one hero, an (empty) set of monsters, one song
disk.put('hk.pal', serializePalette(pal.pal));
disk.put('hk.bbl', serializeBlocks(book.finish()));
disk.put('hk.mbl', serializeBlocks(finishMonsterPictures(monsterBlocks)));
disk.put('hk.mon', serializeMonsters(monsterSet(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildKeyHero(heroBlocks);
heroChar.meter[KEYS] = INF_REPEAT; // no keys in this game
heroChar.meter[0] = HERO_HIT_POINTS;
heroChar.meter[1] = HERO_LIVES;
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('hk.snd', serializeSoundSet(throwSounds()));
disk.put('hk.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
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
disk.put('title.gif', gif(titlePicture(pal, book, hero, door, TITLE, 'A STARTER GAME', 'key', 'dressing'), pal));
disk.put(STARTER_STING, starterStingFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'THE TYPISTS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'WHICH KEYS?', STORY);
disk.put('keys.gif', gif(keyboardPicture(pal, book), pal));
disk.put('howto.gif', gif(paper(pal, book, 'HOW TO PLAY'), pal));
disk.put('howto.txt', HOWTO);
disk.put('howto.lst', serializeSlideList([{ name: 'keys.gif', pause: 0 }, { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]));
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'KEYS DONE!', 'THREE LEVELS DONE', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'KEYS DONE'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OH NO!', 'OUT OF LIVES', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('hk.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText("Home Keys"));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${heroBlocks.index.size} hero blocks`);
