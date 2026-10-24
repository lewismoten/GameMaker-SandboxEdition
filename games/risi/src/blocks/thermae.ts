// THERMAE.BBL: the public baths and the theater beside them. Two levels share it:
//   V. Canit Piscis Aureus: the baths, where a goldfish with diva tendencies sings. Marble and
//      mosaics of sea creatures, pools to wade (the cold one, the warm one, the hot one, which
//      gives birth to scalding bubbles), steam vents that lift you, benches where the mice of
//      the baths cheer (clamant mures), drums that bounce you (tympana tremunt), golden scales
//      (counter 23: cantus tuus, aurum nostrum), and her golden basin (labrum), which gives
//      birth to the notes of her song (walk past her) and takes six scales.
//   VI. Silentium Ridentium: the theater in the afternoon. The stands (cavea) are stone steps
//      (ledges) where the audience sits stone-faced (omnes spectant, nemo ridet), the awning
//      (velarium) over them, cabbages thrown from the top row, the orchestra's floor, the stairs
//      up to the stage that open for five laughs (counter 24), the stage itself (wood), its
//      painted front with doors and columns, the box behind Emperor Gravis that gives birth to
//      his decrees, and the altar on the stage that takes the laurel crown (counter 25).
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro, microWidth } from '../../../snowbound/src/art/font';
import { buildPalette, type Pal } from '../art/pal';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { joeCameo } from '../../../kit/cameos';
import { CROWN, LAUGHS, LAUGHS_NEEDED, MON, SCALES, SCALES_NEEDED } from '../ids';
import { BlockBook, GRAV, LEDGE, LIFE, SOLID, column, context, copy, cup, denarius, grapes, marble, outside, sparkle, wreath } from './common';

/** Ticks between scalding bubbles out of the hot pool. */
export const BUBBLE_EVERY = 40;
/** Ticks between notes from the diva's basin. */
export const NOTE_EVERY = 30;
/** Ticks between drops of hot water off the steamy vault. */
export const DRIP_EVERY = 54;
/** Ticks between cabbages from the top of the stands. */
export const CABBAGE_EVERY = 58;
/** Ticks between the hushes ("SILENTIUM!") the herald's horn blows over the Emperor's head. */
export const HUSH_EVERY = 64;

export function buildThermae(pal: Pal): BlockBook {
  const x = context(pal);
  const { book, c, R, P, air } = x;

  book.add('outside', outside(x), { solid: SOLID });

  // ---------- V. the baths ----------
  /** Marble walls in big slabs, a niche now and then. */
  const bwall = (seed: number, niche = false) => {
    const p = marble(x, seed, 1, 2);
    p.rect(0, 0, 20, 1, c('vein', 0))
      .rect(0, 10, 20, 1, c('vein', 0))
      .rect(seed % 2 ? 9 : 0, 0, 1, 10, c('vein', 0))
      .rect(seed % 2 ? 0 : 9, 10, 1, 10, c('vein', 0));
    if (niche) {
      p.rect(5, 4, 10, 14, c('blue', 0)).disc(10, 4, 5, c('blue', 0));
      blob(p, 10, 12, 3, 5, R('marble'), 2, 3);
      p.disc(10, 6, 2.4, c('marble', 3));
    }
    return p;
  };
  book.add('bwall', bwall(1), air);
  book.add('bniche', bwall(2, true), air);
  // a wet, dark stain high on the wall where the steam gathers: it gives birth to hot drips
  const wet = bwall(3);
  blob(wet, 10, 6, 6, 3, R('water'), 0, 1);
  for (const sx of [7, 10, 13]) wet.line(sx, 8, sx, 13 + (sx % 3), c('water', 1));
  wet.disc(10, 17, 1.4, c('steam', 2));
  book.add('bwallDrip', wet, { ...air, birthMon: MON.drip, birthTime: DRIP_EVERY });
  // the vaulted ceiling: a coffered band in blue and gold
  const vault = P().rect(0, 0, 20, 20, c('blue', 0));
  for (let xx = 2; xx < 20; xx += 10) vault.rect(xx, 3, 7, 7, c('blue', 1)).rect(xx + 2, 5, 3, 3, c('gold', 0));
  vault.rect(0, 13, 20, 2, c('gold', 0)).rect(0, 15, 20, 5, c('marble', 2));
  book.add('vault', vault, air);
  const bbase = bwall(3);
  bbase.rect(0, 15, 20, 5, c('blue', 1)).rect(0, 15, 20, 1, c('gold', 1));
  for (let xx = 2; xx < 20; xx += 6) bbase.rect(xx, 17, 3, 2, c('marble', 3));
  book.add('bbase', bbase, air);
  // the floor: a mosaic of sea creatures (solid), and the floor of a pool under the water
  const seaMosaic = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, (xx + y) % 5 === 0 ? c('marble', 2) : c('marble', 3));
    p.rect(0, 0, 20, 2, c('blue', 2)).rect(0, 2, 20, 1, c('blue', 0));
    const r = rng(seed);
    if (r() < 0.5) {
      // a dolphin in black tesserae
      blob(p, 10, 11, 6, 2.4, R('ink'), 0, 1);
      p.line(15, 10, 18, 7, c('ink', 0)).line(15, 12, 18, 14, c('ink', 0)).set(6, 10, c('marble', 3));
    } else {
      // an octopus
      blob(p, 10, 9, 3, 3, R('ink'), 0, 1);
      for (let k = 0; k < 5; k++) p.line(8 + k, 12, 5 + k * 2.4, 17, c('ink', 0));
    }
    return p;
  };
  book.add('bfloor', seaMosaic(4), { solid: SOLID });
  book.add('bfloor2', seaMosaic(5), { solid: SOLID });
  const poolFloor = P();
  for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) poolFloor.set(xx, y, xx % 5 === 0 || y % 5 === 0 ? c('water', 1) : c('water', 2));
  book.add('poolFloor', poolFloor, { solid: SOLID });
  // the water you wade (it falls like air; the hot pool gives birth to bubbles)
  const water = (hot: boolean, seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++)
      for (let xx = 0; xx < 20; xx++)
        p.set(xx, y, shadeAt(R(hot ? 'tile' : 'water'), hot ? 1 : 2, hot ? 2 : 3, 0.45 + Math.sin((xx + seed) / 3) * 0.12 - y / 70, xx, y));
    return p;
  };
  // the surface row shows the wall behind its top: draw the wall, then the water line
  const surface = (hot: boolean, seed: number) => {
    const p = bwall(seed);
    const w = water(hot, seed);
    p.blit(w.crop(0, 8, 20, 12), 0, 8);
    for (let xx = 0; xx < 20; xx++) p.set(xx, 8 + Math.round(Math.sin((xx + seed) / 2)), c(hot ? 'tile' : 'water', 4));
    if (hot) for (const sx of [4, 12]) blob(p, sx, 5, 2.4, 1.6, R('steam'), 0, 2);
    return p;
  };
  book.add('pool', water(false, 6), air);
  book.add('poolTop', surface(false, 7), air);
  book.add('hot', water(true, 8), { ...air, birthMon: MON.bubble, birthTime: BUBBLE_EVERY });
  book.add('hotTop', surface(true, 9), air);
  // the pool's rim (a ledge of marble)
  const rim = bwall(10);
  rim.rect(0, 12, 20, 8, c('marble', 3)).rect(0, 12, 20, 2, c('marble', 2)).rect(0, 19, 20, 1, c('vein', 0));
  book.add('rim', rim, { solid: SOLID });
  // the steam vents in the warm room's floor: air that lifts (curling as it goes)
  const steamUp = (f: number) => {
    const p = bwall(11);
    for (let k = 0; k < 4; k++) {
      const y = (k * 6 + f * 3) % 20;
      for (let xx = 2; xx < 18; xx++) if ((xx + k) % 3) p.set(xx + Math.round(Math.sin((xx + f * 3 + k) / 2)), y, c('steam', 1 + (k % 2)));
    }
    return p;
  };
  book.add('steam0', steamUp(0), { grav: GRAV.up, next: 'steam1', ntime: 4 });
  book.add('steam1', steamUp(1), { grav: GRAV.up, next: 'steam0', ntime: 4 });
  const vent = seaMosaic(12);
  vent.rect(3, 0, 14, 4, c('bronze', 1));
  for (let xx = 4; xx < 16; xx += 2) vent.set(xx, 1, c('ink', 0)).set(xx, 2, c('ink', 0));
  book.add('vent', vent, { solid: SOLID });
  // a bench (a ledge) where the mice of the baths sit and cheer
  const bench = bwall(13);
  bench.rect(0, 10, 20, 3, c('marble', 3)).rect(0, 10, 20, 1, c('marble', 2)).rect(2, 13, 3, 7, c('marble', 2)).rect(15, 13, 3, 7, c('marble', 2));
  book.add('bench', bench, { solid: LEDGE, grav: GRAV.down });
  // a drum (tympanum, solid) and the air over it that bounces you up
  const drum = (top: boolean, f = 0) => {
    const p = bwall(14);
    if (top) {
      for (let k = 0; k < 3; k++) p.line(4 + k * 5, 18 - f * 2, 6 + k * 5, 12 - f * 2, c('gold', 1));
      return p;
    }
    p.rect(1, 4, 18, 16, c('pompeii', 1)).rect(1, 2, 18, 3, c('marble', 3)).rect(1, 18, 18, 2, c('bronze', 2));
    for (let xx = 2; xx < 19; xx += 4) p.line(xx, 5, xx + 2, 17, c('ochre', 2));
    return p;
  };
  book.add('drum', drum(false), { solid: SOLID });
  book.add('boing0', drum(true, 0), { grav: GRAV.up, next: 'boing1', ntime: 3 });
  book.add('boing1', drum(true, 1), { grav: GRAV.up, next: 'boing0', ntime: 3 });
  // columns
  book.add('bcolTop', column(x, vault, true), air);
  book.add('bcol', column(x, bwall(15)), air);
  book.add('bcolBase', column(x, bbase, false, true), air);
  // golden scales of the diva (counter 23), on the wall or under the water
  const scale = (bg: Pixels, seed: number) => {
    const p = copy(bg);
    blob(p, 10, 10, 5, 4, R('fish'), 1, 3);
    for (let k = 0; k < 3; k++) p.line(6 + k * 3, 13, 8 + k * 3, 7, c('fish', 0));
    return sparkle(x, p, seed, 3);
  };
  book.add('scale', scale(bwall(16), 17), { ...air, effect: SCALES, eamt: 1, score: 200, touch: 'bwall' });
  book.add('scalePool', scale(water(false, 18), 19), { ...air, effect: SCALES, eamt: 1, score: 200, touch: 'pool' });
  book.add('scaleHot', scale(water(true, 20), 21), { ...air, effect: SCALES, eamt: 1, score: 200, touch: 'hotPlain' });
  book.add('hotPlain', water(true, 20), air);
  // a towel (linteum: dignity back), a strigil (points), grapes, a coin, a wreath
  const towel = bwall(22);
  towel.rect(4, 8, 12, 10, c('toga', 2)).rect(4, 8, 12, 2, c('toga', 3)).rect(4, 14, 12, 1, c('purple', 1));
  book.add('linteum', towel, { hp: 30, score: 10, touch: 'bwall' });
  const strigil = bwall(23);
  strigil.line(4, 6, 13, 15, c('bronze', 3)).line(5, 6, 14, 15, c('bronze', 2)).ring(14, 6, 3, c('bronze', 2));
  book.add('strigil', strigil, { score: 150, touch: 'bwall' });
  book.add('bgrapes', grapes(x, bwall(24)), { hp: 20, score: 10, touch: 'bwall' });
  book.add('bcoin', denarius(x, bwall(25)), { score: 100, touch: 'bwall' });
  book.add('bwreath', wreath(x, bwall(26)), { effect: LIFE, eamt: 1, score: 500, touch: 'bwall' });
  // the diva's golden basin (labrum), two blocks: the left half is her stage (scenery, she sings
  // in it and it gives birth to her notes); the right half takes six scales
  const basin = (half: 'L' | 'R', done: boolean, f = 0) => {
    const p = copy(bbase);
    p.rect(half === 'L' ? 2 : 0, 6, half === 'L' ? 18 : 18, 8, c('gold', 1)).rect(half === 'L' ? 2 : 0, 6, half === 'L' ? 18 : 18, 2, c('gold', 3));
    p.rect(half === 'L' ? 14 : 0, 14, 6, 6, c('gold', 0));
    if (half === 'L') {
      // the goldfish herself, with a diva's lashes, singing
      blob(p, 11, 4 - f, 5, 3.4, R('fish'), 1, 3);
      p.line(5, 4 - f, 2, 1 - f, c('fish', 2)).line(5, 4 - f, 2, 7 - f, c('fish', 2));
      p.set(14, 3 - f, c('ink', 0))
        .line(13, 1 - f, 15, 1 - f, c('ink', 0))
        .disc(16, 5 - f, 1, c('ink', 0));
      micro(p, 13, 0, f ? 'O!' : '', c('gold', 3));
    } else if (done) sparkle(x, p, 27, 6);
    else micro(p, 6, 8, String(SCALES_NEEDED), c('ink', 0));
    return p;
  };
  book.add('basinL0', basin('L', false, 0), { ...air, birthMon: MON.note, birthTime: NOTE_EVERY, next: 'basinL1', ntime: 12 });
  book.add('basinL1', basin('L', false, 1), { ...air, birthMon: MON.note, birthTime: NOTE_EVERY, next: 'basinL0', ntime: 12 });
  book.add('basinR', basin('R', false), { solid: SOLID, effect: SCALES, eamt: -SCALES_NEEDED, score: 2000, touch: 'basinDone' });
  book.add('basinDone', basin('R', true), { grav: GRAV.none });

  // ---------- VI. the theater ----------
  /** The sky over the theater, the red and white awning's edge at the top. */
  const tsky = (seed: number, awning = false) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('sky'), 1, 3, 0.3 + y / 40, xx, y));
    if (awning) {
      for (let xx = 0; xx < 20; xx++) p.rect(xx, 0, 1, 12 + Math.round(Math.sin(xx / 3.2) * 2), Math.floor(xx / 5) % 2 ? c('red', 2) : c('marble', 3));
      p.line(0, 13, 20, 13, c('wood', 1));
    }
    const r = rng(seed);
    if (!awning && r() < 0.3) blob(p, 4 + r() * 12, 6 + r() * 6, 4, 1.6, R('marble'), 2, 3);
    return p;
  };
  book.add('tsky', tsky(31), air);
  book.add('awning', tsky(32, true), air);
  // the stands: stone steps (ledges), the back of the next step up behind (solid)
  const step = (kind: 'seat' | 'riser' | 'top', seed: number) => {
    const p = kind === 'seat' ? tsky(seed) : P();
    const r = rng(seed);
    const y0 = kind === 'seat' ? 12 : 0;
    for (let y = y0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('stone'), 2, 3, 0.5 + (r() - 0.5) * 0.3 - (y - y0) / 40, xx, y));
    if (kind === 'seat') p.rect(0, 12, 20, 2, c('stone', 4)).rect(0, 19, 20, 1, c('stone', 1));
    if (kind === 'riser') for (let y = 4; y < 20; y += 8) p.rect(0, y, 20, 1, c('stone', 1));
    if (kind === 'top') p.rect(0, 0, 20, 2, c('stone', 4));
    return p;
  };
  book.add('seat', step('seat', 33), { solid: LEDGE, grav: GRAV.down });
  book.add('riser', step('riser', 34), { solid: SOLID });
  book.add('standsTop', step('top', 35), { solid: SOLID });
  // the top of the stands, where they throw cabbages from (it gives birth to them)
  const rowTop = step('seat', 36);
  for (const hx of [5, 14]) blob(rowTop, hx, 8, 3, 3.4, R('skin'), 1, 3);
  rowTop.set(4, 7, c('ink', 0)).set(13, 7, c('ink', 0));
  blob(rowTop, 9, 11, 2.4, 2.4, R('laurel'), 1, 3);
  book.add('cabbageRow', rowTop, { solid: LEDGE, grav: GRAV.down, birthMon: MON.cabbage, birthTime: CABBAGE_EVERY });
  // the orchestra's floor (solid flagstones) and the air over it
  const orchestra = P();
  for (let y = 0; y < 20; y++)
    for (let xx = 0; xx < 20; xx++) orchestra.set(xx, y, (Math.floor(xx / 10) + Math.floor(y / 10)) % 2 ? c('marble', 2) : c('pompeii', 2));
  orchestra.rect(0, 0, 20, 2, c('marble', 3));
  book.add('orchestra', orchestra, { solid: SOLID });
  // the stage front (scaenae frons): columns and doors painted in red and gold (scenery)
  const frons = (seed: number, part: 'wall' | 'door' | 'col' | 'top') => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('pompeii'), 1, 2, 0.5 + Math.sin(xx + y) * 0.05, xx, y));
    if (part === 'top') p.rect(0, 10, 20, 4, c('marble', 3)).rect(0, 14, 20, 1, c('gold', 1)).rect(0, 0, 20, 10, c('sky', 3));
    if (part === 'door') p.rect(4, 2, 12, 18, c('wood', 1)).rect(4, 2, 12, 2, c('gold', 1)).disc(14, 12, 1, c('gold', 2));
    if (part === 'col') return column(x, p);
    if (part === 'wall')
      p.rect(3, 3, 14, 14, c('ochre', 1))
        .frame(3, 3, 14, 14, c('gold', 1))
        .set(4 + (seed % 12), 4, c('gold', 2));
    return p;
  };
  book.add('frons', frons(37, 'wall'), air);
  book.add('fronsDoor', frons(38, 'door'), air);
  book.add('fronsCol', frons(39, 'col'), air);
  book.add('fronsTop', frons(40, 'top'), air);
  // the stage (wooden boards, solid)
  const stage = P();
  for (let y = 0; y < 20; y++)
    for (let xx = 0; xx < 20; xx++) stage.set(xx, y, shadeAt(R('wood'), 1, 3, 0.4 + ((xx * 7 + Math.floor(y / 5) * 3) % 20) / 60, xx, y));
  for (let y = 4; y < 20; y += 5) stage.rect(0, y, 20, 1, c('wood', 0));
  stage.rect(0, 0, 20, 2, c('wood', 4));
  book.add('stage', stage, { solid: SOLID });
  // the stairs up to the stage: shut by a velvet rope until five laugh (counter 24)
  const stairs = (open: boolean) => {
    const p = tsky(41);
    for (let k = 0; k < 4; k++) p.rect(k * 5, 15 - k * 5, 20 - k * 5, 5, c('marble', 2 + (k % 2)));
    if (!open) {
      p.rect(2, 4, 2, 16, c('gold', 1)).rect(16, 4, 2, 16, c('gold', 1)).line(3, 6, 17, 6, c('red', 2)).line(3, 7, 17, 8, c('red', 1));
      micro(p, 8, 9, String(LAUGHS_NEEDED), c('ink', 0));
    }
    return p;
  };
  book.add('stairs', stairs(false), { solid: SOLID, effect: LAUGHS, eamt: -LAUGHS_NEEDED, score: 1000, touch: 'stairsOpen' });
  book.add('stairsOpen', stairs(true), { solid: LEDGE, grav: GRAV.down });
  // the imperial box behind the Emperor (solid), its decrees stacked ready (scenery: his "SILENTIUM!" now comes from the herald's horn)
  const box = frons(42, 'wall');
  box.rect(1, 6, 18, 14, c('purple', 1)).rect(1, 6, 18, 2, c('gold', 2));
  for (const [sx, sy] of [
    [5, 11],
    [10, 13],
    [14, 10],
  ])
    box.rect(sx, sy, 4, 3, c('marble', 3)).set(sx, sy + 1, c('red', 2));
  book.add('decreeBox', box, { solid: SOLID });
  // the herald's bronze horn in the stage front behind the throne: it gives birth to his hushes
  const horn = (seed: number, bell: boolean) => {
    const p = frons(seed, 'wall');
    p.rect(6, 9, 14, 3, c('bronze', 2)).rect(6, 9, 14, 1, c('bronze', 3));
    if (bell) p.disc(5, 10, 4, c('bronze', 1)).disc(5, 10, 2, c('ink', 0));
    else p.rect(12, 4, 2, 6, c('bronze', 1));
    return p;
  };
  book.add('horn', horn(49, true), { ...air, birthMon: MON.hush, birthTime: HUSH_EVERY });
  // the altar on the stage: the laurel crown laid on it ends the game
  const altar = (crowned: boolean) => {
    const p = frons(43, 'wall');
    p.rect(3, 8, 14, 12, c('marble', 3)).rect(2, 6, 16, 3, c('marble', 2)).rect(2, 18, 16, 2, c('marble', 2));
    micro(p, Math.round(10 - microWidth('ARA') / 2), 11, 'ARA', c('ink', 0));
    if (crowned) {
      for (let k = 0; k < 9; k++) p.set(5 + k, 4 - Math.round(Math.sin((k / 8) * Math.PI) * 2), c('laurel', 2 + (k % 2)));
      sparkle(x, p, 44, 5);
    } else blob(p, 10, 3, 2, 2.4, R('flame'), 0, 3);
    return p;
  };
  book.add('altar', altar(false), { solid: SOLID, effect: CROWN, eamt: -1, score: 5000, touch: 'altarDone' });
  book.add('altarDone', altar(true), { grav: GRAV.none });
  // a comic mask lying in the orchestra (points), grapes, a cup, a coin
  const mask = tsky(45);
  blob(mask, 10, 11, 6, 6, R('ochre'), 2, 3);
  mask.disc(7, 9, 1.4, c('ink', 0)).disc(13, 9, 1.4, c('ink', 0));
  for (let k = 0; k < 9; k++) mask.set(6 + k, 13 + Math.round(Math.sin((k / 8) * Math.PI) * 2), c('ink', 0));
  book.add('mask', mask, { score: 300, touch: 'tsky' });
  book.add('tgrapes', grapes(x, tsky(46)), { hp: 20, score: 10, touch: 'tsky' });
  book.add('tcup', cup(x, tsky(47)), { hp: 30, score: 10, touch: 'tsky' });
  book.add('tcoin', denarius(x, tsky(48)), { score: 100, touch: 'tsky' });
  // a painted Easter egg, rolled under the bench of cheering mice in the baths (a few points, no sound of its own)
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(
      `egg${k || ''}`,
      drawEasterEgg(
        copy(bbase),
        {
          ink: c('ink', 0),
          shell: [c('grass', 1), c('grass', 2), c('grass', 3)],
          paint: [c('pompeii', 2), c('pompeii', 3)],
          accent: c('gold', 3),
          white: c('marble', 3),
        },
        'dots',
        k,
      ),
      {
        score: 50,
        touch: 'bbase',
        grav: GRAV.down,
        next: `egg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
        ntime: k ? 3 : 60,
      },
    );
  // Mystery Robot Joe at the top of the stands, counting the laughs (scenery; recolored from the
  // unlit palette, so the block is the same in every light)
  const joe = tsky(31);
  const robot = joeCameo(buildPalette('plain').pal, 'down', 0);
  for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) if (robot.get(xx, y) !== 255) joe.set(xx, y, robot.get(xx, y));
  book.add('joe', joe, air);
  return book;
}
