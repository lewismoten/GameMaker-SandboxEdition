// dayngt.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a stage (a palette on a level's map).
// A scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card). Day, dusk and night are three scenes
// that name the same map and blocks and a different palette file in slot 0.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'DAY AND NIGHT';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'dn.cmf',
    'menu.gif',
    'dn.cmf',
    'story.lst',
    'dn.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'dn.cmf', 'lost.lst', 'dn.cmf', ...new Array(16).fill('')];

  // one scene a stage: the same map and blocks as the level's other stages, with the stage's palette
  const stages = levels.flatMap((level) => level.stages.map((stage) => ({ level, stage })));
  stages.forEach(({ level: l, stage }, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = `${l.title} ${stage.hour}`.slice(0, 19);
    scene.pos = { x: 40 + i * 50, y: 110 };
    scene.files = [
      `${stage.hour}.pal`,
      `${l.file}.map`,
      `${l.file}.bbl`,
      'dn.mon',
      'dn.mbl',
      'hero.chr',
      'hero.cbl',
      'dn.snd',
      'dn.cmf',
      stage.card ? `${l.file}.lst` : '',
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    // every link goes on to the next stage (the next level's first, or the ending after the last)
    const next = stages[i + 1];
    stage.links.forEach(([fx, fy], k) => {
      scene.links[k] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? { x: next.stage.enter[0], y: next.stage.enter[1] } : { x: 0, y: 0 } };
    });
    game.scenes.push(scene);
  });

  const first = levels[0].stages[0].enter;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
