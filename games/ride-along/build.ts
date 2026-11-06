// RIDE ALONG (Sandbox Software, 1994): builds every file of the game into games/ride-along/disk/.
//   cd web && npx vite-node ../games/ride-along/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter). This one is about a vehicle
// that keeps moving on its own: the rocket and the canoe are character files, and their idle sequences rise.
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
import { buildHero } from '../kit/starter/heroChar';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { buildBoat, buildBoatBlocks, buildShip, buildShipBlocks } from './src/rideChars';
import { finishRide } from './src/rideBlocks';
import { titlePicture } from './src/title';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { buildSounds } from '../kit/starter/sounds';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const book = levels[0].book;
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: one palette, one hero, one set of monsters (none are placed), one song
disk.put('ride.pal', serializePalette(pal.pal));
disk.put('ride.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('ride.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[KEYS] = INF_REPEAT; // no keys in this game
disk.put('hero.chr', serializeCharacter(heroChar));
// level 2 and level 3 name these in their scenes instead of the helper's own: the same game, a different character
const shipBlocks = buildShipBlocks(pal);
disk.put('ship.cbl', serializeBlocks(shipBlocks.finish()));
disk.put('ship.chr', serializeCharacter(buildShip(shipBlocks)));
const boatBlocks = buildBoatBlocks(pal);
disk.put('boat.cbl', serializeBlocks(boatBlocks.finish()));
disk.put('boat.chr', serializeCharacter(buildBoat(boatBlocks)));
disk.put('ride.snd', serializeSoundSet(buildSounds()));
disk.put('ride.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(finishRide(l.book)));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, book, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, hero, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('ride-along'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'TOP PILOTS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'ALONG FOR THE RIDE', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'ALL DOCKED!', 'THREE RIDES, ONE TRICK', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'WELL TRAVELED'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'THE RIDE GOES ON', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('ride.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Ride Along'));
clipEveryList(disk.files);
disk.write();
console.log(
  `${TITLE}: ${levels.map((l) => l.book.index.size).join('/')} blocks, ${monsterBlocks.index.size} monster blocks, ${heroBlocks.index.size} hero blocks`,
);
