// REMOTE.BBL: every background block, drawn in code, seen from above at a slant (you see the
// floor, the tops of things and their fronts). A block's number is the order it was added (by
// name here); the attributes are the game:
//   - searching is touching: push into a couch cushion, the blanket, the laundry, the magazines,
//     the cat's chair or Teddy's bed and it changes into the searched version, counting one spot
//     (counter 20); the baby gate to the kitchen only opens for six;
//   - Teddy gives you a kiss (patience back), the cat a swipe (patience lost); the Voice-O-Matic
//     mishears you and orders a pizza (a life);
//   - in the kitchen the fridge's cold soda gives patience back, the toaster gives birth to
//     flying toast, Mom's number is seven fridge magnets on the floor (counter 21), and the phone
//     dials them; Teddy's bowl is his (points off);
//   - in the void between the cushions the nothing is solid, a Bermuda swirl stings once, the lost
//     things are points, the fake remotes say NOPE, and the pay TV takes ten pennies (money);
//   - on the living room ride the spinning rug carries you round (gravity), the VCR's PLAY
//     button counts (counter 22) and the couch only lets you sit down with the tape playing.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';
import { DIGITS, DIGITS_NEEDED, LIVES, MON, MOMS_NUMBER, MONEY, PENNIES_NEEDED, PLAY, SPOTS, SPOTS_NEEDED } from '../ids';

export { BlockBook, SOLID };
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
/** Ticks between slices of toast. */
export const TOAST_EVERY = 90;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);
  const ink = c('ink', 0);
  const solid = { solid: SOLID };

  /** A big picture cut into blocks, left to right, top to bottom: names[row][col]. */
  const cut = (pic: Pixels, names: (string | null)[][], attrs: (name: string) => Parameters<BlockBook['add']>[2] = () => solid) => {
    names.forEach((row, ry) =>
      row.forEach((name, rx) => {
        if (name) book.add(name, pic.crop(rx * 20, ry * 20, 20, 20), attrs(name));
      }),
    );
  };

  // ---------- floors ----------
  const carpet = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('carpet'), 3, 1, seed, 0.35);
    const r = rng(seed + 5);
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('carpet', 1));
    return p;
  };
  book.add('carpet', carpet(1));
  book.add('carpet2', carpet(2));
  // the oriental rug: navy with a burgundy and cream medallion
  const rug = (() => {
    const p = P();
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const d = Math.abs(x - 9.5) + Math.abs(y - 9.5);
        p.set(x, y, d < 3 ? c('wall', 3) : d < 6 ? c('red', 1) : d < 7 ? c('wall', 2) : (x + y) % 4 === 0 ? c('rug', 2) : c('rug', 1));
      }
    return p;
  })();
  book.add('rug', rug);
  const rugEdge = carpet(3);
  rugEdge.rect(0, 0, 20, 12, c('rug', 1)).rect(0, 10, 20, 2, c('red', 1));
  for (let x = 1; x < 20; x += 2) rugEdge.line(x, 12, x, 15, c('wall', 3));
  book.add('rugEdge', rugEdge);
  // a Lego brick, left on the carpet: OW (and it's gone)
  const lego = carpet(4);
  lego.rect(6, 8, 8, 5, c('red', 2)).rect(6, 12, 8, 1, c('red', 0));
  for (const x of [7, 10]) lego.rect(x, 7, 2, 2, c('red', 3));
  book.add('lego', lego, { hp: -6, touch: 'carpet' });

  // ---------- walls ----------
  const wallpaper = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('wall', 2));
    for (let x = 2; x < 20; x += 5) p.rect(x, 0, 1, 20, c('wall', 3));
    const r = rng(seed);
    for (let y = 3; y < 20; y += 7) for (let x = 0; x < 20; x += 5) if (r() < 0.8) p.set(x + 4, y, c('flora', 1)).set(x + 4, y + 1, c('pink', 0));
    p.rect(0, 0, 20, 2, c('wood', 2)).rect(0, 2, 20, 1, c('wood', 0));
    return p;
  };
  book.add('paper', wallpaper(5), solid);
  // the lower wall: wood paneling and the baseboard
  const panel = (() => {
    const p = P();
    for (let x = 0; x < 20; x++) for (let y = 0; y < 20; y++) p.set(x, y, shadeAt(R('wood'), 1, 3, 0.45 + Math.sin(x * 1.7 + y * 0.15) * 0.2, x, y));
    for (const x of [0, 10]) p.rect(x, 0, 1, 17, c('wood', 0));
    p.rect(0, 0, 20, 1, c('wood', 4)).rect(0, 16, 20, 4, c('wood', 1)).rect(0, 16, 20, 1, c('wood', 3));
    return p;
  })();
  book.add('panel', panel, solid);
  // the top of a wall seen from above (the sides and the front of the room)
  const wallTop = P().rect(0, 0, 20, 20, c('wall', 0));
  wallTop.rect(0, 0, 20, 1, c('wall', 1)).rect(0, 19, 20, 1, c('ink', 1));
  for (let y = 4; y < 20; y += 6) wallTop.rect(0, y, 20, 1, c('wall', 1));
  book.add('wallTop', wallTop, solid);
  // a window: the curtains and the night outside
  const window = wallpaper(6);
  window.rect(3, 4, 14, 14, c('wood', 3)).rect(4, 5, 12, 12, c('sky', 1)).rect(9, 5, 2, 12, c('wood', 3)).rect(4, 10, 12, 1, c('wood', 3));
  for (const [x, y] of [[6, 7], [13, 6], [14, 13]]) window.set(x, y, c('star', 0));
  window.disc(6, 13, 1.5, c('lamp', 1));
  for (let y = 3; y < 19; y++) window.rect(1, y, 3 - (y % 2), 1, c('red', 1)).rect(16 + (y % 2), y, 3, 1, c('red', 1));
  book.add('window', window, solid);
  // Teddy's portrait over the couch
  const portrait = wallpaper(7);
  portrait.rect(4, 4, 12, 14, c('gold', 0)).rect(5, 5, 10, 12, c('flora', 0));
  blob(portrait, 10, 12, 4, 3.6, R('fur'), 1, 3);
  portrait.line(7, 9, 7, 6, c('fur', 2)).line(13, 9, 13, 5, c('fur', 2)).line(10, 9, 10, 13, c('white', 2)).set(8, 11, ink).set(12, 11, ink).set(10, 14, ink);
  book.add('portrait', portrait, solid);
  // the clock: hands at a quarter past "where is it"
  const clock = wallpaper(8);
  clock.disc(10, 11, 6, c('wood', 1)).disc(10, 11, 5, c('white', 2)).line(10, 11, 10, 7, ink).line(10, 11, 13, 12, ink);
  book.add('clock', clock, solid);
  // a shelf of VHS tapes (the panel row)
  const shelf = panel.crop(0, 0, 20, 20);
  shelf.rect(1, 2, 18, 13, c('wood', 0));
  ['red', 'blue', 'white', 'yellow', 'green', 'red', 'blue'].forEach((k, i) => shelf.rect(2 + i * 2 + Math.floor(i / 4), 4, 2, 10, c(k, i % 2 ? 1 : 2)).set(2 + i * 2 + Math.floor(i / 4), 6, c('white', 2)));
  book.add('tapes', shelf, solid);

  // ---------- the TV and the VCR ----------
  // A big 1995 console TV in a wood cabinet, two blocks wide: the screen shows blue nothing,
  // the snow of static, or channel 13's cooking show.
  const tv = (show: 'blue' | 'snow0' | 'snow1' | 'cook0' | 'cook1') => {
    const p = new Pixels(40, 20);
    p.rect(0, 0, 40, 20, c('wood', 1)).rect(0, 0, 40, 2, c('wood', 3)).rect(0, 18, 40, 2, c('wood', 0));
    p.rect(2, 2, 27, 16, c('crt', 0)).rect(3, 3, 25, 14, c('crt', 1));
    const sx = 4;
    const sy = 4;
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 23; x++) {
        const corner = (x === 0 || x === 22) && (y === 0 || y === 11);
        if (corner) continue;
        let col = c('screen', 1);
        if (show === 'blue') col = c('screen', (x + y) % 9 === 0 ? 2 : 1);
        if (show.startsWith('snow')) col = rng(x * 31 + y * 7 + (show === 'snow1' ? 999 : 0))() < 0.5 ? c('screen', 3) : c('crt', (x * y + (show === 'snow1' ? 1 : 0)) % 3);
        p.set(sx + x, sy + y, col);
      }
    if (show.startsWith('cook')) {
      // a chef in a tall white hat over a pot, steam rising: channel 13
      const f = show === 'cook1' ? 1 : 0;
      p.rect(sx, sy + 8, 23, 4, c('wood', 2));
      blob(p, sx + 8, sy + 9, 4, 2, R('silver'), 0, 2);
      p.rect(sx + 14, sy + 3, 5, 6, c('white', 2)).rect(sx + 15, sy, 3, 3, c('white', 2)).rect(sx + 15, sy + 4, 3, 2, c('skin', 2));
      for (let k = 0; k < 3; k++) p.set(sx + 7 + k * 2, sy + 4 - ((k + f) % 2), c('white', 1));
      micro(p, sx + 1, sy + 1, '13', c('yellow', 2));
    }
    // the knobs and the speaker grille
    for (const y of [5, 10]) p.disc(34, y, 2, c('crt', 2)).set(34, y - 1, c('crt', 3));
    for (let y = 13; y < 17; y += 2) p.rect(31, y, 7, 1, c('wood', 0));
    return p;
  };
  cut(tv('blue'), [['tvL', 'tvR']], () => ({ solid: SOLID }));
  // the den's TV blinks between static and blue (no remote, no way to change it)
  {
    const a = tv('snow0');
    const b = tv('snow1');
    book.add('tvSnowL', a.crop(0, 0, 20, 20), { solid: SOLID, next: 'tvSnowL2', ntime: 3 });
    book.add('tvSnowL2', b.crop(0, 0, 20, 20), { solid: SOLID, next: 'tvSnowL', ntime: 3 });
    book.add('tvSnowR', a.crop(20, 0, 20, 20), { solid: SOLID, next: 'tvSnowR2', ntime: 3 });
    book.add('tvSnowR2', b.crop(20, 0, 20, 20), { solid: SOLID, next: 'tvSnowR', ntime: 3 });
    const k0 = tv('cook0');
    const k1 = tv('cook1');
    book.add('tvCookL', k0.crop(0, 0, 20, 20), { solid: SOLID, next: 'tvCookL2', ntime: 8 });
    book.add('tvCookL2', k1.crop(0, 0, 20, 20), { solid: SOLID, next: 'tvCookL', ntime: 8 });
    book.add('tvCookR', k0.crop(20, 0, 20, 20), { solid: SOLID });
  }
  // the VCR on its stand, blinking 12:00 (it always has been)
  const vcr = (lit: boolean, playing = false) => {
    const p = carpet(9);
    p.rect(1, 6, 18, 12, c('crt', 0)).rect(1, 6, 18, 2, c('crt', 2)).rect(1, 17, 18, 1, ink);
    p.rect(3, 10, 8, 3, c('ink', 1)).rect(4, 11, 6, 1, c('crt', 0));
    p.rect(12, 9, 6, 5, ink);
    if (playing) micro(p, 12, 9, '>', c('led', 1));
    else if (lit) micro(p, 12, 9, '12', c('led', 1));
    p.rect(3, 15, 2, 1, c('crt', 3)).rect(6, 15, 2, 1, c('crt', 3)).rect(9, 15, 2, 1, playing ? c('led', 1) : c('crt', 3));
    return p;
  };
  book.add('vcr', vcr(true), { solid: SOLID, next: 'vcrOff', ntime: 18 });
  book.add('vcrOff', vcr(false), { solid: SOLID, next: 'vcr', ntime: 18 });
  // the ride's VCR: press PLAY (counter 22), and the tape plays
  book.add('vcrPlay', vcr(true), { solid: SOLID, effect: PLAY, eamt: 1, score: 250, touch: 'vcrPlaying' });
  book.add('vcrPlaying', vcr(true, true), { solid: SOLID });

  // ---------- the couch ----------
  // Dusty rose with teal flowers, five blocks wide: its back (top row) and arms and seat cushions.
  const couch = (() => {
    const p = new Pixels(100, 40);
    const fabric = (x: number, y: number, k: number) => {
      const flower = (x % 9 === 4 && y % 8 === 3) || (x % 9 === 0 && y % 8 === 7);
      return flower ? c('flora', 2) : (x + y) % 9 === 0 && flower === false && (x * y) % 7 === 0 ? c('flora', 1) : c('couch', k);
    };
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 100; x++) {
        let k = 2;
        if (y < 18) k = y < 3 ? 3 : y > 14 ? 1 : 2; // the back cushions, rounded
        if (x < 14 || x >= 86) k = y < 4 ? 3 : y > 36 ? 0 : 2; // the arms
        p.set(x, y, fabric(x, y, k));
      }
    // seams between the back cushions and the seat cushions
    for (const x of [14, 38, 62, 85]) p.rect(x, 2, 1, 36, c('couch', 0));
    p.rect(14, 17, 72, 2, c('couch', 0)).rect(0, 38, 100, 2, c('couch', 0));
    p.rect(14, 19, 72, 2, c('couch', 3));
    // the arms roll over
    for (const x0 of [0, 86]) p.rect(x0, 0, 14, 2, c('couch', 4)).rect(x0 + 1, 2, 12, 1, c('couch', 3));
    return p;
  })();
  // The couch faces the TV, away from you: its seat cushions on the far side (the top row) and
  // its back toward you (the bottom row), so the picture is turned upside down.
  const flipped = new Pixels(100, 40).map((x, y) => couch.get(x, 39 - y));
  cut(flipped, [
    ['couchArmL', null, null, null, 'couchArmR'],
    ['couchBackL', 'couchBack', 'couchBack2', 'couchBack3', 'couchBackR'],
  ]);
  // the seat cushions: touch one and you lift it; under it, the usual
  const seat = (k: number) => couch.crop(20 + k * 20, 20, 20, 20);
  book.add('cushion', seat(0), { solid: SOLID, effect: SPOTS, eamt: 1, score: 50, touch: 'cushionUp' });
  book.add('cushion2', seat(1), { solid: SOLID, effect: SPOTS, eamt: 1, score: 50, touch: 'cushionUp2' });
  const lifted = (k: number, junk: 'pennies' | 'crumbs') => {
    const p = seat(k);
    p.rect(1, 3, 18, 15, c('ink', 1)).rect(2, 4, 16, 13, c('couch', 0));
    // the cushion propped up at the back
    p.rect(0, 0, 20, 5, c('couch', 3)).rect(0, 4, 20, 1, c('couch', 1));
    if (junk === 'pennies') {
      p.disc(6, 10, 2, c('copper', 2)).disc(13, 13, 2, c('copper', 1));
      p.rect(9, 8, 6, 1, c('blue', 2)).set(15, 8, c('white', 2));
    } else {
      for (const [x, y] of [[5, 9], [9, 14], [14, 10], [12, 7], [7, 13]]) p.rect(x, y, 2, 1, c('orange', 2));
      p.rect(10, 11, 1, 4, c('silver', 2));
    }
    return p;
  };
  book.add('cushionUp', lifted(0, 'pennies'), solid);
  book.add('cushionUp2', lifted(1, 'crumbs'), solid);
  // the seat you sit back down in at the end (the ride): it only takes you with the tape playing
  book.add('couchSeat', seat(2), { solid: SOLID, effect: PLAY, eamt: -1, score: 1000, touch: 'couchSat' });
  const sat = seat(2);
  blob(sat, 10, 9, 6, 5, R('robe'), 1, 3);
  book.add('couchSat', sat);

  // ---------- the rest of the living room ----------
  // the coffee table: snacks, a soda, a bowl of popcorn (two blocks wide)
  const table = (() => {
    const p = new Pixels(40, 20);
    p.rect(0, 0, 40, 20, c('carpet', 3));
    p.rect(1, 3, 38, 13, c('wood', 3)).rect(1, 15, 38, 3, c('wood', 1)).rect(1, 3, 38, 1, c('wood', 4));
    blob(p, 10, 9, 6, 4, R('red'), 1, 3);
    for (const [x, y] of [[8, 7], [11, 8], [13, 6], [9, 10]]) p.rect(x, y, 2, 2, c('white', 2));
    p.rect(26, 5, 5, 7, c('red', 2)).rect(26, 5, 5, 1, c('silver', 2)).set(28, 8, c('white', 2));
    p.rect(32, 8, 6, 4, c('yellow', 1));
    return p;
  })();
  cut(table, [['tableL', 'tableR']]);
  // the armchair, with the cat asleep on it: look under the cat (it swipes)
  const chair = (cat: boolean) => {
    const p = carpet(10);
    p.rect(1, 1, 18, 7, c('flora', 0)).rect(1, 7, 3, 12, c('flora', 0)).rect(16, 7, 3, 12, c('flora', 0)).rect(4, 7, 12, 11, c('flora', 1));
    p.rect(1, 1, 18, 1, c('flora', 2));
    if (cat) {
      blob(p, 10, 12, 6, 4, R('cat'), 1, 3);
      for (let x = 6; x < 15; x += 3) p.line(x, 9, x, 15, c('cat', 0));
      blob(p, 14, 11, 2.6, 2.4, R('cat'), 1, 3);
      p.set(13, 9, c('cat', 2)).set(15, 9, c('cat', 2)).line(13, 11, 14, 11, ink).line(5, 15, 9, 16, c('cat', 2));
    } else {
      p.rect(6, 10, 3, 2, c('copper', 2)).rect(10, 13, 5, 1, c('silver', 2));
      for (const [x, y] of [[7, 14], [13, 10]]) p.set(x, y, c('cat', 2));
    }
    return p;
  };
  book.add('chairCat', chair(true), { solid: SOLID, hp: -6, effect: SPOTS, eamt: 1, score: 50, touch: 'chairEmpty' });
  book.add('chairEmpty', chair(false), solid);
  // Teddy asleep in his bed: lift the dog (he kisses you: patience)
  const bed = (dog: 'asleep' | 'up') => {
    const p = carpet(11);
    blob(p, 10, 11, 9, 7, R('plaid'), 0, 2);
    blob(p, 10, 11, 6.4, 4.6, R('red'), 0, 2);
    if (dog === 'asleep') {
      blob(p, 9, 11, 5.6, 3.6, R('fur'), 1, 3);
      p.rect(5, 12, 6, 2, c('white', 2));
      blob(p, 14, 10, 2.8, 2.6, R('fur'), 1, 3);
      p.line(13, 8, 12, 6, c('fur', 2)).line(16, 8, 17, 5, c('fur', 2)).line(13, 10, 14, 10, ink).line(15, 10, 16, 10, ink).set(15, 12, ink);
      micro(p, 15, 1, 'Z', c('white', 2));
    } else {
      // the bed empty but for a squeaky toy; Teddy sitting up in it, grinning (or not)
      p.rect(5, 13, 4, 2, c('yellow', 2)).set(4, 13, c('orange', 1));
      blob(p, 12, 10, 3.2, 3, R('fur'), 1, 3);
      p.line(10, 8, 9, 4, c('fur', 2)).line(14, 8, 15, 3, c('fur', 2)).line(12, 7, 12, 12, c('white', 2));
      p.set(11, 9, ink).set(13, 9, ink).set(12, 12, ink);
      p.set(12, 13, c('pink', 2)).set(12, 14, c('pink', 1));
    }
    return p;
  };
  book.add('dogBed', bed('asleep'), { solid: SOLID, hp: 10, effect: SPOTS, eamt: 1, score: 50, touch: 'dogUp' });
  book.add('dogUp', bed('up'), solid);
  // the end table and its lamp
  const lamp = carpet(12);
  lamp.rect(2, 8, 16, 10, c('wood', 2)).rect(2, 8, 16, 1, c('wood', 4)).rect(2, 17, 16, 1, c('wood', 0));
  lamp.disc(10, 7, 6, c('lamp', 1)).disc(10, 7, 4, c('lamp', 2)).disc(10, 7, 1.5, c('wood', 1));
  book.add('lamp', lamp, solid);
  // the Voice-O-Matic 2000 ("Just ask!"): it hears "remote" and orders a pizza (a life)
  const gadget = (say?: string) => {
    const p = carpet(13);
    p.rect(2, 9, 16, 9, c('wood', 2)).rect(2, 9, 16, 1, c('wood', 4));
    p.rect(5, 2, 10, 13, c('crt', 0)).rect(5, 2, 10, 2, c('crt', 2));
    for (let y = 5; y < 10; y += 2) p.rect(6, y, 8, 1, c('crt', 1));
    p.rect(6, 11, 8, 3, ink);
    if (say) micro(p, 6, 11, say.slice(0, 2), c('led', 1));
    p.set(13, 3, say ? c('led', 1) : c('red', 1));
    return p;
  };
  book.add('gadget', gadget(), { solid: SOLID, effect: LIVES, eamt: 1, score: 100, touch: 'gadgetOn' });
  // it scrolls PIZZA on its little display, two letters at a time
  book.add('gadgetOn', gadget('PI'), { solid: SOLID, next: 'gadgetOn2', ntime: 10 });
  book.add('gadgetOn2', gadget('ZZ'), { solid: SOLID, next: 'gadgetOn3', ntime: 10 });
  book.add('gadgetOn3', gadget('A?'), { solid: SOLID, next: 'gadgetOn', ntime: 14 });
  // the afghan on the floor: walk over it and flip it
  const blanket = (flipped: boolean) => {
    const p = carpet(14);
    for (let y = 2; y < 19; y++) for (let x = 1; x < 19; x++) if (!(flipped && y < 7 && x > y)) p.set(x, y, c(['orange', 'yellow', 'green', 'purple'][Math.floor((x + y) / 4) % 4], (x + y) % 2 ? 1 : 2));
    if (flipped) {
      for (let k = 0; k < 7; k++) p.line(k + 1, k + 1, 18, k + 1, c('orange', 0));
      p.rect(12, 12, 4, 1, c('silver', 2)).set(16, 12, c('silver', 1));
    }
    for (let x = 1; x < 19; x += 2) p.set(x, 19, c('wall', 3));
    return p;
  };
  book.add('blanket', blanket(false), { effect: SPOTS, eamt: 1, score: 50, touch: 'blanketUp' });
  book.add('blanketUp', blanket(true));
  // the magazines (and a TV Guide from 1993)
  const mags = (spread: boolean) => {
    const p = carpet(16);
    const list: [number, number, string][] = spread ? [[1, 3, 'red'], [10, 2, 'blue'], [4, 10, 'yellow'], [11, 11, 'white']] : [[4, 5, 'red'], [5, 7, 'blue'], [4, 9, 'yellow']];
    for (const [x, y, k] of list) p.rect(x, y, 9, 7, c(k, 2)).rect(x, y, 9, 2, c(k, 1)).rect(x + 1, y + 3, 5, 1, c('ink', 1));
    micro(p, list[list.length - 1][0] + 1, list[list.length - 1][1] + 1, 'TV', c('red', 0));
    return p;
  };
  book.add('mags', mags(false), { solid: SOLID, effect: SPOTS, eamt: 1, score: 50, touch: 'magsSpread' });
  book.add('magsSpread', mags(true));
  // the laundry basket
  const laundry = (dug: boolean) => {
    const p = carpet(17);
    p.rect(2, 4, 16, 14, c('white', 1)).rect(3, 5, 14, 12, c('white', 0));
    for (let x = 4; x < 17; x += 3) p.rect(x, 7, 1, 9, c('white', 2));
    if (!dug) {
      blob(p, 7, 6, 4, 3, R('blue'), 1, 3);
      blob(p, 13, 5, 4, 3, R('red'), 1, 3);
      blob(p, 10, 8, 3, 2, R('white'), 1, 2);
    } else {
      blob(p, 4, 17, 3, 2, R('blue'), 1, 3);
      blob(p, 16, 2, 3, 2, R('red'), 1, 3);
    }
    return p;
  };
  book.add('laundry', laundry(false), { solid: SOLID, effect: SPOTS, eamt: 1, score: 50, touch: 'laundryDug' });
  book.add('laundryDug', laundry(true), solid);
  // a potted ficus
  const plant = carpet(18);
  plant.rect(6, 12, 8, 7, c('orange', 0)).rect(5, 12, 10, 2, c('orange', 1));
  for (const [x, y] of [[7, 5], [12, 4], [10, 8], [5, 8], [14, 9], [9, 2]]) blob(plant, x, y, 3, 2.4, R('green'), 0, 2);
  book.add('plant', plant, solid);
  // things to find: a penny (money), popcorn (points), half a candy bar (patience)
  const penny = (bg: () => Pixels) => {
    const p = bg();
    blob(p, 10, 11, 4, 3.6, R('copper'), 1, 3);
    p.ring(10, 11, 2.4, c('copper', 1)).set(8, 9, c('gold', 2));
    return p;
  };
  book.add('penny', penny(() => carpet(19)), { effect: MONEY, eamt: 1, score: 5, touch: 'carpet' });
  const kernels = (bg: () => Pixels, to: string) => {
    const p = bg();
    for (const [x, y] of [[6, 8], [12, 11], [9, 14]] as const) blob(p, x, y, 2, 1.8, R('white'), 1, 2);
    p.set(12, 12, c('yellow', 1));
    book.add(`popcorn${to}`, p, { score: 10, touch: to });
  };
  kernels(() => carpet(20), 'carpet');
  // a game controller, its cord running off to the TV: a remote? NOPE
  const pad = carpet(21);
  pad.line(10, 0, 10, 6, ink).rect(3, 7, 14, 7, c('crt', 3)).disc(4, 10, 3.4, c('crt', 3)).disc(16, 10, 3.4, c('crt', 3));
  pad.rect(3, 9, 3, 1, ink).rect(4, 8, 1, 3, ink).disc(14, 9, 1, c('purple', 2)).disc(16, 11, 1, c('purple', 2)).rect(9, 11, 2, 1, c('crt', 1));
  book.add('pad', pad, { score: 10, touch: 'carpet' });
  // a beanbag chair
  const beanbag = carpet(22);
  blob(beanbag, 10, 11, 8, 7, R('purple'), 0, 3);
  beanbag.line(6, 8, 13, 12, c('purple', 0));
  book.add('beanbag', beanbag, solid);
  // the baby gate to the kitchen: it opens when you give up on the living room (six spots)
  const babyGate = (open: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('tile', 3));
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((Math.floor(x / 5) + Math.floor(y / 5)) % 2) p.set(x, y, c('tile', 0));
    if (!open) {
      p.rect(0, 2, 20, 2, c('white', 2)).rect(0, 15, 20, 2, c('white', 2));
      for (let x = 1; x < 20; x += 3) p.rect(x, 2, 1, 15, c('white', 1));
      micro(p, 7, 7, String(SPOTS_NEEDED), c('red', 1));
    } else p.rect(0, 2, 2, 15, c('white', 2));
    return p;
  };
  book.add('babyGate', babyGate(false), { solid: SOLID, effect: SPOTS, eamt: -SPOTS_NEEDED, score: 500, touch: 'gateOpen' });
  book.add('gateOpen', babyGate(true));

  // ---------- the kitchen ----------
  // checkered linoleum, red and cream
  const lino = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('tile', 1) : c('tile', 3));
    const r = rng(seed);
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('tile', 2));
    return p;
  };
  book.add('lino', lino(21));
  // the backsplash (the kitchen's back wall): white tile and a strip of wallpaper
  const tileWall = P().rect(0, 0, 20, 20, c('white', 2));
  for (let k = 0; k < 20; k += 5) tileWall.rect(k, 6, 1, 14, c('white', 0)).rect(0, 6 + k, 20, 1, c('white', 0));
  tileWall.rect(0, 0, 20, 6, c('yellow', 1)).rect(0, 5, 20, 1, c('wood', 1));
  for (let x = 2; x < 20; x += 6) tileWall.set(x, 2, c('red', 2)).set(x + 1, 3, c('green', 1));
  book.add('tileWall', tileWall, solid);
  // the counter: laminate top and cabinet doors, and what sits on it
  const counter = (what?: 'sink' | 'toaster' | 'micro0' | 'micro1' | 'stove' | 'cereal' | 'drawer' | 'drawerOpen') => {
    const p = P().rect(0, 0, 20, 20, c('wood', 2));
    p.rect(0, 0, 20, 9, c('counter', 1)).rect(0, 8, 20, 1, c('counter', 0)).rect(0, 0, 20, 1, c('counter', 2));
    p.rect(1, 10, 8, 9, c('wood', 3)).rect(11, 10, 8, 9, c('wood', 3)).rect(7, 14, 1, 2, c('silver', 2)).rect(12, 14, 1, 2, c('silver', 2));
    if (what === 'sink') p.rect(3, 1, 14, 6, c('silver', 1)).rect(4, 2, 12, 4, c('silver', 0)).rect(9, 0, 2, 3, c('silver', 2));
    if (what === 'toaster') p.rect(4, 0, 12, 7, c('silver', 2)).rect(6, 1, 3, 2, ink).rect(11, 1, 3, 2, ink).rect(16, 3, 2, 1, ink);
    if (what === 'micro0' || what === 'micro1') {
      p.rect(1, 0, 18, 8, c('white', 1)).rect(2, 1, 11, 6, ink).rect(14, 1, 4, 3, c('ink', 1));
      if (what === 'micro0') micro(p, 3, 2, '12:0', c('led', 1));
    }
    if (what === 'stove') for (const [x, y] of [[5, 3], [14, 3]]) p.ring(x, y, 3, ink).ring(x, y, 1.5, c('crt', 1));
    if (what === 'cereal') p.rect(3, 0, 6, 8, c('yellow', 2)).rect(11, 1, 6, 7, c('blue', 2)).set(5, 3, c('red', 2)).set(13, 4, c('white', 2));
    if (what === 'drawer' || what === 'drawerOpen') {
      p.rect(1, 10, 18, 4, c('wood', 4)).rect(9, 11, 2, 1, c('silver', 2));
      if (what === 'drawerOpen') {
        p.rect(1, 10, 18, 9, c('wood', 1)).rect(2, 11, 16, 7, c('wood', 0));
        p.rect(3, 12, 5, 1, c('yellow', 2)).rect(9, 14, 6, 1, c('blue', 2)).disc(15, 12, 1.5, c('copper', 2)).rect(4, 15, 3, 2, c('red', 1));
      }
    }
    return p;
  };
  book.add('counter', counter(), solid);
  book.add('sink', counter('sink'), solid);
  book.add('toaster', counter('toaster'), { solid: SOLID, birthMon: MON.toast, birthTime: TOAST_EVERY });
  book.add('microwave', counter('micro0'), { solid: SOLID, next: 'microwave2', ntime: 18 });
  book.add('microwave2', counter('micro1'), { solid: SOLID, next: 'microwave', ntime: 18 });
  book.add('stove', counter('stove'), solid);
  book.add('cereal', counter('cereal'), solid);
  book.add('drawer', counter('drawer'), { solid: SOLID, score: 100, touch: 'drawerOpen' });
  book.add('drawerOpen', counter('drawerOpen'), solid);
  // the fridge: almond, two blocks tall, magnets, a crayon drawing; open it (who knows anymore?)
  const fridge = (part: 'top' | 'bottom', open: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('fridge', 2));
    p.rect(0, 0, 1, 20, c('fridge', 1)).rect(19, 0, 1, 20, c('fridge', 1));
    if (part === 'top') {
      p.rect(0, 0, 20, 2, c('fridge', 3)).rect(0, 18, 20, 2, c('fridge', 0)).rect(15, 6, 2, 8, c('silver', 2));
      if (open) p.rect(1, 2, 18, 16, c('screen', 3)).rect(2, 4, 7, 5, c('white', 2)).rect(10, 9, 6, 6, c('blue', 1)).rect(2, 12, 6, 4, c('pink', 2));
      else p.rect(3, 5, 8, 9, c('white', 2)).line(4, 12, 7, 7, c('red', 2)).line(7, 7, 10, 12, c('blue', 2)).disc(7, 6, 1, c('yellow', 2));
    } else {
      p.rect(15, 3, 2, 10, c('silver', 2)).rect(0, 18, 20, 2, c('ink', 1));
      if (open) {
        p.rect(1, 0, 18, 18, c('screen', 3));
        for (const y of [5, 11]) p.rect(1, y, 18, 1, c('silver', 2));
        p.rect(3, 1, 3, 4, c('red', 2)).rect(7, 2, 3, 3, c('green', 2)).rect(12, 6, 5, 5, c('white', 1)).rect(3, 12, 5, 5, c('yellow', 2)).rect(11, 13, 2, 4, c('blue', 2));
      } else {
        for (const [x, y, k] of [[3, 3, 'red'], [8, 9, 'blue'], [4, 13, 'green']] as const) p.rect(x, y, 3, 3, c(k, 2));
      }
    }
    return p;
  };
  book.add('fridgeTop', fridge('top', false), { solid: SOLID, score: 50, touch: 'freezerOpen' });
  book.add('freezerOpen', fridge('top', true), solid);
  book.add('fridge', fridge('bottom', false), { solid: SOLID, hp: 25, score: 50, touch: 'fridgeOpen' });
  book.add('fridgeOpen', fridge('bottom', true), solid);
  // the kitchen table and its chairs
  const ktable = lino(22);
  ktable.rect(1, 2, 18, 15, c('wood', 3)).rect(1, 16, 18, 2, c('wood', 1)).rect(1, 2, 18, 1, c('wood', 4));
  blob(ktable, 7, 9, 3, 2.4, R('white'), 1, 2);
  ktable.rect(12, 6, 4, 6, c('blue', 2)).rect(12, 6, 4, 1, c('white', 2));
  book.add('ktable', ktable, solid);
  const kchair = lino(23);
  kchair.rect(4, 4, 12, 12, c('wood', 2)).rect(4, 4, 12, 3, c('wood', 1)).rect(4, 15, 12, 1, c('wood', 0));
  book.add('kchair', kchair, solid);
  // Teddy's bowl, the trash can, a puddle of spilled milk
  const bowl = lino(24);
  blob(bowl, 10, 11, 6, 4, R('red'), 1, 3);
  blob(bowl, 10, 10, 4, 2.4, R('wood'), 1, 2);
  micro(bowl, 5, 13, 'TED', c('white', 2));
  // it's Teddy's: touch it and he grumbles (points off), and it's licked clean
  book.add('bowl', bowl, { solid: SOLID, score: -5, touch: 'bowlClean' });
  const clean = lino(24);
  blob(clean, 10, 11, 6, 4, R('red'), 1, 3);
  blob(clean, 10, 10, 4, 2.4, R('silver'), 1, 2);
  micro(clean, 5, 13, 'TED', c('white', 2));
  book.add('bowlClean', clean, solid);
  const trash = lino(25);
  trash.rect(4, 2, 12, 16, c('silver', 1)).rect(4, 2, 12, 3, c('silver', 2)).rect(8, 0, 4, 2, c('silver', 0));
  trash.rect(6, 7, 1, 9, c('silver', 0)).rect(10, 7, 1, 9, c('silver', 0)).rect(13, 7, 1, 9, c('silver', 0));
  book.add('trash', trash, solid);
  const milk = lino(26);
  blob(milk, 9, 11, 7, 4, R('white'), 1, 2);
  blob(milk, 15, 7, 3, 2, R('white'), 1, 2);
  book.add('milk', milk);
  // a slice of cold pizza on a plate: patience
  const pizza = lino(27);
  pizza.disc(10, 10, 7, c('white', 2));
  for (let y = 5; y < 15; y++) pizza.rect(10 - (y - 5) / 2, y, (y - 5) + 1, 1, c('yellow', 2));
  pizza.disc(9, 11, 1.2, c('red', 2)).disc(11, 13, 1.2, c('red', 2)).rect(5, 14, 10, 2, c('orange', 1));
  book.add('pizza', pizza, { hp: 20, score: 25, touch: 'lino' });
  // Mom's number on fridge magnets (counter 21)
  for (const d of [...new Set(MOMS_NUMBER)]) {
    const p = lino(30 + Number(d));
    p.rect(4, 3, 12, 14, c(['red', 'blue', 'green', 'yellow', 'purple', 'orange'][Number(d) % 6], 2));
    p.rect(4, 3, 12, 1, c('white', 2)).rect(4, 16, 12, 1, ink);
    micro(p, 6, 6, d, c('white', 2), 2);
    book.add(`magnet${d}`, p, { effect: DIGITS, eamt: 1, score: 25, touch: 'lino' });
  }
  // the phone: a beige wall phone with a long curly cord. It dials all seven digits ("Called my
  // mom..."), and you're on the line.
  const phone = (off: boolean) => {
    const p = tileWall.crop(0, 0, 20, 20);
    p.rect(5, 6, 10, 12, c('fridge', 1)).rect(5, 6, 10, 1, c('fridge', 3));
    for (let k = 0; k < 9; k++) p.rect(7 + (k % 3) * 2, 11 + Math.floor(k / 3) * 2, 1, 1, c('crt', 1));
    if (!off) p.rect(4, 3, 4, 15, c('fridge', 2)).rect(4, 3, 4, 1, c('fridge', 3));
    else {
      p.rect(7, 18, 3, 2, c('fridge', 0));
      micro(p, 12, 0, 'MA', c('red', 1));
    }
    for (let y = 16; y < 20; y++) p.set(5 + ((y * 3) % 4), y, c('fridge', 0));
    if (!off) micro(p, 12, 1, String(DIGITS_NEEDED), c('red', 1));
    return p;
  };
  book.add('phone', phone(false), { solid: SOLID, effect: DIGITS, eamt: -DIGITS_NEEDED, score: 500, touch: 'phoneDone' });
  book.add('phoneDone', phone(true));

  // ---------- the void between the cushions ----------
  const deep = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sky'), 0, 2, 0.3 + Math.sin((x + seed * 3) / 5 + y / 7) * 0.25, x, y));
    const r = rng(seed);
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('star', i % 2));
    return p;
  };
  book.add('void', deep(40), solid);
  book.add('void2', deep(41), solid);
  // a lost thing floating far off in the void (scenery, solid): a sock, a key, a crayon
  const far = (k: number) => {
    const p = deep(42 + k);
    if (k === 0) p.rect(7, 5, 4, 7, c('red', 1)).rect(7, 11, 7, 3, c('red', 1)).rect(7, 5, 4, 1, c('white', 1));
    if (k === 1) p.disc(7, 8, 3, c('gold', 0)).rect(9, 8, 8, 2, c('gold', 0)).rect(14, 10, 1, 2, c('gold', 0));
    if (k === 2) p.rect(4, 10, 12, 3, c('blue', 1)).rect(15, 10, 3, 3, c('blue', 0));
    return p;
  };
  for (const k of [0, 1, 2]) book.add(`far${k}`, far(k), solid);
  // the couch fabric you walk on in there: rose and teal, worn
  const fabric = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (x % 9 === 4 && y % 8 === 3) || (x % 9 === 0 && y % 8 === 7) ? c('flora', 2) : c('couch', (x + y + seed) % 7 === 0 ? 1 : 2));
    const r = rng(seed);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('couch', 3));
    return p;
  };
  book.add('fabric', fabric(44));
  book.add('fabric2', fabric(45));
  // a Bermuda swirl on the path: it stings as you step through it, and closes
  const swirl = (f: number) => {
    const p = deep(46);
    for (let t = 0; t < 60; t++) {
      const a = t * 0.35 + f * 1.4;
      const rr = t / 7;
      p.set(10 + Math.cos(a) * rr, 10 + Math.sin(a) * rr, c('purple', 3 - Math.floor(t / 20)));
    }
    return p;
  };
  book.add('swirl0', swirl(0), { hp: -8, touch: 'fabric2', next: 'swirl1', ntime: 3 });
  book.add('swirl1', swirl(1), { hp: -8, touch: 'fabric2', next: 'swirl0', ntime: 3 });
  // lost things: points (and a few red herrings)
  const lost = (what: string, draw: (p: Pixels) => void, score: number) => {
    const p = fabric(50 + book.index.size);
    draw(p);
    book.add(what, p, { score, touch: 'fabric' });
  };
  lost('pen', (p) => p.line(4, 15, 15, 4, c('blue', 1)).line(5, 15, 16, 4, c('blue', 2)).set(15, 4, c('white', 2)).set(4, 16, ink), 50);
  lost('spoon', (p) => (blob(p, 6, 6, 3, 2.4, R('silver'), 1, 2), p.line(8, 8, 16, 16, c('silver', 2))), 100);
  lost('xmasSock', (p) => {
    p.rect(6, 2, 7, 9, c('red', 2)).rect(6, 10, 10, 6, c('red', 2)).rect(6, 2, 7, 3, c('white', 2));
    p.set(9, 7, c('green', 2)).set(11, 12, c('green', 2)).set(8, 13, c('gold', 2));
  }, 250);
  lost('pog', (p) => {
    p.disc(10, 10, 6, c('yellow', 2)).ring(10, 10, 6, c('red', 1));
    for (let a = 0; a < 6.28; a += 0.8) p.line(10, 10, 10 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, c('red', 2));
    p.disc(10, 10, 2, c('blue', 2));
  }, 25);
  lost('guide', (p) => {
    p.rect(4, 3, 12, 15, c('white', 2)).rect(4, 3, 12, 4, c('red', 2));
    micro(p, 6, 4, 'TV', c('white', 2));
    p.rect(6, 9, 8, 1, ink).rect(6, 11, 6, 1, ink).rect(6, 13, 8, 1, ink);
  }, 150);
  lost('crumb', (p) => {
    p.line(4, 10, 16, 10, c('gold', 1)).line(10, 4, 10, 16, c('gold', 1));
    blob(p, 10, 10, 3, 2.6, R('wood'), 3, 4, 1.2);
  }, 77);
  // fake remotes: a calculator, the garage door opener, a Game Boy. NOPE.
  const fake = (name: string, draw: (p: Pixels) => void) => {
    const p = fabric(60 + book.index.size);
    draw(p);
    book.add(name, p, { score: 10, touch: 'nope' });
  };
  fake('calc', (p) => {
    p.rect(5, 2, 10, 16, c('crt', 0)).rect(6, 3, 8, 4, c('led', 0));
    for (let k = 0; k < 9; k++) p.rect(6 + (k % 3) * 3, 8 + Math.floor(k / 3) * 3, 2, 2, c('crt', 2));
  });
  fake('opener', (p) => {
    p.rect(5, 5, 10, 10, c('crt', 1)).rect(5, 5, 10, 2, c('crt', 2)).disc(10, 11, 2.4, c('red', 2));
  });
  fake('gameboy', (p) => {
    p.rect(5, 1, 11, 18, c('crt', 3)).rect(7, 3, 7, 6, c('crt', 0)).rect(8, 4, 5, 4, c('green', 0));
    p.rect(7, 12, 3, 1, ink).rect(8, 11, 1, 3, ink).disc(13, 13, 1, c('purple', 2)).disc(14, 11, 1, c('purple', 2));
  });
  const nope = fabric(70);
  micro(nope, 3, 7, 'NOPE', c('red', 3));
  book.add('nope', nope);
  // a candy bar (patience) and pennies lying on the fabric
  const candy = fabric(71);
  candy.rect(4, 7, 12, 6, c('wood', 0)).rect(4, 7, 4, 6, c('red', 2)).rect(12, 7, 4, 6, c('red', 2));
  book.add('candy', candy, { hp: 20, score: 10, touch: 'fabric' });
  book.add('pennyF', penny(() => fabric(72)), { effect: MONEY, eamt: 1, score: 5, touch: 'fabric' });
  // the pay TV: an old coin-op set floating in the void (insert ten pennies), and it warms up
  const payTv = (on: boolean) => {
    const p = fabric(73);
    p.rect(1, 1, 18, 17, c('crt', 1)).rect(1, 1, 18, 1, c('crt', 3));
    p.rect(3, 3, 11, 9, on ? c('screen', 2) : c('crt', 0));
    if (on) for (let y = 4; y < 11; y += 2) p.rect(4, y, 9, 1, c('screen', 3));
    p.rect(15, 4, 2, 4, ink).rect(15, 4, 2, 1, c('silver', 2));
    micro(p, 3, 13, on ? 'ON' : `${PENNIES_NEEDED}C`, on ? c('led', 1) : c('copper', 3));
    return p;
  };
  book.add('payTv', payTv(false), { solid: SOLID, effect: MONEY, eamt: -PENNIES_NEEDED, score: 1000, touch: 'payTvOn' });
  book.add('payTvOn', payTv(true));
  // a sign in the void
  const sign = deep(74);
  sign.rect(1, 4, 18, 11, c('wood', 3)).rect(1, 4, 18, 1, c('wood', 4)).rect(9, 15, 2, 5, c('wood', 1));
  micro(sign, 2, 5, 'LOST', ink);
  micro(sign, 2, 10, '&FND', ink);
  book.add('sign', sign, solid);

  // ---------- the living room ride ----------
  // the spinning rug: red and yellow carnival stripes, its arrows the way it carries you
  const spin = (dir: keyof typeof GRAV, f: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (dir === 'up' || dir === 'down' ? Math.floor(x / 5) : Math.floor(y / 5)) % 2 ? c('red', 2) : c('yellow', 2));
    const arrow = (ax: number, ay: number) => {
      const [dx, dy] = dir === 'right' ? [1, 0] : dir === 'left' ? [-1, 0] : dir === 'down' ? [0, 1] : [0, -1];
      for (let k = -3; k <= 3; k++) p.set(ax + dx * k, ay + dy * k, c('white', 2));
      for (let k = 1; k <= 2; k++) p.set(ax + dx * (3 - k) - dy * k, ay + dy * (3 - k) - dx * k, c('white', 2)).set(ax + dx * (3 - k) + dy * k, ay + dy * (3 - k) + dx * k, c('white', 2));
    };
    const o = f * 5;
    if (dir === 'right' || dir === 'left') arrow((10 + (dir === 'right' ? o : -o) + 20) % 20, 10);
    else arrow(10, (10 + (dir === 'down' ? o : -o) + 20) % 20);
    return p;
  };
  for (const dir of ['right', 'down', 'left', 'up'] as const) {
    book.add(`spin${dir}`, spin(dir, 0), { grav: GRAV[dir], next: `spin${dir}2`, ntime: 4 });
    book.add(`spin${dir}2`, spin(dir, 1), { grav: GRAV[dir], next: `spin${dir}`, ntime: 4 });
  }
  // the hub in the middle of the ride, and the bulbs round its edge
  const hub = carpet(80);
  hub.disc(10, 10, 9, c('red', 1)).disc(10, 10, 7, c('yellow', 2)).disc(10, 10, 3, c('red', 2));
  for (let a = 0; a < 6.28; a += 0.785) hub.set(10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8, c('lamp', 2));
  book.add('hub', hub, solid);
  const bulbs = (f: number) => {
    const p = wallTop.crop(0, 0, 20, 20);
    for (let x = 2; x < 20; x += 5) p.disc(x, 10, 2, (x + f * 5) % 10 < 5 ? c('lamp', 2) : c('lamp', 0));
    return p;
  };
  book.add('bulbs', bulbs(0), { solid: SOLID, next: 'bulbs2', ntime: 6 });
  book.add('bulbs2', bulbs(1), { solid: SOLID, next: 'bulbs', ntime: 6 });
  return book;
}

