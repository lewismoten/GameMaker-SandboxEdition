// DEMO.REC: the attract-mode recording the menu plays when nobody touches the keys. It
// is made by playing in the headless engine with a little autopilot - across the training
// deck, out of the airlock and over the galaxy chart in the pod - writing down every key
// press and release with its game tick, Game-Maker style. The pilot flies like a person:
// one thrust key held down for a while (one press, one release, as a keyboard with the
// typematic repeat off sends them), never a drumroll of taps.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import { SCAN } from './ids';
import type { Built } from './game';
import { simFor } from '../verify';
import type { Sim } from '../sim';

export async function buildDemo(b: Built): Promise<{ rec: Uint8Array; ticks: number; reached: boolean }> {
  const home = b.scenes.find((s) => s.file === 'home')!;
  const sim = simFor(b, home, 1);
  const keys: RecordedKey[] = [];
  let last = 0;
  let t = 0;
  const held = new Set<number>();
  const ev = (scan: number, down: boolean) => {
    if (down === held.has(scan)) return;
    if (down) {
      held.add(scan);
      sim.press(scan);
    } else {
      held.delete(scan);
      sim.release(scan);
    }
    // keys pressed now reach the engine on the next tick
    keys.push({ delta: t + 1 - last, key: down ? scan : scan | 0x80 });
    last = t + 1;
  };
  const step = async (n = 1) => {
    for (let i = 0; i < n; i++) {
      await sim.tick();
      t++;
    }
  };
  // stand a moment, wave hello, then head right, hopping when stuck and firing at the range
  await step(18);
  ev(SCAN.t, true);
  await step(2);
  ev(SCAN.t, false);
  await step(30);
  ev(SCAN.right, true);
  let lastX = sim.pos.x;
  let stuck = 0;
  while (t < 900 && sim.link < 0 && !sim.dead) {
    await step();
    stuck = sim.pos.x === lastX ? stuck + 1 : 0;
    lastX = sim.pos.x;
    const bx = sim.pos.bx;
    if (stuck > 2) {
      // a quick tap: a longer one plays back differently in PLAYGAME than in the headless sim
      ev(SCAN.up, true);
      await step();
      ev(SCAN.up, false);
      stuck = 0;
    }
    // the practice range: blast the drones
    if (bx >= 36 && bx <= 50 && t % 12 === 0) {
      ev(SCAN.space, true);
      await step(2);
      ev(SCAN.space, false);
    }
  }
  const reached = sim.link >= 0;
  ev(SCAN.right, false);
  // then the pod: out across the galaxy chart to the warp ring of The Cradle
  const galaxy = b.scenes.find((s) => s.file === 'galaxy')!;
  const pod = simFor(b, galaxy, 2, sim.w.ci);
  const before = pod.ticks;
  const tBase = t;
  pod.onKey = (k) => {
    const now = tBase + (pod.ticks - before) + 1;
    keys.push({ delta: now - last, key: k });
    last = now;
  };
  const warp = b.game.scenes[galaxy.scene].links[1].from;
  const flown = await fly(pod, { x: warp.x, y: warp.y + 2 }, 700);
  t += pod.ticks - before;
  // hold still a moment in front of the ring, then Esc ends the demo
  pod.onKey = undefined;
  ev(SCAN.esc, true);
  t += 1;
  ev(SCAN.esc, false);
  return { rec: serializeRecording(keys), ticks: t, reached: reached && flown };
}

/**
 * Flies the pod to a map cell along a breadth-first route the way a person would: it holds
 * one thrust key (Game-Maker reads one at a time) for at least a third of a second, lets
 * go when the pod is moving the right way, and only then reaches for another.
 */
/** Returns whether the pod got there. */
async function fly(sim: Sim, goal: { x: number; y: number }, maxTicks: number): Promise<boolean> {
  const bbl = sim.scene.bbl;
  const map = sim.w.map;
  const dist = new Int32Array(10000).fill(-1);
  const q = [goal.y * 100 + goal.x];
  dist[q[0]] = 0;
  const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    const x = i % 100;
    const y = Math.floor(i / 100);
    for (const [dx, dy] of DIRS) {
      const j = ((y + dy + 100) % 100) * 100 + ((x + dx + 100) % 100);
      const blk = bbl[map[j]];
      if (dist[j] >= 0 || (blk && (blk.solid || blk.grav))) continue;
      dist[j] = dist[i] + 1;
      q.push(j);
    }
  }
  let arrived = false;
  let cur = 0;
  let heldFor = 0;
  let rest = 0;
  const MIN_HOLD = 6;
  for (let t = 0; t < maxTicks; t++) {
    const c = sim.w.chr;
    const px = c.x[0] * 20 + c.x[1] + 10;
    const py = c.y[0] * 20 + c.y[1] + 10;
    const cx = Math.floor(px / 20) % 100;
    const cy = Math.floor(py / 20) % 100;
    if ((cx === goal.x && cy === goal.y) || sim.link >= 0) {
      arrived = true;
      break;
    }
    // aim down the route as far as it runs straight (a person sees the open lane ahead)
    let tx = cx;
    let ty = cy;
    let first: number[] | undefined;
    for (let step = 0; step < 6; step++) {
      let best: number[] | undefined;
      let bd = dist[((ty + 100) % 100) * 100 + ((tx + 100) % 100)];
      for (const [dx, dy] of DIRS) {
        const d = dist[((ty + dy + 100) % 100) * 100 + ((tx + dx + 100) % 100)];
        if (d >= 0 && (bd < 0 || d < bd)) {
          bd = d;
          best = [dx, dy];
        }
      }
      if (!best || (first && (best[0] !== first[0] || best[1] !== first[1]))) break;
      first ??= best;
      tx += best[0];
      ty += best[1];
    }
    const ex = tx * 20 + 10 - px;
    const ey = ty * 20 + 10 - py;
    const errX = Math.max(-5, Math.min(5, ex / 4)) - sim.w.ci.gravx;
    const errY = Math.max(-5, Math.min(5, ey / 4)) - sim.w.ci.gravy;
    let want = 0;
    if (Math.max(Math.abs(errX), Math.abs(errY)) > 1) {
      want = Math.abs(errX) >= Math.abs(errY) ? (errX > 0 ? SCAN.right : SCAN.left) : errY > 0 ? SCAN.down : SCAN.up;
    }
    // keep holding what is held for a moment, and after that for as long as it still
    // takes the pod the right way without overshooting; a person doesn't drum on a key
    if (cur && heldFor < MIN_HOLD) want = cur;
    else if (cur) {
      const sign = cur === SCAN.right || cur === SCAN.down ? 1 : -1;
      const horiz = cur === SCAN.right || cur === SCAN.left;
      const e = (horiz ? ex : ey) * sign;
      const err = (horiz ? errX : errY) * sign;
      const other = Math.abs(horiz ? errY : errX);
      if (other < 3 && (e > 40 || (e > 4 && err > -1.5))) want = cur;
    }
    if (want !== cur) {
      if (cur) {
        sim.release(cur);
        cur = 0;
        rest = 1;
      } else if (rest > 0) rest--;
      else {
        sim.press(want);
        cur = want;
        heldFor = 0;
      }
    }
    heldFor++;
    await sim.tick();
    if (sim.dead) return false;
  }
  if (cur) sim.release(cur);
  return arrived;
}
