// lark.gam: the scene graph, and every map and monster list it loads.
//
//   0 title   1 the end   2 the library   3 the Long Road (first leg)
//   4 chapter 1's card    5 the square at 6:59   6 the tower   7 the belfry   8 the square at seven
//   9..12 the talks (the storybook, the workbench, Doc Leo, Doc Leo at seven)   13 the bell
//
// A talk, a chapter card and the bell are pass scenes (levels/pass.ts): their intro picture is the
// point, and they link straight on. PLAYGAME shows a scene's intro on every way in, so no place
// Joe comes back to (from a talk) has an intro of its own: chapter 1's card is a pass scene on the
// way in from the road instead.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { Light } from './art/pal';
import { townSet } from './blocks/town';
import { towerSet } from './blocks/tower';
import { BlockSet, Bestiary } from './blocks/sets';
import { buildHero, buildSide, heroBlocks } from './characters';
import { SCENE } from './ids';
import { belfryMap, squareMap, towerMap } from './levels/clock';
import { libraryMap } from './levels/library';
import { giftCell, passMap, type Gift } from './levels/pass';
import { roadMap } from './levels/road';
import { mark, type Stamped } from './levels/stamp';
import { critterBlocks, squareCritters, towerCritters } from './sprites/critters';
import { TITLE } from './screens/text';

export const GAM = 'lark.gam';

export interface Place {
  scene: number;
  desc: string;
  /** Base name of its .pal, .map and (if it has monsters) .mon. */
  file: string;
  light: Light;
  set: 'town' | 'tower';
  hero: 'hero' | 'side';
  song: string;
  stamped: Stamped;
  mons?: Bestiary;
  intro?: string;
}

export interface Compiled {
  game: Game;
  places: Place[];
  sets: { town: BlockSet; tower: BlockSet };
  mb: BlockSet;
  hero: ReturnType<typeof buildHero>;
  side: ReturnType<typeof buildSide>;
  cb: BlockSet;
  pass: Stamped;
}

const below = (p: { x: number; y: number }) => ({ x: p.x, y: p.y + 1 });

function noLinks(): Link[] {
  return Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
}

export function compile(): Compiled {
  const town = townSet();
  const tower = towerSet();
  const mb = critterBlocks();
  const cb = heroBlocks();
  const hero = buildHero(cb);
  const side = buildSide(cb);
  const pass = passMap(town);
  const squareMons = squareCritters(mb);
  const towerMons = towerCritters(mb);

  const library = libraryMap(town);
  const road = roadMap(town);
  const square = squareMap(town, squareMons, false);
  const square7 = squareMap(town, squareMons, true);
  const inside = towerMap(tower, towerMons);
  const belfry = belfryMap(tower);

  const place = (p: Omit<Place, 'stamped'> & { stamped: Stamped }): Place => p;
  const passPlace = (scene: number, desc: string, song: string, intro: string): Place =>
    place({ scene, desc, file: 'pass', light: 'black', set: 'town', hero: 'hero', song, stamped: pass, intro });
  const places: Place[] = [
    place({ scene: SCENE.library, desc: 'Closing Time', file: 'library', light: 'lamp', set: 'town', hero: 'hero', song: 'library', stamped: library }),
    place({ scene: SCENE.road1, desc: 'The Long Road', file: 'road1', light: 'evening', set: 'town', hero: 'hero', song: 'road', stamped: road }),
    passPlace(SCENE.card1, 'Chapter One', 'square', 'card1.lst'),
    place({
      scene: SCENE.square,
      desc: 'The Square, 6:59',
      file: 'square',
      light: 'evening',
      set: 'town',
      hero: 'hero',
      song: 'square',
      stamped: square,
      mons: squareMons,
    }),
    place({
      scene: SCENE.tower,
      desc: 'The Clock Tower',
      file: 'tower',
      light: 'clock',
      set: 'tower',
      hero: 'side',
      song: 'tower',
      stamped: inside,
      mons: towerMons,
    }),
    place({ scene: SCENE.belfry, desc: 'The Belfry', file: 'belfry', light: 'clock', set: 'tower', hero: 'side', song: 'tower', stamped: belfry }),
    place({
      scene: SCENE.square7,
      desc: 'The Square, Seven',
      file: 'square7',
      light: 'evening',
      set: 'town',
      hero: 'hero',
      song: 'parade',
      stamped: square7,
      mons: squareMons,
    }),
    passPlace(SCENE.talkBook, 'The Storybook', 'library', 'talkbook.lst'),
    passPlace(SCENE.talkBench, 'The Workbench', 'library', 'talkbnch.lst'),
    passPlace(SCENE.talkLeo, 'Doc Leo', 'square', 'talkleo.lst'),
    passPlace(SCENE.talkLeo7, 'Doc Leo at Seven', 'parade', 'talkleo7.lst'),
    passPlace(SCENE.bell, 'Seven Bells', 'parade', 'bell.lst'),
  ];

  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'title.cmf',
    'menu.gif',
    'menu.cmf',
    'story.lst',
    'story.cmf',
    'help.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The Road Goes On';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];
  const top = Math.max(...places.map((p) => p.scene));
  for (let s = 2; s <= top; s++) {
    const p = places.find((q) => q.scene === s);
    if (!p) throw new Error(`no place for scene ${s}`);
    const sc: Scene = emptyScene(ADVTYPE);
    sc.desc = p.desc.slice(0, 19);
    sc.pos = { x: 20 + ((s - 2) % 6) * 48, y: 30 + Math.floor((s - 2) / 6) * 40 };
    sc.files = [
      `${p.file}.pal`,
      `${p.file}.map`,
      `${p.set}.bbl`,
      p.mons ? `${p.file}.mon` : '',
      p.mons ? 'lark.mbl' : '',
      `${p.hero}.chr`,
      `${p.hero === 'side' ? 'side' : 'hero'}.cbl`,
      'lark.snd',
      `${p.song}.cmf`,
      p.intro ?? '',
      '',
      ...new Array(9).fill(''),
    ];
    sc.links = noLinks();
    game.scenes.push(sc);
  }
  const used = new Map<number, number>();
  const link = (scene: number, from: { x: number; y: number }, toScene: number, to: { x: number; y: number }) => {
    const i = used.get(scene) ?? 0;
    if (i >= MAXSCENELINKS) throw new Error(`scene ${scene} has too many links`);
    used.set(scene, i + 1);
    game.scenes[scene].links[i] = { toScene, from, to };
  };
  /** A talk: walking onto `at` in `scene` goes to the pass scene `talk`, which gives `gift` and comes back to `back`. */
  const talk = (scene: number, at: { x: number; y: number }, talkScene: number, gift: Gift, back: { x: number; y: number }) => {
    const cell = giftCell(pass, gift);
    link(scene, at, talkScene, cell);
    link(talkScene, cell, scene, back);
  };
  const pass1 = (passScene: number, toScene: number, to: { x: number; y: number }) => link(passScene, giftCell(pass, 'none'), toScene, to);

  // the library: the storybook and the workbench are talks; the little red door goes out to the road
  talk(SCENE.library, mark(library, 'k'), SCENE.talkBook, 'none', below(mark(library, 'k')));
  talk(SCENE.library, mark(library, 'b'), SCENE.talkBench, 'ready', below(mark(library, 'b')));
  link(SCENE.library, mark(library, 'G'), SCENE.road1, mark(road, '@'));
  // the road: north up the first lane to chapter 1 (by its card); east through the gate, the road goes on
  link(SCENE.road1, mark(road, 'L'), SCENE.card1, giftCell(pass, 'none'));
  pass1(SCENE.card1, SCENE.square, mark(square, '@'));
  link(SCENE.road1, mark(road, 'E'), SCENE.end, { x: 0, y: 0 });
  // the square at 6:59: Doc Leo, the tower door, and back down the lane
  talk(SCENE.square, mark(square, 'L'), SCENE.talkLeo, 'none', below(mark(square, 'L')));
  link(SCENE.square, mark(square, 'd'), SCENE.tower, mark(inside, '@'));
  link(SCENE.square, mark(square, 'S'), SCENE.road1, mark(road, 'r'));
  // the tower: the door back out, the hatch up; the belfry's bell rope rings seven
  link(SCENE.tower, mark(inside, 'D'), SCENE.square, below(mark(square, 'd')));
  link(SCENE.tower, mark(inside, 'X'), SCENE.belfry, mark(belfry, '@'));
  link(SCENE.belfry, mark(belfry, 'R'), SCENE.bell, giftCell(pass, 'none'));
  pass1(SCENE.bell, SCENE.square7, mark(square7, '@'));
  // the square at seven: Doc Leo's thank-you (back inside his corner, by the key), and home down the lane
  talk(SCENE.square7, mark(square7, 'L'), SCENE.talkLeo7, 'thanks', below(mark(square7, 'L')));
  link(SCENE.square7, mark(square7, 'S'), SCENE.road1, mark(road, 'r'));

  title.links[0] = { toScene: SCENE.library, from: { x: 0, y: 0 }, to: mark(library, '@') };
  return { game, places, sets: { town, tower }, mb, hero, side, cb, pass };
}
