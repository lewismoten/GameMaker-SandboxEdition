// The level check's touch probe: on the real engine (sim.ts), the hero is dropped onto each
// solid monster that hurts, walked into each monster that hurts, and stood between each solid
// pacer and the wall it walks up to, at a few moments after the scene starts. PLAYGAME's
// ChkMonChr puts a hero a solid monster touches next to it, on the side it is pushed out of,
// with no check for walls (SOLTOP: under it; SOLLEF and SOLRIG: beside it). Three things are
// real trouble there, where "solid and hurts" alone is not:
// - a sink: landing on it pushes the hero into the ground under it, where it hurts him until
//   he hops out (wave 8b found these in four games, wave 15 in five more);
// - a push: a pacer that walks right up against a wall or solid block shoves a hero standing
//   in the gap inside it (wave 15: risi's rooftop pigeon, sweats' pedestrian and static);
// - a hold: once it touches him, no move gets him away before it has taken his life (the hurt
//   picture keeps him still while it walks with him, or stands on him).
// The hero is put down as a scene start does (SceneSim.place), so no stale screen position
// pushes him, and nothing is dropped from above the map's top row (the map wraps there).
import { BLEN, MONBL, SOLLEF, SOLRIG, SOLTOP } from '../../../formats/blocks';
import { DIESEQ } from '../../../formats/character';
import type { Game } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import { LASTMM, LASTMON, bgBlock } from '../../../engine/world';
import { at, type Finding } from '../findings';
import { getsAway } from '../escape';
import { keyRoles, movesFor } from '../inputs';
import { linksInto } from '../playtest';
import { SceneSim, type FileSource, type Snap } from '../sim';
import type { SceneData } from '../sceneData';

/** Ticks after the hero comes in at which monsters are probed (they move on between). */
const MOMENTS = [0, 10, 20, 30, 40, 50];
/** Placed copies of one monster probed, and monsters (by number) a scene. */
const SLOTS_EACH = 2;
const MONSTERS = 16;
/** Ticks the pacers are followed from the start, looking for them to walk up to a wall. */
const TRACK = 180;
/** The widest gap (blocks) between a pacer and a wall that a hero is stood in. */
const GAP = 2;
/** Ticks a pushed hero stays inside a block before it counts (a thin wall lets him through). */
const STAYS = 18;
/** Places beside a wall tried for one monster. */
const TRIES_EACH = 6;

export async function landings(d: SceneData, game: Game, files: FileSource): Promise<Finding[]> {
  const into = linksInto(game, d.scene);
  const from = into.find((l) => l.scene !== d.scene) ?? into[0];
  if (!from || !d.names.mon) return [];
  let sim: SceneSim;
  try {
    sim = new SceneSim(game, d.scene, files, from.to);
  } catch {
    return [];
  }
  // every monster moves (the hero is put down far from where he came in, among ones the explorer would freeze)
  sim.freezeBeyond = { x: 0, y: 0 };
  const w = sim.w;
  const gravity = w.bg.some((b) => b.grav !== 0);
  const moves = movesFor(keyRoles(w.chr, gravity), gravity);
  const walks = keyRoles(w.chr, gravity).move.filter((m) => m.dy === 0 && m.dx !== 0);
  const solidAt = (x: number, y: number) => bgBlock(w, w.blkmap[w.map[((y + MWID) % MWID) * MLEN + ((x + MLEN) % MLEN)]] ?? 0).solid;
  const shownSolid = (x: number, y: number) => solidAt(x, y) !== 0;
  /** A block solid at its sides: a wall a push can shove him into (a ledge solid on top only isn't). */
  const wallAt = (x: number, y: number) => (solidAt(x, y) & (SOLLEF | SOLRIG)) !== 0;
  /** The hero's feet are inside solid blocks (or, for a push, his feet or head are inside walls). */
  const inside = (push = false) => {
    const c = w.chr;
    const is = push ? wallAt : shownSolid;
    const row = (y: number) => is(c.x[0], y) && (c.x[1] === 0 || is(c.x[0] + 1, y));
    return row(c.y[0]) || (push && row(c.y[0] - 1));
  };
  /** The solid sides of the monster's pictures, together (ChkMonChr pushes out of any of them). */
  const solidOf = (n: number) => (w.mon[n]?.pic ?? []).reduce((s, [p]) => (p < MONBL ? s | (w.mblk[p]?.solid ?? 0) : s), 0);
  const hurts = (n: number) => !!w.mon[n]?.pic.some(([p]) => p < MONBL && w.mblk[p]?.chHitPt < 0);
  /** Placed monsters that pass `keep`, a few of each, for the first few monsters. */
  const pick = (keep: (n: number) => boolean) => {
    const each = new Map<number, number[]>();
    for (let l = 0; l < LASTMM; l++) {
      const n = w.mm[l].monnum;
      if (n >= LASTMON || !keep(n)) continue;
      const list = each.get(n) ?? [];
      if (list.length < SLOTS_EACH) each.set(n, [...list, l]);
    }
    return [...each.values()].slice(0, MONSTERS).flat();
  };
  // walked into and landed on: monsters with a picture that hurts; stood beside a wall: solid ones
  const slots = pick(hurts);
  const pacers = pick((n) => solidOf(n) !== 0);
  if (!slots.length && !pacers.length) return [];
  const moments = [];
  for (let t = 0; t <= MOMENTS[MOMENTS.length - 1]; t++) {
    if (MOMENTS.includes(t)) moments.push(sim.snapshot());
    if (await sim.tick()) break;
  }
  const sinks = new Map<number, number[]>();
  const pushes = new Map<number, number[]>();
  const holds = new Map<number, number[]>();
  const tested = new Map<number, number>();
  /**
   * Plays from the hero's new place: did he end up inside a solid block (recorded in `into`:
   * sinks for a landing, pushes for a pacer; a landing that leaves him level with slot `l`, not
   * under it, was a side push too), or get held while hurt (not looked for in a push)?
   */
  const watch = async (n: number, into: Map<number, number[]> | undefined, toward: number[], l = LASTMM) => {
    const start = { x: w.chr.x[0], y: w.chr.y[0] };
    const push = into === pushes;
    let touched = false;
    let stuck = 0;
    sim.hold(toward);
    for (let t = 0; t < (push ? 40 + STAYS : 40); t++) {
      const hp = w.ci.hitpts;
      const r = await sim.tick();
      if (r) return;
      const cell = w.chr.y[0] * MLEN + w.chr.x[0];
      // pushed far on the first ticks: something else was where he was put
      if (t <= 1 && (Math.abs(w.chr.x[0] - start.x) > 2 || Math.abs(w.chr.y[0] - start.y) > 4)) return;
      // (a hero who lands on it and sinks may be dying by then: he sank all the same; a pushed
      // hero must stay in, as one shoved through a thin wall comes out the far side)
      if (into && inside(push) && ++stuck >= (push ? STAYS : 1)) {
        const to = into === sinks && l < LASTMM && w.chr.y[0] <= w.mi[l].cury[0] ? pushes : into;
        to.set(n, [...(to.get(n) ?? []), cell]);
        return;
      }
      if (w.chr.cseq === DIESEQ) return;
      if (w.ci.hitpts < hp && !touched && !push) {
        touched = true;
        // the first touch: can he get away from here? (tried a few times a monster, until one holds)
        const k = tested.get(n) ?? 0;
        if (k >= 0 && k < 3) {
          const away = await getsAway(sim, moves);
          tested.set(n, away ? k + 1 : -1);
          if (!away) holds.set(n, [...(holds.get(n) ?? []), cell]);
        }
        // a landing goes on: he may sink into the ground a while after the first bite
        if (!into) return;
      }
    }
  };
  for (const snap of moments)
    for (const l of slots) {
      sim.restore(snap);
      const n = w.mm[l].monnum;
      if (n >= LASTMON) continue;
      const mi = w.mi[l];
      const mx = mi.curx[0];
      const my = mi.cury[0];
      // dropped from three blocks over it, and from two, over where it is and where it will be when
      // he comes down (it walks on while he falls); in open air, inside the map (it wraps at the top)
      if (gravity && solidOf(n))
        for (const [h, fall] of [
          [3, 10],
          [3, 0],
          [2, 7],
          [2, 0],
        ]) {
          sim.restore(snap);
          for (let t = 0; t < fall; t++) if (await sim.tick()) break;
          const fx = w.mi[l].curx;
          const fy = w.mi[l].cury[0];
          const alive = w.mm[l].monnum === n;
          sim.restore(snap);
          if (!alive || fy < h + 1) continue;
          let open = true;
          for (let k = 2; k <= h + 1; k++) if (shownSolid(fx[0], fy - k)) open = false;
          if (!open) continue;
          sim.place(fx[0], fy - h);
          w.chr.x[1] = fx[1];
          await watch(n, sinks, [], l);
        }
      // walked into from two blocks to the side, standing on ground as the monster is
      for (const side of [-1, 1]) {
        const hx = mx + side * 2;
        const walk = walks.find((m) => m.dx === -side);
        if (!walk || hx < 0 || hx >= MLEN || my < 2 || shownSolid(hx, my) || shownSolid(hx, my - 1)) continue;
        if (gravity && !shownSolid(hx, my + 1)) continue;
        sim.restore(snap);
        sim.place(hx, my);
        await watch(n, undefined, [walk.scan]);
      }
    }
  // A pacer walking up to a wall: the hero is stood in the gap ahead of it, against the wall,
  // just before it gets there, on its row (ChkMonChr pushes him sideways only when it is level
  // with him). If its side push puts him inside the wall and he stays there, that's a push. Every
  // pacer is followed in one run from the start; each place is tried once, a few a monster.
  sim.restore(moments[0]);
  const tries: { n: number; h: number; y: number; snap: Snap }[] = [];
  const tried = new Set<string>();
  const last = pacers.map((l) => w.mi[l].curx[0] * BLEN + w.mi[l].curx[1]);
  const first = pacers.map((l) => w.mm[l].monnum);
  for (let t = 0; t < TRACK; t++) {
    if (await sim.tick()) break;
    pacers.forEach((l, i) => {
      const n = first[i];
      const mi = w.mi[l];
      const now = mi.curx[0] * BLEN + mi.curx[1];
      const s = Math.sign(now - last[i]);
      last[i] = now;
      if (!s || w.mm[l].monnum !== n || tries.filter((x) => x.n === n).length >= TRIES_EACH) return;
      const my = mi.cury[0];
      const lead = s > 0 && mi.curx[1] ? mi.curx[0] + 1 : mi.curx[0];
      // a wall a block or two ahead, his height of open air, ground under him in gravity
      let wall = 0;
      for (let k = 1; k <= GAP + 1 && !wall; k++) if (wallAt(lead + s * k, my) || wallAt(lead + s * k, my - 1)) wall = k;
      const h = lead + s * (wall - 1);
      if (wall < 2 || my < 1 || h < 0 || h >= MLEN || shownSolid(h, my) || shownSolid(h, my - 1)) return;
      if (gravity && !shownSolid(h, my + 1)) return;
      const key = `${n}:${h}:${my}`;
      if (tried.has(key)) return;
      tried.add(key);
      tries.push({ n, h, y: my, snap: sim.snapshot() });
    });
  }
  for (const { n, h, y, snap } of tries) {
    if (pushes.has(n)) continue;
    sim.restore(snap);
    sim.place(h, y);
    await watch(n, pushes, []);
  }
  const where = { scene: d.scene, map: d.names.map };
  const out: Finding[] = [];
  for (const [n, cells] of sinks) {
    const top = (solidOf(n) & SOLTOP) !== 0;
    out.push({
      check: 'hurt-lock',
      severity: 'warning',
      title: `Landing on monster ${n} sinks the hero into the ground under it, first at ${at(cells[0])}`,
      detail: top
        ? 'Its solid top (SOLTOP) pushes a hero who touches it from above down under it, with no check for the floor, where it hurts him until he hops out. Leave out SOLTOP on hazards (keep SOLBOT and the sides): he still stands on its back and is pushed off its sides.'
        : 'Its solid side pushes a hero who lands on it down into the block beside it, with no check for walls. Keep it a block clear of walls and solid blocks.',
      where: { ...where, cell: cells[0], cells, monster: { file: d.names.mon ?? '', n } },
      ...(top ? { fix: 'no-soltop' as const } : {}),
    });
  }
  for (const [n, cells] of pushes)
    out.push({
      check: 'hurt-lock',
      severity: 'warning',
      title: `Monster ${n} pushes the hero inside a wall beside it, first at ${at(cells[0])}`,
      detail:
        'A solid monster’s side push puts him next to it with no check for walls, so where it walks up against a wall or solid block, a hero beside it (standing in the gap, or landing on it) ends up inside the block. Keep pacers a block clear of walls: end the path a block short, or move the wall.',
      where: { ...where, cell: cells[0], cells, monster: { file: d.names.mon ?? '', n } },
    });
  for (const [n, cells] of holds)
    out.push({
      check: 'hurt-lock',
      severity: 'warning',
      title: `Monster ${n} holds the hero while it hurts: once it touches him, no key gets him away (first at ${at(cells[0])})`,
      detail:
        'The hurt picture keeps him still while it stays on him. Give the Hurt sequence frames that move him back out of reach, or keep the monster from walking with him.',
      where: { ...where, cell: cells[0], cells, monster: { file: d.names.mon ?? '', n } },
    });
  return out;
}
