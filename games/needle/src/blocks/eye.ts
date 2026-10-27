// EYE.BBL: the eye of the needle. Night over the desert, turning to dawn the higher he goes; a
// great golden needle stands on its point in the sand, taller than the sky, and at its head is
// its eye: an actual eye, as on the song's cover, looking back at him. A golden thread to
// climb, clouds to stand on, the Spirit's updraft (air that lifts), a small eye gate through
// the needle's shaft, and the eye itself, which takes EYE_GRACE graces to open its pupil for
// a camel on his knees. It blinks on a slow rhythm (its lid droops first, as a warning) and
// only lets him in while it is wide open.
import { dither, Pixels } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import type { Pal } from '../art/pal';
import { EYE_GRACE, GRACE } from '../ids';

/** Ticks the eye stays wide open, droops (the warning), stays shut and lifts again. */
const EYE_OPEN = 64;
const EYE_DROOP = 14;
const EYE_SHUT = 24;
const EYE_LIFT = 8;
import { addGate, addGoodThings, addSoul, GRAV, kit, LEDGE, SOLID, type Kit } from './common';

export function eyeBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, R, P, sky, air } = k;

  // ---------- the sky, darkest at the bottom, dawn at the top ----------
  const starry = (seed: number, shade: number) => {
    const p = sky(seed, shade);
    if (shade < 3)
      for (let i = 0; i < 3; i++) {
        const x = (seed * 7 + i * 13) % 20;
        const y = (seed * 11 + i * 7) % 20;
        p.set(x, y, c('star', i % 3));
      }
    return p;
  };
  book.add('bg', starry(1, 0), air);
  for (let s = 1; s <= 5; s++) book.add(`sky${s}`, starry(1 + s, s), air);
  const band = (s: number) => P().map((x, y) => (dither(x, y, y / 20) ? c('sky', s) : c('sky', s + 1)));
  for (let s = 0; s < 5; s++) book.add(`band${s}`, band(s), air);
  // the moon (scenery)
  const moon = starry(9, 1);
  moon.disc(10, 10, 7, c('white', 1)).disc(13, 8, 6, c('sky', 1));
  book.add('moon', moon, air);
  // the sleeping city far below (scenery): flat roofs, lit windows
  const town = (seed: number) => {
    const p = starry(seed, 0);
    for (let x = 0; x < 20; x++) {
      const top = 8 + ((Math.floor((x + seed * 3) / 5) * 7) % 6);
      for (let y = top; y < 20; y++) p.set(x, y, c('ink', 0));
    }
    p.rect(4 + (seed % 3), 13, 2, 2, c('gold', 3)).rect(13, 11 + (seed % 2) * 3, 2, 2, c('gold', 2));
    return p;
  };
  book.add('town0', town(3), air);
  book.add('town1', town(4), air);
  // desert sand at night
  const dune = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) dune.set(x, y, shadeAt(R('sand'), 0, 2, 0.6 - y / 30 + Math.sin(x / 3) * 0.1, x, y));
  dune.rect(0, 0, 20, 1, c('sand', 3));
  book.add('dune', dune, { solid: SOLID });
  // a dark wall of cloud at the edges of the sky (solid)
  const wall = P().map((x, y) => shadeAt(R('purple'), 0, 1, 0.5 + Math.sin(y / 3 + x / 4) * 0.4, x, y));
  book.add('edge', wall, { solid: SOLID });

  // ---------- clouds, the thread, the updraft ----------
  const cloud = (seed: number, shade: number) => {
    const p = starry(seed, shade);
    for (let x = 0; x < 20; x++) {
      const h = 6 + Math.round(Math.sin((x + seed * 5) / 4) * 2);
      for (let y = 0; y < h; y++) p.set(x, 3 + y, shadeAt(R('white'), 0, 2, 1 - y / h, x, y));
    }
    return p;
  };
  // a cloud bank (solid): the roof, the floor and the far end of the way out the back of the
  // eye, puffed out on the sky's side and flat along the way
  const bank = (kind: 'roof' | 'floor' | 'end', shade: number) => {
    const p = kind === 'floor' ? band(4) : starry(26, shade);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const u = kind === 'roof' ? x : kind === 'floor' ? x + 7 : y;
        const edge = 4 + Math.round(Math.abs(Math.sin(u / 3.2)) * -3 + 2);
        // depth into the cloud from its puffy outer edge
        const d = kind === 'roof' ? y - edge : kind === 'floor' ? 19 - edge - y : x - edge;
        if (d >= 0) p.set(x, y, shadeAt(R('white'), 0, 2, kind === 'roof' ? 1 - d / 20 : 0.45 + d / 30, x, y));
      }
    return p;
  };
  for (const kind of ['roof', 'floor', 'end'] as const) book.add(`bank${kind[0].toUpperCase()}${kind.slice(1)}`, bank(kind, 5), { solid: SOLID });
  for (let s = 0; s <= 5; s++) book.add(`cloud${s}`, cloud(20 + s, s), { solid: LEDGE, grav: GRAV.down });
  // the golden thread through the needle, hanging down to the sand: climb it
  const thread = (shade: number) => {
    const p = starry(30 + shade, shade);
    for (let y = 0; y < 20; y++) {
      const x = 10 + Math.round(Math.sin(y / 4) * 1.2);
      p.set(x, y, c('gold', 4)).set(x + 1, y, c('gold', 2));
    }
    return p;
  };
  for (const sh of [0, 1, 2, 3, 4]) book.add(`thread${sh}`, thread(sh), { grav: GRAV.none });
  // the Spirit's updraft: air that lifts, in rising streaks of light
  const lift = (shade: number, f: number) => {
    const p = starry(40 + shade, shade);
    for (let kk = 0; kk < 3; kk++) {
      const x = 4 + kk * 6;
      for (let y = 0; y < 20; y++) if ((y + f * 5 + kk * 4) % 10 < 4) p.set(x + Math.round(Math.sin(y / 3) * 1.2), y, c('grace', 1 + (y % 2)));
    }
    return p;
  };
  for (const s of [1, 2, 3, 4]) {
    book.add(`lift${s}a`, lift(s, 0), { grav: GRAV.up, next: `lift${s}b`, ntime: 4 });
    book.add(`lift${s}b`, lift(s, 1), { grav: GRAV.up, next: `lift${s}a`, ntime: 4 });
  }

  // ---------- the great golden needle ----------
  // drawn whole (40 x 940: its head with the eye, the shaft, the point) and cut into blocks
  const needle = (x: number, y: number, shade: number): number => {
    // x 0..39 across the shaft (two blocks), lit from the left
    const lit = 1 - x / 40;
    return shadeAt(R('gold'), 1, 4, 0.25 + lit * 0.7 + (x % 13 === 3 ? 0.15 : 0), x, y + shade);
  };
  const shaft = (half: 0 | 1, shade: number) => {
    const p = starry(50 + half, shade);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const gx = half * 20 + x;
        if (gx >= 6 && gx < 34) p.set(x, y, needle(gx - 6 + 6, y, 0));
      }
    return p;
  };
  for (const s of [0, 1, 2, 3, 4, 5]) {
    book.add(`shaftL${s}`, shaft(0, s), { solid: SOLID });
    book.add(`shaftR${s}`, shaft(1, s), { solid: SOLID });
  }
  // the point, in the sand
  const point = (half: 0 | 1) => {
    const p = starry(53 + half, 0);
    for (let y = 0; y < 20; y++) {
      const w = 14 - y * 0.65;
      for (let x = 0; x < 20; x++) {
        const gx = half * 20 + x;
        if (Math.abs(gx - 20) < w) p.set(x, y, needle(gx, y, 0));
      }
    }
    return p;
  };
  book.add('pointL', point(0), { solid: SOLID });
  book.add('pointR', point(1), { solid: SOLID });
  // the head: a golden diamond (rows 0..3 tip, 4..6 the eye) as on the cover
  const HEAD_H = 140;
  const head = new Pixels(40, HEAD_H, 255);
  const widthAt = (y: number) => (y < 60 ? (y / 60) * 19 : y < 120 ? 19 - ((y - 60) / 60) * 5 : 14);
  for (let y = 0; y < HEAD_H; y++) for (let x = 0; x < 40; x++) if (Math.abs(x - 19.5) < widthAt(y)) head.set(x, y, needle(x, y, 0));
  // the eye: white, a blue-violet iris, a deep pupil, a glint, lashes
  const ex = 19.5;
  const ey = 110;
  for (let y = ey - 14; y <= ey + 14; y++)
    for (let x = 0; x < 40; x++) {
      const d = ((x - ex) / 16) ** 2 + ((y - ey) / 13) ** 2;
      if (d > 1) continue;
      const r = Math.hypot(x - ex, y - ey);
      head.set(
        x,
        y,
        r < 4.5
          ? c('ink', 0)
          : r < 11
            ? shadeAt(R('purple'), 1, 3, 1 - r / 13 + ((Math.atan2(y - ey, x - ex) * 6) % 1) * 0.15, x, y)
            : shadeAt(R('white'), 0, 2, 1 - Math.abs(y - ey) / 14, x, y),
      );
    }
  head.disc(ex - 4, ey - 4, 1.6, c('white', 2));
  for (let a = 0; a < 7; a++) head.line(ex - 12 + a * 4, ey - 13, ex - 13 + a * 4.2, ey - 17, c('ink', 0));
  // The eye blinks: its lid droops (the warning), shuts, and lifts again, on a slow rhythm. Only
  // while it is wide open will it look at a camel on his knees and take his graces.
  const lidded = (frac: number): Pixels => {
    const h = head.crop(0, 0, 40, HEAD_H);
    const edge = ey - 14 + frac * 28;
    for (let y = ey - 14; y <= ey + 14; y++)
      for (let x = 0; x < 40; x++) {
        if (((x - ex) / 16) ** 2 + ((y - ey) / 13) ** 2 > 1) continue;
        if (y < edge - 1) h.set(x, y, needle(x, y, 0));
        else if (y < edge + 1) h.set(x, y, c('ink', 0));
      }
    // the lashes along the lid's edge
    if (frac > 0) for (let a = 0; a < 7; a++) h.line(ex - 12 + a * 4, Math.round(edge), ex - 13 + a * 4.2, Math.round(edge) + 3, c('ink', 0));
    return h;
  };
  const BLINK: [string, Pixels, number][] = [
    ['', head, EYE_OPEN],
    ['Droop', lidded(0.45), EYE_DROOP],
    ['Shut', lidded(1), EYE_SHUT],
    ['Lift', lidded(0.45), EYE_LIFT],
  ];
  const next = (i: number) => BLINK[(i + 1) % BLINK.length][0];
  for (let y = 0; y < 7; y++)
    for (const half of [0, 1] as const) {
      // behind it, the sky the map has on that row: dawn (5) down to row 5, the band into 4 on row 6
      const bgAt = () => (y < 6 ? starry(60 + y * 2 + half, 5) : band(4));
      if (y === 5 && !half) {
        // the eye's left half at the pupil row opens (for free) once the right half has let him in
        BLINK.forEach(([name, pic, ntime], i) => {
          const p = bgAt();
          p.blit(pic.crop(0, 100, 20, 20), 0, 0, 255);
          book.add(`head5L${name}`, p, { solid: SOLID, touch: 'pupilOpen', next: `head5L${next(i)}`, ntime });
        });
        continue;
      }
      const p = bgAt();
      p.blit(head.crop(half * 20, y * 20, 20, 20), 0, 0, 255);
      book.add(`head${y}${half ? 'R' : 'L'}`, p, y < 4 ? air : { solid: SOLID });
    }
  // the pupil, open: a way through, one block high, full of light
  const open = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) open.set(x, y, shadeAt(R('gold'), 3, 4, 1 - Math.abs(y - 10) / 14, x, y));
  open.rect(0, 0, 20, 2, c('purple', 2)).rect(0, 18, 20, 2, c('purple', 2));
  book.add('pupilOpen', open, { grav: GRAV.down });
  // the right half of the eye at its pupil row is the gate: EYE_GRACE graces open it
  // (and blinks with the left half: drooping, shut or lifting, it takes nothing and lets no one in)
  BLINK.forEach(([name, pic, ntime], i) => {
    const shut = starry(70, 5);
    shut.blit(pic.crop(20, 100, 20, 20), 0, 0, 255);
    const blink = { next: `pupil${next(i)}`, ntime };
    book.add(
      `pupil${name}`,
      shut,
      name ? { solid: SOLID, ...blink } : { solid: SOLID, effect: GRACE, eamt: -EYE_GRACE, score: 1000, touch: 'pupilOpen', ...blink },
    );
  });

  // a small eye gate through the shaft (one grace), and its hole
  addGate(
    k,
    () => shaft(0, 4),
    () => shaft(1, 4).map((x, y, v) => (x < 18 && y > 1 ? c('sky', 4) : v)),
  );
  const hole = shaft(1, 4).map((x, y, v) => (x < 14 && y > 1 ? c('sky', 4) : v));
  for (let x = 0; x < 14; x++) hole.set(x, 0, c('gold', 3)).set(x, 1, c('gold', 2));
  book.add('hole', hole, air);

  // ---------- good things ----------
  for (const sh of [2, 4]) {
    book.add(`bg${sh}`, starry(79, sh), air);
    addGoodThings(k, () => starry(80, sh), `${sh}`);
  }
  // a dove's olive branch: points
  const olive = starry(81, 4);
  olive.line(4, 14, 16, 6, c('wood', 2));
  for (const [x, y] of [
    [7, 11],
    [10, 9],
    [13, 8],
    [9, 13],
    [14, 10],
  ])
    blob(olive, x, y, 2, 1.2, R('leaf'), 1, 3);
  book.add('olive', olive, { score: 100, touch: 'sky4', grav: GRAV.down });

  // the town's poor, sleeping out at the needle's foot: a camel who passed some by on the road
  // and comes short of grace still has gold for them here (no one is stranded below the eye)
  for (const who of ['beggar', 'widow', 'kids', 'blind'] as const) addSoul(k, who, () => town(3));
  return k;
}
