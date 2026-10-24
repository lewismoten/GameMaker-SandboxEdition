// teddy3.gam: the title scene, the ending, and the levels in order, each one's way out
// (THE CHEZ's door, a parking spot, or a MEANWHILE... hero's goal) linked to the start of the
// next. Each level scene names its own character file: teddy.chr, gwinn.chr, leo.chr or
// chez.chr, so the hero changes from one scene to the next.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '../../../web/src/formats/game';
import type { Level } from './levels/level';
import { garage } from './levels/garage';
import { maple } from './levels/maple';
import { park } from './levels/park';
import { invite } from './levels/invite';
import { bakery } from './levels/bakery';
import { mill } from './levels/mill';
import { dig } from './levels/dig';
import { road } from './levels/road';
import { funhouse } from './levels/funhouse';
import { hill } from './levels/hill';
import { meadow } from './levels/meadow';
import { stage } from './levels/stage';

export const LEVELS: (() => Level)[] = [garage, maple, park, invite, bakery, road, mill, dig, funhouse, hill, meadow, stage];

export const TITLE = 'TEDDY 3: BIGGEST!';

/** What plays on the way out of a level: THE CHEZ driving on after Teddy's, or the level's own cartoon. */
export const outro = (l: Level) => l.outro ?? (l.hero === 'teddy' ? 'drive.fli' : '');

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
  end.desc = 'Surprise!';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 30 + (i % 8) * 36, y: 70 + Math.floor(i / 8) * 90 };
    scene.files = [
      `${l.file}.pal`,
      `${l.file}.map`,
      `${l.file}.bbl`,
      `${l.file}.mon`,
      `${l.file}.mbl`,
      `${l.hero}.chr`,
      `${l.hero}.cbl`,
      'teddy.snd',
      `${l.file}.cmf`,
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
