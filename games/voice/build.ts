// OUT LOUD (Sandbox Software, 1994): builds every file of the game into games/voice/disk/.
//   cd web && npx vite-node ../games/voice/build.ts
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
import { buildHero } from '../kit/starter/heroChar';
import { buildMonsterBlocks, buildMonsters } from '../kit/starter/monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture, titlePicture } from '../kit/starter/screens';
import { skyOf } from '../kit/starter/palette';
import { SEQ } from '../kit/starter/ids';
import { SND_HELLO, ENTER, voiceSounds } from './src/sounds';
import { VOICES } from './src/voices';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { HERO_HIT_POINTS, HERO_LIVES } from './src/hero';
import { buildLevels } from './src/levels';
import { HEARD, SPOKEN } from './src/speakerBlocks';
import { song } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { book, pal, levels } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const monsterBlocks = buildMonsterBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
// a speaker as a picture to stand in the title
const crate = heroPicture(book, 'sky', 'speaker').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

// the game's shared data: one block set, one palette, one hero, an (empty) set of monsters, one song
disk.put('vo.pal', serializePalette(pal.pal));
disk.put('vo.bbl', serializeBlocks(book.finish()));
disk.put('vo.mbl', serializeBlocks(monsterBlocks.finish()));
disk.put('vo.mon', serializeMonsters(buildMonsters(monsterBlocks)));
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[KEYS] = INF_REPEAT; // no keys in this game
heroChar.meter[HEARD] = 2; // the counters the speakers change (a counter shows one less than it holds)
heroChar.meter[SPOKEN] = 2;
// Enter: Kit says hello. The cheer pose is a sequence with no key in the Starter hero; here it gets one and a sound
Object.assign(heroChar.sequences[SEQ.cheer], { key: ENTER, sound: SND_HELLO, norepeat: 1 });
heroChar.meter[0] = HERO_HIT_POINTS;
heroChar.meter[1] = HERO_LIVES;
disk.put('hero.chr', serializeCharacter(heroChar));
// three sound sets, one a level: each names the voice files its level plays
voiceSounds().forEach((set, i) => disk.put(`vo${i + 1}.snd`, serializeSoundSet(set)));
for (const [name, voc] of Object.entries(VOICES)) disk.put(`${name}.voc`, voc);
disk.put('vo.cmf', song());

// each level's map and its card
levels.forEach((l, i) => {
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.gif`, gif(cardPicture(pal, book, hero, i + 1, levels.length, l.title, l.hint), pal));
  disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
});

// pictures and words
const text = (base: string, heading: string, body: string) => {
  disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
  disk.put(`${base}.txt`, body);
  disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, book, hero, crate, TITLE, 'A STARTER GAME'), pal));
disk.put(STARTER_STING, starterStingFli('voice'));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: STARTER_STING, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, book, hero, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, book, 'CHAMPIONS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
text('story', 'OUT LOUD', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, 'WELL SAID!', 'A VOICE FILE PLAYED', 'won'), pal));
disk.put('won.gif', gif(paper(pal, book, 'ALL DONE'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'NOTHING HERE HURTS', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('vo.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Out Loud'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${book.index.size} blocks, ${heroBlocks.index.size} hero blocks`);
