// The bot's way through stage.ts (the level's own comment says what happens there). Across the
// lights' stretches it sneaks as a player does: it walks on, flops flat while a light's beam
// comes over her, stands still behind a light going the same way, and keeps out of a wing
// just before a light is born there.
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { GSEQ, SCAN } from '../../src/ids';
import { STAGE } from '../../src/levels/stage';
import { BEAMS } from '../../src/levels/stageBeasts';

/** The pixel positions of the live beam ends of light `name`. */
const ends = (s: Sim, name: string) =>
  s.w.mm.flatMap((m, i) =>
    s.scene.names?.[m.monnum] === `end${name}` ? [{ x: s.w.mi[i].curx[0] * 20 + s.w.mi[i].curx[1], y: s.w.mi[i].cury[0] * 20 + s.w.mi[i].cury[1] }] : [],
  );

/** Each sim's last look at the beams (to tell which way they are going). */
const seen = new WeakMap<Sim, Map<string, number>>();

/** What the beams of `lights` call for right now: lie flat, stand still, or (`busy`) nothing new. */
function look(s: Sim, lights: string[]) {
  const last = seen.get(s) ?? new Map<string, number>();
  seen.set(s, last);
  const { x, y } = s.pos;
  let flop = false;
  let stop = false;
  let busy = false;
  for (const name of lights) {
    for (const [k, e] of ends(s, name).entries()) {
      const key = `${name}${k}`;
      const was = last.get(key) ?? e.x;
      last.set(key, e.x);
      if (Math.abs(e.y - y) >= 20) continue;
      // (her head is columns 9-16 of her block; the beam's end spans its columns 1-18)
      const toward = e.x < was ? e.x > x - 14 : e.x > was ? e.x < x + 18 : false;
      const near = e.x <= x + 36 && e.x >= x - 36;
      const over = e.x >= x - 12 && e.x <= x + 18;
      if ((toward && near) || over) flop = true;
      else if (e.x > x && e.x < x + 24 && e.x >= was && !flop) stop = true;
      if (toward && Math.abs(e.x - x) < 90) busy = true;
    }
    // a light's wing, just before it lights up (close by, she lies flat as it comes out)
    const b = BEAMS[name];
    const left = b.every - (s.w.clock % b.every);
    const soon = left <= 10 || left >= b.every - 2;
    if (soon && Math.abs(b.y * 20 - y) < 20 && x + 20 <= b.x * 20 + 2 && x + 60 > b.x * 20) flop = true;
  }
  return { flop, stop, busy: busy || flop };
}

/**
 * Walks right to column `goal` past `lights`: flat on the floor while a beam's end is on its
 * way over her, standing still while one ahead is going her way, and waiting outside a
 * light's wing when it is about to light up there.
 */
const sneak = (goal: number, lights: string[]): Order => ({
  until: `sneaked to ${goal}`,
  maxTicks: 600,
  check: (s) => {
    const { flop, stop } = look(s, lights);
    if (s.pos.x >= goal * 20) {
      s.release(SCAN.right);
      s.release(SCAN.dead);
      return true;
    }
    if (flop) {
      s.release(SCAN.right);
      s.press(SCAN.dead);
    } else {
      s.release(SCAN.dead);
      // (a press made while she was busy with a trick is lost: press it again)
      if (stop || s.w.chr.cseq !== GSEQ.right) s.release(SCAN.right);
      if (!stop) s.press(SCAN.right);
    }
    return false;
  },
});

/**
 * BOOFs (to the right) until pigeon `name` is gone, as often as it takes (a BOOF's rings can
 * pass either side of a pigeon), lying flat for `lights` and only BOOFing with none coming.
 */
const boofOff = (name: string, lights: string[]): Order => ({
  until: `BOOFed the ${name} away`,
  maxTicks: 300,
  check: (s) => {
    const { flop, busy } = look(s, lights);
    if (!s.monsters(name).length) {
      s.release(SCAN.space);
      s.release(SCAN.dead);
      s.release(SCAN.right);
      return true;
    }
    s.release(SCAN.right);
    if (flop) {
      s.release(SCAN.space);
      s.press(SCAN.dead);
      return false;
    }
    s.release(SCAN.dead);
    if (s.w.chr.cseq === GSEQ.boof) s.release(SCAN.space);
    else if (s.w.ci.netx <= 0) s.press(SCAN.right);
    else if (!busy) s.press(SCAN.space);
    return false;
  },
});

export const route: Order[] = [
  sneak(20, ['A']),
  { walk: 24 },
  { walk: STAGE.flat - 1 },
  { face: 'right' },
  { trick: 'five', after: 14 },
  { until: 'the rope is chewed', maxTicks: 30, check: (s) => !s.monsters('knot').length },
  sneak(47, ['B', 'C']),
  // past the dressing rooms: BOOF the pigeon first, then under the light
  boofOff('pigeonLow', ['G']),
  sneak(STAGE.crates - 1, ['G']),
  // up the prop crates, and onto the road cases while their light is away
  { walk: STAGE.crates + 1 },
  { until: 'the light on the cases is away', maxTicks: 200, check: (s) => ends(s, 'E').every((e) => e.x >= (STAGE.cases + 4) * 20) },
  { trick: 'e', hold: 6, after: 0 },
  { walk: STAGE.cases, maxTicks: 16, grab: false },
  { until: 'up on the cases', maxTicks: 30, check: (s) => s.pos.by === 35 && s.pos.y % 20 === 0 },
  boofOff('pigeonHigh', ['E']),
  sneak(STAGE.casesEnd, ['E']),
  // the climbing light: wait until it has been down on the floor and is going back up, then follow it
  {
    until: 'the climbing light is down on the floor',
    maxTicks: 200,
    check: (s) => ends(s, 'D').some((e) => e.y === 39 * 20 && e.x <= (BEAMS.D.x - 7) * 20 + 2),
  },
  { until: 'the climbing light is back up the step', maxTicks: 60, check: (s) => ends(s, 'D').some((e) => e.y < 39 * 20 && e.x >= STAGE.step * 20) },
  { walk: STAGE.step - 1, grab: false },
  { hop: 6, dir: 'right', dirFor: 4 },
  { until: 'on the step', maxTicks: 30, check: (s) => s.pos.by === 38 && s.pos.y % 20 === 0 },
  { hop: 6, dir: 'right', dirFor: 4 },
  { until: 'on the riser', maxTicks: 30, check: (s) => s.pos.by === 37 && s.pos.y % 20 === 0 },
  sneak(STAGE.pigeon - 1, ['D', 'F']),
  // the quick light: BOOF the pigeon between its sweeps
  boofOff('pigeon', ['F']),
  sneak(STAGE.spot, ['F']),
];
