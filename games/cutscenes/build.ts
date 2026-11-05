// CUTSCENES (Sandbox Software, 1994): builds every file of the game into games/cutscenes/disk/.
//   cd web && npx vite-node ../games/cutscenes/build.ts
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
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { buildHero } from '../kit/starter/heroChar';
import { buildLevels, finishBlocks } from './src/levels';
import { postcardPicture, titlePicture } from './src/screens';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, SCENE_ONE, STORY, TALE_ONE, TALE_TWO, WON } from './src/text';

/** Hit points and lives at the start (nothing here takes any). */
const HERO_HIT_POINTS = 50;
const HERO_LIVES = 3;
/** Seconds a page of words stays up before the scene goes on by itself (a key turns it sooner). */
const WORDS_FOR = 14;

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, book, timed, scenes } = buildLevels();
const levels = scenes.filter((s) => s.level);
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');

// the game's shared data: one block set, one palette, one hero, an (empty) set of monsters, one song
disk.put('cuts.pal', serializePalette(pal.pal));
disk.put('cuts.bbl', serializeBlocks(finishBlocks(book, timed)));
disk.put('cuts.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('cuts.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[KEYS] = INF_REPEAT; // no keys in this game
heroChar.meter[0] = HERO_HIT_POINTS; // nothing here takes any
heroChar.meter[1] = HERO_LIVES;
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('cuts.snd', serializeSoundSet(buildSounds()));
disk.put('cuts.cmf', song());

// each scene's map (the two tales share one) and each level's card
for (const s of scenes) disk.put(`${s.mapFile}.map`, serializeMap(s.map.done()));
levels.forEach((l, i) => disk.put(`${l.file}.gif`, gif(cardPicture(pal, book, hero, i + 1, levels.length, l.title, l.hint), pal)));

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};

// what a scene shows before it: (the level's card,) a picture for 3 seconds, then a page of words that goes on by itself
const intro = (base: string, head: string, line: string, heading: string, body: string, card: boolean) => {
  disk.put(`${base}p.gif`, gif(postcardPicture(pal, book, cheer, head, line), pal));
  disk.put(`${base}w.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}w.txt`, body);
  disk.put(
    `${base}.lst`,
    serializeSlideList([
      ...(card ? [{ name: `${base}.gif`, pause: 3 }] : []),
      { name: `${base}p.gif`, pause: 3 },
      { name: `${base}w.gif`, pause: 0 },
      { name: `${base}w.txt`, pause: WORDS_FOR },
    ]),
  );
};
intro('one', 'THE SCENE BEGINS', 'A PICTURE, THEN WORDS', 'A SCENE', SCENE_ONE, true);
intro('tale1', 'TALE ONE', 'THE PAPER BOAT', 'THE PAPER BOAT', TALE_ONE, false);
intro('tale2', 'TALE TWO', 'THE LONG WAY ROUND', 'THE LONG WAY ROUND', TALE_TWO, false);
disk.put('hall.lst', serializeSlideList([{ name: 'hall.gif', pause: 3 }]));

disk.put('title.gif', gif(titlePicture(pal, book, hero, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('cutscenes'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'BEST VIEWERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'CUTSCENES', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'CURTAIN!', 'THREE SCENES SEEN', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'THE END'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OH NO!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('cuts.gam', serializeGame(buildGame(scenes)));
disk.put('license.txt', licenseText('Cutscenes'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${heroBlocks.index.size} hero blocks`);
