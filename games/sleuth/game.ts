// FINAL.GAM: the scene graph.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../web/src/formats/game';
import type { Theatre } from './theatre';

export const TITLE = 'FINAL CURTAIN';

const noLinks = (): Link[] => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));

function adv(
  desc: string,
  files: Partial<Record<'pal' | 'map' | 'bbl' | 'mon' | 'mbl' | 'chr' | 'cbl' | 'snd' | 'cmf' | 'intro' | 'exit', string>>,
  scroll = true,
): Scene {
  const s = emptyScene(ADVTYPE);
  s.desc = desc.slice(0, 19);
  s.files = [
    files.pal,
    files.map,
    files.bbl,
    files.mon,
    files.mbl,
    files.chr ?? 'ada.chr',
    files.cbl ?? 'ada.cbl',
    files.snd ?? '',
    files.cmf ?? '',
    files.intro ?? '',
    files.exit ?? '',
  ]
    .map((f) => f ?? '')
    .concat(new Array(9).fill(''));
  s.links = noLinks();
  if (!scroll) s.scroll = { ...s.scroll, up: 0, down: 0, left: 0, right: 0 };
  return s;
}

export function buildGame(acts: Theatre[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = ['', '', '', '', '', '', '', '', '', '', '', '', ...new Array(8).fill('')];
  end.desc = 'Curtain Call';
  const th = { bbl: 'paragon.bbl', mon: 'paragon.mon', mbl: 'paragon.mbl' };
  const a1 = adv('Act One', { ...th, pal: 'house.pal', map: 'act1.map' });
  const a2 = adv('Act Two', { ...th, pal: 'night.pal', map: 'act2.map' });
  game.scenes.push(a1, a2);
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: acts[0].start };
  a1.links[0] = { toScene: 3, from: acts[0].exit, to: acts[1].start };
  a2.links[0] = { toScene: 1, from: acts[1].exit, to: { x: 0, y: 0 } };
  return game;
}
