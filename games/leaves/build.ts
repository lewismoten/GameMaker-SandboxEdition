// LEAVES IN THE WIND (Sandbox Software, 1994): builds every file of the game into games/leaves/disk/.
//   cd web && npx vite-node ../games/leaves/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
// Leaves are monsters that turn as they fall (src/leafArt.ts), born by branch blocks on timers (src/levels.ts); level 2's
// paths come from a little wind model run here at build time (src/wind.ts).
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
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLeafBlocks, buildLeaves } from './src/leaves';
import { buildLevels, finishBlocks } from './src/levels';
import { song } from './src/song';
import { CARDS, CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, tumble, gust } = buildLevels();
const plain = buildHeroBlocks(pal);
// the screens (cards, menu, pages) are drawn with the Starters' sunny blocks, as in every Starter
const scenery = new Book('bbl');
addStarterBlocks(scenery, pal);
const hero = heroPicture(plain, 'stand.top', 'stand');
const cheer = heroPicture(plain, 'cheer.top', 'jump');
const leafBlocks = buildLeafBlocks(pal);

// the game's shared data: one palette, one monster file, one character, one song, the sounds
disk.put('leaves.pal', serializePalette(pal.pal));
disk.put('leaves.mon', serializeMonsters(buildLeaves(leafBlocks)));
disk.put('leaves.mbl', serializeBlocks(leafBlocks.finish()));
const heroChar = buildHero(plain);
heroChar.meter[0] = 3; // nothing here takes any
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('hero.cbl', serializeBlocks(plain.finish()));
disk.put('leaves.snd', serializeSoundSet(buildSounds()));
disk.put('leaves.cmf', song());

// the two rooms: blocks (with their timers and births) and map
for (const l of [tumble, gust]) {
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBlocks(l)));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
}

// a card before each room
const card = (base: string, n: number, [name, hint]: readonly [string, string]) => {
  disk.put(`${base}.gif`, gif(cardPicture(pal, scenery, hero, n, 2, name, hint), pal));
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 3 }]));
};
card('tumble', 1, CARDS.tumble);
card('gust', 2, CARDS.gust);

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, scenery, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, hero, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('leaves'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, scenery, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, scenery, 'LEAF WATCHERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, scenery, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, scenery, 'SAVE GAME'), pal));
text('story', 'LEAVES IN THE WIND', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, scenery, cheer, 'ALL FALLEN!', 'SWOOP, GLIDE, SWOOP', 'won'), pal));
disk.put('won.gif', gif(paper(pal, scenery, 'THAT IS THE LOT'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, scenery, heroPicture(plain, 'hurt.top', 'hurt'), 'OOPS!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, scenery, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('leaves.gam', serializeGame(buildGame({ tumble, gust })));
disk.put('license.txt', licenseText('Leaves in the Wind'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: blocks ${tumble.book.index.size}/${gust.book.index.size}, monster pictures ${leafBlocks.index.size}`);
