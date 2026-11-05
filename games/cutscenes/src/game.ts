// cuts.gam: scene 0 is the title and menu, scene 1 the endings, then one scene each for the
// first level's stage, the menu room and the two tales (scene 2 is the first, in the order of
// levels.ts). A scene lists the files it loads in slots (palette, map, blocks, monsters,
// monster blocks, character, character blocks, sounds, song, a list shown before it) and
// carries its links: touch the From block and you are in the To scene, standing on the To block.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Scene } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'CUTSCENES';

/** The scene number of a scene (by its file name), or of the ending (1). */
export function sceneOf(scenes: Scene[], file: string): number {
  if (file === 'end') return 1;
  const i = scenes.findIndex((s) => s.file === file);
  if (i < 0) throw new Error(`No scene "${file}"`);
  return i + 2;
}

export function buildGame(scenes: Scene[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'cuts.cmf',
    'menu.gif',
    'cuts.cmf',
    'story.lst',
    'cuts.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'cuts.cmf', 'lost.lst', 'cuts.cmf', ...new Array(16).fill('')];

  scenes.forEach((s, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = s.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'cuts.pal',
      `${s.mapFile}.map`,
      'cuts.bbl',
      'cuts.mon',
      'cuts.mbl',
      'hero.chr',
      'hero.cbl',
      'cuts.snd',
      'cuts.cmf',
      s.before,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    s.links.forEach((l, k) => {
      const target = l.to === 'end' ? undefined : scenes[sceneOf(scenes, l.to) - 2];
      const [tx, ty] = target ? target.map.start : [0, 0];
      scene.links[k] = { toScene: sceneOf(scenes, l.to), from: { x: l.from[0], y: l.from[1] }, to: { x: tx, y: ty } };
    });
    game.scenes.push(scene);
  });

  const first = scenes[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
