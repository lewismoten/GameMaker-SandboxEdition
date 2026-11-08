// say-something.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level,
// one a talk, and last each level again without its card, for the talks to come back to.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { StarterMap } from '../../kit/starter/map';
import { addReturnScenes } from '../../kit/starter/returnScenes';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'SAY SOMETHING';

/** The name of a talk's slide list: the nth talk of the whole game, counting from 1 (pip1.lst, moss2.lst...). */
export const talkFile = (who: string, n: number) => `${who}${n}`;

/**
 * Scene 0 is the title and menu, scene 1 the endings, scenes 2.. the levels, then one scene for each
 * talk. A talk's scene loads the tiny PASS map (`pass`) under an all-black palette, shows its
 * slide list (a picture, then the friend's words) as its intro, and the hero, who starts on
 * the pass map's exit cell, is taken straight back to the level, a few blocks past the friend: to the
 * level's last scene, its copy without the level card.
 */
export function buildGame(levels: Level[], pass: StarterMap): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'say.cmf',
    'menu.gif',
    'say.cmf',
    'story.lst',
    'say.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'say.cmf', 'lost.lst', 'say.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'say.pal',
      `${l.file}.map`,
      'say.bbl',
      'say.mon',
      'say.mbl',
      'hero.chr',
      'hero.cbl',
      'say.snd',
      'say.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    const [fx, fy] = l.map.exits[0].from;
    scene.links[0] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? { x: next.map.start[0], y: next.map.start[1] } : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });

  // the talks: a link on the friend's bottom block takes the hero to the talk's scene, and its own link brings him back
  const [px, py] = pass.exits[0].from;
  let n = 0;
  levels.forEach((l, li) => {
    l.talks.forEach((t) => {
      const talkScene = levels.length + 2 + n;
      game.scenes[li + 2].links[1 + (n - firstTalk(levels, li))] = { toScene: talkScene, from: { x: t.at[0], y: t.at[1] }, to: { x: px, y: py } };
      const scene = emptyScene(ADVTYPE);
      scene.desc = `${t.who[0].toUpperCase()}${t.who.slice(1)} talks`;
      scene.pos = { x: 60 + li * 80, y: 40 + (n % 3) * 20 };
      scene.files = [
        'pass.pal',
        'pass.map',
        'say.bbl',
        '',
        '',
        'hero.chr',
        'hero.cbl',
        'say.snd',
        'say.cmf',
        `${talkFile(t.who, n + 1)}.lst`,
        '',
        ...new Array(9).fill(''),
      ];
      scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
      scene.links[0] = { toScene: li + 2, from: { x: px, y: py }, to: { x: t.back[0], y: t.back[1] } };
      game.scenes.push(scene);
      n++;
    });
  });

  // a talk comes back to the level's copy without its card (kit/starter/returnScenes.ts), so "Level 1 of 2" shows once
  addReturnScenes(
    game,
    levels.map((_, i) => i + 2),
  );

  const first = levels[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}

/** How many talks come before level `li`'s own. */
function firstTalk(levels: Level[], li: number): number {
  return levels.slice(0, li).reduce((sum, l) => sum + l.talks.length, 0);
}
