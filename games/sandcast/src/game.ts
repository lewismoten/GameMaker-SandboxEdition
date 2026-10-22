// sandcast.gam: the title scene, the ending, and the seven playfields, linked.
import { ADVTYPE, emptyScene, newGame, type Game, type Link, type Point } from '../../../web/src/formats/game';
import type { LevelMap } from './levels/levelmap';

export interface Level {
  name: string;
  desc: string;
  map: LevelMap;
  pal: string;
  intro?: string;
  pos: Point;
}

export interface Screens {
  title: string;
  menu: string;
  story: string;
  help: string;
  credits: string;
  scores: string;
  load: string;
  save: string;
  demo: string;
  won: string;
  lost: string;
  /** What Teddy finds pressed in the sand of Gwinn's dig (shown as he climbs out). */
  dug: string;
}

const SHARED = { bbl: 'sandcast.bbl', mon: 'sandcast.mon', mbl: 'sandcast.mbl', chr: 'sandcast.chr', cbl: 'sandcast.cbl', snd: 'sandcast.snd' };

/** Scene numbers. */
export const S = { title: 0, end: 1, hub: 2, keep: 3, moat: 4, lagoon: 5, burrows: 6, patio: 7, bbs: 8, dig: 9, dugOut: 10 } as const;

export function buildGame(levels: Record<Exclude<keyof typeof S, 'title' | 'end' | 'dugOut'>, Level>, screens: Screens): Game {
  const g = newGame('SANDCASTLE KNIGHT');
  const [title, end] = g.scenes;
  title.files = [
    screens.title,
    '',
    screens.menu,
    '',
    screens.story,
    '',
    screens.help,
    screens.credits,
    screens.scores,
    screens.load,
    screens.save,
    screens.demo,
  ];
  while (title.files.length < 20) title.files.push('');
  end.desc = 'The End';
  end.files = [screens.won, '', screens.lost, ''];
  while (end.files.length < 20) end.files.push('');

  const order = ['hub', 'keep', 'moat', 'lagoon', 'burrows', 'patio', 'bbs', 'dig'] as const;
  const scene = (lv: Level, intro: string | undefined) => {
    const sc = emptyScene(ADVTYPE);
    sc.desc = lv.desc.slice(0, 19);
    sc.pos = lv.pos;
    sc.files = [lv.pal, lv.name, SHARED.bbl, SHARED.mon, SHARED.mbl, SHARED.chr, SHARED.cbl, SHARED.snd, '', intro ?? '', ''];
    while (sc.files.length < 20) sc.files.push('');
    return sc;
  };
  for (const key of order) g.scenes[S[key]] = scene(levels[key], levels[key].intro);
  // Climbing out of Gwinn's dig comes back up into the sandbox: the same playfield as the
  // sandbox scene, with the same doors, but with a message on the way in.
  g.scenes[S.dugOut] = scene({ ...levels.hub, desc: 'Up from the dig', pos: { x: 150, y: 120 } }, screens.dug);

  const link = (from: number, slot: number, fromMap: LevelMap | null, fromMark: string | null, to: number, toMap: LevelMap | null, toMark: string | null) => {
    const l: Link = {
      toScene: to,
      from: fromMap && fromMark ? fromMap.at(fromMark) : { x: 0, y: 0 },
      to: toMap && toMark ? toMap.at(toMark) : { x: 0, y: 0 },
    };
    g.scenes[from].links[slot] = l;
  };
  const M = (k: (typeof order)[number]) => levels[k].map;

  // SANDCAST_START=keep (etc.) starts a play-test build in that level.
  const start = (process.env.SANDCAST_START ?? 'hub') as (typeof order)[number];
  link(S.title, 0, null, null, S[start], M(start), start === 'hub' ? 'start' : 'arrive');
  link(S.hub, 0, M('hub'), 'door1', S.keep, M('keep'), 'arrive');
  link(S.hub, 1, M('hub'), 'door2', S.moat, M('moat'), 'arrive');
  link(S.hub, 2, M('hub'), 'door3', S.lagoon, M('lagoon'), 'arrive');
  link(S.hub, 3, M('hub'), 'door4', S.burrows, M('burrows'), 'arrive');
  link(S.hub, 4, M('hub'), 'holeBBS', S.bbs, M('bbs'), 'arrive');
  link(S.keep, 0, M('keep'), 'exit', S.hub, M('hub'), 'arrive2');
  link(S.keep, 1, M('keep'), 'secret', S.burrows, M('burrows'), 'vault');
  link(S.moat, 0, M('moat'), 'exit', S.hub, M('hub'), 'arrive3');
  link(S.lagoon, 0, M('lagoon'), 'exit', S.hub, M('hub'), 'arrive4');
  link(S.burrows, 0, M('burrows'), 'exit', S.patio, M('patio'), 'arrive');
  link(S.burrows, 1, M('burrows'), 'vaultExit', S.keep, M('keep'), 'back');
  link(S.patio, 0, M('patio'), 'crown', S.end, null, null);
  link(S.bbs, 0, M('bbs'), 'exit', S.hub, M('hub'), 'arriveBBS');
  // The lone dune in the sandbox's northeast corner hides Gwinn's dig.
  link(S.hub, 5, M('hub'), 'holeDig', S.dig, M('dig'), 'arrive');
  link(S.dig, 0, M('dig'), 'exit', S.dugOut, M('hub'), 'arriveDig');
  for (let i = 0; i <= 5; i++) g.scenes[S.dugOut].links[i] = { ...g.scenes[S.hub].links[i] };

  return g;
}
