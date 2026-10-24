// Level 15: MEANWHILE... Doc Leo Hangs the Lights, high in the Big Top's rigging on the night
// of the surprise party. The string of party lights is strung up already; Doc Leo climbs to
// fetch its plug off the high catwalk and plug it in at the outlet at the top of the tent.
// It puts his tricks together, and the new one is the rigging lift. From the ring a balloon
// goes up to the first catwalk. Along the top of the bleachers a sandbag
// swings at head height (PRATFALL under it), then a balloon to the next catwalk. That one ends
// at the lift's shaft: two planks go round it half a turn apart, solid only on the way up, so
// step on as one comes level and ride it up two catwalks. Juggles practices up there, and his
// pin flies back and forth over the catwalk between him and Twirly: a pin pops a balloon dog,
// so SQUAWK the pigeon and twist a balloon when the pin has gone by. On the high catwalk the plug lies past another sandbag
// (pratfall there and back), and one more balloon reaches the top catwalk and the outlet,
// which opens for the plug. A side catwalk past the pins has the bone.
//
// No fall is blind: every catwalk end hangs over another catwalk at most six blocks down (or
// is a wall or a railing post), the lift's shaft has a catwalk across it halfway and the
// bleachers under it, and a balloon from the one below always reaches back up.
//
// The blocks are in riggingTiles.ts, the monsters in riggingBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, ROWS, riggingTiles } from './riggingTiles';
import { LIFT, PIN_TOSS, SWINGS, riggingBeasts } from './riggingBeasts';
import { riggingSong } from '../sound/riggingSong';

/** Where things are, for the bot's route. */
export const RIGGING = {
  start: 2,
  lift1: 8,
  swingLow: 18,
  lift2: 20,
  lift: 28,
  juggles: 25,
  pigeon: 20,
  lift3: 16,
  plug: 4,
  swingHigh: 10,
  lift4: 12,
  outlet: 24,
};

export function rigging(): Level {
  const bs = riggingTiles();
  const beasts = riggingBeasts();
  const W = 34;
  const m = new LevelMap(bs, beasts, 'roof');
  const { t1, t2, t3, t4, t5, t6 } = ROWS;
  m.rect(1, 17, W - 1, G - 17, 'tent');
  m.rect(0, 17, 1, G - 17, 'side').rect(W, 17, 1, G - 17, 'side');
  m.rect(0, G, W + 1, 1, 'floor');
  m.rect(0, G + 1, W + 1, 4, 'under');
  // the bleachers under the climb's right side (their top is the first walk)
  m.rect(10, t1, W - 10, G - t1, (x, y) => (y === t1 ? 'benchTop' : x % 2 ? 'bench' : 'benchB'));

  // The ring: a balloon up to the first catwalk.
  m.set(3, G - 1, 'signUpL').set(4, G - 1, 'signUpR');
  m.rect(1, t1, 9, 1, 'catwalk');

  // Along the bleachers: the low sandbag swinging under the second catwalk.
  const swing = (name: string, x: number, row: number, top: number) => {
    for (let y = top; y < row; y++) m.set(x, y, 'rope');
    m.set(x, row, 'hook').mon(x, row, name);
  };
  const [[lowName], [highName]] = SWINGS;
  m.set(11, t1 - 1, 'signBagsL').set(12, t1 - 1, 'signBagsR');
  m.rect(10, t2, 18, 1, 'catwalk');
  swing(lowName, RIGGING.swingLow, t1 - 2, t2 + 1);

  // The lift's shaft at the second catwalk's end; the third catwalk across it halfway.
  m.set(26, t2 - 1, 'signLift');
  m.rect(RIGGING.lift, t3, W - RIGGING.lift, 1, 'catwalk');
  m.mon(RIGGING.lift, t2, 'liftA').mon(RIGGING.lift, t2 - LIFT.rise, 'liftB');

  // The fourth catwalk: Juggles and his pins, a pigeon, the railing post at its far end.
  m.rect(14, t4, RIGGING.lift - 14, 1, 'catwalk');
  m.set(13, t4 - 1, 'post').set(13, t4 - 2, 'post');
  m.set(RIGGING.juggles, t4 - 2, 'juggles0Top').set(RIGGING.juggles, t4 - 1, 'juggles0Bot');
  m.set(RIGGING.juggles - PIN_TOSS, t4 - 2, 'twirlyTop').set(RIGGING.juggles - PIN_TOSS, t4 - 1, 'twirlyBot');
  m.mon(RIGGING.juggles, t4 - 3, 'pin');
  m.set(15, t4 - 1, 'signPinsL').set(16, t4 - 1, 'signPinsR');
  m.mon(RIGGING.pigeon, t4 - 1, 'pigeon');

  // The high catwalk: the plug past the high sandbag; the side catwalk with the bone.
  m.rect(1, t5, 18, 1, 'catwalk');
  m.rect(22, t5, W - 22, 1, 'catwalk');
  swing(highName, RIGGING.swingHigh, t5 - 2, t6 + 1);
  m.set(15, t5 - 1, 'signPlug');
  m.set(RIGGING.plug, t5 - 1, 'plug');

  // The top catwalk, the party bulbs strung over it, and the outlet.
  m.rect(10, t6, RIGGING.outlet - 10 + 1, 1, 'catwalk');
  for (let x = RIGGING.swingHigh + 1; x < RIGGING.outlet; x++) m.set(x, t6 - 4, 'bulbs');
  m.set(RIGGING.outlet, t6 - 2, 'outletTop').set(RIGGING.outlet, t6 - 1, 'outlet');

  const treats: [number, number][] = [
    [7, G - 1],
    [4, t1 - 1],
    [14, t1 - 1],
    [20, t1 - 1],
    [24, t1 - 1],
    [15, t2 - 1],
    [23, t2 - 1],
    [31, t3 - 1],
    [19, t4 - 1],
    [17, t5 - 1],
    [6, t5 - 1],
    [26, t5 - 1],
    [15, t6 - 1],
    [21, t6 - 1],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.treat(W - 1, t5 - 1, 'bone');
  m.mark('start', RIGGING.start, G - 1);
  m.mark('exit', RIGGING.outlet, t6 - 1);
  return {
    file: 'rigging',
    hero: 'leo',
    title: 'Doc Leo Hangs the Lights',
    time: 'show',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [14, 41],
    pose: [20, 45, 'front'],
    song: riggingSong,
    card: ['MEANWHILE, Doc Leo hangs', 'the party lights up top.', 'NEW: RIDE THE RIGGING LIFT'],
  };
}
