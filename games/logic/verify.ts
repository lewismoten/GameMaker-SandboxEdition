// Plays every board's solution in the headless sim: Watt has to reach the outlet alive.
// Also checks that reboot (R) works and counts the most monsters alive at once.
import { newCharInfo } from '../../web/src/engine/world';
import { LASTMON } from '../../web/src/formats/monster';
import { Sim } from './sim';
import type { Board } from './board';
import type { BlockSet } from './sets';
import type { Character } from '../../web/src/formats/character';

const SCAN: Record<string, number> = { U: 72, D: 80, L: 75, R: 77, r: 19 };

export interface Played {
  ok: boolean;
  ticks: number;
  peak: number;
  why: string;
  keys: { tick: number; key: number }[];
}

export async function playSolution(b: Board, tiles: BlockSet, mb: BlockSet, cb: BlockSet, chr: Character, moves = b.spec.solution): Promise<Played> {
  const sim = new Sim(
    { map: b.map, bbl: tiles.build(), mbl: mb.build(), mon: b.mons.build(), chr, cbl: cb.build(), links: [{ from: b.exit, to: b.exit }] },
    { x: 18, y: 15 },
    newCharInfo(),
  );
  const keys: Played['keys'] = [];
  sim.onKey = (key) => keys.push({ tick: sim.ticks, key });
  let peak = 0;
  const count = () => (peak = Math.max(peak, sim.w.mm.filter((m) => m.monnum < LASTMON).length));
  const run = async (n: number) => {
    for (let i = 0; i < n && !sim.dead && sim.link < 0; i++) {
      await sim.tick();
      count();
    }
  };
  await run(10);
  for (const ch of moves.replace(/\s+/g, '')) {
    if (sim.dead || sim.link >= 0) break;
    if (ch === '.') await run(9);
    else if (ch === 'w') await run(30);
    else if (ch in SCAN) {
      sim.press(SCAN[ch]);
      await run(1);
      sim.release(SCAN[ch]);
      for (let i = 0; i < 20 && sim.w.chr.cseq !== 0 && !sim.dead && sim.link < 0; i++) await run(1);
      await run(1);
    } else throw new Error(`Bad move ${ch}`);
  }
  await run(10);
  const p = sim.pos;
  const why = sim.dead ? `zapped at ${p.bx - 10},${p.by - 10}` : sim.link >= 0 ? 'reached the outlet' : `stopped at ${p.bx - 10},${p.by - 10}`;
  return { ok: sim.link >= 0 && !sim.dead, ticks: sim.ticks, peak, why, keys };
}
