// brief.gam: the scene graph.
//
//   0  title             1  the end (won / lost)
//   2  the reading room  3  the Reserve Stacks  4  the thirty-third book's card
//   then for each wing: its hallway, its four books, and its four story cards.
//
// PLAYGAME shows a scene's intro graphic on every way in, so the hallways and the reading
// room have none; each book has its cover page (Joe's note and the word count), and each
// story card scene has the story itself. A card is the book's own files with Joe starting on
// a link that sends him straight back to the hallway, so the story shows once, as he leaves.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { CompiledHub } from './levels/hub';
import type { CompiledWing } from './levels/wing';

export const TITLE = 'KEEP IT BRIEF!';
export const GAM = 'brief.gam';

function noLinks(): Link[] {
  return Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
}

const files = (area: string, song: string, intro = '') => [
  'brief.pal',
  `${area}.map`,
  `${area}.bbl`,
  `${area}.mon`,
  `${area}.mbl`,
  'joe.chr',
  'joe.cbl',
  'joe.snd',
  song,
  intro,
  '',
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
  card: (w: number, k: number) => number;
}

export function sceneIds(): SceneIds {
  return {
    room: 2,
    stacks: 3,
    card33: 4,
    hall: (w) => 5 + w * 9,
    book: (w, k) => 5 + w * 9 + 1 + k,
    card: (w, k) => 5 + w * 9 + 5 + k,
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

  const lib = (intro = '') => files('library', 'library.cmf', intro);
  const room = scene('The Reading Room', lib(), 150, 70);
  const stacks = scene('The Reserve Stacks', lib(), 150, 110);
  const card33 = scene('Christmas Hotel WIP', lib('b33.lst'), 150, 150);
  game.scenes.push(room, stacks, card33);

  room.links[8] = { toScene: id.stacks, from: hub.toStacks, to: hub.stacks.entry };
  stacks.links[0] = { toScene: id.room, from: hub.fromStacks, to: hub.room.entry };
  stacks.links[1] = { toScene: id.card33, from: hub.book33, to: hub.stacks.entry };
  card33.links[0] = { toScene: 1, from: hub.stacks.entry, to: { x: 0, y: 0 } };

  wings.forEach((w, wi) => {
    const { area } = w;
    const f = (intro = '') => files(area.file, `${area.file}.cmf`, intro);
    const x = 20 + (wi % 4) * 80;
    const y = wi < 4 ? 20 : 120;
    const hall = scene(w.spec.wing.name, f(), x, y);
    if (game.scenes.length !== id.hall(wi)) throw new Error('Scene numbers out of step');
    game.scenes.push(hall);
    room.links[wi] = { toScene: id.hall(wi), from: hub.doors[wi], to: w.hall.entry };
    hall.links[4] = { toScene: id.room, from: w.door, to: hub.room.entry };
    w.books.forEach((b, k) => {
      const book = scene(`Book ${b.spec.n}`, f(`c${b.spec.n}.lst`), x + k * 14, y + 20);
      hall.links[k] = { toScene: id.book(wi, k), from: w.spines[k], to: b.win.entry };
      book.links[0] = { toScene: id.card(wi, k), from: b.end, to: b.win.entry };
      book.links[1] = { toScene: id.hall(wi), from: b.cover, to: w.hall.entry };
      game.scenes.push(book);
    });
    w.books.forEach((b, k) => {
      const card = scene(`Story ${b.spec.n}`, f(`s${b.spec.n}.lst`), x + k * 14, y + 40);
      card.links[0] = { toScene: id.hall(wi), from: b.win.entry, to: w.hall.entry };
      game.scenes.push(card);
    });
  });
  title.links[0] = { toScene: id.room, from: { x: 0, y: 0 }, to: hub.room.entry };
  return game;
}
