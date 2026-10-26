// Level 16: The Teddy Course, the finale, inside the Big Top at night. Doc Leo's last errand
// takes Teddy into the dark tent, where the Clown Club has built him an obstacle course out of
// every trick from all three adventures, station by station: WOOF at wind-up mice; high-five a
// button to open a door (the garage); DIG under a fence; ride a see-saw (the park); a fast belt
// (the bakery: E at its end); red and blue blinking boards over a ball pit (the funhouse); PLAY
// DEAD under Professor Pratfall's practice pies; SIT PRETTY for Honker; SPIN the turnstile. Then
// a station for each of the others' MEANWHILE ideas: PLAY DEAD under Gwinn's spotlight, ride a
// paddle of the mill's water wheel up a stack of crates, and stand on Doc Leo's balloon pump
// to float up to the high platform, where Teddy SNIFFs out the hidden button whose flap into
// the ring stays open only a few seconds.
// In the dark middle of the ring: SURPRISE! (the ending).
//
// The blocks are in courseTiles.ts, the monsters in courseBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, courseTiles } from './courseTiles';
import { PUMP_EVERY, SPOT, courseBeasts } from './courseBeasts';
import { WHEEL } from './millBeasts';
import { courseSong } from '../sound/courseSong';

/** Where things are, for the bot's route. */
export const COURSE = {
  mice: 6,
  btnDoor: 10,
  door: 11,
  plug: 14,
  fence: 15,
  up: 16,
  step: 18,
  saw: 19,
  crates: 22,
  beltEnd: 29,
  landing: 33,
  pit0: 38,
  pit1: 45,
  prof: 53,
  sit: 56,
  turn: 59,
  /** The MEANWHILE stretch: the spotlight's wing, the water wheel's rising column, the crates it lifts Teddy onto, the balloon pump. */
  wing: SPOT.x,
  wheel: 72,
  ledge: 73,
  pump: 77,
  high: 35,
  scent: 80,
  flap: 84,
  ring: 91,
};

export function course(): Level {
  const bs = courseTiles();
  const beasts = courseBeasts();
  const m = new LevelMap(bs, beasts, 'dark');
  const C = COURSE;
  m.rect(0, 20, C.flap, G - 20, 'tent');
  m.rect(0, G, 100, 1, 'floor');
  m.rect(0, G + 1, 100, 59, 'floor');
  m.rect(0, 25, 1, G - 25, 'canvas');
  m.rect(C.flap + 14, 25, 1, G - 25, 'canvas');
  m.set(3, 37, 'signTitleL').set(4, 37, 'signTitleR');

  // 1: the door in a crate wall, its button beside it.
  m.set(7, 37, 'signFiveL').set(8, 37, 'signFiveR');
  for (let y = 31; y < 38; y++) m.set(C.door, y, 'crate');
  m.set(C.door, 38, 'doorTop').set(C.door, 39, 'doorway');
  m.mon(C.btnDoor, 38, 'btnDoor');
  m.mon(C.door, 39, 'door');

  // 2: the fence, and the tunnel under it (soft dirt at its near end).
  m.set(12, 38, 'signDigL').set(13, 38, 'signDigR');
  for (let y = 33; y < 40; y++) m.set(C.fence, y, 'fence');
  for (let x = C.plug; x <= C.up; x++) m.set(x, G, 'tunnel');
  m.mon(C.plug, G, 'plug');

  // 3: the see-saw: its step, the riding end, the fulcrum, the kid's end; then the crates.
  m.set(16, 37, 'signSawL').set(17, 37, 'signSawR');
  m.set(C.step, 38, 'step');
  m.mon(C.saw, 35, 'saw');
  m.set(C.saw + 1, 39, 'fulcrum');
  m.mon(C.saw + 1, 39, 'plank_0');
  m.mon(C.saw + 2, 38, 'sawKid');
  m.rect(C.crates, 35, C.beltEnd - C.crates + 1, 5, (x, y) => ((x + y) % 3 ? 'crate' : 'crateRed'));

  // 4: the fast belt on the crates, the gap, the landing (a pad in the gap to climb back).
  m.set(C.crates, 33, 'signBeltL').set(C.crates + 1, 33, 'signBeltR');
  for (let x = C.crates + 2; x <= C.beltEnd; x++) m.set(x, 34, x % 2 ? 'belt0' : 'belt1');
  m.set(C.beltEnd + 1, 37, 'step');
  m.rect(C.landing, 35, 4, 5, (x, y) => ((x + y) % 3 ? 'crate' : 'crateRed'));

  // 5: the ball pit and its blinking boards (red, blue, red) with a crate to wait on between
  // them, and a pad up out of its near end.
  m.set(C.landing + 1, 33, 'signBoardsL').set(C.landing + 2, 33, 'signBoardsR');
  for (let x = C.pit0; x <= C.pit1; x++) {
    for (let y = G; y < G + 4; y++) m.set(x, y, y === G + 3 ? 'balls' : 'pit');
    m.set(x, G + 4, 'pitFloor');
    const k = x - C.pit0;
    m.set(x, G, k === 2 || k === 5 ? 'crate' : k < 2 || k > 5 ? 'boardA' : 'boardBGone');
  }
  m.set(C.pit0, G + 2, 'pad');

  // 6: Professor Pratfall's pies; 7: Honker's SIT?; 8: the turnstile.
  m.set(48, 37, 'signPiesL').set(49, 37, 'signPiesR');
  m.set(C.prof, 38, 'profTop').set(C.prof, 39, 'profBot');
  bs.def('profBot').birthMon = beasts.id('pie');
  bs.def('profBot').birthTime = 44;
  m.mon(C.sit - 1, 38, 'askSit');
  m.mon(C.sit, 39, 'rope');
  m.mon(C.turn, 39, 'turnstile');

  // 9: Gwinn's spotlight, out of a wing toward Teddy and back (play dead as it passes).
  m.set(60, 37, 'signLightL').set(61, 37, 'signLightR');
  m.set(C.wing, 30, 'wingTop');
  for (let y = 31; y < G; y++) m.set(C.wing, y, 'wing');
  for (const [k, row] of [
    [0, SPOT.y - 1],
    [1, SPOT.y],
  ] as const) {
    const home = `home${k}`;
    bs.add(home, bs.pic('wing'), { ...bs.def('wing'), birthMon: beasts.id(k ? 'endS' : 'lampS'), birthTime: SPOT.every });
    m.set(C.wing, row, home);
  }
  m.mon(C.wing, SPOT.y - 1, 'lampS').mon(C.wing, SPOT.y, 'endS');
  for (let x = C.wing + SPOT.path[0][0]; x < C.wing; x++) m.set(x, SPOT.y - 2, 'track');

  // 10: the mill's water wheel, rising on its right side up to a stack of crates.
  const n = WHEEL.size;
  m.set(C.wheel - 2, G - n - 2, 'signWheelL').set(C.wheel - 1, G - n - 2, 'signWheelR');
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) m.set(C.wheel - n + 1 + bx, G - n + 1 + by, `hub${bx}${by}`);
  m.mon(C.wheel, G, 'wheelUp');
  m.mon(C.wheel, G - n, 'wheelTop');
  m.mon(C.wheel - n, G - n, 'wheelDown');
  m.mon(C.wheel - n, G, 'wheelBottom');
  m.rect(C.ledge, G - n, 3, n, (x, y) => ((x + y) % 3 ? 'crate' : 'crateRed'));

  // 11: Doc Leo's balloon pump: a balloon dog lifts Teddy up to the high platform; the scent
  // hiding the last button, the flap, and the dark ring beyond, a drop down onto its sawdust.
  m.set(C.pump - 1, 37, 'signPumpL').set(C.pump, 37, 'signPumpR');
  m.set(C.pump, G, 'pump');
  bs.def('pump').birthMon = beasts.id('pumpBalloon');
  bs.def('pump').birthTime = PUMP_EVERY;
  m.rect(C.pump + 1, C.high, C.flap - C.pump - 1, G - C.high, (x, y) => ((x + y) % 3 ? 'crate' : 'crateRed'));
  m.set(C.pump + 1, C.high - 2, 'signSniffL').set(C.pump + 2, C.high - 2, 'signSniffR');
  m.mon(C.scent, C.high - 1, 'scentButton');
  // and the last wind-up mouse, between the button and the flap
  m.mon(C.scent + 1, C.high - 1, 'mouse');
  for (let y = C.high - 4; y < C.high - 1; y++) m.set(C.flap, y, `flap0${y - C.high + 4}`);
  for (let y = 20; y < C.high - 4; y++) m.set(C.flap, y, 'canvas');
  for (let y = C.high; y < G; y++) m.set(C.flap, y, 'canvas');
  m.mon(C.flap, C.high - 1, 'flap');
  m.rect(C.flap + 1, C.high, 2, 1, 'crate');

  // Monsters and treats.
  m.mon(C.mice, 39, 'mouse');
  m.mon(25, 31, 'poodle');
  const treats: [number, number][] = [
    [5, 39],
    [9, 39],
    [13, 39],
    [17, 39],
    [23, 34],
    [34, 34],
    [36, 34],
    [47, 39],
    [51, 39],
    [55, 39],
    [58, 39],
    [64, 39],
    [70, 39],
    [74, 35],
    [79, 34],
    [86, 39],
    [88, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 2, 39);
  m.mark('exit', C.ring, 39);
  return {
    file: 'course',
    hero: 'teddy',
    title: 'The Teddy Course',
    time: 'show',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [14, 34],
    pose: [18, 37, 'front'],
    song: courseSong,
    card: ['The Big Top is dark. A sign:', 'THE TEDDY COURSE. For him?', 'EVERY TRICK YOU KNOW'],
  };
}
