// COLOR DOORS (Sandbox Software, 1994): builds every file of the game into games/color-doors/disk/.
//   cd web && npx vite-node ../games/color-doors/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
// The whole trick is here: ONE map file for the gallery (gallery.map), ONE block set, and FIVE palette files
// (the shared palette, then the same 768 bytes passed through the color-vision matrices; see src/views.ts).
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
import { INF_REPEAT } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { clipEveryList } from '@lewismoten/gamemaker-sandbox-tools/kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { STARTER_STING, starterStingFli } from '../kit/starter/sting';
import { Book } from '../kit/starter/book';
import { addStarterBlocks, KEYS } from '../kit/starter/blocks';
import { buildHeroBlocks, heroPicture } from '../kit/starter/hero';
import { buildHero } from '../kit/starter/heroChar';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { skyOf, type Pal } from '../kit/starter/palette';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { VIEWS, viewPalette } from './src/views';
import { song } from './src/song';
import { titlePicture } from './src/title';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, hall, gallery } = buildLevels();
// the screens (cards, menu, pages) are drawn with the Starters' sunny blocks, as in every Starter
const scenery = new Book('bbl');
addStarterBlocks(scenery, pal);
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
const door = heroPicture(scenery, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

// the game's shared data: one block set, one hero, one song, and a palette for each view
disk.put('doors.bbl', serializeBlocks(book.finish()));
disk.put('doors.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('doors.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[KEYS] = INF_REPEAT; // no keys in this game
heroChar.meter[0] = 3; // nothing here takes any
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('doors.snd', serializeSoundSet(buildSounds()));
disk.put('doors.cmf', song());
const palettes: Pal[] = VIEWS.map((v) => ({ ...pal, pal: viewPalette(pal.pal, v.kind) }));
VIEWS.forEach((v, i) => disk.put(v.file, serializePalette(palettes[i].pal)));

// the two maps. The gallery is one file; every door's scene lists it.
disk.put('hall.map', serializeMap(hall.map.done()));
disk.put('gallery.map', serializeMap(gallery.map.done()));

// a card before each scene: the hall's in the shared palette; each view's is drawn in that view's palette, so the card is the first thing a door changes
const card = (base: string, n: number, name: string, hint: string, p: Pal) => {
  disk.put(`${base}.gif`, gif(cardPicture(p, scenery, hero, n, 6, name, hint), p));
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 3 }]));
};
card('hall', 1, 'The Hall', 'Five doors. Try them all.', pal);
VIEWS.forEach((v, i) => card(`view${i}`, i + 2, v.name, v.line, palettes[i]));

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, scenery, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, hero, door, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('color-doors'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, scenery, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, scenery, 'COLOR WATCHERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, scenery, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, scenery, 'SAVE GAME'), pal));
text('story', 'COLOR DOORS', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, scenery, cheer, 'FIVE DOORS!', 'ONE ROOM, FIVE VIEWS', 'won'), pal));
disk.put('won.gif', gif(paper(pal, scenery, 'ALL DONE'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, scenery, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, scenery, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('colrdoor.gam', serializeGame(buildGame(hall, gallery)));
disk.put('license.txt', licenseText('Color Doors'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${heroBlocks.index.size} hero blocks, ${VIEWS.length} palettes`);
