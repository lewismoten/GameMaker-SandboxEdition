// Builds every file of a graduation game into its disk/ folder: the shared data (palette, blocks, hero,
// monsters, sounds, song), the hall's map and card, the title, menu and ending pictures and the text pages.
// A game's build.ts only names its folder, its Graduation (graduationConfig.ts), its levels and its demo.
import { join } from 'node:path';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { clipEveryList } from '@lewismoten/gamemaker-sandbox-tools/kit/fliClips';
import { Disk } from '../disk';
import { licenseText } from '../license';
import { STARTER_STING, starterStingFli } from './sting';
import { buildHeroBlocks, heroPicture } from './hero';
import { buildHero } from './heroChar';
import { buildMonsterBlocks, buildMonsters } from './monsters';
import { cardPicture, endPicture, gif, menuPicture, paper, scoresPicture, slotsPicture, titlePicture } from './screens';
import { skyOf } from './palette';
import { SILVER_KEYS } from './locks';
import { POWER } from './graduationNods';
import { buildSounds } from './sounds';
import type { Graduation } from './graduationConfig';
import { TITLE, buildGame } from './graduationGame';
import { finishBlocks } from './graduationHall';
import type { buildLevels } from './graduationLevel';
import { song } from './graduationSong';
import { HOWTO, LOST } from './graduationText';

/** Writes the game's disk: `dir` is the game's folder, `built` its levels (buildLevels), `demo` its DEMO.REC bytes. */
export function buildGraduation(dir: string, cfg: Graduation, built: ReturnType<typeof buildLevels>, demo: Uint8Array): void {
  const disk = new Disk(join(dir, 'disk'));
  const { book, pal, levels } = built;
  const { STORY, WON, CREDITS } = { STORY: cfg.text.story, WON: cfg.text.won, CREDITS: cfg.text.credits };
  const title = cfg.title ?? TITLE;
  const heroBlocks = buildHeroBlocks(pal);
  const monsterBlocks = buildMonsterBlocks(pal);
  const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
  const cheer = heroPicture(heroBlocks, 'cheer.top', 'jump');
  // the exit door as a picture to stand in the scenes: its sky made clear
  const door = heroPicture(book, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));

  // the game's shared data: one block set, one palette, one hero, one set of monsters, one song
  disk.put('grad.pal', serializePalette(pal.pal));
  for (const l of levels) disk.put(`${l.bbl}.bbl`, serializeBlocks(finishBlocks({ book: l.book, timed: l.timed })));
  disk.put('grad.mbl', serializeBlocks(monsterBlocks.finish()));
  disk.put('grad.mon', serializeMonsters(buildMonsters(monsterBlocks)));
  disk.put('hero.cbl', serializeBlocks(heroBlocks.finish()));
  const character = buildHero(heroBlocks);
  // the arrival's counting gates use these counters, which (like the key counter) start at 1: a count of none
  if (levels.some((l) => l.book.has('tokenGate'))) character.meter[SILVER_KEYS] = 1;
  if (levels.some((l) => l.book.has('powerGate'))) character.meter[POWER] = 1;
  disk.put('hero.chr', serializeCharacter(character));
  disk.put('grad.snd', serializeSoundSet(buildSounds()));
  disk.put('grad.cmf', song(cfg.song));

  // each level's map and its card
  levels.forEach((l, i) => {
    disk.put(`${l.file}.map`, serializeMap(l.map.done()));
    disk.put(`${l.file}.gif`, gif(cardPicture(pal, l.book, hero, i + 1, levels.length, l.title, l.hint), pal));
    disk.put(`${l.file}.lst`, serializeSlideList([{ name: `${l.file}.gif`, pause: 3 }]));
  });

  // pictures and words
  const text = (base: string, heading: string, body: string) => {
    disk.put(`${base}.gif`, gif(paper(pal, book, heading), pal));
    disk.put(`${base}.txt`, body);
    disk.put(`${base}.lst`, serializeSlideList([{ name: `${base}.gif`, pause: 0 }, { name: `${base}.txt` }]));
  };
  disk.put('title.gif', gif(titlePicture(pal, book, hero, door, title, cfg.upper), pal));
  disk.put(STARTER_STING, starterStingFli(cfg.id));
  disk.put(
    'title.lst',
    serializeSlideList([
      { name: STARTER_STING, pause: 0 },
      { name: 'title.gif', pause: 12 },
    ]),
  );
  disk.put('menu.gif', gif(menuPicture(pal, book, hero, title), pal));
  disk.put('scores.gif', gif(scoresPicture(pal, book, 'THE GRADUATES'), pal));
  disk.put('loadgame.gif', gif(slotsPicture(pal, book, 'LOAD GAME'), pal));
  disk.put('savegame.gif', gif(slotsPicture(pal, book, 'SAVE GAME'), pal));
  text('story', 'THE HALL', STORY);
  text('howto', 'HOW TO PLAY', HOWTO);
  text('credits', 'CREDITS', CREDITS);
  disk.put('wonpic.gif', gif(endPicture(pal, book, cheer, cfg.endTitle ?? 'HONORS!', cfg.honors, 'won'), pal));
  disk.put('won.gif', gif(paper(pal, book, 'WELL DONE'), pal));
  disk.put('won.txt', WON);
  disk.put('won.lst', serializeSlideList([{ name: 'wonpic.gif', pause: 6 }, { name: 'won.gif', pause: 0 }, { name: 'won.txt' }]));
  disk.put('lostpic.gif', gif(endPicture(pal, book, heroPicture(heroBlocks, 'hurt.top', 'hurt'), 'OOPS!', 'EVERYONE FALLS SOMETIMES', 'lost'), pal));
  disk.put('lost.gif', gif(paper(pal, book, 'TRY AGAIN'), pal));
  disk.put('lost.txt', LOST);
  disk.put('lost.lst', serializeSlideList([{ name: 'lostpic.gif', pause: 5 }, { name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]));

  disk.put('demo.rec', demo);
  disk.put('grad.gam', serializeGame(buildGame(levels, title)));
  disk.put('license.txt', licenseText(cfg.stage));
  clipEveryList(disk.files);
  disk.write();
  console.log(`${cfg.id}: ${book.index.size} blocks, ${monsterBlocks.index.size} monster blocks, ${heroBlocks.index.size} hero blocks`);
}
