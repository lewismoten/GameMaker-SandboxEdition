// teddy2.gam: the title scene, the ending, and the levels in order, each one's way out
// (THE CHEZ's door, or Gwinn's ride) linked to the start of the next. Each level scene names
// its own character file: Teddy's, or Gwinn's for the "Meanwhile..." levels.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '../../../web/src/formats/game';
import type { Level } from './levels/level';
import { house } from './levels/level1';
import { main } from './levels/level2';
import { night } from './levels/level3';
import { river } from './levels/level4';
import { farm } from './levels/level5';
import { maze } from './levels/level6';
import { lot } from './levels/levelLot';
import { midway } from './levels/level7';
import { show } from './levels/level8';

export const LEVELS: (() => Level)[] = [house, main, night, river, farm, maze, lot, midway, show];

/** Songs per level (CMF file names), in level order. */
const LEVEL_SONGS = ['house.cmf', 'main.cmf', 'night.cmf', 'river.cmf', 'farm.cmf', 'maze.cmf', 'lot.cmf', 'midway.cmf', 'show.cmf'];

const TITLE = 'TEDDY 2: BIGGER!';

/** What plays on the way out of a level: THE CHEZ driving on, or Gwinn's own cartoon. */
const outro = (l: Level) => l.outro ?? (l.hero === 'teddy' ? 'drive.fli' : '');

/** An all-black palette, for a scene that is only passed through. */
export const DARK = 'dark.pal';

export function buildGame(levels: Level[], startAt?: string): Game {
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
  end.desc = 'The Big Show';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 40 + i * 56, y: 110 };
    scene.files = [
      `${l.file}.pal`,
      `${l.file}.map`,
      `${l.file}.bbl`,
      `${l.file}.mon`,
      `${l.file}.mbl`,
      `${l.hero}.chr`,
      `${l.hero}.cbl`,
      'teddy.snd',
      LEVEL_SONGS[i],
      `${l.file}.lst`,
      levels[i + 1] ? outro(l) : '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    scene.links[0] = { toScene: next ? i + 3 : 1, from: l.exit, to: next ? next.start : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });

  // A level's nook is three more scenes on the level's own files: the nook itself (no card),
  // the level again from the nook's door (its own card, no way back in), and the drive on.
  // Every scene shows its last picture whichever link it is left by, so the level and both
  // nook scenes leave theirs empty and the car takes Teddy to the drive scene: a dark
  // palette, Teddy starts on the link to the next level, and the drive cartoon plays on the
  // way out.
  levels.forEach((l, i) => {
    if (!l.nook) return;
    const level = game.scenes[i + 2];
    const n = l.nook;
    const scene = (desc: string, dy: number, files: string[]) => {
      const sc = emptyScene(ADVTYPE);
      sc.desc = desc.slice(0, 19);
      sc.pos = { x: level.pos.x, y: level.pos.y + dy };
      sc.files = files;
      sc.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
      return sc;
    };
    const at = game.scenes.length;
    const room = scene(
      n.title,
      40,
      level.files.map((f, k) => (k === 9 || k === 10 ? '' : f)),
    );
    const again = scene(
      level.desc,
      80,
      level.files.map((f, k) => (k === 1 ? n.map : k === 9 ? n.card : k === 10 ? '' : f)),
    );
    const drive = scene(
      `${level.desc.slice(0, 13)} drive`,
      120,
      level.files.map((f, k) => (k === 0 ? DARK : k === 9 ? '' : f)),
    );
    drive.links[0] = { ...level.links[0] };
    level.links[0] = { toScene: at + 2, from: l.exit, to: l.exit };
    level.links[1] = { toScene: at, from: n.door, to: n.room };
    level.files[10] = '';
    room.links[0] = { toScene: at + 1, from: n.out, to: n.back };
    again.links[0] = { ...level.links[0] };
    game.scenes.push(room, again, drive);
  });

  const first = Math.max(0, startAt ? levels.findIndex((l) => l.file === startAt) : 0);
  title.links[0] = { toScene: first + 2, from: { x: 0, y: 0 }, to: levels[first].start };
  return game;
}
