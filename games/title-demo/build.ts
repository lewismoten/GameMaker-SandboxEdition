// MAKE A TITLE (Sandbox Software, 1994): builds every file of the game into games/title-demo/disk/.
//   cd web && npx vite-node ../games/title-demo/build.ts
// One of the Starters: small games that each show one idea (games/kit/starter).
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
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildHero } from '../kit/starter/heroChar';
import { buildLevels, finishBlocks } from './src/levels';
import { menuWithWords, recordsTable, slotsList, titlePicture } from './src/screens';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

/** Hit points and lives at the start (nothing here takes any). */
const HERO_HIT_POINTS = 50;
const HERO_LIVES = 3;

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, book, scenes } = buildLevels();
const levels = scenes;
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: one block set, one palette, one hero, an (empty) set of monsters, one song
disk.put('tdemo.pal', serializePalette(pal.pal));
disk.put('tdemo.bbl', serializeBlocks(finishBlocks(book)));
disk.put('tdemo.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('tdemo.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[KEYS] = INF_REPEAT; // no keys in this game
heroChar.meter[0] = HERO_HIT_POINTS; // nothing here takes any
heroChar.meter[1] = HERO_LIVES;
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('tdemo.snd', serializeSoundSet(buildSounds()));
disk.put('tdemo.cmf', song());

// each scene's map (the two tales share one) and each level's card
for (const s of scenes) disk.put(`${s.mapFile}.map`, serializeMap(s.map.done()));
levels.forEach((l, i) => disk.put(`${l.file}.gif`, gif(cardPicture(pal, book, hero, i + 1, levels.length, l.title, l.hint), pal)));

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};

// the title scene's slots as the Scenes editor lists them (slot, file)
const SLOTS: [string, string][] = [
  ['Title graphic', 'TITLE.LST'],
  ['Title song', 'TDEMO.CMF'],
  ['Menu graphic', 'MENU.GIF'],
  ['Menu song', 'TDEMO.CMF'],
  ['Storyline graphic', 'STORY.LST'],
  ['Storyline song', 'TDEMO.CMF'],
  ['Game instructions', 'HOWTO.LST'],
  ['Beginning credits', 'CREDITS.LST'],
  ['High score backdrop', 'SCORES.GIF'],
  ['Load game background', 'LOAD.GIF'],
  ['Save game background', 'SAVE.GIF'],
  ['Demo recording', 'DEMO.REC'],
];
/** The slots picture, with the rows in `lit` marked and a line or two under it. */
const slots = (lit: number[], lines: string[]) => {
  const p = slotsList(pal, book, SLOTS, lit, 'THE TITLE SCENE');
  lines.forEach((l, i) => centered(p, 170 + i * 11, l, pal.c('wood', 1)));
  return p;
};
disk.put('slots1.gif', gif(slots([0, 2], ['MENU GRAPHIC: THE MENU PICTURE', 'TITLE: A MOVIE, THEN A PICTURE']), pal));
disk.put('slots2.gif', gif(slots([11], ['DEMO RECORDING: KEYS AND WHEN', 'IT PLAYS WHEN THE MENU SITS QUIET']), pal));
disk.put('busy.gif', gif(menuWithWords(pal, book, hero, TITLE, true), pal));
disk.put('plain.gif', gif(menuWithWords(pal, book, hero, TITLE, false), pal));

// the first records of this game's own demo, as DEMO.REC stores them
const KEYNAMES: Record<number, string> = { 77: 'RIGHT', 75: 'LEFT', 57: 'SPACE', 1: 'ESC', 72: 'UP', 80: 'DOWN' };
const demoKeys = parseRecording(demoRecording());
const records: [string, string, string][] = [...demoKeys.slice(0, 5), ...demoKeys.slice(-2)].map((k) => [
  String(k.delta),
  String(k.key),
  `${KEYNAMES[k.key & 0x7f] ?? '?'} ${k.key & 0x80 ? 'LET GO' : 'PRESSED'}`,
]);
records.splice(5, 0, ['...', '...', `${demoKeys.length - 7} MORE`]);
disk.put('records.gif', gif(recordsTable(pal, book, records, `${demoKeys.length} KEY CHANGES OF 1,000`), pal));

// what a level shows before it: its card, then its pictures, each going on by itself
const intro = (base: string, pics: [string, number][]) =>
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 3 }, ...pics.map(([name, pause]) => ({ name, pause }))]));
intro('one', [
  ['slots1.gif', 8],
  ['busy.gif', 7],
  ['plain.gif', 7],
]);
intro('two', [
  ['slots2.gif', 8],
  ['records.gif', 12],
]);

disk.put('title.gif', gif(titlePicture(pal, book, hero, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'BEST VIEWERS'), pal));
disk.put('load.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('save.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'MAKE A TITLE', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'ROLL CREDITS!', 'A TITLE, MADE', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'THE END'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OH NO!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('tdemo.gam', serializeGame(buildGame(scenes)));
disk.put('license.txt', licenseText('Make a Title'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${heroBlocks.index.size} hero blocks`);
