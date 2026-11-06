// BEAMS AND FOG (Sandbox Software, 1994): builds every file of the game into games/beams/disk/.
//   cd web && npx vite-node ../games/beams/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
// Light and fog are pixels painted in a checkerboard so what is behind shows (src/light.ts).
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
import { buildHeroBlocks } from '../kit/starter/hero';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { buildCritterBlocks, buildCritters } from './src/critters';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildLevels } from './src/levels';
import { song } from './src/song';
import { CARDS, CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, beams, fog, glow } = buildLevels();
const plain = buildHeroBlocks(pal);
// the screens (cards, menu, pages) are drawn with the Starters' sunny blocks, as in every Starter
const scenery = new Book('bbl');
addStarterBlocks(scenery, pal);
const hero = heroPicture(plain, 'stand.top', 'stand');
const cheer = heroPicture(plain, 'cheer.top', 'jump');
const critters = buildCritterBlocks(pal);

// the game's shared data: one palette, one monster file, one character, one song, the sounds
disk.put('beams.pal', serializePalette(pal.pal));
disk.put('beams.mon', serializeMonsters(buildCritters(critters)));
disk.put('beams.mbl', serializeBlocks(critters.finish()));
const heroChar = buildHero(plain);
heroChar.meter[0] = 3; // nothing here takes any
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('hero.cbl', serializeBlocks(plain.finish()));
disk.put('beams.snd', serializeSoundSet(buildSounds()));
disk.put('beams.cmf', song());

// the three rooms: blocks and map
for (const l of [beams, fog, glow]) {
  disk.put(`${l.file}.bbl`, serializeBlocks(l.book.finish()));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
}

// a card before each room
const card = (base: string, n: number, [name, hint]: readonly [string, string]) => {
  disk.put(`${base}.gif`, gif(cardPicture(pal, scenery, hero, n, 3, name, hint), pal));
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 3 }]));
};
card('beams', 1, CARDS.beams);
card('fog', 2, CARDS.fog);
card('glow', 3, CARDS.glow);

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, scenery, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, hero, critters, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('beams'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, scenery, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, scenery, 'LIGHT KEEPERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, scenery, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, scenery, 'SAVE GAME'), pal));
text('story', 'BEAMS AND FOG', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, scenery, cheer, 'ALL LIT UP!', 'DOTS ALL THE WAY DOWN', 'won'), pal));
disk.put('won.gif', gif(paper(pal, scenery, 'THAT IS THE LOT'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, scenery, heroPicture(plain, 'hurt.top', 'hurt'), 'OOPS!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, scenery, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('beams.gam', serializeGame(buildGame({ beams, fog, glow })));
disk.put('license.txt', licenseText('Beams and Fog'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: blocks ${beams.book.index.size}/${fog.book.index.size}/${glow.book.index.size}, monster pictures ${critters.index.size}`);
