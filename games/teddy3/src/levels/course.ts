// Level 16: The Teddy Course, the finale, inside the Big Top at night. Doc Leo's last errand
// takes Teddy into the dark tent, where the Klown Klub has built him an obstacle course out of
// every trick from all three adventures, station by station: WOOF at wind-up mice; high-five a
// button to open a door (the garage); DIG under a fence; ride a see-saw (the park); a fast belt
// (the bakery: E at its end); red and blue blinking boards over a ball pit (the funhouse); PLAY
// DEAD under Professor Pratfall's practice pies; SIT PRETTY for Honker; SPIN the turnstile; and
// at last a lift to the high platform, where Teddy SNIFFs out the hidden button whose flap into the ring stays open only a few seconds.
// In the dark middle of the ring: SURPRISE! (the ending).
//
// The blocks are in courseTiles.ts, the monsters in courseBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, courseTiles } from './courseTiles';
import { courseBeasts } from './courseBeasts';
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
  lift: 61,
  high: 35,
  scent: 64,
  flap: 68,
  ring: 75,
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
  m.rect(82, 25, 1, G - 25, 'canvas');
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

  // 9: the lift to the high platform, the scent hiding the last button, the flap, and the
  // dark ring beyond, a drop down onto its sawdust.
  m.mon(C.lift, 39, 'liftIdle');
  m.rect(C.lift + 1, C.high, C.flap - C.lift - 1, G - C.high, (x, y) => ((x + y) % 3 ? 'crate' : 'crateRed'));
  m.set(C.lift + 1, C.high - 2, 'signSniffL').set(C.lift + 2, C.high - 2, 'signSniffR');
  m.mon(C.scent, C.high - 1, 'scentButton');
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
    [63, 34],
    [70, 39],
    [72, 39],
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
