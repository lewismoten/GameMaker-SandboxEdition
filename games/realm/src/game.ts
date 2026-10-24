// TUIT.GAM: the scene graph, put together from the scenes each area declares. A scene names
// its files and its links; a link says which block it starts on, which scene it leads to (by
// name) and where Pip arrives there. Scene 0 is the title and menu, scene 1 the ending.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link } from '../../../web/src/formats/game';

export const TITLE = 'ROUND TUIT';

export interface SceneFiles {
  pal: string;
  map: string;
  bbl: string;
  mon?: string;
  mbl?: string;
  chr?: string;
  cbl?: string;
  snd?: string;
  cmf?: string;
  intro?: string;
  exit?: string;
}

export interface LinkSpec {
  from: [number, number];
  /** A scene id, or 'won'. */
  to: string;
  at: [number, number];
}

export interface SceneSpec {
  id: string;
  desc: string;
  files: SceneFiles;
  links: LinkSpec[];
  /** No scrolling (a one-screen room or a pass-through scene). */
  still?: boolean;
}

export interface Front {
  /** Where play starts: the first scene's id and the block Pip starts on. */
  start: { to: string; at: [number, number] };
}

export function assemble(specs: SceneSpec[], front: Front): { game: Game; ids: Map<string, number> } {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'title.cmf',
    'menu.gif',
    'menu.cmf',
    'story.lst',
    'story.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The Round Tuit';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];
  const ids = new Map<string, number>();
  specs.forEach((s, i) => {
    if (ids.has(s.id)) throw new Error(`Two scenes called ${s.id}`);
    ids.set(s.id, i + 2);
  });
  ids.set('won', 1);
  const id = (name: string) => {
    const v = ids.get(name);
    if (v === undefined) throw new Error(`No scene ${name}`);
    return v;
  };
  for (const s of specs) {
    const sc = emptyScene(ADVTYPE);
    sc.desc = s.desc.slice(0, 19);
    const f = s.files;
    sc.files = [
      f.pal,
      f.map,
      f.bbl,
      f.mon ?? '',
      f.mbl ?? '',
      f.chr ?? 'pip.chr',
      f.cbl ?? 'pip.cbl',
      f.snd ?? 'realm.snd',
      f.cmf ?? '',
      f.intro ?? '',
      f.exit ?? '',
    ].concat(new Array(9).fill(''));
    if (s.links.length > MAXSCENELINKS) throw new Error(`${s.id}: ${s.links.length} links (20 at most)`);
    sc.links = Array.from({ length: MAXSCENELINKS }, (_, k): Link => {
      const l = s.links[k];
      if (!l) return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
      return { toScene: id(l.to), from: { x: l.from[0], y: l.from[1] }, to: { x: l.at[0], y: l.at[1] } };
    });
    if (s.still) sc.scroll = { ...sc.scroll, up: 0, down: 0, left: 0, right: 0 };
    game.scenes.push(sc);
  }
  title.links[0] = { toScene: id(front.start.to), from: { x: 0, y: 0 }, to: { x: front.start.at[0], y: front.start.at[1] } };
  return { game, ids };
}
