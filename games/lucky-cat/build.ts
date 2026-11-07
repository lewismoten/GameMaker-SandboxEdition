// LUCKY CAT (Sandbox Software, 1994): builds every file of the game into games/lucky-cat/disk/.
//   cd web && npx vite-node ../games/lucky-cat/build.ts
// A Special: a limited-time game that arrives around Friday the 13th. Midnight, a black cat, is blamed for the
// town's bad luck and gathers 13 lucky charms to prove she is lucky.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { clipEveryList } from '@lewismoten/gamemaker-sandbox-tools/kit/fliClips';
import { Disk } from '../kit/disk';
import { licenseText } from '../kit/license';
import { buildHero } from '../kit/starter/heroChar';
import { SEQ } from '../kit/starter/ids';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { buildCatBlocks, catPicture } from './src/cat';
import { CHARMS, charmSprite } from './src/charms';
import { TITLE, buildGame } from './src/game';
import { finishBlocks } from './src/level';
import { buildLevels } from './src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from './src/monsters';
import { LOOKS, swapped } from './src/palette';
import { rascalPicture, revealCard, storyCard, titlePicture } from './src/pictures';
import { endingReel, introReel, REEL_SPEED } from './src/reels';
import { SONGS, song } from './src/song';
import { CARDS, CREDITS, HOWTO, LOST, REVEAL, STORY, WON } from './src/text';
import { demoRecording } from './src/demo';
import { SANDLOGO, sandLogoFli } from '../kit/sandlogo';

/** Hit points and lives at the start (bad luck takes five). */
const HERO_HIT_POINTS = 50;
const HERO_LIVES = 3;

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const heroBlocks = buildCatBlocks(pal);
const cat = catPicture(heroBlocks, 'stand.top', 'stand');
const cheer = catPicture(heroBlocks, 'cheer.top', 'jump');
const hurt = catPicture(heroBlocks, 'hurt.top', 'hurt');
const base = levels[0].book;
const monsterBlocks = monsterPictures(pal);

// the shared data: the cat, her two characters (the second swaps Left and Right), the crows, the sounds and the songs
disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[0] = HERO_HIT_POINTS;
heroChar.meter[1] = HERO_LIVES;
disk.put('hero.chr', serializeCharacter(heroChar));
disk.put('mirror.chr', serializeCharacter(mirrored(heroChar)));
disk.put('crow.mbl', serializeBlocks(finishMonsterPictures(monsterBlocks)));
disk.put('crow.mon', serializeMonsters(monsterSet(monsterBlocks)));
disk.put('lucky.snd', serializeSoundSet(buildSounds()));
for (const s of SONGS) disk.put(`${s}.cmf`, song(s));

/** The same character with its Left and Right keys (and A and D) swapped: the mirror's trick. */
function mirrored(ch: Character): Character {
  const out = structuredClone(ch);
  const swap = (a: number, b: number) => {
    const t = out.sequences[a].key;
    out.sequences[a].key = out.sequences[b].key;
    out.sequences[b].key = t;
    const j = out.sequences[a].jstkMov;
    out.sequences[a].jstkMov = out.sequences[b].jstkMov;
    out.sequences[b].jstkMov = j;
  };
  swap(SEQ.right, SEQ.left);
  swap(SEQ.rightD, SEQ.leftA);
  return out;
}

// each level: its look, map, block set and the pictures it opens with (a card, then its story notes)
levels.forEach((l, i) => {
  const look = l.look ? swapped(pal, LOOKS[l.look]) : pal.pal;
  const lp = { ...pal, pal: look };
  disk.put(`${l.file}.pal`, serializePalette(look));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBlocks(l)));
  const slides = [{ name: `${l.file}.gif`, pause: 3 }];
  disk.put(`${l.file}.gif`, gif(cardPicture(lp, base, cat, i + 1, levels.length, l.title, l.hint), lp));
  (CARDS[l.file] ?? []).forEach((lines, k) => {
    disk.put(`${l.file}s${k}.gif`, gif(storyCard(lp, base, cat, lines, 40 + i * 3 + k), lp));
    slides.push({ name: `${l.file}s${k}.gif`, pause: 5 });
  });
  disk.put(`${l.file}.lst`, serializeSlideList(slides));
});

// pictures and words
const text = (name: string, heading: string, body: string) => {
  disk.put(`${name}.gif`, gif(paper(pal, base, heading), pal));
  disk.put(`${name}.txt`, body);
  disk.put(`${name}.lst`, serializeSlideList([{ name: `${name}.gif`, pause: 0 }, { name: `${name}.txt` }]));
};
disk.put(
  'title.gif',
  gif(
    titlePicture(
      pal,
      base,
      cat,
      CHARMS.map((n) => charmSprite(pal, n)),
      TITLE,
      'A FRIDAY THE 13TH SPECIAL',
    ),
    pal,
  ),
);
disk.put(SANDLOGO, sandLogoFli());
disk.put('intro.fli', introReel(pal, base, cat).fli(REEL_SPEED));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, base, cat, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, base, 'LUCKIEST CATS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, base, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, base, 'SAVE GAME'), pal));
text('story', 'LUCKY CAT', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
const rascal = rascalPicture(pal, levels[levels.length - 1].book);
REVEAL.forEach((lines, k) => disk.put(`reveal${k}.gif`, gif(revealCard(pal, base, cat, rascal, lines, 60 + k), pal)));
disk.put('ending.fli', endingReel(pal, base, cheer, rascal).fli(REEL_SPEED));
disk.put('wonpic.gif', gif(endPicture(pal, base, cheer, 'LUCKY CAT!', 'THE TOWN CHEERS', 'won'), pal));
disk.put('won.gif', gif(paper(pal, base, 'LUCKIEST CAT'), pal));
disk.put('won.txt', WON);
disk.put(
  'won.lst',
  serializeSlideList([
    ...REVEAL.map((_l, k) => ({ name: `reveal${k}.gif`, pause: 6 })),
    { name: 'ending.fli', pause: 0 },
    { name: 'wonpic.gif', pause: 6 },
    { name: 'won.gif', pause: 0 },
    { name: 'won.txt' },
  ]),
);
disk.put('lostpic.gif', gif(endPicture(pal, base, hurt, 'OH NO!', 'TRY AGAIN', 'lost'), pal));
disk.put('lost.gif', gif(paper(pal, base, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('lucky.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('Lucky Cat'));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${levels.length} levels, ${base.index.size} blocks in the first set, ${heroBlocks.index.size} cat blocks`);
