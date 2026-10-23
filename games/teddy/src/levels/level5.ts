// Level 5: The Klown Klub, showtime. Earn three tickets from Doc Leo's friends with
// tricks (a high five for Honker, a sit for Bubbles, a spin for Twirly), get through the
// turnstile, roll a fluff ball into the bowling pins under the bleachers, play dead under
// the Pie-O-Matic's test pies, spin through the stage door, dig under the stage
// and ride the stage lift up. Gwinn is in the spotlight with the red nose in her mouth:
// sit pretty and she sits too, and drops it. Then give it to Doc Leo. Ta-daaa!
//
// The blocks are in level5Tiles.ts, the monsters in level5Beasts.ts; this file lays out the map.
import { rng } from '../../../kit/pixels';
import { LevelMap, type Level } from './level';
import { bandOf } from './level1Tiles';
import { c, cut } from '../blocks/tiles';
import { G, klubTiles } from './level5Tiles';
import { klubBeasts } from './level5Beasts';

export const P_ = (n: string, k: number) => c(n, k);

export function klub(): Level {
  const bs = klubTiles();
  const beasts = klubBeasts();
  bs.def('bubblesBot').birthMon = beasts.id('bubble');
  bs.def('bubblesBot').birthTime = 30;
  bs.def('launcherBot').birthMon = beasts.id('pie');
  bs.def('launcherBot').birthTime = 40;
  const m = new LevelMap(bs, beasts, 'sky0');
  const pick = (() => {
    const R = rng(23);
    return (...names: string[]) => names[Math.floor(R() * names.length)];
  })();
  m.rect(0, 0, 100, G, (x, y) => `${(x * 7 + y * 13) % 5 === 0 ? 'star' : 'sky'}${bandOf(y)}`);
  m.rect(0, G, 100, 1, 'midway');
  m.rect(0, G + 1, 100, 100 - G - 1, 'deep');
  // the map's ends are tent canvas (the map wraps)
  m.rect(0, 20, 3, 20, 'canvas');
  m.rect(86, 20, 14, 20, 'canvas');

  // The midway in front of the big top: string lights, the three klub members.
  const door = 22;
  m.rect(3, 30, door - 3, 10, (x) => (x % 2 ? 'tentOut' : 'tentOut2'));
  m.rect(3, 29, door - 3, 1, 'tentEave');
  m.rect(3, 33, door - 3, 1, (x) => `lights_${x % 2}`);
  m.set(8, 38, 'honkerTop').set(8, 39, 'honkerBot');
  m.mon(9, 38, 'hand');
  // The root beer stand.
  m.set(10, 38, 'beerSignL').set(11, 38, 'beerSignR').set(10, 39, 'beerMug').set(11, 39, 'beerKeg');
  m.set(13, 38, 'bubblesTop').set(13, 39, 'bubblesBot');
  m.mon(14, 37, 'askTix');
  m.set(18, 38, 'twirlyTop').set(18, 39, 'twirlyBot');
  m.mon(19, 39, 'askSpin');

  // The big top's door and its turnstile.
  m.rect(door, 20, 1, 19, 'canvas');
  m.set(door, 38, 'doorTop').set(door, 39, 'turnstile');

  // Inside: bleachers with a tunnel under them (bowling pins, then pies), a trampoline up to
  // the tightrope, the backstage wall.
  const in0 = door + 1;
  const back = 44;
  m.rect(in0, 20, back - in0, 20, 'inside');
  m.rect(in0, 20, back - in0, 3, 'rigging');
  m.rect(in0, G, back - in0 + 20, 1, 'sawdust');
  // trampoline at the start, a perch, the tightrope over to a perch with goodies
  m.set(in0 + 2, 39, 'tramp_0');
  for (let y = 33; y < 39; y++) m.set(in0 + 2, y, 'boing_0');
  m.rect(in0 + 3, 33, 2, 1, 'perch');
  m.rect(in0 + 5, 33, 9, 1, 'rope');
  m.rect(in0 + 14, 33, 2, 1, 'perch');
  // the bleachers: solid, with a one-block-high tunnel under them
  const b0 = in0 + 6;
  m.rect(b0, 34, back - b0, 5, (x, y) => ((x + y) % 2 ? 'bleachers' : 'bleachers2'));
  m.rect(b0, 39, back - b0, 1, 'tunnel');
  m.mon(b0 + 2, 39, 'pins');
  // the backstage wall: the tunnel leads straight through it
  m.rect(back, 20, 1, 19, 'stageWall');
  m.set(back, 39, 'tunnel');

  // Backstage: the Pie-O-Matic test-firing pies into the tunnel; the stage door.
  const sd = 54;
  m.rect(back + 1, 20, sd - back - 1, 20, 'backstage');
  m.set(back + 2, 36, 'mirror')
    .set(back + 4, 36, 'mirror')
    .set(back + 6, 36, 'rack');
  m.set(back + 3, 38, 'launcherTop').set(back + 3, 39, 'launcherBot');
  m.set(back + 7, 39, 'trunk')
    .set(back + 8, 39, 'trunk')
    .set(back + 8, 38, 'trunk');
  m.rect(sd, 20, 1, 19, 'stageWall');
  m.set(sd, 39, 'doorFrame');
  m.mon(sd, 39, 'revolve');

  // Under the stage: dig through the sawdust, crawl to the lift, ride it up.
  const st0 = 58;
  const st1 = 82;
  m.rect(sd + 1, 20, st0 - sd - 1, 20, 'backstage');
  m.rect(sd + 1, G + 1, 12, 1, 'under');
  m.rect(sd + 2, G, 2, 1, 'under');
  m.mon(sd + 2, G, 'plug');
  m.mon(sd + 3, G, 'plug');
  // the stage: four blocks high, curtains and spotlights above it
  m.rect(st0, 36, st1 - st0 + 1, 4, 'stageFront');
  m.rect(st0, 36, st1 - st0 + 1, 1, 'stage');
  m.rect(st0, 20, st1 - st0 + 1, 16, 'stageBack');
  m.rect(st0, 20, 2, 16, 'curtain');
  m.rect(st1 - 1, 20, 2, 16, 'curtain');
  for (const sx of [71, 77]) for (let y = 0; y < 6; y++) for (let x = 0; x < 3; x++) m.set(sx + x, 29 + y, `cone${x}${y}`);
  m.set(st0 + 9, 26, 'starSign')
    .set(st0 + 18, 25, 'starSign')
    .set(st0 + 21, 31, 'starSign');
  // the lift shaft from the tunnel up through the stage floor
  const lift = sd + 12;
  m.rect(lift, 36, 1, 6, 'lift_0');
  m.rect(sd + 1, G, lift - sd - 1, 1, (x) => (x === sd + 2 || x === sd + 3 ? 'under' : 'sawdust'));
  m.set(lift, G, 'lift_0').set(lift, G + 1, 'lift_0');
  m.rect(lift + 1, G + 1, 1, 1, 'under');
  m.rect(st1 + 1, 20, 86 - st1 - 1, 20, 'canvas');
  // Gwinn in the spotlight with the nose; Doc Leo waiting.
  m.mon(72, 35, 'gwinnNose');
  const leoX = 78;
  m.set(leoX, 34, 'leoTop').set(leoX, 35, 'leoBot');

  const treats: [number, number][] = [
    [5, 39],
    [6, 39],
    [16, 39],
    [21, 39],
    [in0 + 3, 32],
    [in0 + 4, 32],
    [in0 + 6, 32],
    [in0 + 8, 32],
    [in0 + 10, 32],
    [in0 + 12, 32],
    [in0 + 14, 32],
    [in0 + 15, 32],
    [in0 + 4, 39],
    [b0 + 5, 39],
    [b0 + 8, 39],
    [b0 + 11, 39],
    [back + 2, 39],
    [back + 5, 39],
    [sd + 6, G + 1],
    [sd + 8, G + 1],
    [sd + 10, G + 1],
    [64, 35],
    [66, 35],
    [68, 35],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [
    [in0 + 15, 32],
    [b0 + 11, 39],
    [68, 35],
  ])
    m.mon(x, y, 'poodle');
  m.treat(in0 + 13, 32, 'bone');
  m.mark('start', 4, 39);
  m.mark('exit', leoX, 35);
  void pick;
  void cut;
  return {
    file: 'klub',
    title: 'The Klown Klub',
    time: 'show',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [5, 35],
    pose: [16, 39, 'back'],
  };
}
