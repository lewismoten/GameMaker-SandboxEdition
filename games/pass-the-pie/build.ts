// PASS THE PIE (Sandbox Software, 1994, a Special): builds every file of the game into games/pass-the-pie/disk/.
//   cd web && npx vite-node ../games/pass-the-pie/build.ts
// Six streets, two heroes taking turns (Rory's storybook, Mr. Plume's payback), every picture printed in the game's
// own block-print inks (src/print.ts, src/palette.ts), three cartoons, a card for each street, three songs.
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
import { heroPicture } from '../kit/starter/hero';

import { SILVER_KEYS } from '../kit/starter/locks';
import * as art from './src/art';
import { endingFli, introFli, paybackFli } from './src/cartoons';
import { TITLE, buildGame } from './src/game';
import { buildLevels, finishBook } from './src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from './src/monsters';
import { basePal, buildPalette, moodBytes } from './src/palette';
import { buildPlumeBlocks } from './src/plume';
import { buildPlume, buildRory } from './src/plumeChar';
import { buildGameSounds } from './src/sounds';
import { buildRoryBlocks } from './src/rory';
import { cardFli, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture, titlePicture } from './src/screens';
import { chase, gobble, longTable, payback, streetWalk } from './src/song';
import { CREDITS, HOWTO, LOST, STORY, WON } from './src/text';

/** Hit points and lives at the start. */
const HERO_HIT_POINTS = 100;
const HERO_LIVES = 3;

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

const pal = basePal(buildPalette());
const base = pal.pal;
const levels = buildLevels(pal);
const roryBlocks = buildRoryBlocks(pal);
const plumeBlocks = buildPlumeBlocks(pal);
const mb = monsterPictures(pal);
const rory = heroPicture(roryBlocks, 'stand.top', 'stand');
const plume = heroPicture(plumeBlocks, 'stand.top', 'stand');
const plumeKick = heroPicture(plumeBlocks, 'kick1.top', 'throw1');

// the two heroes: each starts with the hit points, the lives and the steel-key counter at 1 (it shows one less)
const heroes = [
  ['rory', roryBlocks, buildRory(roryBlocks)],
  ['plume', plumeBlocks, buildPlume(plumeBlocks)],
] as const;
for (const [name, blocks, ch] of heroes) {
  ch.meter[0] = HERO_HIT_POINTS;
  ch.meter[1] = HERO_LIVES;
  ch.meter[SILVER_KEYS] = 1;
  disk.put(`${name}.cbl`, serializeBlocks(blocks.finish()));
  disk.put(`${name}.chr`, serializeCharacter(ch));
}
disk.put('pass.mbl', serializeBlocks(finishMonsterPictures(mb)));
disk.put('pass.mon', serializeMonsters(monsterSet(mb)));
const sounds = buildGameSounds();
disk.put('pass.snd', serializeSoundSet(sounds.set));
for (const [name, voc] of Object.entries(sounds.vocs)) disk.put(`${name}.voc`, voc);
disk.put('pie.cmf', streetWalk());
disk.put('payback.cmf', payback());
disk.put('table.cmf', longTable());
disk.put('chase.cmf', chase());
disk.put('gobble.cmf', gobble());

// each level: its inks, map, blocks and its card (Mr. Plume's first is led in by the PAYBACK cartoon)
let chapter = 0;
let part = 0;
levels.forEach((l) => {
  const bytes = moodBytes(pal, l.mood);
  const n = l.hero === 'rory' ? ++chapter : ++part;
  const pose = l.hero === 'rory' ? rory : plumeKick;
  disk.put(`${l.file}.pal`, serializePalette(bytes));
  disk.put(`${l.file}.map`, serializeMap(l.map.done()));
  disk.put(`${l.file}.bbl`, serializeBlocks(finishBook(l)));
  disk.put(`${l.file}.fli`, cardFli(pal, bytes, l.hero, n, l.title, l.hint, pose));
  const slides = [{ name: `${l.file}.fli`, pause: 0 }];
  if (l.before) slides.unshift({ name: l.before, pause: 0 });
  disk.put(`${l.file}.lst`, serializeSlideList(slides));
});

const text = (name: string, heading: string, body: string) => {
  disk.put(`${name}.gif`, gif(paper(pal, heading), base));
  disk.put(`${name}.txt`, body);
  disk.put(`${name}.lst`, serializeSlideList([{ name: `${name}.gif`, pause: 0 }, { name: `${name}.txt` }]));
};
disk.put('title.gif', gif(titlePicture(pal, rory, plumeKick, art.pie(pal)), base));
disk.put(SANDLOGO, sandLogoFli());
disk.put('intro.fli', introFli(pal));
disk.put('payback.fli', paybackFli(pal));
disk.put(
  'title.lst',
  serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]),
);
disk.put('menu.gif', gif(menuPicture(pal, plume, TITLE), base));
disk.put('scores.gif', gif(scoresPicture(pal, 'BEST PAYBACKS'), base));
disk.put('loadgame.gif', gif(slotsPicture(pal, 'LOAD GAME'), base));
disk.put('savegame.gif', gif(slotsPicture(pal, 'SAVE GAME'), base));
text('story', 'PASS THE PIE', STORY);
text('howto', 'HOW TO PLAY', HOWTO);
text('credits', 'CREDITS', CREDITS);
disk.put('ending.fli', endingFli(pal));
disk.put('wonpic.gif', gif(endPicture(pal, [rory, plume], 'FULL TABLE', 'THE OVEN WAS NEVER BROKEN', true), base));
disk.put('won.gif', gif(paper(pal, 'THE NEXT MORNING'), base));
disk.put('won.txt', WON);
disk.put(
  'won.lst',
  serializeSlideList([{ name: 'ending.fli', pause: 3 }, { name: 'wonpic.gif', pause: 5 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]),
);
const hurt = [heroPicture(roryBlocks, 'hurt.top', 'hurt'), heroPicture(plumeBlocks, 'hurt.top', 'hurt')];
disk.put('lostpic.gif', gif(endPicture(pal, hurt, 'NOT LIKE THIS', 'BIG GOBBLE STANDS TALL. FOR NOW.', false), base));
disk.put('lost.gif', gif(paper(pal, 'TRY AGAIN'), base));
disk.put('lost.txt', LOST);
disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

disk.put('pass.gam', serializeGame(buildGame(levels)));
disk.put('license.txt', licenseText(TITLE));
clipEveryList(disk.files);
disk.write();
console.log(`${TITLE}: ${levels.map((l) => l.book.index.size).join('/')} blocks, ${roryBlocks.index.size}/${plumeBlocks.index.size} hero blocks`);
