// Builds every file of Sandcastle Knight into games/sandcast/disk/.
//   cd web && npx vite-node ../games/sandcast/build.ts
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serializeBlocks } from '../../web/src/formats/blocks';
import { serializeMonsters } from '../../web/src/formats/monster';
import { serializeMap } from '../../web/src/formats/map';
import { serializeCharacter } from '../../web/src/formats/character';
import { serializeGame } from '../../web/src/formats/game';
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { Disk } from '../kit/disk';
import { BG } from './src/blocks/bblocks';
import { MB, CB } from './src/sprites/sprites';
import { buildMonsters } from './src/characters/monsters';
import { buildCharacter } from './src/characters/character';
import { buildSounds } from './src/sound/sounds';
import { BURROW, DAY, DUSK } from './src/art/palette';
import * as levels from './src/levels/levels';
import { buildGame } from './src/game';
import { filesScreen, gif, introFli, zoomiesFli, lostScreen, menuScreen, messageScreen, scoreScreen, titleScreen, wonScreen } from './src/screens/screens';
import { CREDITS, HELP, INTRO, LOST, README, STORY, WON } from './src/screens/texts';
import { buildDemo } from './src/demo';

const here = dirname(fileURLToPath(import.meta.url));
const disk = new Disk(join(here, 'disk'));

// Shared game data.
disk.put('sandcast.bbl', serializeBlocks(BG.build()));
disk.put('sandcast.mbl', serializeBlocks(MB.build()));
disk.put('sandcast.cbl', serializeBlocks(CB.build()));
disk.put('sandcast.mon', serializeMonsters(buildMonsters()));
disk.put('sandcast.chr', serializeCharacter(buildCharacter()));
disk.put('sandcast.snd', buildSounds());
disk.put('sandcast.pal', DAY);
disk.put('burrow.pal', BURROW);
disk.put('dusk.pal', DUSK);

// Screens.
disk.put('intro.fli', introFli());
disk.put('title.gif', gif(titleScreen()));
disk.put('menu.gif', gif(menuScreen()));
disk.put('scores.gif', gif(scoreScreen()));
disk.put('loadgame.gif', gif(filesScreen('LOAD A SAVED GAME')));
disk.put('savegame.gif', gif(filesScreen('SAVE THIS GAME')));
disk.put('won.gif', gif(wonScreen()));
disk.put('lost.gif', gif(lostScreen()));
const lst = (name: string, entries: [string, number?][]) => disk.put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));
lst('title.lst', [
  ['intro.fli', 0],
  ['title.gif', 12],
]);

/** A text page over a BBS message screen. */
const message = (base: string, subject: string, body: string, from?: string) => {
  disk.put(`${base}.gif`, gif(messageScreen(subject, from)));
  disk.put(`${base}.txt`, body);
  lst(`${base}.lst`, [[`${base}.gif`, 0], [`${base}.txt`]]);
  return `${base}.lst`;
};
const story = message('story', 'The Zoomies of 1995', STORY);
// The story opens with Gwin's zoomies, animated.
disk.put('zoomies.fli', zoomiesFli());
lst('story.lst', [['zoomies.fli', 0], ['story.gif', 0], ['story.txt']]);
const help = message('help', 'How to play', HELP, 'SYSOP');
const credits = message('credits', 'Credits & registering', CREDITS, 'SYSOP');
disk.put('wontxt.gif', gif(messageScreen('Good boy!', 'TEDDY')));
disk.put('won.txt', WON);
lst('won.lst', [['won.gif', 6], ['wontxt.gif', 0], ['won.txt']]);
disk.put('losttxt.gif', gif(messageScreen('Tuckered out', 'GWIN')));
disk.put('lost.txt', LOST);
lst('lost.lst', [['lost.gif', 6], ['losttxt.gif', 0], ['lost.txt']]);

// Playfields.
const L = {
  hub: { name: 'sandbox.map', desc: 'The Sandbox', map: levels.hub(), pal: 'sandcast.pal', pos: { x: 150, y: 80 } },
  keep: { name: 'keep.map', desc: 'Anthill Keep', map: levels.keep(), pal: 'sandcast.pal', pos: { x: 60, y: 120 } },
  moat: { name: 'moat.map', desc: 'Hosewater Moat', map: levels.moat(), pal: 'sandcast.pal', pos: { x: 240, y: 120 } },
  lagoon: { name: 'lagoon.map', desc: 'Low Tide Lagoon', map: levels.lagoon(), pal: 'sandcast.pal', pos: { x: 240, y: 40 } },
  burrows: { name: 'burrows.map', desc: 'Beetle Burrows', map: levels.burrows(), pal: 'burrow.pal', pos: { x: 60, y: 40 } },
  patio: { name: 'patio.map', desc: "Gwin's Nap", map: levels.patio(), pal: 'dusk.pal', pos: { x: 60, y: 160 } },
  bbs: { name: 'bbs.map', desc: 'SANDBOX BBS', map: levels.bbs(), pal: 'sandcast.pal', pos: { x: 240, y: 160 } },
};
const subjects: Record<keyof typeof L, string> = {
  hub: 'Morning in the sandbox',
  keep: 'Level 1: Anthill Keep',
  moat: 'Level 2: Hosewater Moat',
  lagoon: 'Level 3: Low Tide Lagoon',
  burrows: 'Level 4: Beetle Burrows',
  patio: "Level 5: Gwin's nap",
  bbs: 'Secret dial-up!',
};
for (const key of Object.keys(L) as (keyof typeof L)[]) {
  const lv = L[key];
  disk.put(lv.name, serializeMap(lv.map.done()));
  // The sandbox is visited between every castle, so it has no briefing of its own (and the
  // title demo starts there without waiting for a key).
  if (key === 'hub') continue;
  (lv as { intro?: string }).intro = message(key === 'bbs' ? 'bbsintro' : key, subjects[key], INTRO[key], key === 'bbs' ? 'SYSOP' : 'TEDDY');
}

const demo = buildDemo();
disk.put('demo.rec', demo);

const game = buildGame(L, {
  title: 'title.lst',
  menu: 'menu.gif',
  story,
  help,
  credits,
  scores: 'scores.gif',
  load: 'loadgame.gif',
  save: 'savegame.gif',
  demo: 'demo.rec',
  won: 'won.lst',
  lost: 'lost.lst',
});
disk.put('sandcast.gam', serializeGame(game));
disk.put('readme.txt', README);
disk.write();
