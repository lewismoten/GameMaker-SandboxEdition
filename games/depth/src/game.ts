// DEPTH.GAM: the scene graph. Scene 0 is the title and menu, 1 the end. Each level is three
// scenes: a card scene (its intro shows the level card, and Ray starts on a link straight into
// the level, so the card shows once and not again after every pull of focus or every life),
// then the near plane and the far plane, which share one map and link to each other at every
// focus ring.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { LevelSet } from './levels/blocks';

export const TITLE = 'DEPTH PERCEPTION';

export const cardScene = (i: number) => 2 + i * 3;
export const nearScene = (i: number) => 3 + i * 3;
export const farScene = (i: number) => 4 + i * 3;

export interface LevelFiles {
  pal: string;
  map: Record<'near' | 'far', string>;
  bbl: Record<'near' | 'far', string>;
  song: string;
  card: string;
}

export const levelFiles = (i: number, song: string): LevelFiles => ({
  pal: `l${i + 1}.pal`,
  map: { near: `l${i + 1}near.map`, far: `l${i + 1}far.map` },
  bbl: { near: `l${i + 1}near.bbl`, far: `l${i + 1}far.bbl` },
  song,
  card: `card${i + 1}.lst`,
});

const none = (): Link => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } });
const pad = (links: Link[]): Link[] => {
  if (links.length > MAXSCENELINKS) throw new Error('Too many links');
  return [...links, ...Array.from({ length: MAXSCENELINKS - links.length }, none)];
};
const files = (list: string[]) => [...list, ...new Array(20 - list.length).fill('')];

export interface Extra {
  /** More scenes (the egg's page) and links from the levels' planes to them. */
  scenes?: Scene[];
  links?: { level: number; plane: 'near' | 'far'; link: Link }[];
}

export function buildGame(sets: LevelSet[], lf: LevelFiles[], extra: Extra = {}): Game {
  const game = newGame(TITLE);
  sets.forEach((set, i) => {
    const b = set.built;
    const f = lf[i];
    const next = i + 1 < sets.length ? { toScene: cardScene(i + 1), to: sets[i + 1].built.start } : { toScene: 1, to: [0, 0] as [number, number] };
    const pt = (p: [number, number]) => ({ x: p[0], y: p[1] });
    // the card scene: the near plane's own files, so the tick PLAYGAME shows it between the
    // card and the level looks just like the level's first moment (and map pictures of it work)
    const card = emptyScene(ADVTYPE);
    card.desc = `${i + 1}. ${set.level.name}`.slice(0, 19);
    card.pos = { x: 30 + i * 46, y: 40 };
    card.files = files([f.pal, f.map.near, f.bbl.near, '', '', 'near.chr', 'ray.cbl', 'depth.snd', '', f.card]);
    card.links = pad([{ toScene: nearScene(i), from: pt(b.start), to: pt(b.start) }]);
    const plane = (p: 'near' | 'far') => {
      const s = emptyScene(ADVTYPE);
      s.desc = `${i + 1}. ${p === 'near' ? 'Near' : 'Far'}: ${set.level.name}`.slice(0, 19);
      s.pos = { x: 30 + i * 46, y: p === 'near' ? 90 : 140 };
      s.files = files([f.pal, f.map[p], f.bbl[p], 'depth.mon', 'depth.mbl', `${p}.chr`, 'ray.cbl', 'depth.snd', `${f.song}.cmf`]);
      const links: Link[] = b.rings.map((r) => {
        const off = p === 'near' ? r.spec.toFar : r.spec.toNear;
        return { toScene: p === 'near' ? farScene(i) : nearScene(i), from: pt(r.at), to: { x: r.at[0] + off[0], y: r.at[1] + off[1] } };
      });
      links.push({ toScene: next.toScene, from: pt(b.exit), to: pt(next.to) });
      for (const e of extra.links ?? []) if (e.level === i && e.plane === p) links.push(e.link);
      s.links = pad(links);
      return s;
    };
    game.scenes.push(card, plane('near'), plane('far'));
  });
  for (const s of extra.scenes ?? []) game.scenes.push(s);
  const start = game.scenes[0];
  start.files = files([
    'title.lst',
    'title.cmf',
    'menu.gif',
    'menu.cmf',
    'story.lst',
    'story.cmf',
    'howto.lst',
    'credits.lst',
    'hiscore.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
  ]);
  const s0 = sets[0].built.start;
  start.links[0] = { toScene: cardScene(0), from: { x: 0, y: 0 }, to: { x: s0[0], y: s0[1] } };
  game.scenes[1].files = files(['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf']);
  return game;
}
