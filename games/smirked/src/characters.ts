// SMIRKED.CHR (you, Sir Screams-a-Lot: walk eight ways, tackle "GET DOWN!", scream, ask Lily
// if it's real; your nerve, lives, dollars and the counters) and the .MON file each level loads.
//
// Monster rules used here: when two monsters touch, the one with more power kills the other, so
// the tackle (power 120) knocks over an animatronic zombie or a papier-mache witch (110) but not
// a rubber bat, the ghost on its wire or the werewolf guy (150): those you strategically
// reposition away from. On the last level the tackle's slot holds the $12 foam sword's swing
// (power 160), which knocks the cardboard helmet off the 11-year-old knight (150). A monster under power 100
// dies when it touches you (after its picture's effect lands: a sorry to a flattened witch, the
// helmet, a dollar); 100 and up stays and its picture's effect lands every touch (a sting, Lily's pat).
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '../../../web/src/formats/character';
import { CHARBL } from '../../../web/src/formats/blocks';
import { MAXMARCH, emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { BATTERIES, KEY, MON, MONEY, SEQ, SMIRKS, SND, SORRY, HELMET } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right
/** The frame picture that fires a monster (its number in pic1). */
const MONBL = 100;

/** Pixels a step. */
const STEP = 4;
/** Pixels a step on a diagonal. */
const DIAG = 3;

type F = Partial<Frame> & { pic: number };
function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach(
    (f, i) =>
      (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? CHARBL, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }),
  );
  return out;
}

export function buildHero(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], { sound: 255, jstkBut: 0, jstkMov: 0, ...o });
  };
  // Idle: standing, blinking, looking over your shoulder, trying to look brave.
  set(SEQ.idle, [
    { pic: n('down0'), pause: 36 },
    { pic: n('blink'), pause: 3 },
    { pic: n('side0'), pause: 14, orient: MIRROR },
    { pic: n('side0'), pause: 14 },
    { pic: n('brave'), pause: 24 },
    { pic: n('blink'), pause: 3 },
  ]);
  // Fainting dead away (a life lost), like a Victorian woman seeing a ghost.
  set(
    SEQ.die,
    [
      { pic: n('ouch'), pause: 4 },
      { pic: n('faint0'), pause: 6 },
      { pic: n('faint1'), pause: 5 },
      { pic: n('faint2'), pause: 5 },
      { pic: n('faint3'), pause: 30 },
    ],
    { sound: SND.die },
  );
  set(
    SEQ.hurt,
    [
      { pic: n('hurt'), pause: 1 },
      { pic: n('ouch'), pause: 2 },
      { pic: n('hurt'), pause: 1 },
      { pic: n('down0'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  set(3, [{ pic: n('down0') }], { key: 0 });
  set(4, [{ pic: n('down0') }], { key: 0 });
  const walk = (i: number, key: number, joy: number, dx: number, dy: number, view: 'up' | 'down' | 'side', mirror = false) =>
    set(
      i,
      [1, 0, 2, 0].map((k) => ({ pic: n(`${view}${k}`), x: dx, y: dy, orient: mirror ? MIRROR : 0 })),
      { key, jstkMov: joy },
    );
  walk(SEQ.up, KEY.up, JOY.up, 0, -STEP, 'up');
  walk(SEQ.down, KEY.down, JOY.down, 0, STEP, 'down');
  walk(SEQ.left, KEY.left, JOY.left, -STEP, 0, 'side', true);
  walk(SEQ.right, KEY.right, JOY.right, STEP, 0, 'side');
  walk(SEQ.w, KEY.w, 0, 0, -STEP, 'up');
  walk(SEQ.a, KEY.a, 0, -STEP, 0, 'side', true);
  walk(SEQ.s, KEY.s, 0, 0, STEP, 'down');
  walk(SEQ.d, KEY.d, 0, STEP, 0, 'side');
  walk(SEQ.upLeft, KEY.q, JOY.upLeft, -DIAG, -DIAG, 'side', true);
  walk(SEQ.upRight, KEY.e, JOY.upRight, DIAG, -DIAG, 'side');
  walk(SEQ.downLeft, KEY.pad1, JOY.downLeft, -DIAG, DIAG, 'side', true);
  walk(SEQ.downRight, KEY.pad3, JOY.downRight, DIAG, DIAG, 'side');
  // SPACE: "GET DOWN!" The tackle flies off the way you last walked.
  set(
    SEQ.tackle,
    [
      { pic: n('tackle0'), pause: 2 },
      { pic: 0, pic1: MON.tackle, pic2: MONBL, y: 20, pause: 0 },
      { pic: n('tackle1'), pause: 5 },
      { pic: n('tackle0'), pause: 3 },
    ],
    { key: KEY.space, sound: SND.tackle, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
  // B: scream like a cat being dipped in a bathtub.
  set(
    SEQ.scream,
    [
      { pic: n('scream0'), pause: 4 },
      { pic: n('scream1'), pause: 4 },
      { pic: n('scream0'), pause: 4 },
      { pic: n('scream1'), pause: 4 },
      { pic: n('down0'), pause: 2 },
    ],
    { key: KEY.b, sound: SND.scream, norepeat: 1, jstkBut: 2 },
  );
  // C: ask Lily if it's real. ("You know it's not real, right?")
  set(
    SEQ.ask,
    [
      { pic: n('ask'), pause: 14 },
      { pic: n('blink'), pause: 3 },
      { pic: n('ask'), pause: 8 },
      { pic: n('down0'), pause: 2 },
    ],
    { key: KEY.c, sound: SND.ask, norepeat: 1, jstkBut: 4 },
  );

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // nerve (hit points)
  ch.meter[1] = 3; // lives
  // counters show meter - 1: none yet
  ch.meter[MONEY] = 1;
  ch.meter[BATTERIES] = 1;
  ch.meter[SORRY] = 1;
  ch.meter[HELMET] = 1;
  ch.meter[SMIRKS] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  if (path.length > MAXMARCH) throw new Error(`A march holds ${MAXMARCH} corners, not ${path.length}`);
  path.forEach((c, i) => (m.march[0][i] = c));
  return m;
}

/** Back and forth `run` blocks (to the right first, or down) at `speed`, facing the way it goes. */
const pace = (run: number, speed: number, down = false): March[] =>
  down ? [corner(0, 0, speed), corner(0, run, speed, 1), corner(0, 0, speed, 3)] : [corner(0, 0, speed), corner(run, 0, speed, 0), corner(0, 0, speed, 4)];

/** Wander at random, `speed` pixels a tick (towards >= 64). */
const wander = (speed: number) => speed << 6;

export interface MonsterOptions {
  /** Lily's stroll: up to four [dx, dy] corners in blocks (relative to where she starts), there and back. */
  lily?: [number, number][];
  /** Lily pats you as she passes (the fake woods). */
  pats?: boolean;
  /** How far a zombie paces. */
  zombie?: number;
  /** The ghost's wire: blocks along. */
  ghost?: number;
  /** The last level: the tackle's slot is the foam sword's swing. */
  sword?: boolean;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  /** The same, with its stinging tick first (sprites.ts sting()): it hurts once a round. */
  const stings = (a: string, b: string, t = 3): [number, number][] => [[n(`${a}!`), 1], ...anim(a, b, t)];
  if (o.sword) set[MON.tackle] = mon(anim('swing0', 'swing1', 2), { power: 160, thru: 1, towards: 6, end: 8 });
  else set[MON.tackle] = mon(anim('tackle0', 'tackle1', 2), { power: 120, thru: 1, towards: 6, end: 10 });
  set[MON.dust] = mon(anim('dust0', 'dust1', 3), { power: 10, thru: 0, end: 6 });
  set[MON.zombie] = mon(stings('zombie0', 'zombie1', 7), { power: 110, thru: 1, newmon: MON.zombieDown, upscore: 50 }, pace(o.zombie ?? 3, 1));
  set[MON.zombieDown] = mon(anim('zombieDown0', 'zombieDown1', 8), { power: 200, thru: 0 }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.witch] = mon(anim('witch0', 'witch1', 40), { power: 110, thru: 1, newmon: MON.witchFalls, upscore: 25 }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.witchFalls] = mon(anim('witch1', 'flatFalling', 6), { power: 200, thru: 0, end: 20, newmon: MON.witchFlat }, [corner(0, 0, 1), corner(1, 0, 1)]);
  // Said sorry to, or knocked about again (a second tackle, Lily strolling over her, a zombie), a
  // flat witch is taped back up and stands again: there are always witches to say sorry to.
  set[MON.witchFlat] = mon(anim('flat0', 'flat1', 12), { power: 50, thru: 1, newmon: MON.witchTaped }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.witchTaped] = mon(anim('witchTaped0', 'witchTaped1', 40), { power: 110, thru: 1, newmon: MON.witchFalls, upscore: 25 }, [
    corner(0, 0, 1),
    corner(0, 0, 1),
  ]);
  // Lily strolls her route and back, whistling, smirking now and then; in the woods she pats you.
  // A monster shows one picture set for its whole path, so each leg is its own monster, drawn the
  // way she walks it (side on, mirrored going left; her back going up; face on coming down), and
  // each becomes the next at its end. Nothing can knock her over (power 200), so the chain holds.
  const lilyPics = (way: 'front' | 'side' | 'back'): [number, number][] => {
    const [w0, w1] = way === 'front' ? ['lily0', 'lily1'] : way === 'side' ? ['lilySide0', 'lilySide1'] : ['lilyBack0', 'lilyBack1'];
    // walking away she can't smirk at you
    const smirk = way === 'back' ? w0 : 'lilySmirk';
    return o.pats
      ? [
          [n('lilyPat!'), 1],
          [n('lilyPat'), 4],
          [n(w0), 5],
          [n(w1), 5],
          [n(smirk), 10],
          [n(w0), 5],
          [n(w1), 5],
        ]
      : [
          [n(w0), 5],
          [n(w1), 5],
          [n(w0), 5],
          [n(w1), 5],
          [n(smirk), 12],
        ];
  };
  const route = o.lily ?? [[4, 0]];
  const stops: [number, number][] = [[0, 0], ...route, ...[...route].reverse().slice(1), [0, 0]];
  const legs = stops.slice(1).map(([x, y], i) => [x - stops[i][0], y - stops[i][1]] as const);
  if (MON.lilyLegs + legs.length > 64) throw new Error(`Lily's ${legs.length} legs don't fit in the monster slots`);
  // A monster that becomes another at the end of its path (PLAYGAME's MonEndPath) walks the old
  // one's first corner, then dies at the end of its own: so each leg's monster holds the NEXT
  // leg's corner. She starts (MON.lily, on the map) with a standstill that hands over to the last
  // leg's monster, which walks that standstill too and hands over to the first leg's.
  const leg = (k: number) => MON.lilyLegs + (k % legs.length);
  const cornerOf = (k: number) => {
    const [dx, dy] = legs[k % legs.length];
    return corner(dx, dy, 1, Math.abs(dx) >= Math.abs(dy) && dx < 0 ? 4 : 0);
  };
  const wayOf = ([dx, dy]: readonly [number, number]) => (Math.abs(dx) >= Math.abs(dy) ? 'side' : dy < 0 ? 'back' : 'front');
  legs.forEach((l, k) => {
    set[leg(k)] = mon(lilyPics(wayOf(l)), { power: 200, thru: 0, end: -1, newmon: leg(k + 1) }, [cornerOf(k + 1)]);
  });
  set[MON.lily] = mon(lilyPics(wayOf(legs[0])), { power: 200, thru: 0, end: -1, newmon: leg(legs.length - 1) }, [corner(0, 0, 1)]);
  set[MON.lilyNear] = mon(lilyPics('front'), { power: 200, thru: 1, towards: 1 });
  set[MON.bat] = mon(stings('bat0', 'bat1', 4), { power: 150, thru: 0 }, pace(2, 1, true));
  set[MON.ghost] = mon(stings('ghost0', 'ghost1', 8), { power: 150, thru: 0 }, pace(o.ghost ?? 5, 1));
  // A tackle (120) floors the werewolf guy (115) for three seconds: stars, then he's up and after you again.
  set[MON.werewolf] = mon(stings('wolf0', 'wolf1', 5), { power: 115, thru: 1, towards: 1, newmon: MON.wolfDazed, upscore: 25 });
  set[MON.wolfDazed] = mon(anim('wolfDazed0', 'wolfDazed1', 4), { power: 150, thru: 0, end: 48, newmon: MON.werewolf }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.spider] = mon(stings('spider0', 'spider1', 6), { power: 150, thru: 0 }, pace(3, 1, true));
  set[MON.carl] = mon(anim('carl0', 'carl1', 2), { power: 200, thru: 0, towards: wander(2) });
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 1, newmon: MON.seedBye }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.seedBye] = mon(anim('seedBye1', 'seedBye0', 2), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(-3, 2, 3, 4)]);
  // The duel has two rounds: the first knock sends the helmet flying and he scoops it back up
  // (two seconds when he can't be hit or hurt you), then he comes on quicker with it taped; the
  // second knock leaves it on the carpet for you.
  set[MON.knight] = mon(stings('knight0', 'knight1', 4), { power: 150, thru: 1, towards: 1, newmon: MON.knightGrab, upscore: 100 });
  set[MON.knightGrab] = mon(anim('knightGrab0', 'knightGrab1', 8), { power: 200, thru: 0, end: 32, newmon: MON.knight2 }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.knight2] = mon(stings('knightTaped0', 'knightTaped1', 3), { power: 150, thru: 1, towards: 2, newmon: MON.helmetSpin, upscore: 150 });
  // The second knock: the helmet spins through the air to your feet (power 200: no swing or
  // passer-by can knock it away), then rolls the last bit to you and you have it.
  set[MON.helmetSpin] = mon(anim('helmetSpin0', 'helmetSpin1', 2), { power: 200, thru: 1, towards: 3, end: 30, newmon: MON.helmet });
  set[MON.knightRuns] = mon(anim('knightRuns0', 'knightRuns1', 2), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(6, -2, 3, 0)]);
  set[MON.helmet] = mon(anim('helmet0', 'helmet1', 6), { power: 50, thru: 1, towards: 3, newmon: MON.knightRuns });
  set[MON.goat] = mon(anim('goat0', 'goat1', 12), { power: 200, thru: 1 }, pace(2, 1));
  set[MON.bill] = mon(anim('bill0', 'bill1', 6), { power: 50, thru: 0 }, [corner(0, 0, 1), corner(1, 0, 1), corner(0, 0, 1, 4)]);
  return set;
}

export { MON };
