// CAMPUS.BBL: out of doors. Two levels share it:
//   II. Laudes Ignavi: the battlefield in Gaul at noon, and the Brave Coward running from it
//      (fleeing danger, we cherish life): grass and dust, rocks to hop, the tents of the camp, a
//      palisade climbed by a siege ladder (air with no gravity), the ditch he hides in (melius est
//      hic manere!), the hill whose archers' tower gives birth to arrows, and at the end the gate
//      of the town, where he is the first to arrive (primus portam invenit). By it is parked a red
//      chariot with no horses that no Roman can explain (THE CHEZ, an anachronism, on purpose).
//   III. Titus Torquet Lingua: the rooftops of Rome at sunset. Roofs of red tiles to stand on,
//      chimneys, washing lines, the street far below; tituli (painted signs) that twist into
//      tongue twisters when touched (counter 22: tot titulos tetigit), heaps of SAXA (rocks) that a
//      touch mis-speaks into SAGA (spells: sparkling air you walk through), the clever wise man's
//      chimney that shoots spells (sagax sapiens sagitat sagas), and Titus's tavern on the roof,
//      whose door takes seven titles.
import { chezSide } from '../../../kit/chez';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro, microWidth } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { MON, TITLES, TITLES_NEEDED } from '../ids';
import { BlockBook, GRAV, LEDGE, LIFE, SOLID, context, copy, cup, denarius, grapes, outside, sparkle, wreath } from './common';

/** Ticks between arrows from the archers' tower. */
export const ARROW_EVERY = 36;
/** Ticks between spells off the wise man's chimney. */
export const SPELL_EVERY = 52;
/** The tituli: what each says, and what Titus's tongue twists it into. */
export const TITULI: [string, string][] = [
  ['TITVS', 'TVTIS'],
  ['TECTA', 'TACTA'],
  ['TOT', 'TVT'],
  ['TER', 'TRE'],
];

export function buildCampus(pal: Pal): BlockBook {
  const x = context(pal);
  const { book, c, R, P, air } = x;

  book.add('outside', outside(x), { solid: SOLID });

  // ---------- II. the battlefield ----------
  /** The sky (the backdrop ramp), with a wisp of cloud now and then. */
  const sky = (seed: number, row = 2, clouds: boolean | 'always' = true) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('sky'), row, row + 1, 0.3 + y / 40, xx, y));
    const r = rng(seed);
    if (clouds === 'always' || (clouds && r() < 0.5)) {
      const cx = 3 + r() * 14;
      const cy = 4 + r() * 8;
      blob(p, cx, cy, 5, 2, R('marble'), 2, 3);
      blob(p, cx + 3, cy - 1, 3, 2, R('marble'), 2, 3);
    }
    return p;
  };
  book.add('sky', sky(1, 2, false), air);
  book.add('skyHi', sky(2, 0, false), air);
  book.add('skyCloud', sky(5, 2, 'always'), air);
  // the far hills (scenery on the walk row's upper half)
  const hills = (seed: number) => {
    const p = sky(seed, 3);
    const r = rng(seed);
    const h0 = 6 + r() * 3;
    for (let xx = 0; xx < 20; xx++) {
      const h = Math.round(h0 + Math.sin((xx + seed * 7) / 4) * 2);
      for (let y = h; y < 20; y++) p.set(xx, y, shadeAt(R('grass'), 0, 1, 0.3 + (y - h) / 30, xx, y));
    }
    return p;
  };
  book.add('hills', hills(4), air);
  // the walk row: grass and dust (air), tufts
  const field = (seed: number) => {
    const p = hills(seed);
    const r = rng(seed);
    p.rect(0, 14, 20, 6, c('grass', 1));
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), 14 + Math.floor(r() * 6), c('grass', 2));
    return p;
  };
  book.add('field', field(5), air);
  // the ground: grass on top (solid), dirt under
  const ground = (top: boolean, seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('dirt'), 0, 2, 0.5 + (r() - 0.5) * 0.4, xx, y));
    if (top) {
      p.rect(0, 0, 20, 4, c('grass', 2)).rect(0, 4, 20, 1, c('grass', 0));
      for (let xx = 0; xx < 20; xx += 3) p.set(xx, 5, c('grass', 1));
    }
    for (let i = 0; i < 3; i++) p.disc(2 + r() * 16, 8 + r() * 10, 1, c('stone', 2));
    return p;
  };
  book.add('grass', ground(true, 6), { solid: SOLID });
  book.add('dirt', ground(false, 7), { solid: SOLID });
  // a rock in the field (solid: hop it)
  const rock = field(8);
  blob(rock, 10, 13, 8, 7, R('stone'), 0, 3);
  rock.set(7, 10, c('stone', 4)).line(12, 9, 15, 15, c('stone', 0));
  book.add('rock', rock, { solid: SOLID });
  // a bush (scenery)
  const bush = field(9);
  blob(bush, 10, 13, 8, 5, R('olive'), 0, 2);
  book.add('bush', bush, air);
  // the camp's tents: two blocks (scenery): a ridge pole and leather
  const tent = (half: 'L' | 'R') => {
    const p = field(10);
    for (let y = 4; y < 20; y++) {
      const w = Math.round((y - 4) * 0.9);
      const x0 = half === 'L' ? 20 - w : 0;
      p.rect(x0, y, w, 1, c('ochre', y % 3 === 0 ? 1 : 2));
    }
    if (half === 'R') p.rect(0, 12, 4, 8, c('ink', 1));
    else p.rect(16, 12, 4, 8, c('ink', 1));
    return p;
  };
  book.add('tentL', tent('L'), air);
  book.add('tentR', tent('R'), air);
  // a standard (aquila) stuck in the ground: points
  const eagle = field(11);
  eagle.rect(9, 6, 2, 14, c('wood', 2)).rect(5, 8, 10, 2, c('gold', 1));
  blob(eagle, 10, 4, 4, 2.6, R('gold'), 1, 3);
  eagle.set(10, 1, c('gold', 3)).set(9, 3, c('ink', 0));
  micro(eagle, 3, 11, 'SPQR', c('pompeii', 1));
  book.add('aquila', eagle, { score: 250, touch: 'field' });
  // pickups in the field
  book.add('wcup', cup(x, field(12)), { hp: 30, score: 10, touch: 'field' });
  book.add('wcoin', denarius(x, field(13)), { score: 100, touch: 'field' });
  book.add('wwreath', wreath(x, field(14)), { effect: LIFE, eamt: 1, score: 500, touch: 'field' });
  book.add('wcoinSky', denarius(x, sky(15)), { score: 100, touch: 'sky' });
  // the palisade (solid sharpened stakes) and the siege ladder up it (no gravity: climb it)
  const stakes = (top: boolean) => {
    const p = top ? sky(16) : P();
    for (let sx = 0; sx < 20; sx += 5) {
      p.rect(sx, top ? 6 : 0, 5, top ? 14 : 20, c('wood', 2)).rect(sx, top ? 6 : 0, 1, top ? 14 : 20, c('wood', 0));
      if (top) p.line(sx, 6, sx + 2, 1, c('wood', 3)).line(sx + 4, 6, sx + 2, 1, c('wood', 1));
    }
    p.rect(0, top ? 12 : 8, 20, 2, c('iron', 1));
    return p;
  };
  book.add('stakeTop', stakes(true), { solid: SOLID });
  book.add('stakes', stakes(false), { solid: SOLID });
  const ladder = (bg: Pixels) => {
    const p = copy(bg);
    p.rect(3, 0, 2, 20, c('wood', 3)).rect(15, 0, 2, 20, c('wood', 3));
    for (let y = 2; y < 20; y += 5) p.rect(3, y, 14, 2, c('wood', 2));
    return p;
  };
  book.add('ladder', ladder(field(17)), { grav: GRAV.none });
  book.add('ladderSky', ladder(sky(18)), { grav: GRAV.none });
  // a walkway along the top of the palisade (a ledge) and its far side
  const walk = sky(19);
  walk.rect(0, 14, 20, 4, c('wood', 3)).rect(0, 14, 20, 1, c('wood', 4)).rect(2, 18, 2, 2, c('wood', 1)).rect(16, 18, 2, 2, c('wood', 1));
  book.add('walkway', walk, { solid: LEDGE, grav: GRAV.down });
  // the ditch (fossa): its dark sides; he hides at the bottom (scenery: a sign says so)
  const ditch = (sign: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('dirt'), 0, 1, 0.3 + y / 60, xx, y));
    if (sign) {
      p.rect(9, 6, 2, 14, c('wood', 1)).rect(1, 2, 18, 7, c('wood', 3));
      micro(p, 2, 3, 'HIC', c('ink', 0));
      micro(p, 13, 3, '!', c('pompeii', 1));
    }
    return p;
  };
  book.add('ditch', ditch(false), air);
  book.add('ditchSign', ditch(true), air);
  // the hill and the archers' tower on it (solid), which gives birth to arrows
  const tower = (top: boolean) => {
    const p = top ? sky(20) : P();
    p.rect(2, top ? 6 : 0, 16, top ? 14 : 20, c('wood', 1));
    for (let y = top ? 8 : 2; y < 20; y += 6) p.rect(2, y, 16, 1, c('wood', 0));
    if (top) {
      p.rect(0, 4, 20, 3, c('wood', 2));
      for (let sx = 1; sx < 20; sx += 4) p.rect(sx, 1, 2, 3, c('wood', 2));
      p.rect(7, 9, 6, 4, c('ink', 0)).set(9, 10, c('eye', 0)).set(11, 10, c('eye', 0));
    }
    return p;
  };
  book.add('towerTop', tower(true), { solid: SOLID, birthMon: MON.arrow, birthTime: ARROW_EVERY });
  book.add('tower', tower(false), { solid: SOLID });
  // the town gate: its arch and the open way through (the level's end)
  const gate = (part: 'top' | 'way' | 'tower') => {
    const p = part === 'way' ? field(21) : sky(21);
    const stone = (yy0: number, yy1: number) => {
      for (let y = yy0; y < yy1; y++)
        for (let xx = 0; xx < 20; xx++)
          p.set(xx, y, (Math.floor(y / 5) + Math.floor((xx + (Math.floor(y / 5) % 2) * 5) / 10)) % 2 ? c('stone', 3) : c('stone', 2));
    };
    if (part === 'tower') {
      stone(4, 20);
      for (let sx = 0; sx < 20; sx += 6) p.rect(sx, 0, 4, 4, c('stone', 3));
    } else if (part === 'top') {
      stone(0, 20);
      p.disc(10, 22, 9, c('ink', 0));
      micro(p, 1, 2, 'PORTA', c('pompeii', 1));
    } else {
      p.rect(1, 0, 18, 20, c('ink', 0)).rect(1, 0, 2, 20, c('stone', 3)).rect(17, 0, 2, 20, c('stone', 3));
      p.rect(5, 6, 10, 14, c('sky', 4));
    }
    return p;
  };
  book.add('gateTower', gate('tower'), { solid: SOLID });
  book.add('gateTop', gate('top'), air);
  book.add('gateWay', gate('way'), air);
  // THE CHEZ by the gate (an anachronism: a red chariot with no horses), and the puzzled sign
  const chez = new Pixels(40, 20);
  chez.blit(field(22), 0, 0).blit(field(22), 20, 0);
  chezSide(chez, 0, 0, {
    body: [c('red', 1), c('red', 2), c('red', 3)],
    trim: c('red', 0),
    glass: [c('blue', 1), c('blue', 3)],
    roof: c('ink', 0),
    tire: c('ink', 0),
    hub: c('iron', 2),
    bumper: c('ink', 1),
    lamp: c('ochre', 3),
    tail: c('red', 3),
    pin: c('marble', 3),
  });
  book.add('chezL', chez.crop(0, 0, 20, 20), air);
  book.add('chezR', chez.crop(20, 0, 20, 20), air);
  const quid = field(23);
  quid.rect(9, 9, 2, 11, c('wood', 1)).rect(1, 1, 18, 9, c('wood', 3));
  micro(quid, 2, 2, 'QVID', c('ink', 0));
  micro(quid, 2, 6, 'EST?', c('pompeii', 1));
  book.add('quid', quid, air);

  // ---------- III. the rooftops of Rome ----------
  /** The sky at sunset over the city: domes and the far hills in silhouette low down. */
  const dusk = (seed: number, row: number, skyline = false) => {
    const p = sky(seed, row, false);
    if (skyline) {
      const r = rng(seed);
      for (let xx = 0; xx < 20; xx++) {
        const h = 12 + Math.round(Math.sin((xx + seed * 5) / 2.2) * 2 + r() * 2);
        for (let y = h; y < 20; y++) p.set(xx, y, c('grape', 0));
      }
      if (seed % 3 === 0) blob(p, 10, 13, 5, 4, R('grape'), 0, 0);
      if (seed % 4 === 1) p.set(4, 15, c('flame', 2)).set(15, 16, c('flame', 2));
    }
    return p;
  };
  book.add('dusk', dusk(31, 0), air);
  book.add('dusk2', dusk(32, 1), air);
  book.add('duskCity', dusk(33, 3, true), air);
  book.add('duskCity2', dusk(34, 3, true), air);
  // a roof: red tiles on top (solid, stand on it) and the stucco house wall under it (solid)
  const roof = (seed: number) => {
    const p = dusk(seed, 3, true);
    p.rect(0, 8, 20, 12, c('tile', 1));
    for (let y = 8; y < 20; y += 4) for (let xx = (y / 4) % 2 ? 0 : 3; xx < 20; xx += 6) p.rect(xx, y, 4, 3, c('tile', 2)).rect(xx, y, 4, 1, c('tile', 3));
    p.rect(0, 7, 20, 2, c('tile', 3)).rect(0, 6, 20, 1, c('tile', 0));
    return p;
  };
  book.add('roof', roof(35), { solid: SOLID });
  const house = (seed: number, window: boolean) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('ochre'), 1, 2, 0.5 + (r() - 0.5) * 0.3, xx, y));
    if (window)
      p.rect(6, 4, 8, 10, c('ink', 0)).rect(6, 4, 8, 1, c('wood', 2)).rect(6, 14, 8, 2, c('wood', 2)).set(9, 8, c('flame', 2)).set(10, 9, c('flame', 1));
    return p;
  };
  book.add('house', house(36, false), { solid: SOLID });
  book.add('houseWin', house(37, true), { solid: SOLID });
  // the street far below (solid cobbles) and the street's air
  const cobbles = P();
  for (let y = 0; y < 20; y++)
    for (let xx = 0; xx < 20; xx++) cobbles.set(xx, y, (xx % 6 === 0 || y % 5 === 0) && (xx + y) % 2 ? c('stone', 0) : c('stone', 2));
  cobbles.rect(0, 0, 20, 2, c('stone', 3));
  book.add('cobbles', cobbles, { solid: SOLID });
  const alley = P();
  for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) alley.set(xx, y, shadeAt(R('grape'), 0, 1, 0.4 + y / 50, xx, y));
  book.add('alley', alley, air);
  book.add('alleyLadder', ladder(alley), { grav: GRAV.none });
  // a chimney (solid), and the clever wise man's, which gives birth to spells
  const chimney = (magic: boolean) => {
    const p = dusk(38, 2, true);
    p.rect(5, 4, 10, 16, c('tile', 0)).rect(4, 2, 12, 3, c('stone', 3));
    for (let y = 7; y < 20; y += 4) p.rect(5, y, 10, 1, c('ink', 1));
    if (magic) sparkle(x, p, 39, 4, 'spell');
    else blob(p, 9, 0, 3, 2, R('steam'), 0, 2);
    return p;
  };
  book.add('chimney', chimney(false), { solid: SOLID });
  book.add('magusChimney', chimney(true), { solid: SOLID, birthMon: MON.spell, birthTime: SPELL_EVERY });
  // a washing line between two poles (scenery) with togas drying
  const washing = dusk(40, 2, true);
  washing.line(0, 6, 20, 8, c('ink', 1));
  for (const [wx, col] of [
    [3, 'toga'],
    [11, 'purple'],
  ] as const)
    washing.rect(wx, 7, 6, 8, c(col, 2)).rect(wx, 7, 6, 1, c(col, 3));
  book.add('washing', washing, air);
  // a pot of herbs on the roof (scenery) and a cup on a roof (dignity back), coins, grapes
  const herbs = dusk(41, 3, true);
  herbs.rect(5, 12, 10, 8, c('tile', 2)).rect(4, 11, 12, 2, c('tile', 3));
  blob(herbs, 10, 8, 6, 4, R('laurel'), 0, 2);
  book.add('herbs', herbs, air);
  book.add('rcup', cup(x, dusk(42, 3, true)), { hp: 30, score: 10, touch: 'duskCity' });
  book.add('rcoin', denarius(x, dusk(43, 3, true)), { score: 100, touch: 'duskCity' });
  book.add('rgrapes', grapes(x, dusk(44, 3, true)), { hp: 20, score: 10, touch: 'duskCity' });
  book.add('rwreath', wreath(x, dusk(45, 0)), { effect: LIFE, eamt: 1, score: 500, touch: 'dusk' });
  // the tituli: a painted sign on a post; touched, Titus's tongue twists it (counter 22)
  TITULI.forEach(([said, twisted], k) => {
    const sign = (twist: boolean) => {
      const p = dusk(46 + k, 3, true);
      p.rect(9, 10, 2, 10, c('wood', 1))
        .rect(0, 2, 20, 9, twist ? c('ochre', 3) : c('marble', 3))
        .frame(0, 2, 20, 9, c('pompeii', 1));
      const word = twist ? twisted : said;
      micro(p, Math.round(10 - microWidth(word) / 2), 4, word, twist ? c('pompeii', 1) : c('ink', 0));
      if (twist) sparkle(x, p, 50 + k, 3, 'spell');
      return p;
    };
    book.add(`titulus${k}`, sign(false), { ...air, effect: TITLES, eamt: 1, score: 100, touch: `twisted${k}` });
    book.add(`twisted${k}`, sign(true), air);
  });
  // SAXA (a heap of rocks: solid), which a touch mis-speaks into SAGA (a spell: air you pass)
  const saxa = (said: boolean) => {
    const p = dusk(55, 3, true);
    if (said) {
      for (const [sx, sy, rr] of [
        [6, 14, 5],
        [14, 15, 5],
        [10, 8, 5],
      ] as const)
        blob(p, sx, sy, rr + 1, rr, R('ink'), 0, 0);
      for (const [sx, sy, rr] of [
        [6, 14, 5],
        [14, 15, 5],
        [10, 8, 5],
      ] as const)
        blob(p, sx, sy, rr, rr - 1, R('stone'), 0, 2);
      p.rect(2, 9, 16, 6, c('marble', 3)).frame(2, 9, 16, 6, c('ink', 0));
      micro(p, 3, 10, 'SAXA', c('ink', 0));
    } else {
      sparkle(x, p, 56, 7, 'spell');
      micro(p, 3, 10, 'SAGA', c('spell', 2));
    }
    return p;
  };
  book.add('saxa', saxa(true), { solid: SOLID, score: 50, touch: 'saga' });
  book.add('saga', saxa(false), { grav: GRAV.down });
  // Titus's tavern on the roof: its sign, and the door that takes seven titles
  const tavern = (part: 'sign' | 'door' | 'open') => {
    const p = part === 'sign' ? dusk(57, 2) : house(58, false);
    if (part === 'sign') {
      p.rect(0, 10, 20, 10, c('ochre', 2)).rect(0, 4, 20, 7, c('wood', 1));
      micro(p, 1, 5, 'TITI', c('ochre', 3));
      return p;
    }
    if (part === 'open') {
      p.rect(3, 2, 14, 18, c('ink', 0)).rect(5, 4, 10, 16, c('flame', 0));
      blob(p, 10, 12, 3, 3, R('flame'), 1, 3);
      return p;
    }
    p.rect(3, 2, 14, 18, c('wood', 1)).rect(5, 4, 10, 6, c('wood', 2)).rect(5, 12, 10, 6, c('wood', 2)).disc(14, 11, 1, c('bronze', 3));
    micro(p, 7, 5, String(TITLES_NEEDED), c('pompeii', 1));
    return p;
  };
  book.add('tavernSign', tavern('sign'), air);
  book.add('tavern', tavern('door'), { solid: SOLID, effect: TITLES, eamt: -TITLES_NEEDED, score: 1000, touch: 'tavernOpen' });
  book.add('tavernOpen', tavern('open'), { grav: GRAV.none });
  return book;
}
