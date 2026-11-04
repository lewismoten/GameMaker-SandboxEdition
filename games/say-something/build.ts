// SAY SOMETHING (Sandbox Software, 1994): builds every file of the game into games/say-something/disk/.
//   cd web && npx vite-node ../games/say-something/build.ts
// The tenth of the Starters: small games that each show one idea (games/kit/starter).
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
import { buildHero } from '../kit/starter/heroChar';
import { Grid } from '../kit/starter/grid';
import { StarterMap } from '../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { talkPicture, titlePicture } from './src/screens';
import { talkerPicture } from './src/talkers';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame, talkFile } from './src/game';
import { buildLevels } from './src/levels';
import { song } from './src/song';
import { BUBBLE_LINES, CREDITS, HOWTO, LOST, SAYS, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: one block set, one palette, one hero, one set of monsters, one song
disk.put('say.pal', serializePalette(pal.pal));
disk.put('say.bbl', serializeBlocks(book.finish()));
disk.put('say.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('say.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
disk.put('hero.chr', serializeCharacter(buildHero(heroBlocks)));
// the pass map every talk's scene loads: a little ground, and the hero starts on the exit cell, which
// takes him straight back; its palette is all black, so the trip shows nothing but the talk's own pictures
const passGrid = new Grid(8, 15);
passGrid.row(10, 0, 7, 'G').fill(0, 11, 8, 4, 'D');
passGrid.put(1, 8, 's').put(1, 9, 'S').put(4, 8, 'e').put(4, 9, 'E');
const pass = new StarterMap(book, passGrid.rows());
disk.put('pass.map', serializeMap(pass.done()));
disk.put('pass.pal', serializePalette(new Uint8Array(pal.pal.length)));
disk.put('say.snd', serializeSoundSet(buildSounds()));
disk.put('say.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, book, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// each talk: the friend's one line in a bubble (a picture), then their words (a page, or two)
disk.put('talk.gif', gif(paper(pal, book, 'A FRIEND SAYS'), pal));
let talkNo = 0;
for (const l of levels)
  for (const t of l.talks) {
    const base = talkFile(t.who, ++talkNo);
    disk.put(`${base}.gif`, gif(talkPicture(pal, book, talkerPicture(pal, t.who), hero, BUBBLE_LINES[t.who], 40 + talkNo), pal));
    const pages = SAYS[t.who].map((body, i) => {
      const name = i ? `${base}${String.fromCharCode(97 + i)}.txt` : `${base}.txt`;
      disk.put(name, body);
      return { name, pause: 12 };
    });
    disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 4 }, { name: 'talk.gif', pause: 0 }, ...pages]));
  }

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, book, hero, talkerPicture(pal, 'pip'), TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'GOOD TALKERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'SAY SOMETHING', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'WELL SAID!', 'THREE FRIENDS HEARD', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'ALL SAID'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'TAKE YOUR TIME READING', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('say.gam', serializeGame(buildGame(levels, pass)));
disk.put('license.txt', licenseText('Say Something'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${monsterBlocks.index.size} monster blocks, ${heroBlocks.index.size} hero blocks`);
