// Level 4's background blocks, Main Street at noon (the sequel's town, drawn with its tile
// art): brick shopfronts with awnings to stand on, the friends standing in their doorways
// (hidden behind shut doors, which are monsters, until Gwinn BOOFs the doorbell) with an
// RSVP card held out (walk into the doorway and it is hers), the alley's tall fence with soft
// dirt at its foot and a tunnel under it, the brick walk-up's fire escape, and the Klown
// Klub's party van, whose back door takes the three RSVPs one at a time.
import { Pixels } from '../../../kit/pixels';
import { blob, klubArt, micro, over } from '../art/draw';
import { Tiles } from './level';
import { bricks, c, canvas, cloud, copy, cut, dirt, hedge, r, sky, tuft, windowOn } from '../blocks/tiles';
import { bandAt, road, sidewalk, sign, wideSign } from './common';
import { CTR } from '../ids';
import { townCrier } from '../sprites/townfolk';
import { KLUB } from '../sprites/klubfolk';
import { juggler } from '../sprites/folks';
import { leoOn } from '../sprites/leo';
import { errandSprite } from '../sprites/errands';

export const G = 40;

/** The three friends who live on Main Street, left to right (the last one up the fire escape). */
export const FRIENDS = ['crier', 'honker', 'pratfall'] as const;

const skyRow = (y: number) => sky(bandAt(y, G));

export function inviteTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 17));
  t.wall('walk', sidewalk(1));
  t.wall('walk2', sidewalk(2));
  t.wall('road', road(false, 3));
  t.wall('roadLine', road(true, 4));
  t.wall('dirt', dirt(9));
  t.wall('deep', dirt(5, true));
  t.wall('hedgeWall', hedge(false, 25));
  t.wall('hedgeTop', hedge(true, 21, skyRow(29)));
  t.air('lawn', tuft(sky(3), 31));
  t.air('lawnFlower', tuft(sky(3), 41, 'red'));

  // The shopfronts: a cornice, brick, upstairs windows, a signboard, awnings to stand on.
  const brick = bricks(11);
  t.air('brick', brick);
  t.air('brickWin', windowOn(brick, false, 'green'));
  t.air('brickWinLit', windowOn(brick, true, 'red'));
  // a cornice over sky band k (the shops' at row 31, the walk-up's higher)
  const cornice = (k: number) => {
    const p = sky(k);
    p.rect(0, 8, 20, 12, c('brick', 1)).rect(0, 8, 20, 3, c('stone', 3)).rect(0, 11, 20, 1, c('stone', 1));
    for (let x = 1; x < 20; x += 4) p.rect(x, 12, 2, 3, c('stone', 2));
    return p;
  };
  t.air('cornice', cornice(bandAt(31, G)));
  t.air('corniceHi', cornice(bandAt(25, G)));
  for (const [name, col] of [
    ['awnRed', 'red'],
    ['awnBlue', 'blue'],
    ['awnGreen', 'green'],
  ] as const)
    t.ledge(
      name,
      (() => {
        const p = copy(brick);
        for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 10, (x >> 2) % 2 ? c('paint', 3) : c(col, 2));
        p.rect(0, 10, 20, 2, c(col, 0));
        for (let x = 0; x < 20; x += 4) blob(p, x + 2, 11, 2, 2, (x >> 2) % 2 ? [c('paint', 2), c('paint', 3)] : [c(col, 1), c(col, 2)], 0, 1);
        return p;
      })(),
    );
  const shopWin = (fill: (p: Pixels) => void) => {
    const p = copy(brick);
    p.rect(1, 2, 18, 18, c('wood', 1)).rect(2, 3, 16, 15, c('sky', 6));
    p.line(4, 15, 9, 4, c('sky', 7));
    fill(p);
    p.rect(1, 17, 18, 3, c('wood', 2));
    return p;
  };
  t.air(
    'winCakes',
    shopWin((p) => {
      blob(p, 7, 13, 4, 3, r('pink'), 1, 3);
      p.rect(5, 9, 4, 2, c('paint', 3)).set(7, 8, c('red', 3));
      blob(p, 14, 14, 3, 2, r('wood'), 2, 4);
    }),
  );
  t.air(
    'winJokes',
    shopWin((p) => {
      p.disc(6, 11, 3, c('red', 2)).disc(14, 12, 2, c('yellow', 3));
      p.rect(10, 6, 2, 9, c('lilac', 2)).rect(9, 5, 4, 2, c('lilac', 3));
    }),
  );
  t.air(
    'winBooks',
    shopWin((p) => {
      for (let i = 0; i < 6; i++) p.rect(4 + i * 2, 8 + (i % 2), 2, 9 - (i % 2), c(['red', 'blue', 'green'][i % 3], 2));
    }),
  );
  const signboard = (name: string, words: string, col: string) => {
    const p = canvas(2, 1, () => brick);
    p.rect(1, 3, 38, 14, c(col, 1)).frame(1, 3, 38, 14, c('gold', 2));
    micro(p, 20 - Math.floor((words.length * 4 - 1) / 2), 8, words, c('paint', 3));
    const [a, b] = cut(p)[0];
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  signboard('sBakery', 'BAKERY', 'red');
  signboard('sJokes', 'JOKE SHOP', 'blue');
  signboard('sBooks', 'BOOKS', 'green');
  // a lamp post
  for (const [name, top] of [
    ['lampTop', true],
    ['lampPost', false],
  ] as const) {
    const p = sky(3);
    p.rect(9, top ? 8 : 0, 2, top ? 12 : 20, c('ink', 1));
    if (top) p.rect(6, 1, 8, 7, c('ink', 1)).rect(7, 2, 6, 5, c('glow', 3));
    else p.rect(7, 16, 6, 4, c('ink', 1));
    t.air(name, p);
  }

  // The friends' doorways: the friend standing in it, holding out an RSVP card (the bottom
  // block is the card: touch it and it is hers, and the friend keeps waving).
  const doorway = () => {
    const p = canvas(1, 2, () => brick);
    p.rect(3, 6, 14, 34, c('ink', 1)).frame(2, 5, 16, 35, c('wood', 1));
    return p;
  };
  const figures: Record<(typeof FRIENDS)[number], Pixels> = { crier: townCrier(false), honker: KLUB.honker, pratfall: KLUB.pratfall };
  for (const who of FRIENDS) {
    const p = doorway();
    over(p, figures[who], 1, 0);
    const top = p.crop(0, 0, 20, 20);
    const bot = p.crop(0, 20, 20, 20);
    t.air(`${who}Top`, top);
    t.air(`${who}Waves`, bot);
    const card = copy(bot);
    over(card, errandSprite('rsvp'), 7, 3);
    t.air(`${who}Card`, card, { effect: CTR.rsvps, eamt: 1, score: 100, touch: `${who}Waves` });
  }

  // The alley's tall board fence, and the way under it: soft dirt at its foot (a monster:
  // big dig), a dark tunnel through the dirt, and the hole on the far side.
  const fence = (cap: boolean) => {
    const p = cap ? skyRow(30) : new Pixels(20, 20, c('wood', 2));
    if (!cap) for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('wood', 0)).rect(x + 1, 0, 1, 20, c('wood', 3));
    else
      for (let x = 0; x < 20; x += 5) {
        p.rect(x, 8, 4, 12, c('wood', 2))
          .rect(x + 1, 6, 2, 2, c('wood', 2))
          .rect(x, 8, 1, 12, c('wood', 0));
      }
    if (!cap) p.rect(0, 4, 20, 2, c('wood', 1)).rect(0, 14, 20, 2, c('wood', 1));
    return p;
  };
  t.wall('fence', fence(false));
  t.wall('fenceTop', fence(true));
  const hole = new Pixels(20, 20, c('dirt', 0));
  t.air('hole', hole);
  t.air(
    'tunnel',
    (() => {
      const p = copy(hole);
      p.rect(0, 0, 20, 2, c('dirt', 1)).rect(0, 18, 20, 2, c('dirt', 1));
      return p;
    })(),
  );
  t.air('signDig', sign(sky(3), 'DIG', 'down'));

  // The brick walk-up in the alley and its fire escape: iron landings (ledges) and ladders.
  const grate = (base: Pixels) => {
    const p = copy(base);
    p.rect(0, 0, 20, 3, c('metal', 1)).rect(0, 0, 20, 1, c('metal', 3));
    for (let x = 1; x < 20; x += 3) p.rect(x, 3, 1, 3, c('metal', 1));
    p.rect(0, 6, 20, 1, c('metal', 1));
    return p;
  };
  t.ledge('escape', grate(brick));
  t.ledge('escapeSky', grate(skyRow(36)));
  t.air(
    'ladder',
    (() => {
      const p = copy(brick);
      p.rect(4, 0, 2, 20, c('metal', 1)).rect(14, 0, 2, 20, c('metal', 1));
      for (let y = 2; y < 20; y += 5) p.rect(4, y, 12, 1, c('metal', 2));
      return p;
    })(),
  );
  t.air(
    'flowerBox',
    (() => {
      const p = copy(brick);
      p.rect(2, 14, 16, 6, c('wood', 2)).rect(2, 14, 16, 1, c('wood', 3));
      for (const x of [5, 10, 15]) blob(p, x, 11, 2, 2, r('pink'), 1, 3);
      return p;
    })(),
  );
  t.wall(
    'can',
    (() => {
      const p = sky(3);
      p.rect(3, 4, 14, 16, c('metal', 2)).rect(2, 3, 16, 2, c('metal', 3));
      for (let x = 5; x < 17; x += 3) p.rect(x, 6, 1, 13, c('metal', 1));
      return p;
    })(),
  );
  t.air('signUp', sign(sky(3), 'UP', 'up'));

  // The Klown Klub's party van, facing right: polka dots, a red stripe, the cab and its
  // wheels. Its back door is three blocks deep (three latches, one RSVP each); past them,
  // the seat that is Gwinn's goal.
  const van = (open: boolean) => {
    const p = canvas(6, 2, () => sky(3));
    p.rect(1, 6, 86, 28, c('paint', 3)).frame(1, 6, 86, 28, c('ink', 1));
    p.rect(1, 6, 86, 3, c('red', 2));
    // the cab: a rounded nose and the windshield
    p.rect(88, 12, 30, 22, c('paint', 3)).frame(88, 12, 30, 22, c('ink', 1));
    p.rect(92, 14, 16, 9, c('sky', 6)).line(96, 21, 102, 15, c('sky', 7));
    p.rect(114, 26, 5, 3, c('gold', 3)).rect(116, 30, 4, 4, c('ink', 1));
    for (let x = 8; x < 56; x += 11)
      for (const y of [12, 18]) p.disc(x + (y === 18 ? 5 : 0), y, 2, c(['blue', 'yellow', 'green', 'pink'][((x / 11) | 0) % 4], 2));
    micro(p, 62, 10, klubArt('KLOWN'), c('red', 1));
    micro(p, 64, 16, klubArt('KLUB'), c('red', 1));
    // the back door's three latches, each with a card slot and its number
    for (let k = 0; k < 3; k++) {
      const x = k * 20;
      if (open) {
        p.rect(x + 2, 22, 18, 12, c('lilac', 0));
        blob(p, x + 8, 27, 3, 3, r(['red', 'yellow', 'blue'][k]), 1, 3);
        p.line(x + 8, 30, x + 11, 34, c('ink', 1));
      } else {
        p.rect(x + 3, 23, 15, 10, c('lilac', 2)).frame(x + 3, 23, 15, 10, c('ink', 1));
        p.rect(x + 6, 25, 9, 2, c('ink', 0));
        micro(p, x + 9, 28, `${k + 1}`, c('paint', 3));
      }
    }
    // the seat inside, past the latches (always open)
    p.rect(62, 22, 18, 12, c('lilac', 0));
    p.rect(64, 27, 14, 5, c('red', 2)).rect(64, 27, 14, 1, c('red', 3));
    p.rect(70, 23, 2, 3, c('yellow', 3)).rect(69, 24, 4, 1, c('yellow', 3));
    for (const x of [20, 100]) p.disc(x, 35, 4, c('ink', 0)).ring(x, 35, 1, c('metal', 3));
    return cut(p);
  };
  const shut = van(false);
  const open = van(true);
  for (let bx = 0; bx < 6; bx++) t.wall(`vanTop${bx}`, shut[0][bx]);
  for (let k = 0; k < 3; k++) {
    t.air(`latchOpen${k}`, open[1][k]);
    t.wall(`latch${k}`, shut[1][k], { effect: CTR.rsvps, eamt: -1, touch: `latchOpen${k}`, score: 100 });
  }
  t.air('vanSeat', shut[1][3]);
  t.wall('vanBack4', shut[1][4]);
  t.wall('vanBack5', shut[1][5]);

  // Juggles, the van's driver, practicing beside it (two pictures taking turns).
  for (const ph of [0, 1]) {
    const [a, b] = leoOn(juggler(ph), sky(3), sky(3));
    t.air(`juggles${ph}Top`, a, { next: `juggles${1 - ph}Top`, ntime: 7 });
    t.air(`juggles${ph}Bot`, b, { next: `juggles${1 - ph}Bot`, ntime: 7 });
  }

  // Signs.
  const pair = (name: string, base: Pixels, words: string) => {
    const [a, b] = wideSign(base, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  pair('signBoof', sky(3), 'DOORBELL:\nSPACE BOOF');
  pair('signVan', sky(3), 'VAN DOOR:\n3 RSVPS');
  return t;
}
