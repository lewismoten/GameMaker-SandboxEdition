// PASS THE PIE (Sandbox Software, 1994, a Special): builds every file of the game into games/pass-the-pie/disk/.
//   cd web && npx vite-node ../games/pass-the-pie/build.ts
// Six streets, a palette mood each (src/palette.ts), a hero named Rory (src/rory.ts), two cartoons, three songs.
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
import { buildHero } from '../kit/starter/heroChar';
import { SILVER_KEYS } from '../kit/starter/locks';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { endingFli, introFli } from './src/cartoons';
import { TITLE, buildGame } from './src/game';
import { buildLevels, finishBook } from './src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from './src/monsters';
import { buildPalette, moodBytes } from './src/palette';
import { buildRoryBlocks } from './src/rory';
import { longTable, rollsCooling, streetWalk } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

/** Hit points (the gravy boat) and lives at the start. */
const HERO_HIT_POINTS = 100;
const HERO_LIVES = 3;

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const pal = buildPalette();
const levels = buildLevels(pal);
const heroBlocks = buildRoryBlocks(pal);
const mb = monsterPictures(pal);
const rory = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer2.top', 'cheer');
const base = levels[0].book; // the Starter blocks, for the screens' scenery

disk.put('rory.cbl', serializeBlocks(heroBlocks.finish()));
const hero = buildHero(heroBlocks);
hero.meter[0] = HERO_HIT_POINTS;
hero.meter[1] = HERO_LIVES;
hero.meter[SILVER_KEYS] = 1; // the bone counter (it shows one less)
disk.put('rory.chr', serializeCharacter(hero));
disk.put('pass.mbl', serializeBlocks(finishMonsterPictures(mb)));
disk.put('pass.mon', serializeMonsters(monsterSet(mb)));
disk.put('pass.snd', serializeSoundSet(buildSounds()));
disk.put('pie.cmf', streetWalk());
disk.put('dash.cmf', rollsCooling());
disk.put('table.cmf', longTable());

// each level: its palette mood, map, blocks and card
levels.forEach((l, i) => {
  const bytes = moodBytes(pal, l.mood);
  disk.put(`${l.file}.pal`, serializePalette(bytes));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBook(l)));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, base, rory, i + 1, levels.length, l.title, l.hint), { ...pal, pal: bytes }));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

const text = (name: string, heading: string, body: string) => {
  disk.put(`${name}.gif`, gif(paper(pal, base, heading), pal));
  disk.put(`${name}.txt`, body);
  disk.put(`${name}.lst`, serializeSlideList([{ name: `${name}.gif`, pause: 0 }, { name: `${name}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, rory), pal));
disk.put(SANDLOGO, sandLogoFli());
disk.put('intro.fli', introFli(pal));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, base, rory, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, base, 'HUNGRY GUESTS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, base, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, base, 'SAVE GAME'), pal));
text('story', 'PASS THE PIE', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('ending.fli', endingFli(pal));
disk.put('wonpic.gif', gif(endPicture(pal, base, cheer, 'THANK YOU!', 'EVERY DISH ON THE TABLE', 'won'), pal));
disk.put('won.gif', gif(paper(pal, base, 'FULL TABLE'), pal));
disk.put('won.txt', WON);
disk.put(
  'won.lst',
  serializeSlideList([{ name: 'ending.fli', pause: 3 }, { name: 'wonpic.gif', pause: 5 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]),
);
disk.put('lostpic.gif', gif(endPicture(pal, base, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OH NO!', 'THE GRAVY BOAT IS EMPTY', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, base, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('pass.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText(TITLE));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${levels.map((l) => l.book.index.size).join('/')} blocks, ${heroBlocks.index.size} hero blocks`);
