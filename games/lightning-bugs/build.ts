// LIGHTNING BUGS (Sandbox Software, 1994): builds every file of the game into games/lightning-bugs/disk/.
//   cd web && npx vite-node ../games/lightning-bugs/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
// A firefly is a monster with a mostly clear picture, a blink of frames and a looping path (src/bugs.ts).
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
import { Book } from '../kit/starter/book';
import { addStarterBlocks } from '../kit/starter/blocks';
import { buildHeroBlocks, heroPicture } from '../kit/starter/hero';
import { buildHero } from '../kit/starter/heroChar';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { buildBugBlocks, buildBugs } from './src/bugs';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
// the screens (cards, menu, pages) are drawn with the Starters' blocks, as in every Starter
const scenery = new Book('bbl');
addStarterBlocks(scenery, pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
const bugBlocks = buildBugBlocks(pal);

// the game's shared data: one palette, one monster file, one character, one song, the sounds
disk.put('bugs.pal', serializePalette(pal.pal));
disk.put('bugs.mon', serializeMonsters(buildBugs(bugBlocks)));
disk.put('bugs.mbl', serializeBlocks(bugBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[0] = 3; // nothing here takes any
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
disk.put('bugs.snd', serializeSoundSet(buildSounds()));
disk.put('bugs.cmf', song());

// each level's map and blocks, and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.bbl`, serializeBlocks(l.book.finish()));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, scenery, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, scenery, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, levels[0].book, hero, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('lightning-bugs'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, scenery, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, scenery, 'BUG WATCHERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, scenery, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, scenery, 'SAVE GAME'), pal));
text('story', 'LIGHTNING BUGS', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, scenery, cheer, 'GOOD NIGHT!', 'EVERY LIGHT KEEPS ITS OWN TIME', 'won'), pal));
disk.put('won.gif', gif(paper(pal, scenery, 'GOOD NIGHT'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, scenery, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'EVERYONE FALLS SOMETIMES', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, scenery, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('bugs.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Lightning Bugs'));
clipEveryList(disk.files);
disk.write();
console.log(
  `${TITLE}: ${levels.map((l) => `${l.file} ${l.book.index.size} blocks, ${l.bugs.length} fireflies`).join('; ')}; ${bugBlocks.index.size} monster pictures`,
);
