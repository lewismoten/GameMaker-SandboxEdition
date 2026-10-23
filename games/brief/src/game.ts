// brief.gam: the scene graph.
//
//   0  title             1  the end (won / lost)
//   2  the reading room  3  the Reserve Stacks  4  the thirty-third book's card
//   then for each wing: its hallway and its four books;
//   45 the Lost and Found (behind the loose shelf in the Stacks; the felt egg).
//   46 the reading nook (behind a gap in the Other Dimensions hallway's shelves; the tin
//      heart and the Easter egg). The only scene that scrolls: two windows wide, so its far
//      end is off screen as Joe comes in.
//
// PLAYGAME shows a scene's intro graphic on every way in and its exit graphic on every way
// out, so the hallways and the reading room have neither. A book's intro is its cover page
// (Joe's note and the word count); its exit graphic is the story itself, and its only way out
// is the bookmark behind THE END, so the story shows exactly when it has been put back.
// The thirty-third book's card is a pass-through scene (Joe starts on its link): it loads
// dark.pal, all black, so PLAYGAME's fade in and out of its map happens unseen.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { CompiledHub } from './levels/hub';
import type { CompiledWing } from './levels/wing';

export const TITLE = 'KEEP IT BRIEF!';
export const GAM = 'brief.gam';

function noLinks(): Link[] {
  return Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
}

const files = (area: string, song: string, intro = '', exit = '', pal = 'brief.pal') => [
  pal,
  `${area}.map`,
  `${area}.bbl`,
  `${area}.mon`,
  `${area}.mbl`,
  'joe.chr',
  'joe.cbl',
  'joe.snd',
  song,
  intro,
  exit,
  ...new Array(9).fill(''),
];

function scene(desc: string, f: string[], x: number, y: number): Scene {
  const s = emptyScene(ADVTYPE);
  s.desc = desc.slice(0, 19);
  s.pos = { x, y };
  s.scroll = { ...s.scroll, up: 0, down: 0, left: 0, right: 0 };
  s.files = f;
  s.links = noLinks();
  return s;
}

export interface SceneIds {
  room: number;
  stacks: number;
  card33: number;
  hall: (w: number) => number;
  book: (w: number, k: number) => number;
  lost: number;
  nook: number;
}

export function sceneIds(): SceneIds {
  return {
    room: 2,
    stacks: 3,
    card33: 4,
    hall: (w) => 5 + w * 5,
    book: (w, k) => 5 + w * 5 + 1 + k,
    lost: 5 + 8 * 5,
    nook: 5 + 8 * 5 + 1,
  };
}

export function buildGame(hub: CompiledHub, wings: CompiledWing[]): Game {
  const game = newGame(TITLE);
  const id = sceneIds();
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
  end.desc = 'Exactly One Hundred';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  const lib = (intro = '', pal?: string) => files('library', 'library.cmf', intro, '', pal);
  const room = scene('The Reading Room', lib(), 150, 70);
  const stacks = scene('The Reserve Stacks', lib(), 150, 110);
  const card33 = scene('Christmas Hotel WIP', lib('b33.lst', 'dark.pal'), 150, 150);
  game.scenes.push(room, stacks, card33);

  room.links[8] = { toScene: id.stacks, from: hub.toStacks, to: hub.stacks.entry };
  stacks.links[0] = { toScene: id.room, from: hub.fromStacks, to: hub.room.entry };
  stacks.links[1] = { toScene: id.card33, from: hub.book33, to: hub.stacks.entry };
  card33.links[0] = { toScene: 1, from: hub.stacks.entry, to: { x: 0, y: 0 } };

  wings.forEach((w, wi) => {
    const { area } = w;
    const f = (intro = '', exit = '') => files(area.file, `${area.file}.cmf`, intro, exit);
    const x = 20 + (wi % 4) * 80;
    const y = wi < 4 ? 20 : 120;
    const hall = scene(w.spec.wing.name, f(), x, y);
    if (game.scenes.length !== id.hall(wi)) throw new Error('Scene numbers out of step');
    game.scenes.push(hall);
    room.links[wi] = { toScene: id.hall(wi), from: hub.doors[wi], to: w.hall.entry };
    hall.links[4] = { toScene: id.room, from: w.door, to: hub.room.entry };
    w.books.forEach((b, k) => {
      const book = scene(`Book ${b.spec.n}`, f(`c${b.spec.n}.lst`, `s${b.spec.n}.lst`), x + k * 14, y + 20);
      hall.links[k] = { toScene: id.book(wi, k), from: w.spines[k], to: b.win.entry };
      book.links[0] = { toScene: id.hall(wi), from: b.end, to: w.hall.entry };
      game.scenes.push(book);
    });
  });
  // the Lost and Found: in through the loose shelf, out by its door, which shows the felt
  // egg's page (its exit graphic) and puts Joe back in the Stacks
  const lost = scene('Lost and Found', files('library', 'library.cmf', '', 'egg.lst'), 230, 110);
  if (game.scenes.length !== id.lost) throw new Error('Scene numbers out of step');
  game.scenes.push(lost);
  stacks.links[2] = { toScene: id.lost, from: hub.looseShelf, to: hub.lost.entry };
  lost.links[0] = { toScene: id.stacks, from: hub.lostOut, to: hub.stacks.entry };
  // the reading nook: in through the gap in a hallway's shelves, out by its door to the hallway
  const wi = wings.findIndex((w) => w.nook);
  const nook = wings[wi].nook!;
  const nookScene = scene('Reading Nook', files(wings[wi].area.file, `${wings[wi].area.file}.cmf`), 310, 110);
  nookScene.scroll = { ...nookScene.scroll, left: 0xff, right: 0xff };
  if (game.scenes.length !== id.nook) throw new Error('Scene numbers out of step');
  game.scenes.push(nookScene);
  game.scenes[id.hall(wi)].links[5] = { toScene: id.nook, from: nook.gap, to: nook.entry };
  nookScene.links[0] = { toScene: id.hall(wi), from: nook.out, to: wings[wi].hall.entry };
  title.links[0] = { toScene: id.room, from: { x: 0, y: 0 }, to: hub.room.entry };
  return game;
}
