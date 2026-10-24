// Level 14: MEANWHILE... Gwinn Hides Backstage, at the Klown Klub's Big Top on Lookout Hill,
// at night. The surprise party is nearly ready and Teddy is on his way up the hill: Gwinn has
// to get to her hiding spot under the cake table's long tablecloth without being seen too
// early. The new idea is the spotlights: the crew is testing the stage lights, and each one
// comes out of the wings, sweeps along its track and back, and goes dark. Its beam ends at a
// standing dog's head, so FLOP (4) flat and it goes right over her; a light that finds her
// costs a little energy and goes dark for the rest of its sweep. Teach: one slow light over
// the first stretch, a prop table to flop under. Then the prop crates, and a scenery flat
// lashed down across the way (CHEW its rope). Test: two lights out of step over one stretch,
// a slow one and a quick one; past the dressing rooms a pigeon struts in a light's way (BOOF
// it first, or it walks into her while she lies flat); then up onto the stacked road cases,
// where a light sweeps the top and another pigeon struts, with a balloon dog at the far end.
// Twist: a light that climbs: it comes down the crate step from the riser to the floor and
// goes back up, so she flops on whichever level she is on as it passes (or follows it up).
// On the riser a quick light sweeps over the cake crumbs and a pigeon is after them (BOOF it
// between sweeps), and there is the cake, and her spot under its tablecloth.
//
// The blocks are in stageTiles.ts, the monsters in stageBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, stageTiles } from './stageTiles';
import { BEAMS, stageBeasts } from './stageBeasts';
import { stageSong } from '../sound/stageSong';

/** Where things are, for the bot's route. */
export const STAGE = { start: 2, flat: 28, hall: 50, crates: 57, cases: 59, casesEnd: 69, step: 72, riser: 74, pigeon: 79, cake: 84, spot: 85, end: 88 };

export function stage(): Level {
  const bs = stageTiles();
  const beasts = stageBeasts();
  const m = new LevelMap(bs, beasts, 'rig');
  m.rect(0, 31, 100, G - 31, 'tent');
  m.rect(0, 30, 100, 1, 'tentTop');
  for (const x of [6, 24, 38, 55, 69, 82]) m.set(x, 27, 'sandbag');
  m.rect(0, G, 100, 1, 'floor');
  m.rect(0, G + 1, 100, 100 - G - 1, 'under');
  // the tent's ends
  m.rect(0, 28, 1, G - 28, 'tentWall');
  m.rect(STAGE.end + 1, 28, 100 - STAGE.end - 1, G - 28, 'tentWall');

  // The lights: a velvet wing at each home, the track out over the floor.
  for (const [name, beam] of Object.entries(BEAMS)) {
    const { x, y } = beam;
    m.set(x, 31, 'wingTop');
    for (let yy = 32; yy <= y; yy++) m.set(x, yy, 'wing');
    for (const [k, row] of [
      [0, y - 1],
      [1, y],
    ] as const) {
      const home = `home${name}${k}`;
      bs.add(home, bs.pic('wing'), { ...bs.def('wing'), birthMon: beasts.id(`${k ? 'end' : 'lamp'}${name}`), birthTime: beam.every });
      m.set(x, row, home);
    }
    // the first sweep is on the map already; the wings give birth to the rest
    m.mon(x, y - 1, `lamp${name}`).mon(x, y, `end${name}`);
    // its track, along the path's corners (one block above the lamp's row)
    let [cx, cy] = [x, y - 2];
    for (const [dx, dy] of beam.path) {
      const [tx, ty] = [x + dx, y - 2 + dy];
      while (cx !== tx || cy !== ty) {
        if (ty < cy) {
          m.set(cx, cy, 'trackUp');
          cy--;
        } else if (ty > cy) cy++;
        else {
          cx += Math.sign(tx - cx);
          if (m.get(cx, cy) === 'tent') m.set(cx, cy, 'track');
        }
      }
    }
  }

  // Start: Professor Pratfall at the light board, the sign. Teach: one light, a prop table.
  m.set(3, 39, 'signSpotL').set(4, 39, 'signSpotR');
  m.set(5, 38, 'pratfallTop').set(5, 39, 'pratfallBot');
  m.set(6, 39, 'board');
  m.set(15, 39, 'propTable');
  m.set(20, 38, 'juggles0Top').set(20, 39, 'juggles0Bot');

  // The prop crates, and the scenery flat lashed down across the way (chew the rope).
  m.set(21, 39, 'crate').set(22, 39, 'crate').set(22, 38, 'crate').set(23, 39, 'crate');
  m.set(25, 39, 'signRopeL').set(26, 39, 'signRopeR');
  m.set(STAGE.flat, 30, 'flatTop');
  for (let y = 31; y < 39; y++) m.set(STAGE.flat, y, 'flat');
  m.set(STAGE.flat, 39, 'flatGap');
  m.mon(STAGE.flat, 39, 'knot');

  // Test: two lights out of step, two prop tables.
  m.set(33, 39, 'propTable');
  m.set(42, 39, 'propTable');
  m.set(46, 38, 'honkerTop').set(46, 39, 'honkerBot');
  m.set(47, 39, 'horns');
  // The way past the dressing rooms: a pigeon strutting in a light's way (BOOF it first, or it
  // walks into her while she lies flat).
  m.mon(STAGE.hall, 39, 'pigeonLow');
  m.set(STAGE.hall + 2, 39, 'propTable');

  // Then up the prop crates onto the stacked road cases, where a light sweeps the top and a
  // pigeon struts (BOOF it), and a balloon dog at the far end (bones are scarce now).
  const c = STAGE.crates;
  m.set(c, 39, 'crate')
    .set(c + 1, 39, 'crate')
    .set(c + 1, 38, 'crate');
  m.rect(STAGE.cases, 36, STAGE.casesEnd - STAGE.cases + 1, 4, (x, y) => ['roadCase', 'caseAmp', 'roadCase', 'caseLamp'][(x * 3 + y) % 4]);
  m.mon(STAGE.cases + 3, 35, 'pigeonHigh');

  // Twist: the crate step and the riser, the light that climbs them; on the riser a quick
  // light over the cake crumbs, the pigeon after them, and the cake.
  m.set(STAGE.step, 39, 'roadCase').set(STAGE.step + 1, 39, 'roadCase');
  m.rect(STAGE.riser, 38, STAGE.end - STAGE.riser + 1, 1, 'riserTop');
  m.rect(STAGE.riser, 39, STAGE.end - STAGE.riser + 1, 1, 'riser');
  for (let x = STAGE.riser; x <= STAGE.end; x++) if (m.get(x, 32) === 'tent') m.set(x, 32, 'bunting');
  m.mon(STAGE.pigeon, 37, 'pigeon');
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 4; by++) m.set(STAGE.cake + bx, 34 + by, `cake${bx}${by}`);
  m.set(STAGE.end - 1, 37, 'signShh');

  const treats: [number, number][] = [
    [8, 39],
    [11, 39],
    [17, 39],
    [21, 38],
    [22, 37],
    [23, 38],
    [27, 39],
    [30, 39],
    [32, 39],
    [38, 39],
    [41, 39],
    [c, 38],
    [STAGE.cases + 1, 35],
    [STAGE.cases + 6, 35],
    [STAGE.cases + 7, 35],
    [STAGE.hall - 1, 39],
    [STAGE.hall + 3, 39],
    [STAGE.casesEnd + 2, 39],
    [STAGE.step, 38],
    [STAGE.riser, 37],
    [STAGE.pigeon + 2, 37],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mon(STAGE.casesEnd, 35, 'poodle');
  m.mark('start', STAGE.start, 39);
  m.mark('exit', STAGE.spot, 37);
  return {
    file: 'stage',
    hero: 'gwinn',
    title: 'Gwinn Hides Backstage',
    time: 'show',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [4, 35],
    pose: [8, 39, 'gwinnRun1'],
    song: stageSong,
    card: ['MEANWHILE, Gwinn sneaks', 'backstage to hide.', 'NEW: SPOTLIGHTS: 4 FLOP'],
  };
}
