// FINAL.GAM: the scene graph. Two scenes are the theater (one per act); the other seventy
// share GREEN.MAP and differ only in where Ada starts, which links they carry and which
// intro they show. A question is a link to a scene whose intro is the answer; the answer
// scene looks exactly like the room she asked it in, so the talk simply goes on.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { Theatre } from './levels/theatre';
import { LINEUP, ROOM, SOLVED, SUSPECTS, ZCELL, center, type ParlorLinks } from './levels/parlor';

export const TITLE = 'FINAL CURTAIN';

type Pt = { x: number; y: number };
type Files = Partial<Record<'pal' | 'map' | 'bbl' | 'mon' | 'mbl' | 'cmf' | 'intro' | 'exit', string>>;

const noLinks = (): Link[] => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));

export const SUSPECT_LETTER: Record<string, string> = { lila: 'l', edgar: 'e', agatha: 'a', felix: 'f', pike: 'p' };
export const PIN_FILES: Record<string, string> = {
  coroner: 'evcoron',
  checklist: 'evcheck',
  stub: 'evstub',
  chart: 'evchart',
  policy: 'evpolicy',
  ledger: 'evledger',
  umbrella: 'evumbr',
  safe_ms: 'evms',
  cuesheet: 'evcue',
};
export const PINS = {
  gr1: ['coroner', 'checklist', 'stub', 'chart', 'policy'],
  gr2: ['coroner', 'checklist', 'stub', 'chart', 'policy', 'ledger', 'umbrella', 'safe_ms', 'cuesheet'],
};
export const WRONG_KEYS = ['lila', 'edgar', 'agatha', 'felix', 'poison', 'dark', 'love', 'money'];

/** Scene numbers, for the play-testing bot and the docs. */
export interface SceneIndex {
  act1: number;
  act2: number;
  gr1a: number;
  gr1: number;
  gr2a: number;
  gr2: number;
  ev1: number[];
  ev2: number[];
  /** [suspect][0 hello, 1..3 answers] */
  iv1: number[][];
  iv2: number[][];
  acca: number;
  acc: number;
  how: number;
  why: number;
  wrong: number;
  solved: number;
  w: Record<string, number>;
  /** Between the 2 AM green room's sofa cushions: the green room again, with EGG.LST. */
  egg: number;
}

export function buildGame(acts: Theatre[], pl: ParlorLinks): { game: Game; ix: SceneIndex } {
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
    'hiscore.gif',
    'load.gif',
    'save.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'Curtain Call';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  const add = (desc: string, f: Files, scroll: boolean, x: number, y: number): number => {
    const s: Scene = emptyScene(ADVTYPE);
    s.desc = desc.slice(0, 19);
    s.pos = { x, y };
    s.files = [f.pal, f.map, f.bbl, f.mon, f.mbl, 'ada.chr', 'ada.cbl', 'final.snd', f.cmf, f.intro, f.exit].map((v) => v ?? '').concat(new Array(9).fill(''));
    s.links = noLinks();
    if (!scroll) s.scroll = { ...s.scroll, up: 0, down: 0, left: 0, right: 0 };
    game.scenes.push(s);
    return game.scenes.length - 1;
  };
  const theatre = { bbl: 'paragon.bbl', mon: 'paragon.mon', mbl: 'paragon.mbl' };
  const green = { map: 'green.map', bbl: 'green.bbl', mon: 'green.mon', mbl: 'green.mbl', pal: 'house.pal', cmf: 'parlor.cmf' };
  const stage = { ...green, pal: 'dawn.pal', cmf: 'dawn.cmf' };

  const ix = {} as SceneIndex;
  ix.act1 = add('Act One', { ...theatre, pal: 'house.pal', map: 'act1.map', cmf: 'act1.cmf', intro: 'act1.lst', exit: 'curtain.fli' }, true, 30, 60);
  ix.act2 = add('Act Two', { ...theatre, pal: 'night.pal', map: 'act2.map', cmf: 'act2.cmf', intro: 'act2.lst', exit: 'theories.lst' }, true, 30, 120);

  // the green room, round 1 and round 2
  const hub = (round: 'gr1' | 'gr2', y: number) => {
    const a = add(round === 'gr1' ? 'Green Room' : 'Green Room, 2 AM', { ...green, intro: `${round}.lst` }, false, 80, y);
    const plain = add(round === 'gr1' ? 'Green Room (back)' : 'Green Room 2 (back)', green, false, 80, y + 12);
    const evs = PINS[round].map((pin, i) => add(`Board: ${pin}`.slice(0, 19), { ...green, intro: `${PIN_FILES[pin]}.lst` }, false, 110 + i * 8, y + 6));
    return { a, plain, evs };
  };
  const g1 = hub('gr1', 40);
  const g2 = hub('gr2', 100);
  Object.assign(ix, { gr1a: g1.a, gr1: g1.plain, ev1: g1.evs, gr2a: g2.a, gr2: g2.plain, ev2: g2.evs });

  // interviews: a hello and three answers per suspect per round
  const interviews = (round: 1 | 2, y: number) =>
    SUSPECTS.map((who, i) =>
      [0, 1, 2, 3].map((q) =>
        add(`${who} ${round}${q ? ' q' + q : ''}`, { ...green, intro: `i${SUSPECT_LETTER[who]}${round}${q}.lst` }, false, 190 + i * 24 + q * 5, y + q * 4),
      ),
    );
  ix.iv1 = interviews(1, 30);
  ix.iv2 = interviews(2, 90);

  // the stage at dawn
  ix.acca = add('Dawn', { ...stage, intro: 'acc.lst' }, false, 60, 165);
  ix.acc = add('Dawn (again)', stage, false, 80, 165);
  ix.how = add('How?', { ...stage, intro: 'how.lst' }, false, 100, 165);
  ix.why = add('Why?', { ...stage, intro: 'why.lst' }, false, 120, 165);
  ix.wrong = add('The Commissioner', stage, false, 160, 178);
  // Solved (its first tick scores the solved block) and the wrong verdicts (their page, then
  // on to the Commissioner) start Ada on their only link, so they pass straight through.
  // PLAYGAME still fades each one's map in and out around that tick: they load dark.pal,
  // all black, so the stage never flashes up between a page and the next scene.
  const pass = { ...stage, pal: 'dark.pal' };
  ix.solved = add('Solved', pass, false, 140, 165);
  ix.w = {};
  WRONG_KEYS.forEach((k, i) => (ix.w[k] = add(`Wrong: ${k}`, { ...pass, intro: `w${k}.lst` }, false, 160 + i * 18, 165)));

  // ---- links
  const link = (scene: number, n: number, from: Pt, toScene: number, to: Pt) => (game.scenes[scene].links[n] = { toScene, from, to });
  title.links[0] = { toScene: ix.act1, from: { x: 0, y: 0 }, to: acts[0].start };
  link(ix.act1, 0, acts[0].exit, ix.gr1a, center(ROOM.gr1));
  link(ix.act2, 0, acts[1].exit, ix.gr2a, center(ROOM.gr2));

  const hubLinks = (scenes: number[], round: 'gr1' | 'gr2', ivs: number[][], evs: number[], exitTo: number, exitAt: Pt) => {
    for (const s of scenes) {
      let n = 0;
      SUSPECTS.forEach((_, i) => link(s, n++, pl.talk[round][i], ivs[i][0], center(ROOM[round === 'gr1' ? 'r1' : 'r2'](i))));
      pl.pins[round].forEach((p, i) => link(s, n++, p, evs[i], center(ROOM[round])));
      link(s, n++, pl.grExit[round], exitTo, exitAt);
    }
  };
  hubLinks([g1.a, g1.plain, ...g1.evs], 'gr1', ix.iv1, g1.evs, ix.act2, acts[1].start);
  hubLinks([g2.a, g2.plain, ...g2.evs], 'gr2', ix.iv2, g2.evs, ix.acca, center(ROOM.who));

  for (const [round, ivs, back] of [
    ['r1', ix.iv1, g1.plain],
    ['r2', ix.iv2, g2.plain],
  ] as const) {
    SUSPECTS.forEach((_, i) => {
      const room = center(ROOM[round](i));
      for (const s of ivs[i]) {
        let n = 0;
        pl.cards[round][i].forEach((cells, q) => cells.forEach((cell) => link(s, n++, cell, ivs[i][q + 1], room)));
        link(s, n++, pl.ivExit[round][i], back, center(ROOM[round === 'r1' ? 'gr1' : 'gr2']));
      }
    });
  }

  for (const s of [ix.acca, ix.acc]) {
    LINEUP.forEach((who, i) => link(s, i, pl.spots[i], who === 'pike' ? ix.how : ix.w[who], who === 'pike' ? center(ROOM.how) : ZCELL));
    link(s, 5, pl.accBack, g2.plain, center(ROOM.gr2));
  }
  const choices = (s: number, cells: Pt[][], to: [number, Pt][]) => {
    let n = 0;
    cells.forEach((pair, q) => pair.forEach((cell) => link(s, n++, cell, to[q][0], to[q][1])));
  };
  choices(ix.how, pl.how, [
    [ix.why, center(ROOM.why)],
    [ix.w.poison, ZCELL],
    [ix.w.dark, ZCELL],
  ]);
  choices(ix.why, pl.why, [
    [ix.w.love, ZCELL],
    [ix.w.money, ZCELL],
    [ix.solved, SOLVED],
  ]);
  for (const k of WRONG_KEYS) link(ix.w[k], 0, ZCELL, ix.wrong, center(ROOM.wrong));
  link(ix.wrong, 0, pl.wrongExit, ix.acc, center(ROOM.who));
  link(ix.solved, 0, SOLVED, 1, { x: 0, y: 0 });

  // The sofa's seat (once the lens has shown what sits there and Ada has taken it): the same
  // green room, with the egg's note for an intro, and Ada back in the middle of the room.
  ix.egg = add('Green Room 2 (sofa)', { ...green, intro: 'egg.lst' }, false, 104, 112);
  hubLinks([ix.egg], 'gr2', ix.iv2, g2.evs, ix.acca, center(ROOM.who));
  for (const s of [g2.a, g2.plain, ...g2.evs, ix.egg]) link(s, MAXSCENELINKS - 1, pl.sofa, ix.egg, center(ROOM.gr2));
  return { game, ix };
}
