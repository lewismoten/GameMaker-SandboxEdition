// SNOW.MON: how each monster moves and fights.
//
// Game-Maker monster rules used here: when two monsters touch, the one with more power kills
// the other (equal power ignore each other), so the kid's snowball (power 120) beats Pete
// (90) but a thrown snowball (10) can't hurt a plow (200). A monster under power 100 dies
// when it touches the kid (after its block's damage lands); 100 and up stays. When a monster
// dies it is reborn as its newmon, which chains effects: a snowball dies into a poof, Biscuit
// into a running-away dog. 'end' is a lifetime in ticks (or -1: die at the end of the march
// path), and 'towards' makes a monster chase (1..63), flee (negative) or wander (64+).
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../../web/src/formats/monster';
import { MON } from '../ids';
import { buildMonsterBlocks } from '../sprites/monsterBlocks';

// ---------------------------------------------------------------- monsters
const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = [], attack: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  attack.forEach((c, i) => (m.march[1][i] = c));
  return m;
}

export interface MonsterOptions {
  /** Blocks a plow drives before turning around (each leg). */
  plowRun?: number;
  plow2Run?: number;
  carRun?: number;
  plowSpeed?: number;
  carSpeed?: number;
}

/**
 * The .MON file for a level. Vehicles are two monsters side by side; when a leg ends the
 * monster "dies" into its mirror twin, so the blade always leads. Each leg starts with a
 * zero-length corner because PLAYGAME aims a reborn monster with its parent's first corner.
 */
export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  set[MON.snowball] = mon(anim('ball0', 'ball1', 2), { power: 10, thru: 0, towards: 3, end: 34, newmon: MON.poof, upscore: 15 });
  set[MON.poof] = mon(anim('poof0', 'poof1', 2), { power: 100, thru: 0, end: 5 });
  set[MON.myBall] = mon(anim('myBall0', 'myBall1', 2), { power: 120, thru: 1, towards: 7, end: 18, newmon: MON.poof });
  // Biscuit wanders, runs at you when you're close, and bounds off happily after a hug.
  set[MON.dog] = mon(
    anim('dog0', 'dog1', 3),
    { power: 40, thru: 1, towards: 128, activate: 2, newmon: MON.dogRun, upscore: 50 },
    [],
    [corner(0, 0, 1), corner(0, 0, 3)],
  );
  set[MON.dogRun] = mon(anim('dogRun0', 'dogRun1', 2), { power: 100, thru: 0, towards: -5, end: 60 });
  // Big Pete shoves you once (his block's damage) and then strolls off, pleased with himself,
  // for five seconds before he comes looking again: power under 100, so touching the kid
  // "kills" him into that walk-away. A snowball (power 120) beats him to it: he strolls off
  // without the shove, and it's worth 150 points.
  set[MON.bully] = mon(
    anim('bully0', 'bully1', 4),
    { power: 90, thru: 1, towards: 128, activate: 2, newmon: MON.bullyRun, upscore: 150 },
    [],
    [corner(0, 0, 1), corner(0, 0, 2)],
  );
  set[MON.bullyRun] = mon(anim('bullyRun0', 'bullyRun1', 2), { power: 100, thru: 0, towards: -4, end: 90, newmon: MON.bully });

  const legs = (run: number, speed: number, names: [string, string], ids: [number, number, number, number]) => {
    const [ar, al, br, bl] = ids;
    const [rear, front] = names;
    // A is the left block, B the right. Going right: [rear][front]; going left: [front][rear], mirrored.
    set[ar] = mon(anim(`${rear}0`, `${rear}1`), { power: 200, thru: 0, end: -1, newmon: al }, [corner(0, 0, speed), corner(run, 0, speed, 0)]);
    set[al] = mon(anim(`${front}0`, `${front}1`), { power: 200, thru: 0, end: -1, newmon: ar }, [corner(0, 0, speed), corner(-run, 0, speed, 4)]);
    set[br] = mon(anim(`${front}0`, `${front}1`), { power: 200, thru: 0, end: -1, newmon: bl }, [corner(0, 0, speed), corner(run, 0, speed, 0)]);
    set[bl] = mon(anim(`${rear}0`, `${rear}1`), { power: 200, thru: 0, end: -1, newmon: br }, [corner(0, 0, speed), corner(-run, 0, speed, 4)]);
  };
  legs(o.plowRun ?? 30, o.plowSpeed ?? 4, ['plowRear', 'plowFront'], [MON.plowAR, MON.plowAL, MON.plowBR, MON.plowBL]);
  legs(o.plow2Run ?? 20, o.plowSpeed ?? 4, ['plowRear', 'plowFront'], [MON.plow2AR, MON.plow2AL, MON.plow2BR, MON.plow2BL]);
  legs(o.carRun ?? 30, o.carSpeed ?? 5, ['carRear', 'carFront'], [MON.carAR, MON.carAL, MON.carBR, MON.carBL]);
  set[MON.cart] = mon(anim('cart0', 'cart1', 3), { power: 150, thru: 1, towards: 64 * 2 });
  set[MON.sledder] = mon(anim('sledder0', 'sledder1', 3), { power: 150, thru: 0 }, [corner(7, 0, 3, 0), corner(0, 0, 3, 4)]);
  set[MON.cardinal] = mon(
    [
      [n('bird0'), 20],
      [n('bird1'), 2],
      [n('bird0'), 9],
      [n('bird1'), 2],
    ],
    { power: 100, thru: 0 },
    [corner(1, 0, 1, 0), corner(0, 0, 1, 4)],
  );
  return set;
}
