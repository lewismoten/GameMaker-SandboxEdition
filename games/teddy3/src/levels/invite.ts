// Level 4: MEANWHILE... Gwinn's Invitations, on Main Street at noon. Gwinn is secretly helping
// plan Teddy's surprise party, and she is handing out the invitations herself, door to door.
// The new idea is the doorbell: BOOF it, and the friend comes to the door ("YES!") holding
// out an RSVP card; walk into the doorway and it is hers. Teach: the Town Crier's door over
// the bakery, nothing in the way. Test: Honker's door over the joke shop, with two pigeons
// strutting in front of it (each one uses up a BOOF). Twist: Professor Pratfall lives up a
// fire escape in the alley behind a tall fence: big-dig the soft dirt at its foot, crawl
// under, climb the fire escape and BOOF the pigeon and the bell on the top landing. Then the
// Clown Club's party van, where Juggles is waiting: its back door has three latches, and
// each takes one RSVP. With fewer, a latch stays shut (the sign says so), and every door and
// the tunnel back are still there to go round again. Her goal is the seat past the latches.
//
// The blocks are in inviteTiles.ts, the monsters in inviteBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, inviteTiles } from './inviteTiles';
import { inviteBeasts } from './inviteBeasts';
import { bandAt } from './common';
import { inviteSong } from '../sound/inviteSong';
import { addSaveSign } from '../sprites/hidden';

/** Where things are, for the bot's route. */
export const INVITE = { crier: 9, honker: 19, fence: 35, dig: 34, up: 36, low: 41, mid: 40, high: 42, landing: 39, pratfall: 45, latch: 55, seat: 58 };

/** Rows of the fire escape's ledges (she stands on the row above each). */
const ESC = { low: 37, mid: 34, high: 31, top: 28 };

export function invite(): Level {
  const bs = inviteTiles();
  const beasts = inviteBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandAt(y, G)}`);
  for (const [cx, cy] of [
    [3, 24],
    [18, 26],
    [30, 23],
    [52, 22],
    [62, 27],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  const F = INVITE.fence;
  m.rect(0, G, 100, 1, (x) => (x % 2 ? 'walk' : 'walk2'));
  m.rect(0, G + 1, F - 2, 1, 'road');
  m.rect(0, G + 2, F - 2, 1, (x) => (x % 3 ? 'road' : 'roadLine'));
  m.rect(F - 2, G + 1, 100 - F + 2, 2, 'dirt');
  m.rect(0, G + 3, 100, 100 - G - 3, 'deep');
  // a hedge closes Main Street off at both ends (the map wraps around)
  m.rect(0, 30, 1, 10, 'hedgeWall').set(0, 29, 'hedgeTop');
  m.rect(67, 30, 33, 10, 'hedgeWall');
  m.rect(67, 29, 33, 1, 'hedgeTop');

  // A shopfront x0..x0+w-1: a door near its right end with a friend behind it (or none).
  const shop = (x0: number, w: number, sign: string, win: string, awn: string, who?: string) => {
    m.rect(x0, 31, w, 1, 'cornice');
    m.rect(x0, 32, w, 8, 'brick');
    for (let x = x0 + 1; x < x0 + w; x += 2) m.set(x, 33, x === x0 + 3 ? 'brickWinLit' : 'brickWin');
    m.set(x0 + 2, 35, `${sign}L`).set(x0 + 3, 35, `${sign}R`);
    m.rect(x0 + 1, 37, 4, 1, awn);
    for (let x = x0 + 1; x < x0 + 4; x++) m.set(x, 38, win);
    if (!who) return;
    const door = x0 + 5;
    m.set(door, 38, `${who}Top`).set(door, 39, `${who}Card`);
    m.mon(door, 38, 'doorTop').mon(door, 39, 'bellDoor');
  };

  // Teach: the sign, the lamp, and the Town Crier's door over the bakery.
  m.set(2, 39, 'signBoofL').set(3, 39, 'signBoofR');
  shop(4, 7, 'sBakery', 'winCakes', 'awnRed', 'crier');
  m.set(12, 38, 'lampTop').set(12, 39, 'lampPost');
  // Test: Honker's door over the joke shop, two pigeons strutting in front of it.
  shop(14, 7, 'sJokes', 'winJokes', 'awnBlue', 'honker');
  m.mon(14, 39, 'pigeonShort');
  m.mon(16, 39, 'pigeon');
  // the bookshop (no one home; its awning is a treat run), and two more pigeons on the lawn
  shop(23, 6, 'sBooks', 'winBooks', 'awnGreen');
  m.set(21, 38, 'lampTop').set(21, 39, 'lampPost');
  for (let x = 29; x < F; x++) m.set(x, 39, x % 3 ? 'lawn' : 'lawnFlower');
  m.mon(29, 39, 'pigeon');
  m.mon(32, 39, 'pigeonShort');

  // Twist: the alley's tall fence, soft dirt at its foot, the tunnel under it.
  m.set(F, 29, 'fenceTop');
  for (let y = 30; y < 40; y++) m.set(F, y, 'fence');
  m.set(INVITE.dig, G, 'hole');
  m.mon(INVITE.dig, G, 'plug');
  m.rect(INVITE.dig, G + 1, 3, 1, 'tunnel');
  m.set(INVITE.up, G, 'hole');
  m.set(F - 2, 39, 'signDig');
  m.set(F + 2, 39, 'can');
  m.set(F + 3, 39, 'signUp');

  // The walk-up and its fire escape, up to Professor Pratfall's door on the top landing.
  const w0 = INVITE.landing;
  const w1 = w0 + 7;
  m.rect(w0, 22, w1 - w0 + 1, 1, 'corniceHi');
  m.rect(w0, 23, w1 - w0 + 1, 17, 'brick');
  for (const x of [w0 + 1, w0 + 3, w0 + 5, w0 + 7]) m.set(x, 24, x === w0 + 3 ? 'brickWinLit' : 'brickWin');
  for (const y of [30, 33, 37]) m.set(w0 + 5, y, 'brickWin').set(w0 + 7, y, 'brickWin');
  m.set(w0 + 6, 30, 'flowerBox');
  m.rect(INVITE.low, ESC.low, 3, 1, 'escape');
  m.rect(INVITE.mid - 1, ESC.mid, 3, 1, 'escape');
  m.rect(INVITE.high - 1, ESC.high, 3, 1, 'escape');
  const d = INVITE.pratfall;
  m.rect(INVITE.landing, ESC.top, d - INVITE.landing + 1, 1, 'escape');
  m.set(d, ESC.top - 2, 'pratfallTop').set(d, ESC.top - 1, 'pratfallCard');
  m.mon(d, ESC.top - 2, 'doorTop').mon(d, ESC.top - 1, 'bellDoor');
  m.mon(d - 2, ESC.top - 1, 'pigeonShort');

  // The lot past the alley: a goose, the sign, Juggles, and the Clown Club's party van.
  const v = INVITE.latch;
  m.mon(v - 7, 39, 'goose');
  m.set(v - 5, 39, 'signVanL').set(v - 4, 39, 'signVanR');
  m.set(v - 2, 38, 'juggles0Top').set(v - 2, 39, 'juggles0Bot');
  for (let bx = 0; bx < 6; bx++) m.set(v + bx, 38, `vanTop${bx}`);
  for (let k = 0; k < 3; k++) m.set(v + k, 39, `latch${k}`);
  m.set(v + 3, 39, 'vanSeat')
    .set(v + 4, 39, 'vanBack4')
    .set(v + 5, 39, 'vanBack5');
  for (let x = v + 6; x < 67; x++) m.set(x, 39, x % 3 ? 'lawn' : 'lawnFlower');

  // Monsters and treats: a balloon dog on the bookshop's awning, the one bone on the fire escape.
  m.mon(25, 36, 'poodle');
  const treats: [number, number][] = [
    [5, 39],
    [7, 39],
    [11, 39],
    [13, 39],
    [15, 36],
    [16, 36],
    [17, 36],
    [22, 39],
    [24, 36],
    [26, 36],
    [28, 39],
    [31, 39],
    [F + 1, 39],
    [INVITE.low + 1, 36],
    [INVITE.low + 2, 36],
    [INVITE.high, 30],
    [w0 + 2, 27],
    [w0 + 3, 27],
    [v - 8, 39],
    [v - 6, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.treat(INVITE.mid - 1, ESC.mid - 1, 'bone');
  // the save sign, hung on the bakery wall above the Town Crier's door
  addSaveSign(bs, m, 9, 36, false);
  m.mark('start', 1, 39);
  m.mark('exit', INVITE.seat, 39);
  return {
    file: 'invite',
    hero: 'gwinn',
    title: "Gwinn's Invitations",
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [10, 35],
    pose: [12, 39, 'gwinnRun1'],
    song: inviteSong,
    card: ['MEANWHILE, Gwinn invites', 'friends to a secret party.', 'NEW: BOOF DOORBELLS, RSVPS'],
  };
}
