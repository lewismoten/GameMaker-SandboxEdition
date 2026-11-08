// THE THANK-YOU PARADE (Sandbox Software, 1994, a Special): builds every file of the game into games/thank-you-parade/disk/.
//   cd web && npx vite-node ../games/thank-you-parade/build.ts
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
import { buildHero } from '../kit/starter/heroChar';
import { heroPicture } from '../kit/starter/hero';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { endingFli, introFli } from './src/cartoons';
import { TITLE, buildGame } from './src/game';
import { buildLevels, galleryBook } from './src/levels';
import { buildMargeBlocks, buildPennyBlocks } from './src/figure';
import { finishMonsterPictures, monsterPictures, monsterSet } from './src/monsters';
import { drumOffSong, margeSong, paradeSounds, song } from './src/sound';
import { CARD_NOTES, CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { titlePicture } from './src/title';

/** Hit points and lives at the start (a goose costs 1 a moment, a cannon 10). */
const HERO_HIT_POINTS = 80;
const HERO_LIVES = 3;
/** Counters 20 to 25 (the band's three things and the keys, the cards, the float's parts, the banner letters) start at 1: a counter shows one less than it holds. */
const COUNTERS = [20, 21, 22, 23, 24, 25];

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const book = levels[0].book; // pictures for the menu and the text pages
const gallery = galleryBook(pal); // the title and the cartoons
const heroBlocks = buildPennyBlocks(pal);
const mb = monsterPictures(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

disk.put('parade.mbl', serializeBlocks(finishMonsterPictures(mb)));
disk.put('parade.mon', serializeMonsters(monsterSet(mb)));
// the heroes: Penny for most levels, Marge for the airstrip (counters carry over from scene to scene)
for (const [name, blocks] of [
  ['penny', heroBlocks],
  ['marge', buildMargeBlocks(pal)],
] as const) {
  disk.put(`${name}.cbl`, serializeBlocks(blocks.finish()));
  const ch = buildHero(blocks);
  ch.meter[0] = HERO_HIT_POINTS;
  ch.meter[1] = HERO_LIVES;
  for (const n of COUNTERS) ch.meter[n] = 1;
  disk.put(`${name}.chr`, serializeCharacter(ch));
}
disk.put('parade.snd', serializeSoundSet(paradeSounds()));
disk.put('parade.cmf', song());
disk.put('marge.cmf', margeSong());
disk.put('drumoff.cmf', drumOffSong());

// each level: its palette, map, blocks and card
levels.forEach((l, i) => {
  disk.put(`${l.file}.pal`, serializePalette(l.pal.pal));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(l.book.finish()));
  disk.put(`${l.file}.gif`, gif(cardPicture(l.pal, l.book, hero, i + 1, levels.length, l.title, CARD_NOTES[i]), l.pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put(SANDLOGO, sandLogoFli());
disk.put('parade.fli', introFli(pal, gallery, hero));
disk.put('title.gif', gif(titlePicture(pal, gallery, hero, 'THE THANK-YOU', 'PARADE', 'A SPECIAL FROM SANDBOX SOFTWARE'), pal));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'parade.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'PARADE MARSHALS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'THE THANK-YOU PARADE', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('ending.fli', endingFli(pal, gallery, hero));
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'THANK YOU!', 'THE WHOLE TOWN WAVES', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'THE PARADE'), pal));
disk.put('won.txt', WON);
disk.put(
  'won.lst',
  serializeSlideList([{ name: 'ending.fli', pause: 0 }, { name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]),
);
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OH NO!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('parade.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('The Thank-You Parade'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${levels.map((l) => l.book.index.size).join(', ')} blocks per level`);
