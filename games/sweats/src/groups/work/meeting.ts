// "A Totally Normal Meeting": just an hour, and his favorite pen (blue ink, smooth glide, clicky
// top) vanishes. The epic: the conference room's long table with the meeting droning on over it
// (buzzwords drift off the coworkers), the search under the table where his notes have turned
// into angry spider footprints, the supply closet and its scratchy, spiteful backup pen, the
// whiteboard. Five pages of his notes (the plot) and the meeting ends: the door takes them, and
// there it is, the pen, tucked behind his ear.
//
// Layout (12 rows: the ceiling on row 0, the carpet on row 10): the table top is a ledge on
// row 7 (stand on it, hop up through it), the coworkers' heads above it are scenery that give
// birth to buzzwords, the closet's shelves are ledges.
import { Pixels } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing, spotlight } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { officeWall } from './office';
import { WORK_MON } from './ids';

/** Pages of notes to find before the meeting ends. */
export const NOTES = 5;

export function meetingBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => officeWall(pal, seed);
  // the long conference table: its top (a ledge) and the dark under it, legs and all
  const top = wall(11);
  top.rect(0, 10, 20, 4, c('wood', 3)).rect(0, 10, 20, 1, c('wood', 4)).rect(0, 14, 20, 1, c('wood', 0));
  book.add('tableTop', top, { solid: LEDGE, grav: GRAV.down });
  const under = (leg: boolean) => {
    const p = wall(12);
    p.rect(0, 0, 20, 20, c('cube', 0));
    for (let y = 0; y < 20; y += 2) p.rect(0, y, 20, 1, c('ink2', 1));
    if (leg) p.rect(8, 0, 4, 20, c('metal', 1)).rect(9, 0, 1, 20, c('metal', 2));
    return p;
  };
  book.add('underTable', under(false), AIR);
  book.add('tableLeg', under(true), AIR);
  // the coworkers along the far side, heads over the table, droning: buzzwords drift off them
  const coworker = (hair: string, shirt: string, seed: number, droning: boolean) => {
    const p = wall(seed);
    p.rect(3, 12, 14, 8, c(shirt, 1)).rect(3, 12, 14, 2, c(shirt, 2));
    blob(p, 10, 7, 4.4, 4.6, R('skin'), 1, 3);
    p.rect(6, 2, 9, 3, c(hair, 1)).set(5, 4, c(hair, 1)).set(15, 4, c(hair, 1));
    p.set(8, 7, c('ink', 0)).set(12, 7, c('ink', 0));
    if (droning) p.rect(9, 10, 3, 1, c('ink', 0));
    else p.rect(8, 9, 1, 1, c('ink', 0)).rect(12, 9, 1, 1, c('ink', 0));
    return p;
  };
  book.add('boss', coworker('grey', 'navy', 13, true), { ...AIR, birthMon: WORK_MON.buzz, birthTime: 110 });
  book.add('coworker', coworker('hair', 'teal', 14, false), AIR);
  book.add('coworker2', coworker('yellow', 'red', 15, true), { ...AIR, birthMon: WORK_MON.buzz, birthTime: 130 });
  // the projector screen with its chart, the clock, the whiteboard (its tray is a ledge)
  const chart = wall(16);
  chart.rect(1, 1, 18, 15, c('white', 2)).frame(1, 1, 18, 15, c('metal', 1));
  for (const [x, h] of [[4, 4], [8, 7], [12, 5], [15, 10]]) chart.rect(x, 14 - h, 2, h, c('blue', 2));
  chart.line(3, 12, 17, 3, c('red', 2));
  book.add('chart', chart, AIR);
  const clock = (end: boolean) => {
    const p = wall(17);
    p.disc(10, 9, 6, c('white', 2)).ring(10, 9, 6, c('ink', 0)).line(10, 9, 10, 4, c('ink', 0)).line(10, 9, end ? 14 : 13, end ? 9 : 12, c('ink', 0));
    return p;
  };
  book.add('clock', clock(false), AIR);
  const board = wall(18);
  board.rect(0, 2, 20, 14, c('white', 2)).rect(0, 2, 20, 1, c('metal', 1)).rect(0, 15, 20, 2, c('metal', 1));
  micro(board, 2, 5, 'Q3', c('blue', 1));
  micro(board, 2, 10, 'SYNRG', c('red', 1));
  book.add('board', board, { solid: LEDGE, grav: GRAV.down });
  const board2 = wall(19);
  board2.rect(0, 2, 20, 14, c('white', 2)).rect(0, 2, 20, 1, c('metal', 1)).rect(0, 15, 20, 2, c('metal', 1));
  board2.line(2, 12, 7, 6, c('green', 1)).line(7, 6, 11, 9, c('green', 1)).line(11, 9, 17, 4, c('green', 1));
  book.add('board2', board2, { solid: LEDGE, grav: GRAV.down });
  // the supply closet: its dark, its shelves (ledges) with boxes of pens and sticky notes
  const closet = () => {
    const p = new Pixels(20, 20);
    p.rect(0, 0, 20, 20, c('cube', 0));
    for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('ink2', 1));
    return p;
  };
  book.add('closet', closet(), AIR);
  const shelf = (what: 'pens' | 'notes' | 'none') => {
    const p = closet();
    p.rect(0, 15, 20, 3, c('metal', 2)).rect(0, 15, 20, 1, c('metal', 2)).rect(0, 18, 20, 1, c('ink', 1));
    if (what === 'pens') for (let x = 2; x < 18; x += 3) p.rect(x, 5, 2, 10, c('blue', 1)).rect(x, 4, 2, 1, c('white', 2));
    if (what === 'notes') p.rect(3, 9, 6, 6, c('yellow', 2)).rect(11, 7, 6, 8, c('pink', 2));
    return p;
  };
  book.add('shelf', shelf('none'), { solid: LEDGE, grav: GRAV.down });
  book.add('shelfPens', shelf('pens'), { solid: LEDGE, grav: GRAV.down });
  book.add('shelfNotes', shelf('notes'), { solid: LEDGE, grav: GRAV.down });
  const closetDoor = wall(20);
  closetDoor.rect(2, 0, 16, 20, c('cube', 0)).rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
  micro(closetDoor, 5, 2, 'SUP', c('white', 1));
  book.add('closetDoor', closetDoor, AIR);
  // a potted plant by the door, a water cooler (solid)
  const cooler = wall(21);
  cooler.rect(5, 8, 10, 12, c('white', 1)).rect(6, 0, 8, 8, c('blue', 2)).rect(7, 1, 3, 6, c('blue', 3)).set(9, 13, c('red', 2));
  book.add('cooler', cooler, { solid: SOLID });
  // the door out: MEETING ENDS. It takes the five pages of notes, and opens.
  const door = (open: boolean) => {
    const p = wall(22);
    p.rect(2, 0, 16, 20, open ? c('fluor', 0) : c('wood', 2)).rect(2, 0, 16, 1, c('wood', 0)).rect(2, 0, 1, 20, c('wood', 0)).rect(17, 0, 1, 20, c('wood', 0));
    if (!open) {
      p.disc(14, 11, 1.2, c('gold', 2)).rect(5, 3, 10, 7, c('white', 2));
      micro(p, 6, 4, 'END', c('red', 1));
    }
    return p;
  };
  book.add('doorOpen', door(true), { grav: GRAV.none });
  gate(book, 'door', door(false), 'doorOpen', NOTES);
  // the pages of his notes: a sheet of legal pad scrawled like angry spider footprints
  const page = (p: Pixels) => {
    p.rect(5, 6, 10, 13, c('yellow', 2)).rect(5, 6, 10, 1, c('red', 1)).rect(6, 7, 1, 12, c('pink', 1));
    for (let y = 9; y < 18; y += 2) for (let x = 7; x < 14; x++) if ((x * 7 + y * 3) % 5 < 3) p.set(x, y, c('blue', 0));
  };
  for (const bg of ['base', 'underTable', 'officeWall', 'closet']) plotThing(book, bg, `notes@${bg}`, page);
  for (const bg of ['base', 'underTable', 'officeWall', 'closet']) loot(book, pal, bg);
  spotlight(book, pal, 'base');
}

export function meetingSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a buzzword: a grey speech bubble of meeting-speak
  const buzz = (word: string, f: number) => {
    const p = P();
    p.rect(1, 4 + f, 18, 9, c('grey', 2)).rect(2, 5 + f, 16, 7, c('white', 1));
    p.set(15, 13 + f, c('grey', 2)).set(16, 14 + f, c('grey', 2));
    micro(p, 10 - Math.floor((word.length * 4 - 1) / 2), 6 + f, word, c('navy', 1));
    return outline(p, ink);
  };
  book.add('buzz0', buzz('SYNRG', 0), hurts(-3, 0));
  book.add('buzz1', buzz('Q3', 1), hurts(-3, 0));
  // an angry spider footprint: a scrawl of blue ink with legs and a scowl
  const spider = (f: number) => {
    const p = P();
    blob(p, 10, 14, 4, 3, pal.r('blue'), 0, 2);
    for (let k = 0; k < 4; k++) {
      const d = (k % 2 ? 1 : -1) * (f ? 1 : 0);
      p.line(7 - k, 14, 4 - k, 17 + d, c('blue', 0)).line(13 + k, 14, 16 + k, 17 - d, c('blue', 0));
    }
    face(p, pal, 10, 13, { angry: true });
    return outline(p, ink);
  };
  book.add('spider0', spider(0), hurts(-6));
  book.add('spider1', spider(1), hurts(-6));
  // the scratchy backup pen: a cheap stick pen with a sneer, hopping, dashes of Morse code
  const pen = (f: number) => {
    const p = P();
    const y = f ? 2 : 4;
    p.line(6, y + 13, 14, y, c('white', 2)).line(7, y + 13, 15, y, c('white', 1)).line(5, y + 15, 6, y + 13, c('ink', 1));
    p.line(14, y, 15, y - 1, c('blue', 1));
    face(p, pal, 11, y + 6, { angry: true });
    if (f) p.rect(1, 18, 3, 1, c('blue', 1)).rect(6, 18, 1, 1, c('blue', 1)).rect(9, 18, 3, 1, c('blue', 1));
    return outline(p, ink);
  };
  book.add('pen0', pen(0), hurts(-8));
  book.add('pen1', pen(1), hurts(-8));
  const puff = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) p.disc(10 + Math.cos(k) * (3 + f * 3), 10 + Math.sin(k) * (3 + f * 3), 2 - f * 0.6, c('blue', 1 + f));
    return p;
  };
  book.add('ink0', puff(0));
  book.add('ink1', puff(1));
}

export function meetingMonsters(set: Monster[], mb: SpriteBook): void {
  // buzzwords drift up and away to the left off the coworkers, and pop at the end of their path
  set[WORK_MON.buzz] = mon(anim(mb, 'buzz0', 'buzz1', 10), { power: POWER.foe, thru: 1, end: -1, newmon: WORK_MON.inkPuff }, [corner(0, 0, 2), corner(0, -2, 2, 4), corner(-3, -3, 1, 4), corner(-6, -4, 1, 4)]);
  set[WORK_MON.spider] = mon(anim(mb, 'spider0', 'spider1', 3), { power: POWER.foe, thru: 1, newmon: WORK_MON.inkPuff }, pace(3, 2));
  set[WORK_MON.pen] = mon(anim(mb, 'pen0', 'pen1', 5), { power: POWER.foe, thru: 1, newmon: WORK_MON.inkPuff }, pace(2, 1));
  set[WORK_MON.inkPuff] = mon(anim(mb, 'ink0', 'ink1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const meeting: Monologue = {
  file: 'meeting',
  title: 'A Totally Normal Meeting',
  desc: 'A Normal Meeting',
  filler: 'slab',
  legend: {
    '^': 'ceiling',
    '*': 'ceilingLit',
    '.': 'officeWall',
    _: 'base',
    '=': 'carpet',
    '#': 'slab',
    T: 'tableTop',
    u: 'underTable',
    l: 'tableLeg',
    B: 'boss',
    o: 'coworker',
    O: 'coworker2',
    w: 'window',
    k: 'clock',
    h: 'chart',
    C: 'closet',
    s: 'shelf',
    p: 'shelfPens',
    n: 'shelfNotes',
    d: 'closetDoor',
    c: 'cooler',
    W: 'board',
    V: 'board2',
    D: 'door',
    N: 'notes@base',
    M: 'notes@underTable',
    K: 'notes@officeWall',
    L: 'notes@closet',
    $: 'coin@base',
    '%': 'coin@underTable',
    '&': 'coin@officeWall',
    '(': 'coin@closet',
    b: 'bill@underTable',
    m: 'mug@base',
    '!': 'spot@base',
  },
  build: (m: MapBuilder) => {
    const W = 60;
    m.row(0, 0, W - 1, '^');
    for (let x = 3; x < W; x += 6) m.set(x, 0, '*');
    m.fill(0, 1, W, 8, '.').row(9, 0, W - 1, '_').row(10, 0, W - 1, '=').row(11, 0, W - 1, '#');
    // the way in: the spotlight, a window
    m.set(2, 9, '!').set(1, 4, 'w').set(4, 4, 'w');
    // the conference room: the long table, the coworkers, the projector's chart, the clock
    m.row(7, 7, 31, 'T');
    m.fill(7, 8, 25, 2, 'u');
    for (const x of [8, 19, 30]) m.col(x, 8, 9, 'l');
    m.set(10, 6, 'o').set(13, 6, 'B').set(17, 6, 'O').set(22, 6, 'o').set(25, 6, 'B').set(29, 6, 'O');
    m.set(19, 2, 'h').set(20, 2, 'h').set(15, 2, 'k').set(26, 3, 'w');
    // under the table: his notes, scuttling footprints, a coin; on the table: more notes, a dollar
    m.set(12, 9, 'M').set(24, 9, 'M').set(16, 9, '%').set(27, 9, 'b');
    m.set(20, 6, 'K').set(26, 6, '&');
    m.set(5, 9, 'm').set(34, 9, '$');
    m.mon(WORK_MON.spider, 13, 9).mon(WORK_MON.spider, 21, 9);
    m.mon(MON.carl, 20, 3);
    // the supply closet: its shelves (ledges), the backup pen, notes on the top shelf
    m.set(36, 9, 'd').set(36, 8, 'd');
    m.fill(37, 1, 9, 9, 'C');
    m.row(7, 38, 40, 'p').row(4, 41, 44, 'n').row(7, 43, 45, 's');
    m.set(43, 3, 'L').set(39, 6, '(');
    m.mon(WORK_MON.pen, 38, 9);
    // the whiteboard (its tray a ledge), the water cooler, the door out
    m.row(6, 48, 49, 'W').set(50, 6, 'V');
    m.set(49, 5, 'K').set(52, 9, 'c').set(54, 9, '$');
    m.set(57, 9, 'D').set(57, 8, 'k');
    m.link(57, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: meetingMonsters,
  song: 'office',
  clips: { open: 'pen_o', line: 'pen_l', punch: 'pen_p', word: 'pen_w' },
  view: [6, 4],
  card: ['It wasn\'t just a pen.', 'It was MY pen.'],
};
