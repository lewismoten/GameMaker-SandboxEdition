// "I Don't Work Here, But Emotionally I Do": dinner was over, the table cleared, emotionally if
// not physically. Smeared plates, napkins folded into feet, utensils resting like fallen
// soldiers. Does he stack the plates? The epic: table seven's carnage, the wait staff floating
// by like dining-room phantoms (invisible but for their eyes), a quiet chuckle from behind the
// host stand, a goat dining in peace, the leaning tower of greasy plates (a greasy tower of poor
// decisions he climbs for the dessert plate, its grease stain sliding about below), the kitchen
// doors whispering "TABLE 7 STACKED BACKWARDS", and the busboy, silent but judging. Four plates
// (the soup bowl, the pasta plate with a fork nested in it: ceramic heresy; the dessert plate;
// the entree plate) for the bus tub, and the busboy unstacks it all, effortlessly: let the
// professionals stack.
//
// Layout (13 rows: the crown molding on row 0, the wainscot on row 10, the parquet on row 11):
// the tables' tops are ledges on row 9, the tower's plates ledges on rows 7..10.
import { Pixels } from '../../../../kit/pixels';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { DINNER, clear, cut, over } from './art';
import { addBubble, wallpaper } from './dining';
import { PLATES_MON as PM } from './ids';

/** The plates for the bus tub: the soup bowl, the pasta plate, the dessert plate, the entree plate. */
export const PLATES = 4;

/** A plate seen from the side and a little above, at (cx, y): its rim, its well. */
function plate(p: Pixels, pal: Pal, cx: number, y: number, w: number, smear?: string): void {
  const c = pal.c;
  p.rect(cx - w / 2, y, w, 3, c('china', 2)).rect(cx - w / 2 + 1, y - 1, w - 2, 1, c('china', 1)).rect(cx - w / 2 + 2, y + 3, w - 4, 1, c('china', 0));
  p.rect(cx - w / 2 + 3, y, w - 6, 1, c('china', 1));
  if (smear) p.rect(cx - 2, y, 4, 1, c(smear, 2)).set(cx + 2, y + 1, c(smear, 1));
}

export function platesBlocks(book: BlockBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const wall = () => wallpaper(pal);
  const wainscot = book.pics.get('wainscot')!;
  // table seven's carnage: smeared plates, a napkin folded into feet, the fallen soldiers, the tent card
  const carnage = over(wall(), pal, (p) => {
    plate(p, pal, 6, 16, 10, 'red');
    p.line(11, 18, 18, 15, c('metal', 2)).line(12, 19, 19, 17, c('metal', 1)).rect(17, 14, 2, 1, c('green', 1));
    p.rect(3, 10, 4, 4, c('white', 2)).rect(2, 13, 2, 2, c('white', 1)).rect(6, 13, 2, 2, c('white', 1));
    p.rect(13, 5, 6, 6, c('white', 2)).line(13, 10, 16, 5, c('white', 1)).line(16, 5, 18, 10, c('white', 1));
  });
  micro(carnage, 15, 6, '7', c('ink', 0));
  book.add('carnage', carnage, AIR);
  // the host stand (a quiet chuckle from behind it)
  const host = over(wainscot, pal, (p) => {
    p.rect(4, 6, 12, 14, c('wood', 1)).rect(3, 4, 14, 3, c('wood', 3)).rect(6, 9, 8, 8, c('wood', 2));
    p.rect(5, 2, 9, 2, c('white', 2)).rect(9, 2, 1, 2, c('red', 2));
    p.rect(14, 0, 2, 4, c('gold', 1)).rect(13, 0, 4, 1, c('spot', 1));
  });
  micro(host, 6, 11, 'HST', c('gold', 2));
  book.add('hostStand', host, { ...AIR, birthMon: PM.chuckle, birthTime: 160 });
  // the kitchen doors: a pair that swing, round windows lit from within, KITCHEN; whispers come out
  const doors = clear(40, 40);
  doors.rect(4, 0, 32, 7, c('wood', 1)).rect(5, 1, 30, 5, c('wood', 0));
  micro(doors, 7, 1, 'KITCHEN', c('gold', 2));
  for (const x of [3, 21]) {
    doors.rect(x, 7, 16, 33, c('wood', 2)).rect(x, 7, 16, 1, c('wood', 3)).rect(x, 30, 16, 10, c('metal', 1)).rect(x, 30, 16, 1, c('metal', 2));
    doors.disc(x + 8, 17, 5, c('metal', 2)).disc(x + 8, 17, 4, c('spot', 1)).set(x + 6, 15, c('spot', 2)).set(x + 7, 15, c('spot', 2));
    // the invisible eyes at the porthole
    doors.set(x + 6, 18, ink).set(x + 10, 18, ink);
  }
  doors.rect(19, 7, 2, 33, c('wood', 0));
  outline(doors, ink);
  cut(book, 'kitchen', doors, (_col, row) => (row === 1 ? wainscot : wall()), (col, row) => (row === 1 && col === 0 ? { ...AIR, birthMon: PM.whisper, birthTime: 130 } : AIR));
  // the leaning tower of greasy plates: four blocks of it, each one's top a ledge
  const tower = clear(20, 80);
  for (let k = 0; k < 20; k++) {
    const y = 77 - k * 4;
    const lean = Math.round((k * k) / 60);
    const w = k % 5 === 4 ? 10 : 14;
    plate(tower, pal, 9 + lean, y, w, k % 3 === 0 ? 'coffee' : k % 3 === 1 ? 'yellow' : undefined);
  }
  outline(tower, ink);
  cut(book, 'tower', tower, (_col, row) => (row === 3 ? wainscot : wall()), () => ({ solid: LEDGE, grav: GRAV.down }));
  // the bus tub on its cart (the gate): empty, then every plate stacked like an Olympic event
  const busCart = (full: boolean) =>
    over(wainscot, pal, (p) => {
      p.rect(2, 14, 16, 2, c('metal', 2)).rect(3, 16, 1, 3, c('metal', 1)).rect(16, 16, 1, 3, c('metal', 1));
      p.disc(4, 19, 1.2, ink).disc(16, 19, 1.2, ink);
      p.rect(3, 6, 14, 8, c('grey', 1)).rect(3, 6, 14, 1, c('grey', 2)).rect(4, 13, 12, 1, c('grey', 0));
      if (full) for (let k = 0; k < 5; k++) plate(p, pal, 10, 5 - k, 12);
    });
  const closed = busCart(false);
  micro(closed, 6, 8, 'BUS', c('grey', 3));
  book.add('busOpen', busCart(true), { grav: GRAV.none });
  gate(book, 'busTub', closed, 'busOpen', PLATES);
  // the four plates (the plot), over the wallpaper
  const thing = (draw: (p: Pixels) => void) => (p: Pixels) => {
    const t = clear();
    draw(t);
    p.blit(outline(t, ink), 0, 0, T);
  };
  plotThing(book, 'wallpaper', 'soupBowl', thing((p) => {
    p.rect(4, 11, 12, 2, c('china', 2)).rect(5, 13, 10, 3, c('china', 1)).rect(7, 16, 6, 2, c('china', 0));
    p.rect(5, 11, 10, 1, c('orange', 2)).line(14, 8, 18, 4, c('metal', 2));
  }));
  plotThing(book, 'wallpaper', 'pastaPlate', thing((p) => {
    plate(p, pal, 10, 13, 16, 'red');
    // a fork nested inside: ceramic heresy
    p.line(5, 12, 15, 9, c('metal', 2)).line(14, 8, 17, 7, c('metal', 2)).line(15, 10, 18, 9, c('metal', 2));
    p.set(8, 11, c('yellow', 2)).set(11, 11, c('yellow', 2));
  }));
  plotThing(book, 'wallpaper', 'dessertPlate', thing((p) => {
    plate(p, pal, 10, 14, 14);
    p.rect(7, 9, 7, 5, c('cream', 3)).rect(7, 9, 7, 1, c('red', 2)).set(13, 12, c('cream', 1)).set(5, 13, c('cream', 2));
  }));
  plotThing(book, 'wallpaper', 'entreePlate', thing((p) => {
    plate(p, pal, 10, 13, 18, 'coffee');
    plate(p, pal, 10, 10, 14, 'yellow');
    p.set(6, 9, c('coffee', 1)).set(13, 9, c('coffee', 1));
  }));
}

export function platesSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  // a phantom of the dining room: a waiter you can't quite see but for his eyes, a domed tray aloft
  const phantom = (f: number) => {
    const p = clear();
    for (let y = 5; y < 19; y++) for (let x = 4; x < 16; x++) if (Math.abs(x - 9.5) < 3 + y / 4 && !(y === 18 && (x + f) % 3 === 0)) p.set(x, y, (x + y + f) % 2 ? c('white', 2) : c('china', 1));
    p.rect(7, 8, 3, 3, c('white', 2)).rect(11, 8, 3, 3, c('white', 2)).rect(8, 9, 2, 2, ink).rect(12, 9, 2, 2, ink);
    p.rect(9, 15, 3, 2, ink);
    p.rect(9, 12, 2, 1, ink);
    p.rect(13, 3 + f, 6, 1, c('metal', 2)).rect(14, 1 + f, 4, 2, c('metal', 1)).set(16, f, c('metal', 2));
    return p;
  };
  book.add('phantom0', phantom(0), hurts(-6));
  book.add('phantom1', phantom(1), hurts(-6));
  addBubble(book, pal, 'whisper', 'TBL7', hurts(-5), { tail: 'right' });
  addBubble(book, pal, 'chuckle', 'HEH', hurts(-4), { fill: 'cream', tail: 'right' });
  // the grease stain, sliding about with a smirk
  const grease = (f: number) => {
    const p = clear();
    for (let y = 14; y < 19; y++) p.rect(3 + f - (y - 14), y, 14 + (y - 14) * 2 - f * 2, 1, c('coffee', y === 14 ? 3 : 2));
    p.set(6, 15, c('yellow', 3)).set(14, 16, c('yellow', 3));
    face(p, pal, 10, 15, { grin: true });
    return outline(p, ink);
  };
  book.add('grease0', grease(0), hurts(-6));
  book.add('grease1', grease(1), hurts(-6));
  // the busboy: white shirt, black apron, a grey tub, eyes sliding to the side (judging)
  const busboy = (f: number) => {
    const p = clear();
    p.rect(7, 15, 2, 5, ink).rect(11, 15, 2, 5, ink);
    p.rect(5, 8, 10, 8, c('white', 2)).rect(6, 11, 8, 6, c('ink', 1));
    p.rect(1, 9, 8, 4, c('grey', 1)).rect(1, 9, 8, 1, c('grey', 2));
    const hx = 10;
    p.rect(hx - 3, 2, 7, 7, c('skin', 3)).rect(hx - 3, 1, 7, 2, c('hair', 0));
    const look = f ? 1 : -1;
    p.set(hx - 1 + look, 5, ink).set(hx + 2 + look, 5, ink).rect(hx - 2, 4, 2, 1, c('hair', 0)).rect(hx + 1, 3, 2, 1, c('hair', 0));
    p.rect(hx - 1, 7, 3, 1, c('skin', 1));
    return outline(p, ink);
  };
  book.add('busboy0', busboy(0), hurts(0));
  book.add('busboy1', busboy(1), hurts(0));
}

export function platesMonsters(set: Monster[], mb: SpriteBook): void {
  const foe = { power: POWER.foe, thru: 1, newmon: PM.poof };
  set[PM.phantom] = mon(anim(mb, 'phantom0', 'phantom1', 5), { ...foe, thru: 0 }, [corner(0, 0, 1), corner(2, -1, 1, 0), corner(4, 0, 1, 0), corner(2, -1, 1, 4), corner(0, 0, 1, 4)]);
  set[PM.whisper] = mon(anim(mb, 'whisper0', 'whisper1', 6), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 2), corner(-8, 0, 2, 4)]);
  set[PM.chuckle] = mon(anim(mb, 'chuckle0', 'chuckle1', 6), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 1), corner(-2, 0, 1, 4)]);
  set[PM.grease] = mon(anim(mb, 'grease0', 'grease1', 6), foe, pace(3, 1));
  set[PM.busboy] = mon(anim(mb, 'busboy0', 'busboy1', 30), { power: POWER.tough, thru: 1 }, pace(2, 1));
  set[PM.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const plates: Monologue = {
  file: 'plates',
  title: 'I Don’t Work Here, But Emotionally I Do',
  desc: 'Table Seven',
  light: DINNER,
  filler: 'cellar',
  legend: {
    '^': 'crown',
    '.': 'wallpaper',
    _: 'wainscot',
    '=': 'parquet',
    '#': 'cellar',
    L: 'tableL',
    M: 'tableM',
    R: 'tableR',
    l: 'tableLegs',
    h: 'chair',
    s: 'sconce',
    a: 'stillLife',
    w: 'nightWindow',
    c: 'carnage',
    H: 'hostStand',
    G: 'busTub',
    $: 'coin@wainscot',
    '%': 'coin@wallpaper',
    b: 'bill@wallpaper',
    m: 'mug@wainscot',
    '!': 'spot@wainscot',
    '1': 'soupBowl',
    '2': 'pastaPlate',
    '3': 'dessertPlate',
    '4': 'entreePlate',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the restaurant past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 13;
    const W = 58 + OFF;
    m.row(0, 0, W - 1, '^').fill(0, 1, W, 9, '.').row(10, 0, W - 1, '_').row(11, 0, W - 1, '=').row(12, 0, W - 1, '#');
    for (const x of [6, 14, 27, 36, 46]) m.set(x, 1, 'pendant');
    const table = (x0: number, x1: number) => {
      m.set(x0, 9, 'L').set(x1, 9, 'R');
      for (let x = x0 + 1; x < x1; x++) m.set(x, 9, 'M');
      m.row(10, x0, x1, 'l');
      m.set(x0 - 1, 10, 'h').set(x1 + 1, 10, 'h');
    };
    m.set(2, 10, '!');
    // table seven: its carnage, the soup bowl
    table(4, 7);
    m.set(5, 8, 'c').set(6, 8, '1').set(5, 5, 'a').set(2, 6, 's').set(10, 6, 's');
    m.mon(PM.phantom, 10, 10);
    // the second table: the pasta plate; a goat dining in peace
    table(13, 15);
    m.set(13, 8, '%').set(14, 8, '2');
    m.mon(MON.goat, 17, 10);
    m.set(19, 5, 'w');
    // the host stand (the chuckle), the leaning tower of greasy plates, its grease stain
    m.set(21, 10, 'H').set(23, 10, '$');
    for (let r = 0; r < 4; r++) m.set(26, 7 + r, `tower.0.${r}`);
    m.set(26, 6, '3').set(29, 10, '$');
    m.mon(PM.grease, 27, 10);
    // the third table: the entree plate; another phantom
    m.set(31, 6, 's').set(36, 5, 'a').set(41, 5, 'w');
    m.mon(PM.phantom, 30, 10);
    table(34, 37);
    m.set(35, 8, '%').set(36, 8, '4').set(37, 8, 'b');
    // the kitchen doors (the whispers), a coffee, the busboy, the bus tub
    m.set(43, 9, 'kitchen.0.0').set(44, 9, 'kitchen.1.0').set(43, 10, 'kitchen.0.1').set(44, 10, 'kitchen.1.1');
    m.set(46, 10, 'm');
    m.mon(PM.busboy, 49, 10);
    m.set(53, 10, '$');
    m.set(56, 10, 'G');
    m.link(56 + OFF, 10, 'next');
    return { start: [1, 10], size: [W, 13] };
  },
  monsters: platesMonsters,
  song: 'blues',
  clips: { open: 'plate_o', line: 'plate_l', punch: 'plate_p', word: 'plate_w' },
  view: [20, 5],
  card: ['Had I just committed', 'ceramic heresy?'],
};
