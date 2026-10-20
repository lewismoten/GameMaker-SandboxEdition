// Plays parts of the built game headlessly (the engine's own movement, touch and monster
// code via sim.ts) to check that they work: the training deck can be crossed, rovers can
// drive around their worlds, and nothing kills the courier the moment it lands.
import { SCAN } from './common';
import type { Built, SceneInfo } from './game';
import { Sim } from './sim';
import type { CharInfo } from '../../web/src/engine/world';

const key = SCAN;

export function simFor(b: Built, info: SceneInfo, seed = 1, ci?: CharInfo): Sim {
  const sets = b.sets as Record<string, { blocks: import('../../web/src/formats/blocks').Block[] }>;
  const famFile = b.game.scenes[info.scene].files[3];
  const ms = Object.values(b.monsters).find((m) => `${m.name}.mon` === famFile);
  const chr = b.chars[info.chr];
  const links = b.game.scenes[info.scene].links.filter((l) => l.toScene !== 0xffff).map((l) => ({ from: l.from, to: l.to }));
  return new Sim({ map: info.map.toMap(), bbl: sets[info.bbl].blocks, mbl: ms?.mbl, mon: ms?.mon, chr: chr.chr, cbl: chr.cbl, links }, info.arrive, ci, seed);
}

/** Holds a direction, hopping whenever stuck. Returns the link reached (or -1) and why it stopped. */
export async function autoWalk(
  sim: Sim,
  dir: 'right' | 'left',
  ticks: number,
  opts: { hop?: boolean } = {},
): Promise<{ link: number; dead: boolean; ticks: number; x: number }> {
  sim.press(key[dir]);
  let lastX = sim.pos.x;
  let stuck = 0;
  let t = 0;
  for (; t < ticks; t++) {
    await sim.tick();
    if (sim.dead || sim.link >= 0) break;
    const x = sim.pos.x;
    stuck = x === lastX ? stuck + 1 : 0;
    lastX = x;
    if (stuck > 2 && opts.hop !== false) {
      sim.press(key.up);
      await sim.tick();
      sim.release(key.up);
      stuck = 0;
    }
  }
  sim.release(key[dir]);
  return { link: sim.link, dead: sim.dead, ticks: t, x: sim.pos.bx };
}

/** Lands and stands still: the courier must survive `ticks` without moving. */
export async function standStill(sim: Sim, ticks: number): Promise<{ hp: number; dead: boolean }> {
  await sim.run(ticks);
  return { hp: sim.w.ci.hitpts, dead: sim.dead };
}

/**
 * Flies a pod (or swims a diving bell) to a map cell along a breadth-first route around
 * solid blocks, steering its momentum like a player would. Returns the damage taken.
 */
export async function navigate(
  sim: Sim,
  goal: { x: number; y: number },
  maxTicks = 3000,
): Promise<{ arrived: boolean; damage: number; ticks: number; deaths: number }> {
  const bbl = sim.scene.bbl;
  const map = sim.w.map;
  const dist = new Int32Array(10000).fill(-1);
  const q = [goal.y * 100 + goal.x];
  dist[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    const x = i % 100;
    const y = Math.floor(i / 100);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const j = ((y + dy + 100) % 100) * 100 + ((x + dx + 100) % 100);
      const blk = bbl[map[j]];
      // solid blocks stop the pod; currents (solar wind) push it about, so route around them
      if (dist[j] >= 0 || (blk && (blk.solid || blk.grav))) continue;
      dist[j] = dist[i] + 1;
      q.push(j);
    }
  }
  const held = new Set<number>();
  const hold = (k: number, on: boolean) => {
    if (on && !held.has(k)) {
      sim.press(k);
      held.add(k);
    }
    if (!on && held.has(k)) {
      sim.release(k);
      held.delete(k);
    }
  };
  let damage = 0;
  let deaths = 0;
  let hp = sim.w.ci.hitpts;
  let t = 0;
  let arrived = false;
  for (; t < maxTicks; t++) {
    const c = sim.w.chr;
    const px = c.x[0] * 20 + c.x[1] + 10;
    const py = c.y[0] * 20 + c.y[1] + 10;
    const cx = Math.floor(px / 20) % 100;
    const cy = Math.floor(py / 20) % 100;
    if ((cx === goal.x && cy === goal.y) || sim.link >= 0) {
      arrived = true;
      break;
    }
    let best = [0, 0];
    let bd = dist[cy * 100 + cx];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const d = dist[((cy + dy + 100) % 100) * 100 + ((cx + dx + 100) % 100)];
      if (d >= 0 && (bd < 0 || d < bd)) {
        bd = d;
        best = [dx, dy];
      }
    }
    const ex = (cx + best[0]) * 20 + 10 - px;
    const ey = (cy + best[1]) * 20 + 10 - py;
    const wantX = Math.max(-5, Math.min(5, ex / 3));
    const wantY = Math.max(-5, Math.min(5, ey / 3));
    const vx = sim.w.ci.gravx;
    const vy = sim.w.ci.gravy;
    const phase = t % 2;
    hold(SCAN.right, phase === 0 && vx < wantX - 0.5);
    hold(SCAN.left, phase === 0 && vx > wantX + 0.5);
    hold(SCAN.down, phase === 1 && vy < wantY - 0.5);
    hold(SCAN.up, phase === 1 && vy > wantY + 0.5);
    await sim.tick();
    if (sim.w.ci.hitpts < hp) damage += hp - sim.w.ci.hitpts;
    if (sim.dead) {
      deaths++;
      sim.dead = false;
      sim.w.chr.cseq = 0;
      sim.w.chr.cframe = 0;
      sim.w.ci.hitpts = 100;
    }
    hp = sim.w.ci.hitpts;
  }
  for (const k of [...held]) hold(k, false);
  return { arrived, damage, ticks: t, deaths };
}

/**
 * Walks and jet-hops the courier to a map cell along a breadth-first route through cells a
 * two-block-tall body fits in: hold toward the next cell, tap Up to climb, fire now and
 * then. Doors and force fields count as passable (bring credits; fields blink off).
 */
export async function walkTo(
  sim: Sim,
  goal: { x: number; y: number },
  maxTicks = 6000,
  passable: (b: number) => boolean = () => false,
): Promise<{ arrived: boolean; damage: number; ticks: number; deaths: number; best: number }> {
  const bbl = sim.scene.bbl;
  const map = sim.w.map;
  const open = (i: number) => {
    const blk = bbl[map[i]];
    if (passable(map[i])) return true;
    // lifts push up: the route goes beside them (a player steps out of the stream to drop)
    if (blk.grav & 1) return false;
    return (blk.solid & 14) === 0 || blk.solid === 1;
  };
  const idx = (x: number, y: number) => ((y + 100) % 100) * 100 + ((x + 100) % 100);
  const fits = (x: number, y: number) => open(idx(x, y)) && open(idx(x, y - 1));
  const field = (allowLifts: boolean) => {
    const dist = new Int32Array(10000).fill(-1);
    const q = [idx(goal.x, goal.y)];
    dist[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      const x = i % 100;
      const y = Math.floor(i / 100);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const j = idx(x + dx, y + dy);
        const ok = allowLifts ? fitsAny(x + dx, y + dy) : fits(x + dx, y + dy);
        if (dist[j] >= 0 || !ok) continue;
        dist[j] = dist[i] + 1;
        q.push(j);
      }
    }
    return dist;
  };
  const openAny = (i: number) => passable(map[i]) || (bbl[map[i]].solid & 14) === 0 || bbl[map[i]].solid === 1;
  const fitsAny = (x: number, y: number) => openAny(idx(x, y)) && openAny(idx(x, y - 1));
  let dist = field(false);
  if (dist[idx(sim.w.chr.x[0], sim.w.chr.y[0])] < 0) dist = field(true);
  const held = new Set<number>();
  const hold = (k: number, on: boolean) => {
    if (on && !held.has(k)) {
      sim.press(k);
      held.add(k);
    }
    if (!on && held.has(k)) {
      sim.release(k);
      held.delete(k);
    }
  };
  let damage = 0;
  let deaths = 0;
  let hp = sim.w.ci.hitpts;
  let best = 1e9;
  let t = 0;
  let arrived = false;
  let upCool = 0;
  for (; t < maxTicks; t++) {
    const c = sim.w.chr;
    const cx = (c.x[0] + (c.x[1] > 10 ? 1 : 0)) % 100;
    const cy = c.y[0] + (c.y[1] > 10 ? 1 : 0);
    const here = dist[idx(cx, cy)];
    if (here >= 0) best = Math.min(best, here);
    if ((Math.abs(cx - goal.x) <= 1 && Math.abs(cy - goal.y) <= 1) || sim.link >= 0) {
      arrived = true;
      break;
    }
    // look a few steps ahead along the route
    let tx = cx;
    let ty = cy;
    let d = here < 0 ? 1e9 : here;
    for (let step = 0; step < 3; step++) {
      let nb: [number, number] | undefined;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nd = dist[idx(tx + dx, ty + dy)];
        if (nd >= 0 && nd < d) {
          d = nd;
          nb = [tx + dx, ty + dy];
        }
      }
      if (!nb) break;
      [tx, ty] = nb;
    }
    let ddx = tx - cx;
    if (ddx > 50) ddx -= 100;
    if (ddx < -50) ddx += 100;
    hold(SCAN.right, ddx > 0);
    hold(SCAN.left, ddx < 0);
    if (upCool > 0) upCool--;
    if (ty < cy && upCool === 0 && sim.w.ci.gravy > -4) {
      sim.press(SCAN.up);
      upCool = 3;
    } else if (held.has(SCAN.up) || upCool === 2) sim.release(SCAN.up);
    if (t % 9 === 0) sim.press(SCAN.space);
    if (t % 9 === 1) sim.release(SCAN.space);
    await sim.tick();
    if (sim.w.ci.hitpts < hp) damage += hp - sim.w.ci.hitpts;
    if (sim.dead) {
      deaths++;
      sim.dead = false;
      sim.w.chr.cseq = 0;
      sim.w.chr.cframe = 0;
      sim.w.ci.hitpts = 100;
    }
    hp = sim.w.ci.hitpts;
  }
  for (const k of [...held]) hold(k, false);
  sim.release(SCAN.up);
  return { arrived, damage, ticks: t, deaths, best };
}
