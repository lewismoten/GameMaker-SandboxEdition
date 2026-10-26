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
//
// PLAYGAME fades every scene's map in before its first tick and fades it out after the
// link is taken, so a pass-through scene would flash the board up and back down before
// the room fades it in again. The card and fuse box page scenes therefore load dark.pal,
// all black: their map fades in and out unseen, and only the room scene shows the board.
// The crawlspace behind the Home Computer is a scene of its own, the only one that scrolls.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Scene } from '../../../web/src/formats/game';
import type { CompiledRoom } from './levels/board';

const TITLE = 'OHM SWEET OHM';

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
  const files = (room: string, intro = '', pal = 'watt.pal') => [
    pal,
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
    card.files = files(rooms[ri].room, `${b.spec.file}.lst`, 'dark.pal');
    card.links = noLinks();
    card.links[0] = { toScene: roomScene(ri), from: b.start, to: b.start };
    game.scenes.push(card);
  });
  // Behind a seam in a board's housing: the fuse box. Its socket leads through a page of
  // text back onto that board's pad.
  rooms.forEach((r, ri) => {
    const fb = r.fusebox;
    if (!fb?.from.seam) return;
    const links = game.scenes[roomScene(ri)].links;
    const free = () => {
      const i = links.findIndex((l) => l.toScene === NOSCENE);
      if (i < 0) throw new Error(`${r.room}: no link left for the fuse box`);
      return i;
    };
    links[free()] = { toScene: roomScene(ri), from: fb.from.seam, to: fb.start };
    const page = emptyScene(ADVTYPE);
    page.desc = 'The Fuse Box';
    page.pos = { x: 40 + ri * 70, y: 60 };
    page.scroll = { ...page.scroll, up: 0, down: 0, left: 0, right: 0 };
    page.files = files(r.room, 'fusebox.lst', 'dark.pal');
    page.links = noLinks();
    page.links[0] = { toScene: roomScene(ri), from: fb.from.start, to: fb.from.start };
    game.scenes.push(page);
    links[free()] = { toScene: game.scenes.length - 1, from: fb.exit, to: fb.from.start };
  });
  // Behind a hatch in a board's housing: the crawlspace, the one scene that scrolls (two
  // boards wide, so its far end is off screen as Watt rolls in). Its hatch out puts Watt back
  // on that board's pad.
  rooms.forEach((r, ri) => {
    const cr = r.crawl;
    if (!cr?.from.hatch) return;
    const links = game.scenes[roomScene(ri)].links;
    const i = links.findIndex((l) => l.toScene === NOSCENE);
    if (i < 0) throw new Error(`${r.room}: no link left for the crawlspace`);
    const crawl = emptyScene(ADVTYPE);
    crawl.desc = 'The Crawlspace';
    crawl.pos = { x: 40 + ri * 70, y: 30 };
    crawl.scroll = { ...crawl.scroll, up: 0, down: 0, left: 0xff, right: 0xff };
    crawl.files = files(r.room);
    crawl.links = noLinks();
    crawl.links[0] = { toScene: roomScene(ri), from: cr.exit, to: cr.from.start };
    game.scenes.push(crawl);
    links[i] = { toScene: game.scenes.length - 1, from: cr.from.hatch, to: cr.start };
  });
  title.links[0] = { toScene: cardScene(startAt), from: { x: 0, y: 0 }, to: boards[startAt].b.start };
  return game;
}
