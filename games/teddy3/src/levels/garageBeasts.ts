// Level 1's monsters: a mouse in the laundry room and a dust bunny in the garage (a bark sends
// each off), Teddy's wobble ball sniffed out from under the dryer, and the gadgets: the
// button by the laundry room door, the one over the workbench that opens the key cabinet, and
// the garage door's button, whose door goes up and comes back down on its own.
import { CRITTERS } from '../sprites/critters';
import { TOYS } from '../sprites/toys';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { pacer, popUp, scent } from './common';
import { cabinetDoor, cabinetOpen, doorOpen, doorShut, garagePanel, garagePanelHalf } from '../sprites/gadgets';
import { wiredButton, wiredDoor } from './parts';
import { sprite } from '../art/draw';
import { P } from '../art/pal';

/** Dust bunnies: gray fluff with two dot eyes, rolling. */
const K = { d: P.c('stone', 2), D: P.c('stone', 3), l: P.c('stone', 4), o: P.c('ink', 0) };
const bunny = (k: number) =>
  sprite(
    k
      ? ['....d.ddd....', '..ddDdDDdd...', '.dDDlDDDDDd..', 'dDDoDDDoDDDd.', 'dDDDDDDDDDDd.', '.dDDDlDDDDd..', '..ddDDDdd....']
      : ['...ddd.d.....', '..ddDDdDdd...', '.dDDDDlDDDd..', 'dDDoDDDoDDDd.', 'dDlDDDDDDDDd.', '.dDDDDDDlDd..', '...ddDdd.....'],
    K,
    undefined,
    13,
  );

export function garageBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('rat')) b.pic(name, px, { hp: -4 }).pic(`${name}Run`, px);
  b.pic('bunny1', bunny(0), { hp: -3 }).pic('bunny2', bunny(1), { hp: -3 });
  for (const [name, px] of Object.entries(TOYS))
    if (name.startsWith('wobble') || name.startsWith('ballAir')) b.pic(name, px, name.startsWith('wobble') ? { effect: CTR.lives, eamt: 1, score: 500 } : {});
  b.pic('doorShut', doorShut(), { solid: 15 }).pic('doorOpen', doorOpen());
  b.pic('cabShut', cabinetDoor(), { solid: 15 }).pic('cabOpen', cabinetOpen());
  b.pic('panel', garagePanel(), { solid: 15 }).pic('panelHalf', garagePanelHalf());

  pacer(
    b,
    'mouse',
    [
      ['rat1', 2],
      ['rat2', 2],
    ],
    POWER.pest,
    3,
    'mouseRun',
    2,
  );
  // scared off, it scampers away from Teddy, under the door into the garage
  b.add('mouseRun', {
    pics: [
      ['rat1Run', 1],
      ['rat2Run', 1],
    ],
    power: 0,
    path: [[6, 0, 9]],
    end: -1,
  });
  pacer(
    b,
    'bunny',
    [
      ['bunny1', 4],
      ['bunny2', 4],
    ],
    POWER.pest,
    3,
    'puff',
    1,
  );

  // The laundry room door: its button is beside it, at Teddy's head height.
  wiredButton(b, 'btnDoor', [[1, 1]]);
  wiredDoor(b, 'door', 'doorShut', 'doorOpen');
  // The key cabinet on the workbench: its button is on the wall above the bench.
  wiredButton(b, 'btnCab', [[1, 1]], false);
  wiredDoor(b, 'cab', 'cabShut', 'cabOpen');
  // The garage door: up when its spark arrives, down again 3 seconds later (push it again).
  wiredButton(b, 'btnGarage', [[7, 1]]);
  b.pic('gap', sprite(['....................'], {}, 0, 0));
  wiredDoor(b, 'garage', 'panel', 'gap', { holdOpen: 60, closing: 'panelHalf' });

  // The wobble ball (a nap), sniffed out from under the dryer.
  b.add('wobble', {
    pics: [
      ['wobble1', 4],
      ['wobble2', 3],
      ['wobble3', 4],
      ['wobble4', 3],
    ],
    power: POWER.pickup,
  });
  popUp(b, 'wobblePop', 'ballAir1', 'wobble');
  scent(b, 'scentBall', 'wobblePop');
  scent(b, 'scentTreat', 'treatFall');
  return b;
}
