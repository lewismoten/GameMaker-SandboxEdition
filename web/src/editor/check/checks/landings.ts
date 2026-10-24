// The level check's touch probe: on the real engine (sim.ts), the hero is dropped onto each
// solid monster that hurts, and walked into each monster that hurts, at a few moments after
// the scene starts. Two things are real trouble there, where "solid and hurts" alone is not:
// - a sink: landing on it pushes the hero into the ground under it, where it hurts him until
//   he hops out (wave 8b found these in four games);
// - a hold: once it touches him, no move gets him away before it has taken his life (the hurt
//   picture keeps him still while it walks with him, or stands on him).
// The hero is put down as a scene start does (SceneSim.place), so no stale screen position
// pushes him, and nothing is dropped from above the map's top row (the map wraps there).
import { MONBL } from '../../../formats/blocks';
import { DIESEQ } from '../../../formats/character';
import type { Game } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import { monPicNum } from '../../../engine/monsters';
import { LASTMM, LASTMON, bgBlock } from '../../../engine/world';
import { at, type Finding } from '../findings';
import { getsAway } from '../escape';
import { keyRoles, movesFor } from '../inputs';
import { linksInto } from '../playtest';
import { SceneSim, type FileSource } from '../sim';
import type { SceneData } from '../sceneData';

/** Ticks after the hero comes in at which monsters are probed (they move on between). */
const MOMENTS = [0, 20, 40];
/** Placed copies of one monster probed, and monsters (by number) a scene. */
const SLOTS_EACH = 2;
const MONSTERS = 16;

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
  sim.freezeBeyond = { x: 24, y: 15 };
  const w = sim.w;
  const gravity = w.bg.some((b) => b.grav !== 0);
  const moves = movesFor(keyRoles(w.chr, gravity), gravity);
  const walks = keyRoles(w.chr, gravity).move.filter((m) => m.dy === 0 && m.dx !== 0);
  const shownSolid = (x: number, y: number) => bgBlock(w, w.blkmap[w.map[((y + MWID) % MWID) * MLEN + ((x + MLEN) % MLEN)]] ?? 0).solid !== 0;
  const inside = () => {
    const c = w.chr;
    return shownSolid(c.x[0], c.y[0]) && (c.x[1] === 0 || shownSolid(c.x[0] + 1, c.y[0]));
  };
  const picOf = (l: number) => {
    const p = monPicNum(w, l);
    return p < MONBL ? w.mblk[p] : undefined;
  };
  // which slots to probe: placed monsters with a picture that hurts, a few of each
  const each = new Map<number, number[]>();
  for (let l = 0; l < LASTMM; l++) {
    const n = w.mm[l].monnum;
    if (n >= LASTMON || !w.mon[n]?.pic.some(([p]) => p < MONBL && w.mblk[p]?.chHitPt < 0)) continue;
    const list = each.get(n) ?? [];
    if (list.length < SLOTS_EACH) each.set(n, [...list, l]);
  }
  const slots = [...each.values()].slice(0, MONSTERS).flat();
  if (!slots.length) return [];
  const moments = [];
  for (let t = 0; t <= MOMENTS[MOMENTS.length - 1]; t++) {
    if (MOMENTS.includes(t)) moments.push(sim.snapshot());
    if (await sim.tick()) break;
  }
  const sinks = new Map<number, number[]>();
  const holds = new Map<number, number[]>();
  const tested = new Map<number, number>();
  /** Plays from the hero's new place: did he sink into the ground, or get held while hurt? */
  const watch = async (n: number, landing: boolean, toward: number[]) => {
    const start = { x: w.chr.x[0], y: w.chr.y[0] };
    sim.hold(toward);
    for (let t = 0; t < 40; t++) {
      const hp = w.ci.hitpts;
      const r = await sim.tick();
      if (r || w.chr.cseq === DIESEQ) return;
      const cell = w.chr.y[0] * MLEN + w.chr.x[0];
      // pushed far on the first ticks: something else was where he was put
      if (t <= 1 && (Math.abs(w.chr.x[0] - start.x) > 2 || Math.abs(w.chr.y[0] - start.y) > 4)) return;
      if (landing && inside()) {
        sinks.set(n, [...(sinks.get(n) ?? []), cell]);
        return;
      }
      if (w.ci.hitpts < hp) {
        // the first touch: can he get away from here? (tried a few times a monster, once it holds)
        const k = tested.get(n) ?? 0;
        if (k < 0 || k >= 3) return;
        const away = await getsAway(sim, moves);
        tested.set(n, away ? k + 1 : -1);
        if (!away) holds.set(n, [...(holds.get(n) ?? []), cell]);
        return;
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
      const pic = picOf(l);
      // dropped from three blocks over it (open air, and inside the map: it wraps at the top)
      if (gravity && pic && pic.solid & 1 && my >= 4 && !shownSolid(mx, my - 2) && !shownSolid(mx, my - 3) && !shownSolid(mx, my - 4)) {
        sim.place(mx, my - 3);
        w.chr.x[1] = mi.curx[1];
        await watch(n, true, []);
        sim.restore(snap);
      }
      // walked into from two blocks to the side, standing on ground as the monster is
      for (const side of [-1, 1]) {
        const hx = mx + side * 2;
        const walk = walks.find((m) => m.dx === -side);
        if (!walk || hx < 0 || hx >= MLEN || my < 2 || shownSolid(hx, my) || shownSolid(hx, my - 1)) continue;
        if (gravity && !shownSolid(hx, my + 1)) continue;
        sim.restore(snap);
        sim.place(hx, my);
        await watch(n, false, [walk.scan]);
      }
    }
  const where = { scene: d.scene, map: d.names.map };
  const out: Finding[] = [];
  for (const [n, cells] of sinks)
    out.push({
      check: 'hurt-lock',
      severity: 'warning',
      title: `Landing on monster ${n} sinks the hero into the ground under it, first at ${at(cells[0])}`,
      detail: 'It is solid on top and hurts, so it pushes him down into the floor, where it hurts him until he hops out. Make it solid only at its sides.',
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
