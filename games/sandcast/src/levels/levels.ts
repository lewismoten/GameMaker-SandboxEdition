// The seven playfields of Sandcastle Knight.
import { LEGEND, LevelMap, type Legend } from './levelmap';
import { MON } from '../rules';

const L = (extra: Legend): Legend => ({ ...LEGEND, ...extra });

// ================================================================= the sandbox (hub)
// A wooden sandbox split into four corners by a buried hose and a row of toys. Each castle
// sends you back to the next corner, so the sandbox itself is the map of your progress.
export function hub(): LevelMap {
  const m = new LevelMap('grass', 1);
  m.rect(1, 1, 48, 35, 'sand');
  m.ring(0, 0, 50, 37, 'boardH');
  m.rect(0, 0, 1, 37, 'boardV').rect(49, 0, 1, 37, 'boardV');
  for (const [x, y] of [
    [0, 0],
    [49, 0],
    [0, 36],
    [49, 36],
  ])
    m.set(x, y, 'post');
  m.rect(25, 1, 1, 35, 'hoseV');
  m.stamp(1, 18, ['xBaQcxx[]xdaBxxQcaxx[]xB'], LEGEND);
  m.stamp(26, 18, ['[]xxaBQxxcdxx[]xBaxQcxx'], LEGEND);

  // Northwest: the old burrow (Beetle Burrows), reached last.
  m.stamp(
    1,
    1,
    [
      '..x.....D..........*....',
      '.WWWWW..D...A...........',
      '.W...W..D.......o.......',
      '.W.E.W..DD..............',
      '.W...W...D....j.........',
      '.WW.WW...D..............',
      '...........DDD..........',
      '..o....xx...DLD.w.....Q.',
      '...........DDD*.........',
      '.....A........r.........',
      '..*.....................',
      '........QQ.....$........',
      '........QQ.......R......',
      '...o....................',
      '...w.......r.........4..',
      '.............*..........',
      'x......................x',
    ],
    L({
      E: { tile: 'ladder', mark: 'door4' },
      '4': { tile: 'sand', mark: 'arrive4' },
      j: { tile: 'sand', mon: MON.beetleLoop },
      r: { tile: 'sand', mon: MON.crabH },
      R: { tile: 'sand', mon: MON.crabV },
    }),
  );
  // Northeast: the kiddie pool and the way to Low Tide Lagoon.
  m.stamp(
    26,
    1,
    [
      '.......................',
      '..pp~~~~~~~~...........',
      '.~~~~~~~~~~~~~.....*...',
      '.~~~~~~~~~~~~~.........',
      '.~~~~~~~~~~~~~..MTTM...',
      '..~~~~~~~~~~~...#!##...',
      '...~~~~~~~~...r........',
      '...........r...........',
      '..o....................',
      '.......d.......$.......',
      '...r...y.......o...x...',
      '......*................',
      '..x.........A....q.....',
      '...........w...........',
      '........o.........@....',
      '..h....................',
      '...x...................',
    ],
    L({
      '!': { tile: 'door', mark: 'door3' },
      '@': { tile: 'sand', mark: 'arrive3' },
      r: { tile: 'sand', mon: MON.crabH },
      q: { tile: 'sand', mon: MON.gwinRoam },
    }),
  );
  // Southeast: the garden hose, its lazy loop, and the Hosewater Moat. A little hole
  // in the corner is not an ant's.
  m.stamp(
    26,
    19,
    [
      '...x..............x....',
      '..o.......*.......MTTM.',
      'N.................#!##.',
      '.......................',
      '...j........o..........',
      '.>>>>>>>>>v.....*......',
      '.^........v......J.....',
      '.^..$.....v............',
      '.^<<<<<<<<<....o.......',
      '...........A...........',
      '..@............x.......',
      '.........*.............',
      '....d.........w........',
      '..o..............O.....',
      '.........h.....&.......',
      '...x...........$.......',
      '......................x',
    ],
    L({
      '!': { tile: 'door', mark: 'door2' },
      '@': { tile: 'sand', mark: 'arrive2' },
      O: { tile: 'hole', mark: 'holeBBS' },
      '&': { tile: 'sand', mark: 'arriveBBS' },
      j: { tile: 'sand', mon: MON.beetleH },
      J: { tile: 'sand', mon: MON.beetleV },
    }),
  );
  // Hose banks on the outside corners of the lazy loop, so it carries you round and round.
  m.set(37, 24, 'hoseV').set(36, 28, 'hoseH').set(26, 27, 'hoseV').set(27, 23, 'hoseH');
  // Southwest: Teddy's toy chest, his shovel, a tennis ball, and Anthill Keep behind the dunes.
  m.stamp(
    1,
    19,
    [
      '........................',
      '.*......D......o......*.',
      '...DDDDDDDDD............',
      '...D.......D......A.....',
      '...D..MTTM.D............',
      '...D..#!##.D....*.......',
      '...D.......D............',
      '...DDDDDDDDD.....j......',
      '........................',
      '..o.......x.........o...',
      '.....*....q.....A.......',
      '........................',
      '...a.B.c.........*......',
      '............o..........h',
      '..S..y..................',
      '.@......*.....[]........',
      'C.......................',
    ],
    L({
      '!': { tile: 'door', mark: 'door1' },
      '@': { tile: 'sand', mark: 'start' },
      S: 'shovel',
      j: { tile: 'sand', mon: MON.antRow },
      q: { tile: 'sand', mon: MON.gwinRoam },
    }),
  );
  return m;
}

// ================================================================= 1. Anthill Keep
// Build the four towers (a bucket of sand each) to raise the gate. Plug anthills with sand.
export function keep(): LevelMap {
  const m = new LevelMap('grass', 2);
  m.stamp(
    0,
    0,
    [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GDD.....*..................*.....DDG',
      'GD....F..MMMMMMMMMMMMMMMMMM..F....DG',
      'G........#______MMMM______#........G',
      'GD.......#______#!##______#.......DG',
      'G........#_______9________#........G',
      'G..o.....#__*__________*__#.....o..G',
      'G........#________h_____O_#........G',
      'G........#____V___________#........G',
      'GD....F..########P#########..F....DG',
      'G....y.............................G',
      'G...D......o..........o.......D....G',
      'G.......A..................A.......G',
      'G..*...............................G',
      'GDD.......D.D.........D.D.......*DDG',
      'G...o.........................o....G',
      'G..............j...................G',
      'GD......DDD.......A.......DDD.....DG',
      'G.......DoD...............DoD......G',
      'G........D.................D.......G',
      'G..h..........*...y...*........$...G',
      'GD...............................DDG',
      'GDD..............@..............DDDG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    L({
      '!': { tile: 'door', mark: 'exit' },
      '@': { tile: 'sand', mark: 'arrive' },
      O: { tile: 'hole', mark: 'secret' },
      V: { tile: 'court', mark: 'back' },
      j: { tile: 'sand', mon: MON.antRow },
      '9': { tile: 'court', mon: MON.gwinNap },
    }),
  );
  return m;
}

// ================================================================= 2. Hosewater Moat
// The castle stands on an island. Fill the ford with sand, or run the crumbling bridge;
// the hose current carries you out again. A lazy river runs around the edge.
export function moat(): LevelMap {
  const m = new LevelMap('grass', 3);
  m.stamp(
    0,
    0,
    [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'G..*......*.......$........*.......*..LG',
      'G>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>vG',
      'G.....D.....o..........o.......D......vG',
      'G..o.....~~~~~~~~~~~~~~~~~~~~~~...D...vG',
      'G........~~~~~~~~~~~~~~~~~~~~~~.......vG',
      'G...D....~~..................~~..o....vG',
      'G........~~F.MMMMMMMMMMMMMM.F~~.......vG',
      'G....A...~~..#____MMMM____#..~~.......vG',
      'G........~~..#____#!##____#..~~...o...vG',
      'G..*.....~~..#____________#..~~.......vG',
      'G........~~..#__*______*__#..~~..*....vG',
      'G...o....bb..#_____h______#..>>>>.....vG',
      'G........~~..#____________#..~~.......vG',
      'G....o...~~..#____________#..~~....A..vG',
      'G........~~.o######P#######o.~~.......vG',
      'G..D.....~~..................~~..D....vG',
      'G........~~F................F~~.......vG',
      'G...*....~~..................~~...*...vG',
      'G........~~..................~~.......vG',
      'G..o.....~~~~~~~~~~z~~~~~~~~~~~.......vG',
      'G........~~~~~~~~~~z~~~~~~~~~~~.o.....vG',
      'G....D.......o.........o.........D....vG',
      'G..j......y..........q........J.......vG',
      'G.....................................vG',
      'GN....................................vG',
      'G.....o.............*..........o......vG',
      'G..D...............@..............D....G',
      'G..h...................................G',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    L({
      '!': { tile: 'door', mark: 'exit' },
      '@': { tile: 'sand', mark: 'arrive' },
      F: 'found2',
      P: 'gate2',
      j: { tile: 'sand', mon: MON.beetleH },
      J: { tile: 'sand', mon: MON.beetleLoop },
      q: { tile: 'sand', mon: MON.gwinRoam },
    }),
  );
  return m;
}

// ================================================================= 3. Low Tide Lagoon
// Waves roll up the beach; the tidal flat floods and drains. Golden shells wait on the
// sandbars, crabs patrol the gullies, and the bucket packs walls of wet sand.
export function lagoon(): LevelMap {
  const m = new LevelMap('grass', 4);
  const barrierA = 'QQdQQaQQBQQcQQQ9QQcQQQaQQQQdQQBQQQQaQQ';
  const barrierB = 'QaQQcQQdQQQBQQQ.QQQdQQcQQaQQQQBQQdQQQQ';
  m.stamp(
    0,
    0,
    [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'G...*..............U...w..........*....G',
      'G.MMMMMMMMMMMM.....@...........Q.......G',
      'G.#__________#....y........X.......w...G',
      'G.#__MMMM____#..d......................G',
      'G.#__#!##____#.........Q......*........G',
      'G.#__________#....r....................G',
      'G.#_*______*_#..........w.......d......G',
      'G.######S#####.....Q.........R.........G',
      'G..*...h..........................*....G',
      'G......w.........Q.......*.....y.......G',
      'G......................................G',
      `G${barrierA}G`,
      'G.........r....ere.....................G',
      `G${barrierB}G`,
      'G...*.........w...............*........G',
      'G......................................G',
      ...[0, 1, 2, 3].map((k) => `G${String(k).repeat(38)}G`),
      `G${'t'.repeat(38)}G`,
      `Gttttsss${'t'.repeat(21)}sss${'t'.repeat(7)}G`,
      `Gttttsgs${'t'.repeat(21)}sgs${'t'.repeat(7)}G`,
      `G${'t'.repeat(14)}sss${'t'.repeat(16)}sss${'t'.repeat(2)}G`,
      `G${'t'.repeat(14)}sgs${'t'.repeat(16)}sgs${'t'.repeat(2)}G`,
      'GttttttttttttttttttttttttttttttttttttttG',
      'G~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~G',
      'G~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~G',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    L({
      '!': { tile: 'door', mark: 'exit' },
      '@': { tile: 'sand', mark: 'arrive' },
      U: 'bucket',
      S: 'shellGate',
      r: { tile: 'sand', mon: MON.crabH },
      R: { tile: 'sand', mon: MON.crabV },
      X: { tile: 'sand', mon: MON.crabBox },
      '0': 'surf0',
      '1': 'surf1',
      '2': 'surf2',
      '3': 'surf3',
      t: 'flat',
      s: 'sand',
      '9': { tile: 'sand', mon: MON.gwinNap },
    }),
  );
  // The sea runs on past the bottom of the map.
  m.rect(0, 29, 40, 8, 'water');
  return m;
}

// ================================================================= 4. Beetle Burrows
// Galleries under the sandbox, lit by glowworms. Root doors open for acorns; a cracked
// wall is sometimes no wall at all. Up in a corner, a sealed vault joins Anthill Keep.
export function burrows(): LevelMap {
  const m = new LevelMap('earth', 5);
  const W = (n: number) => 'W'.repeat(n);
  m.stamp(
    0,
    0,
    [
      W(44),
      W(9) + 'L' + W(34),
      W(9) + 'k' + W(4) + 'n' + W(19) + '*..$..*.' + 'WW',
      'W.@' + '.'.repeat(28) + 'WWW' + '.Y......' + 'WW',
      'W....m....j......%.........m...' + 'WWW' + '..*..$..' + 'WW',
      'Wo.........................o...' + 'WWW' + '......Z.' + 'WW',
      W(28) + '.' + W(5) + '..*..*..' + 'WW',
      W(28) + 'r' + W(15),
      W(28) + '.' + W(15),
      W(27) + 'l.' + W(15),
      W(28) + '.' + W(15),
      'W' + '.'.repeat(13) + 'bb' + '.'.repeat(15) + W(13),
      'W%' + '.'.repeat(12) + 'zz' + '.....m.........' + W(13),
      'W' + '.'.repeat(13) + '~~' + '.'.repeat(15) + W(13),
      'WW.' + W(21) + 'n' + W(19),
      'WWr' + W(26) + '*.*' + W(12),
      'WW.l' + W(25) + '.%.' + W(12),
      'WW.' + W(9) + 'n' + W(17) + 'k' + W(13),
      'W' + '..' + '........' + 'm' + '....' + '>>>>>>' + '........' + '.' + '...........' + '.' + 'W',
      'W' + '....j' + '.'.repeat(5) + 'q' + '.'.repeat(11) + '%' + '.'.repeat(9) + 'j' + '.'.repeat(4) + 'y' + '.'.repeat(4) + 'W',
      'Wo' + '.'.repeat(15) + '>>>>>>' + '.'.repeat(10) + 'm' + '.'.repeat(9) + 'W',
      W(12) + 'n' + W(27) + '.' + W(3),
      W(40) + 'r' + W(3),
      W(40) + '.' + W(3),
      W(33) + '..........' + 'W',
      W(33) + '..J.......' + 'W',
      W(33) + '....m.....' + 'W',
      W(33) + '.*.....E..' + 'W',
      W(33) + '...*......' + 'W',
      W(44),
    ],
    L({
      '@': { tile: 'sand', mark: 'arrive' },
      E: { tile: 'ladder', mark: 'exit' },
      Y: { tile: 'sand', mark: 'vault' },
      Z: { tile: 'ladder', mark: 'vaultExit' },
      L: 'juice',
      j: { tile: 'sand', mon: MON.beetleH },
      J: { tile: 'sand', mon: MON.beetleV },
      q: { tile: 'sand', mon: MON.gwinRoam },
    }),
  );
  roughen(m, 51);
  return m;
}

/** Makes straight galleries look dug: lumps of earth and roots along their edges, glowworms in the walls. */
function roughen(m: LevelMap, seed: number): void {
  let s = seed;
  const rand = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const plain = (x: number, y: number) => /^sand\d$/.test(m.get(x, y));
  const wall = (x: number, y: number) => ['earth', 'roots'].includes(m.get(x, y));
  const quiet = (x: number, y: number) => [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => plain(x + dx, y + dy) || wall(x + dx, y + dy)));
  const marked = new Set([...m.marks.values()].map(([x, y]) => y * 100 + x));
  const occupied = new Set(m.map.monsters.filter((p) => p.monnum < 64).map((p) => p.cury * 100 + p.curx));
  for (let y = 1; y < 40; y++)
    for (let x = 1; x < 50; x++) {
      if (!plain(x, y) || !quiet(x, y) || marked.has(y * 100 + x) || occupied.has(y * 100 + x)) continue;
      const top = wall(x, y - 1) && plain(x, y + 1) && plain(x, y + 2);
      const bottom = wall(x, y + 1) && plain(x, y - 1) && plain(x, y - 2);
      if ((top || bottom) && wall(x - 1, y) === false && rand() < 0.22) m.set(x, y, rand() < 0.5 ? 'roots' : 'earth');
    }
  for (let y = 1; y < 40; y++)
    for (let x = 1; x < 50; x++) if (m.get(x, y) === 'earth' && (plain(x, y + 1) || plain(x, y - 1)) && rand() < 0.07) m.set(x, y, 'glow');
}

// ================================================================= 5. Gwin's patio
export const CAT_AT = { x: 13, y: 3 };
export function patio(): LevelMap {
  const m = new LevelMap('grass', 6);
  m.ring(0, 6, 32, 16, 'brick');
  m.rect(1, 7, 30, 14, 'patio');
  m.rect(11, 0, 10, 7, 'brick');
  m.rect(12, 1, 8, 2, 'patio');
  m.rect(12, 3, 1, 4, 'patio').rect(19, 3, 1, 4, 'patio');
  m.set(15, 1, 'crown').mark('crown', 15, 1);
  for (let by = 0; by < 4; by++) for (let bx = 0; bx < 6; bx++) m.set(CAT_AT.x + bx, CAT_AT.y + by, `cat${bx}${by}`);
  m.stamp(
    1,
    7,
    [
      '..............................',
      '..............................',
      '..u......................u....',
      '..............................',
      '.....##..................##...',
      '.....#....................#...',
      '..............................',
      '...........u......u...........',
      '..............................',
      '.....#....................#...',
      '.....##..................##...',
      '..............@...............',
      '.P...y........u.........y...P.',
      '..............................',
    ],
    L({ '.': 'patio', u: 'bowl', P: 'post2', '#': 'brick', y: 'tennis', '@': { tile: 'patio', mark: 'arrive' } }),
  );
  m.mon(12, 7, MON.pawL).mon(19, 7, MON.pawR).mon(14, 8, MON.tail);
  return m;
}

// ================================================================= THE -= S A N D B O X =- BBS
export function bbs(): LevelMap {
  const m = new LevelMap('ansiWall', 7);
  m.rect(1, 1, 22, 12, 'ansiFloor');
  const letters = ['ltrT', 'ltrH', 'ltrE', 'ltrDashEq', 'ltrS', 'ltrA', 'ltrN', 'ltrD', 'ltrB', 'ltrO', 'ltrX', 'ltrEqDash', 'ltrB', 'ltrB', 'ltrS'];
  letters.forEach((name, i) => m.set(4 + i, 1, name));
  m.stamp(
    1,
    2,
    [
      '......................',
      '.f..g....f....f...g.f.',
      '......t........t......',
      '..f.......f.f.......f.',
      '.....f..........f.....',
      '.g.......L.......f..g.',
      '..f..t..f....f..t..f..',
      '.......f......f.......',
      '.f..........@.......f.',
      '....f..............f..',
      '...........X..........',
    ],
    L({
      '.': 'ansiFloor',
      f: 'floppy',
      t: 'terminal',
      L: 'juiceBBS',
      g: { tile: 'ansiFloor', mon: MON.gremlin },
      '@': { tile: 'ansiFloor', mark: 'arrive' },
      X: { tile: 'noCarrier', mark: 'exit' },
    }),
  );
  return m;
}
