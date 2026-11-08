// THE MOUNTAIN MOVED NEXT DOOR (Sandbox Software, 1994): builds every file of the game into
// games/mountain-next-door/disk/.
//   cd web && npx vite-node ../games/mountain-next-door/build.ts
// A Special: a limited-time game for the day after Thanksgiving. Tess the trail marker finds the mountain in the
// lot next door, finds out why it came (it followed its little cloud into town) and marks a trail to lead it home.
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
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture } from '../kit/starter/screens';
import { buildSounds } from '../kit/starter/sounds';
import { demoRecording } from './src/demo';
import { TITLE, buildGame } from './src/game';
import { finishBlocks } from './src/level';
import { buildLevels } from './src/levels';
import { MON_SETS, finishMonsterPictures, hollowSet, monsterPictures, nextSet, picnicSet, trailSet } from './src/monsters';
import { lookOf } from './src/palette';
import { restage } from './src/art/vista';
import { storyCard, titlePicture } from './src/pictures';
import { REEL_SPEED, endingReel, introReel } from './src/reels';
import { SONGS, song } from './src/song';
import { buildTessBlocks, tessPicture } from './src/tess';
import { CARDS, CREDITS, HOWTO, LOST, STORY, WON } from './src/text';
import { EXCUSE, EXCUSE_COUNTER, excuseVoc, nextSounds } from './src/voice';
import { BEAD_COUNTER } from './src/props';
import { fordSounds, mistSounds, townSounds } from './src/sounds';

/** Hit points and lives at the start (a pebble's bump takes five). */
const HERO_HIT_POINTS = 50;
const HERO_LIVES = 3;

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const { pal, levels } = buildLevels();
const heroBlocks = buildTessBlocks(pal);
const tess = tessPicture(heroBlocks, 'stand.top', 'stand');
const cheer = tessPicture(heroBlocks, 'cheer2.top', 'cheer');
const hurt = tessPicture(heroBlocks, 'hurt.top', 'hurt');
const base = levels[0].book;
const mb = monsterPictures(pal);

// the shared data: Tess, the monster pictures and the four monster files, the sounds and the songs
disk.put('tess.cbl', serializeBlocks(heroBlocks.finish()));
const heroChar = buildHero(heroBlocks);
heroChar.meter[0] = HERO_HIT_POINTS;
heroChar.meter[1] = HERO_LIVES;
heroChar.meter[EXCUSE_COUNTER] = 1; // a counter (not unlimited), so touching the mountain's trigger plays its voice (voice.ts)
heroChar.meter[BEAD_COUNTER] = 1; // the same for a bead of mist (props.ts)
disk.put('tess.chr', serializeCharacter(heroChar));
disk.put('mount.mbl', serializeBlocks(finishMonsterPictures(mb)));
disk.put('trail.mon', serializeMonsters(trailSet(mb)));
disk.put('next.mon', serializeMonsters(nextSet(mb)));
disk.put('hollow.mon', serializeMonsters(hollowSet(mb)));
disk.put('picnic.mon', serializeMonsters(picnicSet(mb)));
disk.put('street.mon', serializeMonsters(MON_SETS.street(mb)));
disk.put('ford.mon', serializeMonsters(MON_SETS.ford(mb)));
disk.put('mount.snd', serializeSoundSet(buildSounds()));
// level 1's own sounds: the mountain's "excuse me" (voice.ts)
disk.put('next.snd', serializeSoundSet(nextSounds()));
disk.put('mist.snd', serializeSoundSet(mistSounds()));
disk.put('town.snd', serializeSoundSet(townSounds()));
disk.put('ford.snd', serializeSoundSet(fordSounds()));
disk.put(`${EXCUSE}.voc`, excuseVoc());
for (const s of SONGS) disk.put(`${s}.cmf`, song(s));

// each level: its look, map, block set and the pictures it opens with (a card, then its story pages)
levels.forEach((l, i) => {
  const lp = { ...pal, pal: lookOf(pal, l.look) };
  disk.put(`${l.file}.pal`, serializePalette(lp.pal));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBlocks(l)));
  const slides = [{ name: `${l.file}.gif`, pause: 4 }];
  disk.put(`${l.file}.gif`, gif(restage(cardPicture(lp, base, tess, i + 1, levels.length, l.title, l.hint), lp, base, 160, 21 + i), lp));
  (CARDS[l.file] ?? []).forEach((lines, k) => {
    const peak =
      l.file === 'next' && k >= 1 ? undefined : { eyes: l.file === 'picnic' ? ('open' as const) : ('open' as const), gates: i < 2, cloud: l.file === 'picnic' };
    disk.put(`${l.file}s${k}.gif`, gif(storyCard(lp, base, tess, lines, 40 + i * 3 + k, l.file === 'next' && k === 0 ? undefined : peak), lp));
    slides.push({ name: `${l.file}s${k}.gif`, pause: 8 });
  });
  disk.put(`${l.file}.lst`, serializeSlideList(slides));
});

// pictures and words
const text = (name: string, heading: string, body: string) => {
  disk.put(`${name}.gif`, gif(restage(paper(pal, base, heading), pal, base, 176, 11), pal));
  disk.put(`${name}.txt`, body);
  disk.put(`${name}.lst`, serializeSlideList([{ name: `${name}.gif`, pause: 0 }, { name: `${name}.txt` }]));
};
disk.put(
  'title.gif',
  gif(
    titlePicture(
      pal,
      base,
      tess,
      [
        ['THE MOUNTAIN', 3],
        ['MOVED NEXT DOOR', 2],
      ],
      'A DAY-AFTER-THANKSGIVING SPECIAL',
    ),
    pal,
  ),
);
disk.put(SANDLOGO, sandLogoFli());
disk.put('intro.fli', introReel(pal, base, tess).fli(REEL_SPEED));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 14 },
  ]),
);
disk.put('menu.gif', gif(restage(menuPicture(pal, base, tess, TITLE), pal, base, 170, 7), pal));
disk.put('scores.gif', gif(restage(scoresPicture(pal, base, 'TRAIL CREW'), pal, base, 176, 13), pal));
disk.put('loadgame.gif', gif(restage(slotsPicture(pal, base, 'LOAD GAME'), pal, base, 176, 11), pal));
disk.put('savegame.gif', gif(restage(slotsPicture(pal, base, 'SAVE GAME'), pal, base, 176, 11), pal));
text('story', 'THE MOUNTAIN', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
const sunrise = { ...pal, pal: lookOf(pal, 'sunrise') };
disk.put('ending.fli', endingReel(pal, base, cheer).fli(REEL_SPEED));
disk.put('wonpic.gif', gif(restage(endPicture(sunrise, base, cheer, 'HOME AGAIN!', 'PLEASE WIPE YOUR FOOTHILLS', 'won'), sunrise, base, 160, 31), sunrise));
disk.put('won.gif', gif(restage(paper(pal, base, 'HOME AGAIN'), pal, base, 176, 11), pal));
disk.put('won.txt', WON);
disk.put(
  'won.lst',
  serializeSlideList([{ name: 'ending.fli', pause: 0 }, { name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]),
);
disk.put('lostpic.gif', gif(restage(endPicture(pal, base, hurt, 'OH NO!', 'TRY AGAIN', 'lost'), pal, base, 160, 37), pal));
disk.put('lost.gif', gif(restage(paper(pal, base, 'TRY AGAIN'), pal, base, 176, 11), pal));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('demo.rec', demoRecording());
disk.put('mountain.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText('The Mountain Moved Next Door'));
clipEveryList(disk.files);
disk.write();
console.log(
  `${TITLE}: ${levels.length} levels; blocks per set ${levels.map((l) => `${l.file} ${l.book.index.size}`).join(', ')}; ${heroBlocks.index.size} hero blocks, ${mb.index.size} monster pictures`,
);
