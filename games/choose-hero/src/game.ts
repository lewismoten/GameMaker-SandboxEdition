// sw.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'WHO TO BE?';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'pick.cmf',
    'menu.gif',
    'pick.cmf',
    'story.lst',
    'pick.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'pick.cmf', 'lost.lst', 'pick.cmf', ...new Array(16).fill('')];

  // scene 2 is the room, scenes 3 and 4 the same climb with a different character file each
  const scenes: { level: Level; title: string; chr: string; to: number[] }[] = [
    { level: levels[0], title: levels[0].title, chr: 'fast', to: [3, 4] },
    { level: levels[1], title: 'Climb: Fast Feet', chr: 'fast', to: [1] },
    { level: levels[1], title: 'Climb: Big Hops', chr: 'hops', to: [1] },
  ];
  scenes.forEach((sc, i) => {
    const l = sc.level;
    const scene = emptyScene(ADVTYPE);
    scene.desc = sc.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'pick.pal',
      `${l.file}.map`,
      'pick.bbl',
      'pick.mon',
      'pick.mbl',
      `${sc.chr}.chr`,
      `${sc.chr}.cbl`,
      'pick.snd',
      'pick.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    // each door goes to its own scene; the climb's start is the same place for both
    sc.to.forEach((target, n) => {
      const [fx, fy] = l.map.exits[n].from;
      const dest = target === 1 ? { x: 0, y: 0 } : { x: levels[1].map.start[0], y: levels[1].map.start[1] };
      scene.links[n] = { toScene: target, from: { x: fx, y: fy }, to: dest };
    });
    game.scenes.push(scene);
  });

  const first = levels[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
