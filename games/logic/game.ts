// ohmsweet.gam: the title scene, the ending, one scene per room of the house (all of a
// room's boards share its map), and one "card" scene per board.
//
// PLAYGAME shows a scene's intro graphic every time the scene is played: on every link
// into it (even a link from the scene to itself) and again after every death. Its exit
// graphic plays every time a link is taken out of it. So the room scenes have neither,
// and every board gets a tiny card scene instead: the same files as its room, its own
// title card as the intro graphic, and Watt starting right on a link that sends him on
// into the room scene, onto the same pad. A reboot then restarts the board at once, with
// no card, and every board still gets its own card on the way in.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Scene } from '../../web/src/formats/game';
import type { CompiledRoom } from './board';

export const TITLE = 'OHM SWEET OHM';

function noLinks(): Scene['links'] {
  return Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
}

export function buildGame(rooms: CompiledRoom[], startAt = 0): Game {
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
  end.desc = 'Home Sweet Ohm';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  const boards = rooms.flatMap((r, ri) => r.boards.map((b) => ({ b, ri })));
  const roomScene = (ri: number) => 2 + ri;
  const cardScene = (g: number) => 2 + rooms.length + g;
  const files = (room: string, intro = '') => [
    'watt.pal',
    `${room}.map`,
    `${room}.bbl`,
    `${room}.mon`,
    'parts.mbl',
    'watt.chr',
    'watt.cbl',
    'watt.snd',
    `${room}.cmf`,
    intro,
    '',
    ...new Array(9).fill(''),
  ];
  rooms.forEach((r, ri) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = r.room === 'living' ? 'The Living Room' : `The ${r.room[0].toUpperCase()}${r.room.slice(1)}`;
    scene.pos = { x: 40 + ri * 70, y: 100 };
    scene.scroll = { ...scene.scroll, up: 0, down: 0, left: 0, right: 0 };
    scene.files = files(r.room);
    scene.links = noLinks();
    if (r.boards.length > MAXSCENELINKS) throw new Error(`${r.room}: more boards than links`);
    game.scenes.push(scene);
  });
  boards.forEach(({ b, ri }, g) => {
    const next = boards[g + 1];
    // the room scene: this board's outlet leads to the next board's card (or the ending)
    game.scenes[roomScene(ri)].links[rooms[ri].boards.indexOf(b)] = {
      toScene: next ? cardScene(g + 1) : 1,
      from: b.exit,
      to: next ? next.b.start : { x: 0, y: 0 },
    };
    const card = emptyScene(ADVTYPE);
    card.desc = b.spec.title.slice(0, 19);
    card.pos = { x: 20 + (g % 10) * 28, y: 150 + Math.floor(g / 10) * 20 };
    card.scroll = { ...card.scroll, up: 0, down: 0, left: 0, right: 0 };
    card.files = files(rooms[ri].room, `${b.spec.file}.lst`);
    card.links = noLinks();
    card.links[0] = { toScene: roomScene(ri), from: b.start, to: b.start };
    game.scenes.push(card);
  });
  title.links[0] = { toScene: cardScene(startAt), from: { x: 0, y: 0 }, to: boards[startAt].b.start };
  return game;
}
