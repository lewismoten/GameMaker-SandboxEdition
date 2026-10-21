// Everything around the play: pictures, films, music and sound, wired into the scene
// file slots (title, menu, story, instructions, credits, high scores, load/save, the
// planet cards before each landing, the films between places, won and lost).
import { serializeSlideList } from '../../../web/src/formats/graphicScripts';
import { serializeGame } from '../../../web/src/formats/game';
import { serializeHighScores } from '../../../web/src/formats/highscore';
import { dosText } from '../../kit/disk';
import { SANDLOGO, sandLogoFli } from '../../kit/sandlogo';
import type { Built } from './game';
import { buildSongs } from './sound/music';
import { buildSounds } from './sound/sounds';
import {
  type Scan,
  hiscoreScreen,
  menuScreen,
  pageScreen,
  placeCards,
  sectorCards,
  slotScreen,
  storySlides,
  titleScreen,
  wonScreens,
  planetArt,
} from './screens/screens';
import { introFli, launchFli, warpFli, wonFli } from './screens/flics';
import { DESCENT_BIOMES, descentFile, descentFli } from './screens/descent';
import { CREDITS, INSTRUCTIONS } from './screens/text';
import { HAILS, hailPages } from './screens/hails';
import { buildDemo } from './demo';
import { SCENE, SECTORS, allWorlds } from './universe';
import { drawCourier } from './sprites/courier';
import { drawShard } from './blocks/items';

export async function present(b: Built): Promise<void> {
  const put = (name: string, bytes: Uint8Array) => b.files.set(name.toLowerCase(), bytes);
  const putAll = (m: Map<string, Uint8Array>) => m.forEach((v, k) => put(k, v));
  const g = b.game;

  // sound and music
  const snd = buildSounds();
  put('maximus.snd', snd.snd);
  putAll(snd.vocs);
  putAll(buildSongs());

  // films
  put(SANDLOGO, sandLogoFli());
  put('intro.fli', introFli());
  put('warp.fli', warpFli());
  for (const biome of DESCENT_BIOMES) put(descentFile(biome), descentFli(biome));
  put('launch.fli', launchFli());
  put('won.fli', wonFli());

  // title, menu and the start scene's pages
  put('title.gif', titleScreen());
  put(
    'title.lst',
    serializeSlideList([
      { name: SANDLOGO, pause: 0 }, // the Sandbox Software logo, then the game's own intro
      { name: 'intro.fli', pause: 0 },
      { name: 'title.gif', pause: 12 },
    ]),
  );
  put('menu.gif', menuScreen());
  putAll(storySlides());
  put(
    'instbg.gif',
    pageScreen('INSTRUCTIONS', 81, (c) => {
      c.sprite(drawCourier({ arm: [80, 90], gun: 'blaster', flash: 2.5 }), 292, 120, 1);
    }),
  );
  put('instruct.txt', dosText(INSTRUCTIONS));
  put('inst.lst', serializeSlideList([{ name: 'instbg.gif', pause: 0 }, { name: 'instruct.txt' }]));
  put(
    'credbg.gif',
    pageScreen('CREDITS', 82, (c) => {
      planetArt(c, 300, 190, 30, 'crystal', 5);
      for (let k = 0; k < 10; k++) c.sprite(drawShard(k).crop(5, 0, 10, 20), 4, 20 + k * 17, 1);
    }),
  );
  put('credits.txt', dosText(CREDITS));
  put('credits.lst', serializeSlideList([{ name: 'credbg.gif', pause: 0 }, { name: 'credits.txt' }]));
  put('hiscore.gif', hiscoreScreen());
  put('maximus.his', startingScores());
  put('load.gif', slotScreen('LOAD GAME', 91));
  put('save.gif', slotScreen('SAVE GAME', 92));
  putAll(wonScreens());

  // the attract-mode demo, played by the headless engine
  const demo = await buildDemo(b);
  put('demo.rec', demo.rec);
  if (!demo.reached) b.problems.push('demo: the autopilot did not reach the airlock and the warp ring');

  const s0 = g.scenes[SCENE.start];
  s0.files = [
    'title.lst',
    'title.cmf',
    'menu.gif',
    'galaxy.cmf',
    'story.lst',
    'story.cmf',
    'inst.lst',
    'credits.lst',
    'hiscore.gif',
    'load.gif',
    'save.gif',
    b.files.has('demo.rec') ? 'demo.rec' : '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  const s1 = g.scenes[SCENE.end];
  s1.files = ['won.lst', 'triumph.cmf', 'lost.gif', 'lament.cmf', ...new Array(16).fill('')];

  // planet cards: each sector's cards in one tall GIF, a .BKD window per world, and a
  // little slide show per world: the descent film, then its card
  const worlds = allWorlds();
  // and on each card, the world's long-range scan
  const scanOf = (scene: number): Scan | undefined => {
    const info = b.scenes.find((x) => x.scene === scene);
    if (!info) return undefined;
    const blocks = b.sets[info.bbl].blocks;
    const cls = new Uint8Array(10000);
    const def = blocks[0].grav;
    for (let i = 0; i < 10000; i++) {
      const blk = blocks[info.map.cells[i]];
      const y = Math.floor(i / 100);
      if (blk.chHitPt < 0) cls[i] = 3;
      else if (blk.solid & 14) cls[i] = y > 70 ? 2 : 1;
      else if (blk.grav !== def && blk.grav !== 0) cls[i] = 4;
      else if (info.kind === 'ocean' && blk.grav === 0) cls[i] = 5;
      else cls[i] = 0;
    }
    return { cls, arrive: info.arrive, uplink: g.scenes[scene].links[0].from, vault: info.vault };
  };
  SECTORS.forEach((_, k) =>
    putAll(
      sectorCards(
        k,
        worlds.filter((w) => w.sector === k).map((w) => ({ ...w, scan: scanOf(w.scene) })),
      ),
    ),
  );
  // three worlds hail the pod first: the hail, then the landing film and the card
  putAll(hailPages((name) => worlds.find((w) => w.world.name === name)!.scene));
  const hailed = new Set(HAILS.map((h) => h.world));
  for (const w of worlds)
    put(
      `w${w.scene}.lst`,
      serializeSlideList([
        ...(hailed.has(w.world.name) ? [{ name: `w${w.scene}h.bkd` }] : []),
        { name: descentFile(w.world.biome), pause: 0 },
        { name: `w${w.scene}.bkd` },
      ]),
    );
  putAll(
    placeCards([
      {
        file: 'mael',
        title: 'MAELSTROM',
        sub: 'THE WAY TO THE CORE',
        text: 'Two hundred rocks in a storm that never ends. Your weapons are useless here: just fly.',
        biome: 'core',
      },
      {
        file: 'citadel',
        title: 'CITADEL',
        sub: 'AROUND THE CORE',
        text: 'The fortress that guards the dead star. Find the teleporter in its vault.',
        biome: 'station',
      },
      {
        file: 'heart',
        title: 'THE HEART',
        sub: 'MAXIMUS CORE',
        text: 'Crack the Guardian armor with the Plasma Lance. Only a shield orb can touch its eye.',
        biome: 'core',
      },
    ]),
  );

  // scene songs and graphics
  const SONG_OF: Record<string, string> = { ocean: 'ocean.cmf', station: 'station.cmf', rover: 'rover.cmf' };
  for (const info of b.scenes) {
    const sc = g.scenes[info.scene];
    if (info.scene === SCENE.galaxy) {
      sc.files[8] = 'galaxy.cmf';
      sc.files[10] = 'warp.fli';
    } else if (info.scene === SCENE.home) sc.files[8] = 'cradle.cmf';
    else if (info.scene === SCENE.maelstrom) {
      sc.files[8] = 'storm.cmf';
      sc.files[9] = 'mael.bkd';
    } else if (info.scene === SCENE.citadel) {
      sc.files[8] = 'black.cmf';
      sc.files[9] = 'citadel.bkd';
    } else if (info.scene === SCENE.heart) {
      sc.files[8] = 'boss.cmf';
      sc.files[9] = 'heart.bkd';
    } else if (info.kind === 'space') sc.files[8] = `${SECTORS[info.sector!].song}.cmf`;
    else {
      sc.files[8] = SONG_OF[info.kind] ?? `${SECTORS[info.sector!].song}.cmf`;
      sc.files[9] = `w${info.scene}.lst`;
      sc.files[10] = 'launch.fli';
    }
  }
  put('maximus.gam', serializeGame(g));
}

/** A starting top ten, so the high score screen is not empty on a fresh disk. */
export function startingScores(): Uint8Array {
  const names = ['Max', 'Ada Starling', 'Dr. Leo', 'Captain Rook', 'Teddy the Corgi', 'The Night Shift', 'Gwin', 'Letter Carrier', 'Courier 9', 'Sandbox Crew'];
  return serializeHighScores(names.map((name, i) => ({ score: Math.round(250000 / (i + 1) / 10) * 10, name })));
}
