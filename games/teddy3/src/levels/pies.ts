// Level 10: MEANWHILE... Pie Practice, one afternoon in the Clown Club's practice tent at the
// Fairgrounds. Doc Leo has to fetch the birthday cake from Professor Pratfall's bakery stall,
// and the way there runs right through the Club's pie-throwing practice. The new idea is the
// PRATFALL (hold 4): flat on his back, only his feet's block is left, so a pie thrown at head
// height sails over. Teach: Twirly throws one slow pie at a time, and she winds up first (the
// pie goes up over her head). Test: Bubbles throws high and low by turns: a high wind-up is a
// pie at head height (pratfall), a low one skids along the floor (hop it); pigeons peck at the
// crumbs (SQUAWK). Twist: the bakery is up past the little stage, and under the stage Honker throws in
// volleys of three: pratfall under a volley, then twist a balloon in the lull and ride up onto
// the stage. On the stage Juggles throws volleys too, under the bakery balcony: pratfall, then
// a second balloon up to the stall, the cake, and the back flap (it opens for the cake).
//
// The blocks are in piesTiles.ts, the monsters in piesBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { BALCONY_ROW, G, LOOPS, STAGE_ROW, piesTiles } from './piesTiles';
import { piesBeasts } from './piesBeasts';
import { piesSong } from '../sound/piesSong';

/** Where things are, for the bot's route. */
export const PIES = { teach: 24, pigeons: 28, test: 43, volley: 69, stage: 52, lift: 56, volley2: 71, lift2: 65, prof: 66, cake: 69, flap: 72 };

export function pies(): Level {
  const bs = piesTiles();
  const beasts = piesBeasts();
  const m = new LevelMap(bs, beasts, 'pole');
  const W = PIES.flap + 1;
  // the tent: x 1..W-1 inside, the roof at row 23, the floor at G
  m.rect(1, 24, W - 1, G - 24, 'tent');
  m.rect(0, 23, W + 1, 1, 'roof');
  m.rect(1, 24, W - 1, 1, 'valance');
  m.rect(0, G, W + 1, 1, 'floor');
  for (let x = 1; x < PIES.stage; x++) m.set(x, 31, 'garland');
  m.rect(0, G + 1, W + 1, 4, 'under');

  // The throwers (each a loop of poses; the throw pose's block gives birth to the pie).
  const thrower = (id: string, x: number, y: number, births: [number, 'T' | 'B', string][], every: number) => {
    m.set(x, y - 1, `${id}0T`).set(x, y, `${id}0B`);
    for (const [k, half, pie] of births) {
      const d = bs.def(`${id}${k}${half}`);
      d.birthMon = beasts.id(pie);
      d.birthTime = every;
    }
  };
  const loopTicks = (id: string) => LOOPS[id].frames.reduce((s, [, t]) => s + t, 0);

  // Start, and the teach: Twirly's slow pies, ending on her target.
  m.set(3, 39, 'signFlopL').set(4, 39, 'signFlopR');
  m.set(10, 38, 'target00').set(10, 39, 'target01');
  thrower('teach', PIES.teach, 39, [[2, 'T', 'pieTeach']], loopTicks('teach'));

  // The test: pigeons after the crumbs, then Bubbles, throwing high and low by turns.
  m.mon(PIES.pigeons, 39, 'pigeon').mon(PIES.pigeons + 3, 39, 'pigeon');
  m.set(34, 38, 'target00').set(34, 39, 'target01');
  m.set(36, 39, 'signLowL').set(37, 39, 'signLowR');
  thrower(
    'test',
    PIES.test,
    39,
    [
      [2, 'T', 'pieHigh'],
      [5, 'B', 'pieLow'],
    ],
    loopTicks('test') / 2,
  );

  // The twist: the stage, with Honker's volleys under it; the bakery balcony over its far
  // end, with Juggles' volleys under that.
  m.set(46, 38, 'target00').set(46, 39, 'target01');
  m.set(48, 39, 'signUpL').set(49, 39, 'signUpR');
  m.rect(PIES.stage, STAGE_ROW, W - PIES.stage, 1, 'stage');
  for (const x of [PIES.stage, 61]) for (let y = STAGE_ROW + 1; y < G; y++) m.set(x, y, 'stageLeg');
  thrower('volley', PIES.volley, 39, [[2, 'T', 'pieVolley']], 12);
  m.set(57, 32, 'target00').set(57, 33, 'target01');
  m.rect(62, BALCONY_ROW, W - 62, 1, 'balcony');
  for (let y = BALCONY_ROW + 1; y < STAGE_ROW; y++) m.set(62, y, 'stageLeg');
  thrower('volley2', PIES.volley2, STAGE_ROW - 1, [[2, 'T', 'pieVolley2']], 12);
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 3; by++) m.set(62 + bx, BALCONY_ROW - 3 + by, `stall${bx}${by}`);
  m.set(PIES.prof, BALCONY_ROW - 2, 'profTop').set(PIES.prof, BALCONY_ROW - 1, 'profBot');
  m.set(PIES.cake, BALCONY_ROW - 1, 'cake');
  m.set(PIES.flap, BALCONY_ROW - 2, 'flap00').set(PIES.flap, BALCONY_ROW - 1, 'flap01');

  const treats: [number, number][] = [
    [7, 39],
    [13, 39],
    [17, 39],
    [21, 39],
    [27, 39],
    [33, 39],
    [39, 39],
    [41, 39],
    [44, 39],
    [51, 39],
    [54, STAGE_ROW - 1],
    [59, STAGE_ROW - 1],
    [67, BALCONY_ROW - 1],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 2, 39);
  m.mark('exit', PIES.flap, BALCONY_ROW - 1);
  return {
    file: 'pies',
    hero: 'leo',
    title: 'Pie Practice',
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [4, 35],
    pose: [12, 39, 'front'],
    song: piesSong,
    card: ['MEANWHILE, Doc Leo fetches', 'the cake. Pie practice!', 'NEW: HOLD 4 TO PRATFALL'],
  };
}
