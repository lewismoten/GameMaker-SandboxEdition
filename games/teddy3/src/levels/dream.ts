// Level 12: Teddy's Dream Run, a bonus between the Funhouse and Lookout Hill. Teddy naps in
// THE CHEZ on the way up the hill, and his paws twitch: he is dreaming of a run past the
// hills, the town and a picket fence. The screen never scrolls. Teddy hops on the spot like a
// rabbit while the bands behind him slide by at three speeds (dreamTiles.ts), and things come
// along the path from the right, born in two cells off the right edge, one block of a chain for
// each, on a timetable. Teach: wobble balls and puddles to hop. Then low branches to play dead
// under. Then the two by turns. Treats float in a block up, most just behind a ball, so one hop
// takes the ball and the treat. The paw prints in the sky fill in as he goes; when the last
// one fills, the path carries him off to the right, a finish flag pops up and he drops into
// the end of the dream. (The ending is a "door on a clock": nothing he does makes it come
// sooner, and nothing can make him miss it.)
//
// The blocks are in dreamTiles.ts, the monsters in dreamBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { EDGE, END, FENCE, G, LANE, PRINTS, SPAWN, VIEW, dreamTiles, spawnChain } from './dreamTiles';
import { dreamBeasts } from './dreamBeasts';
import { dreamSong } from '../sound/dreamSong';

type Thing = 'ball' | 'puddle' | 'branch';

/** What comes along the path, by the tick it is born off the right edge. */
export const PATH: [number, Thing][] = [
  [70, 'ball'],
  [130, 'ball'],
  [185, 'puddle'],
  [235, 'ball'],
  [280, 'ball'],
  [320, 'puddle'],
  [400, 'branch'],
  [460, 'branch'],
  [515, 'branch'],
  [565, 'branch'],
  [640, 'ball'],
  [690, 'branch'],
  [735, 'puddle'],
  [775, 'branch'],
  [815, 'ball'],
  [855, 'branch'],
  [895, 'ball'],
  [935, 'puddle'],
];
/** The treats floating in a block up, by the tick each is born; the last few are a shower at the end. */
export const TREATS = [138, 243, 360, 655, 823, 903, 990, 1005, 1020, 1035];

// Fair play: two things in the way never come closer than 35 ticks apart (time to land, or to
// get up, before the next), and every treat floats at least a block clear of them, behind or
// ahead (a ball or a branch it touched would take it). The path is clear well before the end.
PATH.forEach(([t], k) => {
  if (k && t - PATH[k - 1][0] < 35) throw new Error(`dream: ${t} comes too soon after ${PATH[k - 1][0]}`);
});
const clear = 20 / FENCE.shift;
for (const t of TREATS)
  for (const [h] of PATH) if (t - h < clear && h - t < 2 * clear) throw new Error(`dream: the treat at ${t} would meet what comes at ${h}`);
if (END - PATH[PATH.length - 1][0] < 120) throw new Error('dream: the last thing comes too close to the end');

export function dream(): Level {
  const bs = dreamTiles();
  const beasts = dreamBeasts();
  spawnChain(
    bs,
    'path',
    bs.pic('lane'),
    PATH.map(([t, what]) => [t, beasts.id(what)]),
    PATH[PATH.length - 1][0] + 40,
  );
  spawnChain(
    bs,
    'high',
    bs.pic('fence0'),
    [
      ...TREATS.map((t): [number, number] => [t, beasts.id('treatRun')]),
      ...PATH.filter(([, what]) => what === 'branch').map(([t]): [number, number] => [t, beasts.id('leaves')]),
    ].sort((a, b) => a[0] - b[0]),
    TREATS[TREATS.length - 1] + 15,
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  const Y = VIEW.y;
  m.rect(0, Y + 1, 100, 1, 'sky1');
  m.set(15, Y + 1, 'cloud0')
    .set(16, Y + 1, 'cloud1')
    .set(17, Y + 1, 'cloud2');
  m.set(22, Y + 1, 'sunL').set(23, Y + 1, 'sunR');
  m.rect(0, Y + 2, 100, 1, 'hills0');
  m.rect(0, Y + 3, 100, 1, 'town0');
  m.rect(0, Y + 4, 100, 1, 'fence0');
  m.rect(0, LANE, 100, 1, 'lane');
  m.rect(0, G, 100, 1, 'curb');
  m.rect(0, G + 1, 100, 100 - G - 1, (_x, y) => `lawn${(y - G + 1) % 2}`);
  // the paw prints, between the moon and the finish flag
  m.set(VIEW.x + 1, Y, 'moonCap');
  for (let k = 0; k < PRINTS; k++) m.set(VIEW.x + 2 + k, Y, `paw_${k}`);
  m.set(VIEW.x + 2 + PRINTS, Y, 'flagCap');
  // the finish at the right edge, and the cells off it that give birth to what comes
  // (the hole is two cells wide, the second off the edge, so a dog carried to the edge drops
  // in however far over it he is)
  m.set(EDGE, LANE, 'laneEnd')
    .set(EDGE, G, 'edge')
    .set(EDGE + 1, G, 'edge');
  m.set(SPAWN, LANE, 'pathWait').set(SPAWN, LANE - 1, 'highWait');
  m.mark('start', VIEW.x + 8, LANE);
  m.mark('exit', EDGE, G);
  return {
    file: 'dream',
    hero: 'runner',
    still: true,
    title: "Teddy's Dream Run",
    time: 'sunset',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [VIEW.x + 1, Y + 1],
    pose: [VIEW.x + 8, LANE, 'hop'],
    song: dreamSong,
    card: ['BONUS! Teddy naps in THE CHEZ.', 'His paws twitch: a dream run!', 'NEW: THE WORLD RUNS BY HIM'],
  };
}
