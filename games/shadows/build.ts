// LITTLE SHADOWS (Sandbox Software, 1994): builds every file of the game into games/shadows/disk/.
//   cd web && npx vite-node ../games/shadows/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
// A shadow is pixels painted into a picture. The yard's two scenes load the same map and different pictures (src/assets.ts).
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
import { heroPicture } from '../kit/starter/hero';
import { buildHero } from '../kit/starter/heroChar';
import { shadowJump } from './src/jump';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { buildAssets } from './src/assets';
import { buildCritters } from './src/critters';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { song } from './src/song';
import { CARDS, CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, yardSolid, yardDither, hop, hover } = buildLevels();
const assets = buildAssets(pal);
// the screens (cards, menu, pages) are drawn with the Starters' sunny blocks and Kit without a shadow, as in every Starter
const scenery = new Book('bbl');
addStarterBlocks(scenery, pal);
const hero = heroPicture(assets.plain, 'stand.top', 'stand');
const cheer = heroPicture(assets.plain, 'cheer.top', 'jump');

// the game's shared data: one palette, one monster file, one character, one song, the sounds
disk.put('shadows.pal', serializePalette(pal.pal));
disk.put('shadows.mon', serializeMonsters(buildCritters(assets.dither.critters)));
const heroChar = buildHero(assets.plain);
shadowJump(heroChar, assets.plain);
heroChar.meter[0] = 3; // nothing here takes any
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('shadows.snd', serializeSoundSet(buildSounds()));
disk.put('shadows.cmf', song());

// the pictures that differ: Kit and the critters with a solid shadow or a dithered one, and the yard's signs
disk.put('solid.cbl', serializeBlocks(assets.solid.hero.finish()));
disk.put('dither.cbl', serializeBlocks(assets.dither.hero.finish()));
disk.put('solid.mbl', serializeBlocks(assets.solid.critters.finish()));
disk.put('dither.mbl', serializeBlocks(assets.dither.critters.finish()));
disk.put('solid.bbl', serializeBlocks(yardSolid.book.finish()));
disk.put('dither.bbl', serializeBlocks(yardDither.book.finish()));
disk.put('hop.bbl', serializeBlocks(hop.book.finish()));
disk.put('hover.bbl', serializeBlocks(hover.book.finish()));

// the three maps (the yard is one file)
disk.put('yard.map', serializeMap(yardSolid.map.done()));
disk.put('hop.map', serializeMap(hop.map.done()));
disk.put('hover.map', serializeMap(hover.map.done()));
if (JSON.stringify(yardSolid.map.done()) !== JSON.stringify(yardDither.map.done())) throw new Error('The yard must be one map in both looks');

// a card before each room
const card = (base: string, n: number, [name, hint]: readonly [string, string]) => {
  disk.put(`${base}.gif`, gif(cardPicture(pal, scenery, hero, n, 3, name, hint), pal));
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 3 }]));
};
card('solid', 1, CARDS.solid);
card('dither', 1, CARDS.dither);
card('hop', 2, CARDS.hop);
card('hover', 3, CARDS.hover);

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, scenery, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
const pic = (book: Book, name: string) => book.pics.get(name)!;
disk.put(
  'title.gif',
  gif(
    titlePicture(
      pal,
      heroPicture(assets.dither.hero, 'stand.top', 'stand'),
      pic(assets.dither.critters, 'pip0'),
      pic(assets.dither.critters, 'bee0'),
      pic(assets.dither.critters, 'shade1'),
      TITLE,
      'A STARTER GAME',
    ),
    pal,
  ),
);
disk.put(STARTER_STING, starterStingFli('shadows'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, scenery, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, scenery, 'SHADOW WATCHERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, scenery, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, scenery, 'SAVE GAME'), pal));
text('story', 'LITTLE SHADOWS', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, scenery, cheer, 'ALL SHADED!', 'PIXELS ALL THE WAY DOWN', 'won'), pal));
disk.put('won.gif', gif(paper(pal, scenery, 'THAT IS THE LOT'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, scenery, heroPicture(assets.plain, 'hurt.top', 'hurt'), 'OOPS!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, scenery, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('shadows.gam', serializeGame(buildGame({ solid: yardSolid, dither: yardDither, hop, hover })));
disk.put('license.txt', licenseText('Little Shadows'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: 4 background block sets, critters ${assets.dither.critters.index.size}, hero ${assets.dither.hero.index.size}`);
