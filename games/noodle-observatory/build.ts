// THE NOODLE OBSERVATORY (Sandbox Software, 1994): builds every file of the game into games/noodle-observatory/disk/.
//   cd web && npx vite-node ../games/noodle-observatory/build.ts
// A Special: a limited-time game for Monkey Day (December 14). Nell builds a kitchen observatory to find out what the
// round, cheese-colored moon in her window really is, and finds the bakery's round window next door.
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
import { gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import type { Place as PlaceName } from './src/art';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { finishBlocks, type Level } from './src/level';
import { buildLevels } from './src/levels';
import { MON_SETS, finishMonsterPictures, monsterPictures } from './src/monsters';
import { buildNellBlocks, buildRing, buildRingBlocks, nellPicture, sentinels } from './src/nell';
import { lookOf } from './src/palette';
import { endingPicture, notePicture, titlePicture } from './src/pictures';
import { SONGS, song } from './src/song';
import { CARDS, CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const heroBlocks = buildNellBlocks(pal);
const nell = nellPicture(heroBlocks, 'stand.top', 'stand');
const cheer = nellPicture(heroBlocks, 'cheer2.top', 'cheer');
const base = levels[0].book;
const mb = monsterPictures(pal);
const toy = mb.pics.get('toy0')!;

// the shared data: Nell on foot and in the ring, the actors and their two files, the sounds and the songs
disk.put('nell.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
const keep = heroChar.sequences;
sentinels(heroChar);
heroChar.sequences = keep;
disk.put('nell.chr', serializeCharacter(heroChar));
const ringBlocks = buildRingBlocks(pal, heroBlocks);
disk.put('ring.cbl', serializeBlocks(ringBlocks.finish()));
disk.put('ring.chr', serializeCharacter(buildRing(ringBlocks)));
disk.put('noodle.mbl', serializeBlocks(finishMonsterPictures(mb)));
disk.put('kitchen.mon', serializeMonsters(MON_SETS.kitchen(mb)));
disk.put('roof.mon', serializeMonsters(MON_SETS.roof(mb)));
disk.put('noodle.snd', serializeSoundSet(buildSounds()));
for (const s of SONGS) disk.put(`${s}.cmf`, song(s));

/** The place a level's cards show. */
const placeOf = (l: Level): PlaceName =>
  l.hero === 'ring' ? 'pantry' : l.look === 'evening' ? 'lens' : l.look === 'dark' ? 'loft' : l.look === 'night' || l.look === 'reveal' ? 'roof' : 'cupboard';

// each level: its look, map, block set and the pictures it opens with (a card, then its story pages)
levels.forEach((l, i) => {
  const lp = { ...pal, pal: lookOf(pal, l.look) };
  disk.put(`${l.file}.pal`, serializePalette(lp.pal));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBlocks(l)));
  const slides: { name: string; pause: number }[] = [];
  (CARDS[l.file] ?? []).forEach((lines, k) => {
    disk.put(`${l.file.slice(0, 6)}s${k}.gif`, gif(notePicture(lp, placeOf(l), nell, lines), lp));
    slides.push({ name: `${l.file.slice(0, 6)}s${k}.gif`, pause: 8 });
  });
  disk.put(`${l.file}.gif`, gif(notePicture(lp, placeOf(l), nell, [`SCENE ${i + 1} OF ${levels.length}`, l.hint], l.title.toUpperCase()), lp));
  slides.push({ name: `${l.file}.gif`, pause: 4 });
  disk.put(`${l.file}.lst`, serializeSlideList(slides));
});

// pictures and words
const text = (name: string, heading: string, body: string) => {
  disk.put(`${name}.gif`, gif(paper(pal, base, heading), pal));
  disk.put(`${name}.txt`, body);
  disk.put(`${name}.lst`, serializeSlideList([{ name: `${name}.gif`, pause: 0 }, { name: `${name}.txt` }]));
};
const dusk = { ...pal, pal: lookOf(pal, 'dusk') };
disk.put(
  'title.gif',
  gif(
    titlePicture(
      dusk,
      nell,
      toy,
      [
        ['THE NOODLE', 3],
        ['OBSERVATORY', 3],
      ],
      'A KITCHEN-SKY MYSTERY',
    ),
    dusk,
  ),
);
disk.put(SANDLOGO, sandLogoFli());
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'title.gif', pause: 14 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, base, nell, TITLE), pal));
disk.put('scores.gif', gif(scoresPicture(pal, base, 'STARGAZERS'), pal));
disk.put('loadgame.gif', gif(slotsPicture(pal, base, 'LOAD GAME'), pal));
disk.put('savegame.gif', gif(slotsPicture(pal, base, 'SAVE GAME'), pal));
text('story', 'THE MOON', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
const night = { ...pal, pal: lookOf(pal, 'reveal') };
disk.put('wonpic.gif', gif(endingPicture(night, cheer, toy, mb.pics.get('col0')!, 'AN EXCELLENT VIEW', 'OF NEXT DOOR'), night));
disk.put('won.gif', gif(paper(pal, base, 'NEXT DOOR'), pal));
disk.put('won.txt', WON);
disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 8 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
disk.put('lostpic.gif', gif(notePicture(dusk, 'cupboard', nell, ['TRY THAT ROUTE AGAIN.'], 'OOPS!'), dusk));
disk.put('lost.gif', gif(paper(pal, base, 'TRY AGAIN'), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('noodle.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('The Noodle Observatory'));
clipEveryList(disk.files);
disk.write();
console.log(
  `${TITLE}: ${levels.length} scenes; blocks per set ${levels.map((l) => `${l.file} ${l.book.index.size}`).join(', ')}; ${heroBlocks.index.size} hero blocks, ${mb.index.size} actor pictures`,
);
