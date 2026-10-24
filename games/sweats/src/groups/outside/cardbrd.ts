// "The Day I Fought Cardboard": the sign said MILD SCARES FOR ALL AGES. He takes his girlfriend's
// daughter Lily (eight, a unicorn hoodie, a caramel apple the size of her head) to the haunted
// house: bonding time. The fog machine hisses (its puffs drift at him), the animatronic zombie
// with its plastic axe pops out of its coffin, "GET DOWN!": he tackles a papier-mache witch who
// was not part of the show (one word breaks her broomstick, the next topples her), a guy in a
// werewolf mask growls (a word and the mask comes off: just a guy, waving), the strategic
// repositioning through a wall of fake spiderwebs (a sneeze each), the gift shop's twelve-dollar
// souvenir sword, an eleven-year-old in a clown wig (a word and he runs off giggling). Lily walks
// ahead the whole way, unimpressed, and pats him (composure back). The plot is the proof it was
// all fake: the zombie's plastic axe, the broken broomstick, the witch's hat, the souvenir sword;
// with all four the emergency exit opens, his new best friend glowing over it.
//
// Layout (12 rows: the rafters on row 0, the walking row 9, the floorboards on row 10). The
// beam (row 7) and the gift shop's shelf (row 7) are ledges.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing, spotlight } from '../../common/blocks';
import { anim, bob, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { SIDES, T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { CARD_MON } from './ids';
import { person } from './people';
import { coinOn } from './street';

/** The last two sets' mugs mend less (common/blocks.ts loot()). */
const LATE = { mugHp: 10 };

/** Proof it was all fake. */
export const PROPS = 4;

/** The haunted house's wallpaper: a dark damask. */
function hauntWall(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20, c('haunt', 1));
  const r = rng(seed);
  for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('haunt', 0));
  for (const [cx, cy] of [
    [5, 5],
    [15, 15],
  ]) {
    p.set(cx, cy - 3, c('haunt', 2))
      .set(cx, cy + 3, c('haunt', 2))
      .set(cx - 3, cy, c('haunt', 2))
      .set(cx + 3, cy, c('haunt', 2));
    p.ring(cx, cy, 1.6, c('haunt', 2));
  }
  return p;
}

export function cardBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => hauntWall(pal, seed);
  book.add('hWall', wall(100), AIR);
  const base = wall(101);
  base.rect(0, 11, 20, 9, c('wood', 0)).rect(0, 11, 20, 1, c('wood', 1)).rect(0, 13, 20, 1, c('wood', 1)).rect(9, 14, 1, 6, c('ink', 1));
  book.add('hBase', base, AIR);
  const boards = new Pixels(20, 20, c('wood', 1));
  for (let y = 0; y < 20; y += 5) boards.rect(0, y, 20, 1, c('wood', 0));
  boards.rect(6, 1, 1, 4, c('wood', 0)).rect(15, 6, 1, 4, c('wood', 0)).rect(3, 11, 1, 4, c('wood', 0)).rect(12, 16, 1, 4, c('wood', 0));
  boards.rect(0, 0, 20, 1, c('wood', 2));
  book.add('hFloor', boards, { solid: SOLID });
  const ceil = new Pixels(20, 20, c('haunt', 0));
  ceil.rect(0, 0, 20, 8, c('wood', 0)).rect(0, 7, 20, 1, c('wood', 1));
  ceil.line(0, 8, 9, 19, c('grey', 1)).line(4, 8, 9, 19, c('grey', 1)).line(0, 13, 6, 8, c('grey', 1)).line(0, 18, 10, 8, c('grey', 0));
  book.add('hCeil', ceil, { solid: SOLID });
  // the sign: MILD SCARES FOR ALL AGES
  {
    const pic = new Pixels(60, 20, T);
    pic.rect(1, 2, 58, 16, c('wood', 2)).frame(1, 2, 58, 16, c('wood', 0));
    micro(pic, 8, 4, 'MILD SCARES', c('orange', 2));
    micro(pic, 6, 11, 'FOR ALL AGES', c('white', 2));
    pic.set(15, 18, c('orange', 1)).set(15, 19, c('orange', 0)).set(44, 18, c('orange', 1));
    addPicture(book, 'scareSign', pic, wall(102), () => AIR);
  }
  // the fog machine, hissing
  const fogger = base.crop(0, 0, 20, 20);
  fogger.rect(3, 9, 14, 10, c('metal', 0)).rect(3, 9, 14, 2, c('metal', 1)).rect(0, 12, 4, 3, c('metal', 1)).disc(12, 14, 2, c('red', 2));
  fogger.rect(5, 15, 6, 1, c('metal', 2));
  for (const [x, y] of [
    [1, 9],
    [0, 6],
    [3, 5],
  ])
    fogger.disc(x, y, 1.4, c('fog', 2));
  book.add('fogger', fogger, { ...AIR, birthMon: CARD_MON.fog, birthTime: 70 });
  // the zombie's coffin, standing open
  const coffin = base.crop(0, 0, 20, 20);
  for (let y = 0; y < 20; y++) {
    const w = y < 6 ? 10 + y : 16 - Math.floor((y - 6) / 3);
    coffin.rect(10 - w / 2, y, w, 1, c('wood', 0));
    if (y > 1 && y < 19) coffin.rect(12 - w / 2, y, w - 4, 1, c('red', 0));
  }
  book.add('coffin', coffin, AIR);
  // a portrait whose eyes follow you, a candelabra
  const portrait = wall(103);
  portrait.rect(3, 2, 14, 16, c('gold', 1)).rect(5, 4, 10, 12, c('haunt', 0));
  blob(portrait, 10, 9, 3.5, 4, R('fog'), 0, 2);
  portrait.rect(6, 13, 8, 3, c('ink', 1)).set(9, 8, c('red', 3)).set(12, 8, c('red', 3));
  book.add('portrait', portrait, AIR);
  const candles = wall(104);
  candles.rect(6, 17, 8, 3, c('gold', 1)).rect(9, 9, 2, 8, c('gold', 1)).rect(4, 11, 12, 1, c('gold', 1));
  for (const x of [4, 9, 15])
    candles
      .rect(x, 6, 2, 5, c('white', 2))
      .set(x, 4, c('yellow', 2))
      .set(x, 5, c('orange', 2))
      .set(x + 1, 5, c('yellow', 2));
  book.add('candles', candles, AIR);
  // the wall of fake spiderwebs (a sneeze each, then torn)
  const web = (torn: boolean) => {
    const p = wall(105);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      if (torn && k % 3) continue;
      p.line(10, 10, 10 + Math.cos(a) * 12, 10 + Math.sin(a) * 12, c('white', 1));
    }
    if (!torn) for (const r of [3, 6, 9]) p.ring(10, 10, r, c('white', 0));
    return p;
  };
  book.add('webTorn', web(true), AIR);
  book.add('web', web(false), { ...AIR, hp: -1, touch: 'webTorn' });
  // the beam and the gift shop's shelf (ledges)
  const beam = wall(106);
  beam.rect(0, 0, 20, 6, c('wood', 1)).rect(0, 0, 20, 1, c('wood', 2)).rect(0, 5, 20, 1, c('wood', 0)).line(3, 6, 6, 12, c('grey', 1));
  book.add('beam', beam, { solid: LEDGE, grav: GRAV.down });
  const shelf = wall(107);
  shelf.rect(0, 0, 20, 3, c('wood', 2)).rect(0, 3, 20, 1, c('wood', 0));
  shelf.rect(2, 6, 4, 6, c('orange', 2)).rect(2, 6, 4, 1, c('green', 1));
  shelf.disc(12, 9, 3, c('white', 2)).set(11, 8, c('ink', 0)).set(13, 8, c('ink', 0));
  micro(shelf, 4, 14, 'GIFTS', c('gold', 2));
  book.add('giftShelf', shelf, { solid: LEDGE, grav: GRAV.down });
  // the emergency exit: its sign glowing (his new best friend), the door it opens on
  const sign = wall(108);
  sign.rect(2, 8, 16, 9, c('exit', 0)).rect(3, 9, 14, 7, c('exit', 1));
  micro(sign, 3, 10, 'EXIT', c('white', 2));
  sign.rect(9, 2, 2, 6, c('metal', 0));
  book.add('exitSign', sign, AIR);
  const door = (open: boolean) => {
    const p = base.crop(0, 0, 20, 20);
    p.rect(2, 0, 16, 20, open ? c('fog', 2) : c('metal', 0)).frame(2, 0, 16, 20, c('metal', 1));
    if (open) p.rect(4, 2, 12, 18, c('sky', 4)).rect(4, 14, 12, 6, c('green', 1));
    else p.rect(3, 9, 14, 2, c('metal', 2)).rect(14, 8, 2, 4, c('metal', 1));
    return p;
  };
  book.add('exitOpen', door(true), { grav: GRAV.none });
  gate(book, 'exit', door(false), 'exitOpen', PROPS);
  // the proof: the plastic axe, the broken broomstick, the witch's hat, the souvenir sword
  plotThing(book, 'hBase', 'axe', (p) => {
    p.line(4, 18, 14, 6, c('wood', 2)).line(5, 18, 15, 6, c('wood', 1));
    p.rect(11, 3, 7, 6, c('grey', 2)).rect(11, 3, 7, 1, c('white', 2)).set(17, 9, c('red', 2));
  });
  plotThing(book, 'hBase', 'broom', (p) => {
    p.line(1, 17, 9, 13, c('wood', 2)).line(12, 15, 14, 18, c('wood', 2));
    for (let k = 0; k < 6; k++) p.line(14, 18, 19, 13 + k, c('yellow', 1));
    p.set(10, 13, c('wood', 0)).set(11, 14, c('wood', 0));
  });
  plotThing(book, 'hWall', 'hat', (p) => {
    p.rect(2, 15, 16, 3, c('ink', 1)).line(6, 15, 11, 2, c('ink', 1)).line(14, 15, 11, 2, c('ink', 1));
    for (let y = 3; y < 15; y++) p.rect(11 - (y - 2) * 0.38, y, (y - 2) * 0.76 + 1, 1, c('ink', 1));
    p.rect(6, 13, 9, 2, c('purple', 2)).rect(9, 13, 3, 2, c('gold', 2));
    p.line(6, 14, 11, 2, c('haunt', 3)).rect(2, 17, 16, 1, c('haunt', 3)).set(11, 1, c('haunt', 3));
  });
  plotThing(book, 'hWall', 'sword', (p) => {
    p.line(4, 16, 15, 5, c('metal', 2)).line(5, 16, 16, 5, c('metal', 1)).set(16, 4, c('white', 2));
    p.line(3, 12, 8, 17, c('gold', 2)).line(2, 18, 4, 16, c('red', 1));
    p.rect(12, 14, 6, 4, c('white', 2));
    micro(p, 12, 13, '$12', c('red', 1));
  });
  loot(book, pal, 'hBase', LATE);
  coinOn(book, pal, 'hWall');
  spotlight(book, pal, 'hBase');
}

export function cardSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // Lily: the unicorn hoodie (horn, mane), glitter, the caramel apple the size of her head.
  // Side on, walking right (her path mirrors her for left), the apple held out ahead.
  const lily = (f: number) => {
    const p = person(pal, { hair: 'yellow', shirt: 'white', pants: 'pink', step: f, short: true, raw: true, side: true });
    p.rect(7, 2, 6, 3, c('white', 2)).rect(7, 5, 2, 2, c('white', 2));
    p.line(11, 2, 13, -1, c('gold', 3)).set(12, 1, c('gold', 2));
    for (const [x, y, col] of [
      [6, 3, 'pink'],
      [6, 4, 'purple'],
      [6, 5, 'teal'],
    ] as const)
      p.set(x, y, c(col, 2));
    p.set(9, 7, c('pink', 2)).set(8, 9, c('gold', 3));
    p.rect(9, 11, 3, 2, c('gold', 3)).set(10, 10, c('gold', 3));
    p.line(13, 11, 16, 11, c('skin', 2)).line(16, 14, 16, 9 + f, c('wood', 2));
    p.disc(16, 7 + f, 3.2, c('red', 1))
      .rect(13, 7 + f, 7, 3, c('coffee', 3))
      .set(15, 6 + f, c('white', 2));
    return outline(p, ink);
  };
  book.add('lily0', lily(0), { chHitPt: 10 });
  book.add('lily1', lily(1), { chHitPt: 10 });
  book.add('lilyOn0', lily(0));
  book.add('lilyOn1', lily(1));
  // a puff of the fog machine
  const fog = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) p.disc(5 + k * 2 + f, 13 + Math.sin(k + f) * 2, 3 - (k % 2) * 0.6, c('fog', 1 + (k % 2)));
    face(p, pal, 10, 12 + f, { angry: true });
    return p;
  };
  book.add('fog0', fog(0), hurts(-2, 0));
  book.add('fog1', fog(1), hurts(-2, 0));
  // the animatronic zombie: cardboard-green, arms out, a plastic axe
  const zombie = (f: number) => {
    const p = person(pal, { hair: 'grey', shirt: 'grey', pants: 'navy', step: 0, raw: true });
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++)
        if ([c('skin', 1), c('skin', 2), c('skin', 3), c('skin', 4)].includes(p.get(x, y))) p.set(x, y, c('green', 2 - ((x + y) % 2)));
    p.rect(4, 9, 3, 1, c('green', 2)).rect(14, 9, 3, 1, c('green', 2));
    p.rect(8, 11, 1, 3, c('grey', 0)).rect(12, 10, 1, 2, c('grey', 0));
    p.line(16, 9 - f, 19, 3 - f, c('wood', 2))
      .rect(17, 1 - f, 3, 4, c('grey', 2))
      .set(9, 5, c('red', 3))
      .set(12, 5, c('red', 3));
    return outline(p, ink);
  };
  // (solid only at its sides: landing on its head slides him down beside the coffin)
  book.add('zombie0', zombie(0), hurts(-5, SIDES));
  book.add('zombie1', zombie(1), hurts(-5, SIDES));
  // the papier-mache witch, on her broomstick, and without it
  const witch = (f: number, broom: boolean) => {
    const p = P();
    const y = broom ? f : 2 - f * 2;
    if (broom) {
      p.line(0, 15 + y, 15, 13 + y, c('wood', 2));
      for (let k = 0; k < 5; k++) p.line(15, 13 + y, 19, 10 + k + y, c('yellow', 1));
    }
    p.rect(6, 8 + y, 8, 7, c('purple', 1)).rect(5, 14 + y, 10, 2, c('purple', 0));
    blob(p, 10, 6 + y, 3, 3, pal.r('green'), 1, 3);
    p.set(12, 7 + y, c('green', 0))
      .set(13, 7 + y, c('green', 0))
      .set(9, 5 + y, ink)
      .set(11, 5 + y, ink);
    p.rect(5, 3 + y, 11, 1, ink)
      .line(8, 3 + y, 10 + (broom ? 0 : 3), -2 + y, ink)
      .line(12, 3 + y, 10 + (broom ? 0 : 3), -2 + y, ink)
      .rect(9, 0 + y, 3, 3, ink);
    for (let k = 0; k < 4; k++) p.set(6 + k * 3, 16 + y, c('white', 1));
    if (!broom) p.line(3, 9 + y, 6, 11 + y, c('purple', 1)).line(17, 9 + y, 14, 11 + y, c('purple', 1));
    return outline(p, ink);
  };
  book.add('witch0', witch(0, true), hurts(-5));
  book.add('witch1', witch(1, true), hurts(-5));
  book.add('witchB0', witch(0, false), hurts(-5));
  book.add('witchB1', witch(1, false), hurts(-5));
  // the guy in the werewolf mask (growling), and with it off (waving it). Side on, walking right
  // (their paths mirror them for left): the snout and the mask in his hand lead.
  const wolf = (f: number, mask: boolean) => {
    const p = person(pal, { hair: 'hair', shirt: 'red', pants: 'navy', step: f, raw: true, arms: mask ? 'up' : undefined, side: true });
    if (mask) {
      blob(p, 9.5, 5, 4, 4.2, pal.r('fur'), 0, 2);
      p.line(8, 2, 7, -1, c('fur', 1)).line(10, 2, 10, -1, c('fur', 0));
      p.rect(12, 5, 5, 3, c('fur', 1)).set(16, 5, ink).set(13, 8, c('white', 2)).set(15, 8, c('white', 2)).set(11, 4, c('yellow', 2));
    } else {
      p.rect(15, 6 - f, 4, 4, c('fur', 1))
        .set(18, 6 - f, c('yellow', 2))
        .line(12, 10, 15, 8 - f, c('red', 1));
      p.set(11, 7, c('ink', 0)).set(12, 7, c('ink', 0));
    }
    return outline(p, ink);
  };
  book.add('wolf0', wolf(0, true), hurts(-5));
  book.add('wolf1', wolf(1, true), hurts(-5));
  book.add('wolfGuy0', wolf(0, false));
  book.add('wolfGuy1', wolf(1, false));
  // bats on strings, flapping (harmless props)
  const bat = (f: number) => {
    const p = P();
    p.line(10, 0, 10, 8, c('grey', 0));
    blob(p, 10, 11, 2.5, 3, pal.r('ink'), 0, 1);
    const w = f ? -3 : 3;
    p.line(8, 10, 2, 10 + w, c('ink', 1))
      .line(12, 10, 18, 10 + w, c('ink', 1))
      .line(2, 10 + w, 5, 13, c('ink', 1))
      .line(18, 10 + w, 15, 13, c('ink', 1));
    p.set(9, 10, c('red', 3)).set(11, 10, c('red', 3));
    return outline(p, ink);
  };
  book.add('bat0', bat(0));
  book.add('bat1', bat(1));
  // the eleven-year-old in the clown wig, his horn, harmless (and running off giggling). Side on,
  // walking right (his paths mirror him for left): the wig puffs round the back of his head, the
  // red nose and the horn out ahead.
  const clown = (f: number, run: boolean) => {
    const p = person(pal, { hair: 'red', shirt: 'teal', pants: 'yellow', step: f, short: true, raw: true, arms: run ? 'up' : undefined, side: true });
    for (const [x, y, col] of [
      [6, 3, 'red'],
      [8, 2, 'teal'],
      [11, 2, 'yellow'],
      [13, 3, 'red'],
      [5, 5, 'yellow'],
      [6, 7, 'teal'],
    ] as const)
      p.disc(x, y + 1, 1.6, c(col, 2));
    p.disc(13.5, 8.5, 1, c('red', 3));
    if (!run) p.rect(13, 11, 3, 2, c('gold', 2)).disc(17, 12, 1.6, c('red', 2));
    else micro(p, 15, 0, '!', c('white', 2));
    return outline(p, ink);
  };
  book.add('clown0', clown(0, false));
  book.add('clown1', clown(1, false));
  book.add('clownRun0', clown(0, true));
  book.add('clownRun1', clown(1, true));
}

export function cardMonsters(set: Monster[], mb: SpriteBook): void {
  set[CARD_MON.lily] = mon(anim(mb, 'lily0', 'lily1', 8), { power: POWER.friend, thru: 1, newmon: CARD_MON.lilyOn }, pace(1, 1));
  set[CARD_MON.lilyOn] = mon(anim(mb, 'lilyOn0', 'lilyOn1', 4), { power: POWER.tough, thru: 0, end: 50 }, [
    corner(0, 0, 2),
    corner(8, 0, 2, 0),
    corner(0, 0, 2, 4),
  ]);
  set[CARD_MON.fog] = mon(anim(mb, 'fog0', 'fog1', 6), { power: POWER.foe, thru: 0, end: -1, newmon: CARD_MON.poof }, [corner(0, 0, 1), corner(-6, 0, 1, 4)]);
  set[CARD_MON.zombie] = mon(anim(mb, 'zombie0', 'zombie1', 5), { power: POWER.foe, thru: 1, newmon: CARD_MON.poof }, bob(1, 2));
  set[CARD_MON.witch] = mon(anim(mb, 'witch0', 'witch1', 4), { power: POWER.foe, thru: 1, newmon: CARD_MON.witch2 }, pace(3, 2));
  set[CARD_MON.witch2] = mon(anim(mb, 'witchB0', 'witchB1', 3), { power: POWER.foe, thru: 1, newmon: CARD_MON.poof }, pace(2, 2));
  set[CARD_MON.wolf] = mon(anim(mb, 'wolf0', 'wolf1', 5), { power: POWER.foe, thru: 1, newmon: CARD_MON.wolfGuy }, pace(3, 1));
  set[CARD_MON.wolfGuy] = mon(anim(mb, 'wolfGuy0', 'wolfGuy1', 6), { power: POWER.tough, thru: 0, end: 40 }, [corner(0, 0, 1), corner(-3, 0, 1, 4)]);
  set[CARD_MON.clown] = mon(anim(mb, 'clown0', 'clown1', 5), { power: POWER.foe, thru: 1, newmon: CARD_MON.clownOff }, pace(2, 1));
  set[CARD_MON.clownOff] = mon(anim(mb, 'clownRun0', 'clownRun1', 2), { power: POWER.tough, thru: 0, end: 30 }, [
    corner(0, 0, 4),
    corner(8, -1, 4, 0),
    corner(0, 0, 4, 4),
  ]);
  set[CARD_MON.bat] = mon(anim(mb, 'bat0', 'bat1', 4), { power: POWER.tough, thru: 0 }, [corner(0, 0, 1), corner(0, 1, 1), corner(0, 0, 1)]);
  set[CARD_MON.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const cardbrd: Monologue = {
  file: 'cardbrd',
  title: 'The Day I Fought Cardboard',
  desc: 'I Fought Cardboard',
  filler: 'soil',
  // inside the haunted house: dim and purple (the exit sign keeps its glow)
  light: {
    sky: [
      [10, 4, 20],
      [90, 50, 90],
      [40, 20, 50],
    ],
    mul: [0.74, 0.66, 0.86],
    add: [8, 0, 18],
  },
  legend: {
    '^': 'hCeil',
    '.': 'hWall',
    _: 'hBase',
    '=': 'hFloor',
    '#': 'soil',
    f: 'fogger',
    c: 'coffin',
    P: 'portrait',
    i: 'candles',
    w: 'web',
    b: 'beam',
    g: 'giftShelf',
    E: 'exitSign',
    $: 'coin@hBase',
    '%': 'bill@hBase',
    m: 'mug@hBase',
    '&': 'coin@hWall',
    '!': 'spot@hBase',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the haunted house past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 13;
    const W = 66 + OFF;
    m.row(0, 0, W - 1, '^')
      .fill(0, 1, W, 8, '.')
      .row(9, 0, W - 1, '_')
      .row(10, 0, W - 1, '=')
      .row(11, 0, W - 1, '#');
    // the way in: the spotlight, the sign, Doc Leo taking tickets, Lily walking ahead
    m.set(2, 9, '!');
    placePicture(m, 'scareSign', 3, 5, 3, 1);
    m.mon(MON.leo, 5, 9);
    m.mon(CARD_MON.lily, 8, 9);
    // the fog machine, the portrait, the zombie's coffin (and its plastic axe after)
    m.set(11, 9, '$').set(14, 9, 'f').set(16, 4, 'P').set(20, 6, 'i');
    m.set(19, 9, 'c').mon(CARD_MON.zombie, 19, 9);
    m.set(22, 9, 'axe');
    // GET DOWN!: the witch, her broomstick, the beam with her hat up on it
    m.mon(CARD_MON.witch, 26, 9);
    m.row(7, 28, 31, 'b');
    m.set(30, 6, 'hat').set(29, 6, '&');
    m.set(33, 9, 'broom').set(31, 9, '$');
    m.set(36, 4, 'P').set(40, 6, 'i').set(9, 6, 'i').set(24, 4, 'P').set(58, 4, 'P');
    for (const x of [7, 17, 27, 41, 51, 60]) m.mon(CARD_MON.bat, x, 1 + (x % 3));
    // the werewolf mask, the wall of fake spiderwebs, Lily's pat
    m.mon(CARD_MON.wolf, 38, 9);
    m.col(43, 7, 9, 'w');
    m.mon(CARD_MON.lily, 46, 9);
    m.set(48, 9, 'm').set(50, 6, 'i');
    // the gift shop: the souvenir sword on the shelf, the clown wig, Lily again
    m.row(7, 53, 56, 'g');
    m.set(55, 6, 'sword').set(54, 6, '&');
    m.mon(CARD_MON.clown, 58, 9);
    m.set(57, 9, '%');
    m.mon(CARD_MON.lily, 61, 9);
    // the emergency exit
    m.set(63, 8, 'E').set(63, 9, 'exit');
    m.link(63 + OFF, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: cardMonsters,
  song: 'chase',
  clips: { open: 'lily_o', line: 'lily_l', punch: 'lily_p', word: 'lily_w' },
  view: [15, 4],
  card: ["You know it's not real,", 'right?'],
};
