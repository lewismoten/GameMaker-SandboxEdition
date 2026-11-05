// What each scene of a game supplies to each special counter (money and 20-29), by source kind:
// map blocks, and monsters that add to it when touched or turn into something that does when
// they die. The Level check's `counters` words a door's finding from it. Pure data, no DOM
// (it runs in a Web Worker). It counts the map as drawn: a block a birth block makes, a priced
// shop chain, a shot that never lands and respawns are out of sight.
import { BACKBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { blockUse, type SceneData } from '../sceneData';

export interface SceneSupply {
  scene: number;
  name: string;
  /** Total the map's blocks add (Infinity: a refill that stays put gives as much as the hero likes). */
  blocks: number;
  /** Total from placed monsters (touch, or the pickup they leave when they die). */
  monsters: number;
  /** How many placed monsters add to it. */
  monsterCount: number;
}

/** Per counter, the scenes that supply it (only those that do). */
export type Ledger = Map<number, SceneSupply[]>;

const special = (b: Block | undefined): b is Block => !!b && (b.effect === 3 || b.effect >= 20);

/** What a block adds to `e` when touched, following what it turns into (touch, then timer); 0 if nothing. */
function adds(bg: Block[], start: number, e: number): number {
  const seen = new Set<number>();
  const todo = [start];
  while (todo.length) {
    const n = todo.shift()!;
    const b = bg[n];
    if (!b || seen.has(n)) continue;
    seen.add(n);
    if (special(b) && b.effect === e && b.eamt > 0) return b.touchBl === n ? Infinity : b.eamt;
    todo.push(b.touchBl);
    if (b.ntime > 0) todo.push(b.nextBl);
  }
  return 0;
}

/** What a monster adds to `e`: its picture's block touched, or a monster it dies into (a chain). */
function monsterGives(d: SceneData, n: number, e: number): number {
  const seen = new Set<number>();
  let total = 0;
  while (n >= 0 && n < LASTMON && !seen.has(n) && d.mon[n]) {
    seen.add(n);
    for (const [p] of d.mon[n].pic) if (p < BACKBL) total = Math.max(total, adds(d.mbl, p, e));
    n = d.mon[n].newmon;
  }
  return total;
}

export function counterLedger(scenes: SceneData[]): Ledger {
  const out: Ledger = new Map();
  for (const d of scenes) {
    const use = blockUse(d.map);
    const counters = new Set<number>();
    for (const b of [...d.bbl, ...d.mbl]) if (special(b) && b.eamt > 0) counters.add(b.effect);
    const placed = d.map.monsters.filter((p) => p.monnum < LASTMON && !!d.mon[p.monnum] && p.curx >= 0 && p.curx < MLEN && p.cury >= 0 && p.cury < MWID);
    for (const e of counters) {
      let blocks = 0;
      for (let n = 0; n < BACKBL; n++) if (use[n]) blocks += adds(d.bbl, n, e) * use[n];
      let monsters = 0;
      let monsterCount = 0;
      for (const p of placed) {
        const g = monsterGives(d, p.monnum, e);
        if (g > 0) {
          monsters += g;
          monsterCount++;
        }
      }
      if (blocks > 0 || monsters > 0) out.set(e, [...(out.get(e) ?? []), { scene: d.scene, name: d.name, blocks, monsters, monsterCount }]);
    }
  }
  return out;
}

const total = (s: SceneSupply) => s.blocks + s.monsters;
const num = (n: number) => (n === Infinity ? 'any number' : String(n));
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** What a scene gives: the total, and its parts by source kind when there is more than one kind. */
export function supplyWords(s: SceneSupply): string {
  if (s.monsterCount === 0) return num(s.blocks);
  const m = `${num(s.monsters)} from ${s.monsterCount} monster${s.monsterCount === 1 ? '' : 's'}`;
  return s.blocks > 0 ? `${num(total(s))} (${num(s.blocks)} from blocks, ${m})` : m;
}

/** The ledger's words for a gate: this scene, the other scenes, and whether the whole game covers it. */
export function ledgerFor(
  ledger: Ledger,
  e: number,
  scene: number,
  start: number,
  need: number,
): { here: number; others: SceneSupply[]; all: number; title: string; detail: string } {
  const rows = ledger.get(e) ?? [];
  const here = rows.find((r) => r.scene === scene);
  const others = rows.filter((r) => r.scene !== scene);
  const hereN = here ? total(here) : 0;
  const all = start + rows.reduce((s, r) => s + total(r), 0);
  const elsewhere = others.length ? list(others.map((o) => `${o.name} ${supplyWords(o)}`)) : 'no other scene gives any';
  const title = `needs ${need}; this scene gives ${here ? supplyWords(here) : 0}; ${others.length ? `${list(others.map((o) => o.name))} give ${num(others.reduce((s, o) => s + total(o), 0))}` : 'no other scene gives any'}`;
  const detail = `The hero starts with ${start}. Supply, counting the maps as drawn: this scene ${here ? supplyWords(here) : 0}; ${elsewhere}. Counters carry from scene to scene.`;
  return { here: hereN, others, all, title, detail };
}
