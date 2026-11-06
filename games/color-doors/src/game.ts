// colrdoor.gam: scene 0 is the title and menu, scene 1 the ending, scene 2 the hall, then scenes 3 to 7: one gallery
// scene for each door. All five gallery scenes list the SAME map (gallery.map), the same blocks and the same
// character; only the palette slot differs (as.pal, red1.pal, red2.pal, blue.pal, gray.pal), and the way back lands
// at the door that scene was entered by. A scene lists the files it loads in slots (palette, map, blocks, monsters,
// monster blocks, character, character blocks, sounds, song, a card before it) and carries its links: touch the
// From block here and you are in the To scene, standing on the To cell.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GALLERY_END, GROUND, HALL_DOORS, HALL_FINISH, hallLanding, type Level } from './levels';
import { VIEWS } from './views';
import { ORIGIN } from '../../kit/starter/map';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'COLOR DOORS';

/** The scenes by number. */
export const SCENE = { end: 1, hall: 2 } as const;

export function buildGame(hall: Level, gallery: Level): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'doors.cmf',
    'menu.gif',
    'doors.cmf',
    'story.lst',
    'doors.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'doors.cmf', 'lost.lst', 'doors.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const scene = (desc: string, pal: string, map: string, card: string, x: number, y: number) => {
    const s = emptyScene(ADVTYPE);
    s.desc = desc.slice(0, 19);
    s.pos = { x, y };
    s.files = [pal, map, 'doors.bbl', 'doors.mon', 'doors.mbl', 'hero.chr', 'hero.cbl', 'doors.snd', 'doors.cmf', card, '', ...new Array(9).fill('')];
    s.links = blank();
    return s;
  };
  const feet = (x: number): { x: number; y: number } => ({ x: x + ORIGIN, y: GROUND - 1 + ORIGIN });

  // the hall: one door a view, in the palette as drawn
  const hallScene = scene('The Hall', VIEWS[0].file, `${hall.file}.map`, 'hall.lst', 60, 80);
  HALL_DOORS.forEach((x, i) => {
    hallScene.links[i] = { toScene: VIEWS[i].scene, from: feet(x), to: { x: gallery.map.start[0], y: gallery.map.start[1] } };
  });
  hallScene.links[HALL_DOORS.length] = { toScene: SCENE.end, from: feet(HALL_FINISH), to: { x: 0, y: 0 } };
  game.scenes.push(hallScene);

  // a gallery scene for each view: the same map, its own palette, its own way back
  VIEWS.forEach((v, i) => {
    const s = scene(v.name, v.file, `${gallery.file}.map`, `view${i}.lst`, 140 + i * 40, 80);
    s.links[0] = { toScene: SCENE.hall, from: feet(GALLERY_END), to: { x: hallLanding(i)[0], y: hallLanding(i)[1] } };
    game.scenes.push(s);
  });

  const first = hall.map.start;
  title.links[0] = { toScene: SCENE.hall, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
