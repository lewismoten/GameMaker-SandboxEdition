// FIREWORKS (Sandbox Software, 1994): builds every file of the game into games/fireworks/disk/.
//   cd web && npx vite-node ../games/fireworks/build.ts
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
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLauncher } from './src/hero';
import { buildLevels, finishBlocks } from './src/levels';
import { buildMonsterBlocks, buildMonsters } from './src/monsters';
import { song } from './src/song';
import { launchSounds } from './src/sounds';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, book, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsters = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: one block set, one palette, one hero, one set of monsters, one song
disk.put('fw.pal', serializePalette(pal.pal));
disk.put('fw.bbl', serializeBlocks(finishBlocks(book)));
disk.put('fw.mbl', serializeBlocks(monsters.book.finish()));
disk.put('fw.mon', serializeMonsters(buildMonsters(monsters.book, monsters.frames)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
disk.put('hero.chr', serializeCharacter(buildLauncher(heroBlocks)));
disk.put('fw.snd', serializeSoundSet(launchSounds()));
disk.put('fw.cmf', song());

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
disk.put('title.gif', gif(titlePicture(pal, book, cheer, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('fireworks'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'SKY WATCHERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'FIREWORKS NIGHT', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'WHAT A SHOW!', 'UP, POP, AND DOWN AGAIN', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'WHAT A SHOW'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'EVERYONE FALLS SOMETIMES', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('fw.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Fireworks Night'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${monsters.book.index.size} monster pictures, ${heroBlocks.index.size} hero blocks`);
