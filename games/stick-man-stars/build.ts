// STICK MAN STARS (Sandbox Software, 1994): builds every file of the game into games/stick-man-stars/disk/.
//   cd web && npx vite-node ../games/stick-man-stars/build.ts
// A short Special: a stick figure picks stars out of the night sky and tosses them at little repo houses.
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
import { SANDLOGO, sandLogoFli } from '../kit/sandlogo';
import { heroPicture } from '../kit/starter/hero';
import { KEYS } from '../kit/starter/blocks';
import { buildThrower } from './src/hero';
import { buildStickBlocks } from './src/stick';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { skyOf } from '../kit/starter/palette';
import { throwSounds } from './src/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { HERO_HIT_POINTS, finishMonsterPictures, monsterPictures, monsterSet } from './src/monsters';
import { song } from './src/song';
import { titlePicture } from './src/title';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, levels } = buildLevels();
const heroBlocks = buildStickBlocks(pal);
const monsterBlocks = monsterPictures(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const throwPose = heroPicture(heroBlocks, 'cheer.top', 'throw1');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
// the exit door as a picture to stand in the scenes: its sky made clear
const door = heroPicture(book, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

// the game's shared data: one block set, one palette, one hero, one set of monsters, one song
disk.put('stars.pal', serializePalette(pal.pal));
disk.put('stars.bbl', serializeBlocks(book.finish()));
disk.put('stars.mbl', serializeBlocks(finishMonsterPictures(monsterBlocks)));
disk.put('stars.mon', serializeMonsters(monsterSet(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildThrower(heroBlocks);
heroChar.meter[KEYS] = 1; // the star counter (the kit's key counter): it shows one less than it holds
heroChar.meter[0] = HERO_HIT_POINTS; // nothing here takes any
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('stars.snd', serializeSoundSet(throwSounds()));
disk.put('stars.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.pal`, serializePalette(l.pal.pal));
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
disk.put('title.gif', gif(titlePicture(pal, book, monsterBlocks, throwPose, door, TITLE, 'A STARGAZING SPECIAL'), pal));
disk.put(SANDLOGO, sandLogoFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'STAR PICKERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'A STAR FOR YOU', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'ALL LIT UP!', 'THANK YOU, STARGAZERS', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'THE STREET GLOWS'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOF! SPAM!', 'PICK UP YOUR STARS', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('stars.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Throw It'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${monsterBlocks.index.size} monster blocks, ${heroBlocks.index.size} hero blocks`);
