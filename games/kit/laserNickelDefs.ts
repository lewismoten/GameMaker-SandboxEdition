// What each game's laser wooden nickel (laserNickels.ts) is: a token of the game's own world, a 1994 collectible in a series of
// 26 (the order of NICKELS below is the series number). `top` and `bottom` are the arcs on the front (up to about 15 characters),
// `art` draws the middle of the face (millimeters from the center; nothing past 11.5 mm out unless it is lettering or a rim
// motif), `good` is the back's "GOOD FOR ..." in up to three lines of 8x8 letters (10 characters at most a line).
// Figures come from the game's own built disk: pixelTrinketDefs.ts names a hero and a signature figure for most games and
// the rest are named here. Secret games are not listed here and never get a nickel.
import type { Def } from './pixelTrinketDefs';
import type { Art } from './laserNickelParts';

export interface NickelDef {
  top: string;
  bottom?: string;
  good: string[];
  /** The back's top arc when it isn't "GOOD FOR" (the lines then say it all). */
  arc?: string;
  /** How many figures the art draws: the hero, then the signature figure. */
  figs?: 1 | 2;
  /** A hero for games pixelTrinketDefs.ts has none for: character file (or a monster: mon + mbl + n), block file, palette. */
  hero?: { chr: string; cbl: string; pal: string; seq?: number } | { mon: string; mbl: string; n: number; pal: string };
  /** One line: what this token is. */
  concept: string;
  art: (a: Art) => void;
  /** How far from the center the art may reach (mm), when it is meant to fill the face (default 12.3, inside the lettering). */
  zone?: number;
}

const h = (chr: string, cbl: string, pal: string, seq?: number) => ({ chr: `${chr}.chr`, cbl: `${cbl}.cbl`, pal: `${pal}.pal`, seq });

/** Comedy and tragedy masks for the Paragon's ticket. */
const mask = (a: Art, x: number, y: number, happy: boolean) => {
  a.ring(x, y, 2.6)
    .disc(x - 1, y - 0.7, 0.45)
    .disc(x + 1, y - 0.7, 0.45);
  for (let i = -2; i <= 2; i++) a.disc(x + i * 0.55, y + (happy ? 0.9 + 0.2 * (2 - Math.abs(i)) : 1.9 - 0.2 * (2 - Math.abs(i))), 0.26);
};
/** The Ω as type draws it: a ring open at the bottom, its ends turned in a little, standing on two short feet. */
const omega = (a: Art) => {
  const cy = -2.6;
  const r0 = 5.5;
  const r1 = 7.9;
  const gap = 38; // half the opening at the bottom, degrees either side of straight down
  a.arcBand(0, cy, r0, r1, 90 + gap, 450 - gap, 4);
  const at = (r: number, deg: number): [number, number] => [r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  for (const s of [-1, 1]) {
    const end = 90 - s * gap; // where this leg's band ends
    const [xo, yo] = at(r1, end);
    const [xi, yi] = at(r0, end);
    const foot = Math.max(yo, yi) + 2.2; // the feet's bottom edge
    // the leg runs straight down from the band's end to the foot
    a.poly([
      [xi, yi],
      [xo, yo],
      [xo, foot - 2.2],
      [xi, foot - 2.2],
    ]);
    // the foot: a short bar reaching outward
    const inner = Math.min(Math.abs(xi), Math.abs(xo));
    a.poly([
      [s * inner, foot - 2.2],
      [s * (inner + 4.4), foot - 2.2],
      [s * (inner + 4.4), foot],
      [s * inner, foot],
    ]);
  }
};
const paw = (a: Art, x: number, y: number, k = 1) => {
  a.disc(x, y + 1.5 * k, 2.4 * k);
  for (const [dx, dy] of [
    [-2.8, -1.4],
    [-1, -3.2],
    [1, -3.2],
    [2.8, -1.4],
  ])
    a.disc(x + dx * k, y + dy * k, 1.1 * k);
};

/** In series order: the 26 tokens. */
export const NICKELS: Record<string, NickelDef> = {
  blaster: {
    concept: 'An arcade token: a star cut clean through, "1 PLAY", "NO CASH VALUE".',
    top: 'VIRUS BLASTER',
    bottom: 'NO CASH VALUE',
    good: ['ONE FREE', 'VIRUS SCAN'],
    art: (a) => {
      a.text('INSERT', 0, -8, 0.5, 'micro').text('1 PLAY', 0, 8, 0.5, 'micro');
      for (const deg of [0, 30, 150, 180, 210, 330]) a.disc(9.6 * Math.cos((deg * Math.PI) / 180), 9.6 * Math.sin((deg * Math.PI) / 180), 0.4);
      a.holeStar(0, 0, 5.2);
    },
  },
  brief: {
    concept: 'A library token: a big "100" and "WORDS", exactly.',
    top: 'KEEP IT BRIEF!',
    bottom: 'TINY POCKETS',
    good: ['ONE STORY', 'OF EXACTLY', '100 WORDS'],
    zone: 15,
    art: (a) => a.text('100', 0, -1.4, 1).text('WORDS', 0, 6.8, 0.4),
  },
  carl: {
    concept: 'A buzz token: Carl himself, small, over "ONE BUZZ".',
    top: 'A FLY NAMED CARL',
    bottom: 'ONE BUZZ',
    good: ['ONE BUZZ', 'IN HIS EAR', 'AT 3:47 AM'],
    figs: 1,
    art: (a) => a.figure(0, 0, 0, 14),
  },
  depth: {
    concept: 'A depth token: rings receding to a bold sphere, "NO GLASSES".',
    top: 'DEPTH PERCEPTION',
    bottom: 'NO GLASSES',
    good: ['ONE PULL', 'OF FOCUS'],
    art: (a) => a.ring(0, 0, 10.8).ring(0, 0, 8.3).ring(0, 0, 6.1).ring(0, 0, 4.3).disc(0, 0, 2.8),
  },
  goat: {
    concept: 'A shepherds' + "'" + ' tally token: the third goat from the left.',
    top: 'THIRD GOAT',
    bottom: 'FROM THE LEFT',
    good: ['ONE GOAT', 'SCREAM'],
    figs: 1,
    art: (a) => a.figure(0, 0, 0, 14),
  },
  loaf: {
    concept: 'A basket token: Loaf #13, the one nobody picked.',
    top: 'LOAF #13',
    bottom: 'IN THE BASKET',
    good: ['ONE HOLY', 'CRUMB'],
    figs: 1,
    art: (a) => a.figure(0, 0, 0, 13),
  },
  logic: {
    concept: 'Just an Ω, big and bold.',
    top: 'OHM SWEET OHM',
    bottom: 'SMART HOME',
    good: ['ONE SPARE', 'FUSE'],
    zone: 13.6,
    art: omega,
  },
  loofah: {
    concept: 'A scrub token: the loofah beside the friendly bath monster, "CLEANSE ME".',
    top: 'CLEANSE ME',
    bottom: 'O LOOFAH',
    good: ['ONE SCRUB', 'LEAVING', 'MY SOUL'],
    figs: 2,
    art: (a) => a.figure(0, -5.5, 0, 12).figure(1, 5.5, 2, 8.5),
  },
  maximus: {
    concept: 'A Galactic Courier star credit: a rocket along a dotted star route, "PAID ON DELIVERY".',
    top: 'GALACTIC COURIER',
    bottom: 'PAID ON DELIVERY',
    good: ['ONE STAR', 'SHARD'],
    art: (a) => {
      // a rocket flying a dotted star route
      a.poly([
        [-1.6, -5],
        [1.6, -5],
        [1.6, 2],
        [-1.6, 2],
      ]).poly([
        [-1.6, -5],
        [0, -9],
        [1.6, -5],
      ]);
      a.poly([
        [-1.6, 0],
        [-3.6, 3.4],
        [-1.6, 2],
      ])
        .poly([
          [1.6, 0],
          [3.6, 3.4],
          [1.6, 2],
        ])
        .poly([
          [-0.8, 2.6],
          [0.8, 2.6],
          [0, 4.8],
        ]);
      for (let i = 0; i <= 8; i++) {
        const t = ((-170 + (160 * i) / 8) * Math.PI) / 180;
        a.disc(8.4 * Math.cos(t), -1.4 + 8.4 * Math.sin(t) * 0.9, i % 8 === 0 ? 0.95 : 0.4);
      }
      a.text('1 CREDIT', 0, 7.2, 0.5, 'micro');
    },
  },
  mustard: {
    concept: 'A faith token: the smallest hole in the land, "SMALLEST THING IN THE LAND".',
    top: 'MUSTARD SEED',
    bottom: 'HUSTLE',
    good: ['ONE MOVED', 'MOUNTAIN'],
    art: (a) => a.ring(0, 0, 3.2).text('SMALLEST', 0, -6.6, 0.5, 'micro').text('THING', 0, 6.6, 0.5, 'micro').holeCircle(0, 0, 1.6),
  },
  needle: {
    concept: 'A road token: Brother Camel alone, and the eye he has to get through.',
    top: 'BROTHER CAMEL',
    bottom: 'THE EYE',
    good: ['ONE CAMEL', 'THROUGH', 'THE EYE'],
    figs: 1,
    hero: h('saddled', 'saddled', 'city'),
    art: (a) => a.figure(0, 0, 0, 15),
  },
  realm: {
    concept: 'The Round Tuit itself: a ringed boss, "A ROUND TUIT".',
    top: 'A ROUND TUIT',
    bottom: 'GET AROUND TO IT',
    arc: 'GOOD FOR ONE',
    good: ['GETTING', 'AROUND', 'TO IT'],
    art: (a) => a.disc(0, 0, 3.6).ring(0, 0, 5.6).ring(0, 0, 9.2).dots(0, 0, 7.4, 12),
  },
  reckoning: {
    concept: 'A fridge-door token: the clock reads "3:17 A.M." with Doc Leo, in his pajamas, in the kitchen.',
    top: 'DAIRY RECKONING',
    bottom: 'NO LACTOSE',
    good: ['ONE SLICE', 'AT 3:17 AM'],
    figs: 1,
    hero: h('leo', 'reckon', 'bedroom'),
    art: (a) => a.figure(0, -7, 0, 10).text('3:17', 4.8, -1.8, 0.45).text('A.M.', 4.8, 3.2, 0.36),
  },
  remote: {
    concept: 'A couch token: the remote, and "PLAY".',
    top: 'THE REMOTE?!',
    bottom: 'PLAY',
    good: ['ONE LOOK', 'UNDER THE', 'COUCH'],
    figs: 1,
    hero: h('remote', 'remote', 'den'),
    art: (a) => a.figure(0, 0, 0, 14),
  },
  risi: {
    concept: 'A Roman coin: Marcus in a laurel wreath, "VENI VIDI RISI".',
    top: 'VENI VIDI RISI',
    bottom: 'I LAUGHED',
    good: ['ONE LAUGH', 'IN ROME'],
    figs: 1,
    art: (a) => a.dots(0, 0, 10, 20, 0.7, -90).figure(0, 0, 0, 14),
  },
  sandcast: {
    concept: 'A beach token: a sand dollar that hides a knight’s crest.',
    top: 'SANDCASTLE',
    bottom: 'KNIGHT',
    good: ['ONE TOWER', 'OF SAND'],
    art: (a) => {
      for (let i = 0; i < 5; i++) {
        const t = (-90 + i * 72) * (Math.PI / 180);
        const c = [Math.cos(t), Math.sin(t)];
        a.poly([
          [c[0] * 3.4 - c[1] * 0.1, c[1] * 3.4 + c[0] * 0.1],
          [c[0] * 6.4 + c[1] * 1.7, c[1] * 6.4 - c[0] * 1.7],
          [c[0] * 10.8, c[1] * 10.8],
          [c[0] * 6.4 - c[1] * 1.7, c[1] * 6.4 + c[0] * 1.7],
        ]);
      }
      a.ring(0, 0, 3).poly([
        [-1.6, -1.9],
        [1.6, -1.9],
        [1.6, 0.4],
        [0, 2.2],
        [-1.6, 0.4],
      ]);
    },
  },
  sleuth: {
    concept: 'The Paragon Theatre’s admission token: "ADMIT ONE", row and seat, a perforation, and the two masks.',
    top: 'PARAGON THEATRE',
    bottom: 'OPENING NIGHT',
    good: ['ONE SEAT', 'ROW A 9'],
    art: (a) => {
      a.text('ADMIT', 0, -6.2, 0.42).text('ONE', 0, -2, 0.42);
      mask(a, -8.8, -1.4, true);
      mask(a, 8.8, -1.4, false);
      a.perf(2.4, -9.6, 8.8).text('ROW A', 0, 5, 0.5, 'micro').text('SEAT 9', 0, 8.3, 0.5, 'micro');
    },
  },
  smirked: {
    concept: 'The bravery award: a rosette with a star, "BRAVERY BADGE", "SHE SMIRKED".',
    top: 'BRAVERY BADGE',
    bottom: 'SHE SMIRKED',
    good: ['ONE YELL', 'AT THE FOG', 'MACHINE'],
    art: (a) => a.dots(0, 0, 10.2, 14, 0.9).star(0, 0, 8),
  },
  snowbound: {
    concept: 'Shoveling scrip: "$1" a driveway, with a snowflake.',
    top: 'SNOWBOUND',
    bottom: 'ONE DRIVEWAY',
    good: ['ONE SCOOP', 'OF SNOW', 'FOR $1'],
    art: (a) => {
      for (let i = 0; i < 3; i++) {
        const t = (i * 60 * Math.PI) / 180;
        a.bar(-4.2 * Math.cos(t), -6.6 - 4.2 * Math.sin(t), 4.2 * Math.cos(t), -6.6 + 4.2 * Math.sin(t), 0.9);
      }
      a.text('$1', 0, 1.8, 0.9);
    },
  },
  sweats: {
    concept: 'An open-mic token: Will in his ruff and sweatpants, "ONE OPEN MIC SLOT".',
    top: 'SHAKESPEARE IN',
    bottom: 'SWEATPANTS',
    good: ['ONE OPEN', 'MIC SLOT'],
    figs: 1,
    art: (a) => a.figure(0, 0, 0, 14),
  },
  teddy: {
    concept: 'A trick token: a paw print and "ONE TRICK".',
    top: 'TEDDY',
    bottom: 'LITTLE BIG',
    good: ['ONE TRICK', 'ON REQUEST'],
    art: (a) => paw(a, 0, -1.4, 1.5),
  },
  teddy2: {
    concept: 'A Tri-County Fair ride ticket: a Ferris wheel with a hole for its hub.',
    top: 'TRI-COUNTY FAIR',
    bottom: 'LITTLE BIGGER',
    good: ['SNIFF OUT', "GWINN'S", 'TRAIL'],
    art: (a) => {
      a.ring(0, 0, 9.4);
      for (let i = 0; i < 6; i++) {
        const t = (i * Math.PI) / 3;
        a.bar(3 * Math.cos(t), 3 * Math.sin(t), 8.8 * Math.cos(t), 8.8 * Math.sin(t), 0.5);
      }
      a.holeCircle(0, 0, 1.5);
    },
  },
  teddy3: {
    concept: 'A birthday token: a party hat and "BIG DAY".',
    top: 'TEDDY',
    bottom: 'LITTLE BIGGEST',
    good: ['ONE BIG', 'BIRTHDAY', 'SURPRISE'],
    art: (a) => {
      a.poly([
        [0, -9],
        [-5.4, 3],
        [5.4, 3],
      ])
        .disc(0, -9.4, 1.2)
        .text('BIG DAY', 0, 8, 0.5, 'micro');
    },
  },
  tickle: {
    concept: 'A rat token: the lab rat from the game, "CERTIFIED".',
    top: 'CERTIFIED',
    bottom: 'RAT TICKLER',
    good: ['ONE RAT', 'TICKLE'],
    figs: 1,
    hero: { mon: 'course.mon', mbl: 'tickle.mbl', n: 0, pal: 'course.pal' },
    art: (a) => a.figure(0, 0, 0, 14),
  },
  tuneup: {
    concept: 'A tuning token: a tuning fork, "NO WRENCHES".',
    top: 'TUNE-UP',
    bottom: 'NO WRENCHES',
    good: ['ONE FREE', 'TUNE-UP', 'BY EAR'],
    art: (a) => {
      a.arcBand(0, -3.6, 2.2, 3.5, 0, 180, 12).bar(-2.85, -3.6, -2.85, -10.2, 1.3).bar(2.85, -3.6, 2.85, -10.2, 1.3).bar(0, 0.4, 0, 8.2, 1.6).disc(0, 8.6, 1.2);
      for (const s of [-1, 1]) for (let i = 1; i <= 2; i++) a.arcBand(s * 5.6, -6, 1.2 * i + 1, 1.2 * i + 1.6, s > 0 ? -50 : 130, s > 0 ? 50 : 230, 10);
    },
  },
  year2000: {
    concept: 'A Teleport-A-Phone token: a hole through the middle like a subway token, "25 CENT".',
    top: 'IN THE YEAR',
    bottom: '2000!',
    good: ['ONE FREE', 'TELEPORT'],
    art: (a) => a.ring(0, 0, 6).text('25 CENT', 0, -8.4, 0.5, 'micro').text('TELEPORT', 0, 8.4, 0.5, 'micro').holeCircle(0, 0, 3.4),
  },
};

/** The hidden message: one Sandscript letter on the back of each token, in series order. */
export const MESSAGE = 'BEKINDANDKEEPPLAYINGFRIEND';

/** A Def (pixelTrinketDefs.ts shape) for a hero named in NICKELS. */
export const heroDef = (game: string, n: NickelDef): Def | undefined =>
  n.hero
    ? 'mon' in n.hero
      ? { id: game, title: game, blurb: '', source: { mon: n.hero.mon, mbl: n.hero.mbl, n: n.hero.n }, pal: n.hero.pal }
      : { id: game, title: game, blurb: '', source: { chr: n.hero.chr, cbl: n.hero.cbl, seq: n.hero.seq }, pal: n.hero.pal }
    : undefined;
