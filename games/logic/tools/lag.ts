// "None needs fast fingers": plays every board's solution the way a person taps, with `lag`
// extra ticks after each roll. At a '$' (wait for the current) the player watches for a
// moment from which the whole next stretch, up to the next '$', works at that pace; if none
// comes within 150 ticks, or Watt is zapped anyway, the board fails at that lag.
//   cd web && npx vite-node ../games/logic/tools/lag.ts        (or as part of check.ts)
import { newCharInfo } from '../../../web/src/engine/world';
import { BOARDS } from '../src/levels/boards';
import { compileHouse } from '../src/levels/board';
import { buildMonsterBlocks, buildWattBlocks } from '../src/sprites/sprites';
import { buildWatt } from '../src/characters/watt';
import { Sim } from './sim';

const SCAN: Record<string, number> = { U: 0x48, D: 0x50, L: 0x4b, R: 0x4d };

async function run(sim: Sim, n: number): Promise<void> {
  for (let i = 0; i < n && !sim.dead && sim.link < 0; i++) await sim.tick();
}

/** Plays a stretch of a solution: each roll, then `lag` more ticks before the next key. */
async function play(sim: Sim, moves: string, lag: number): Promise<void> {
  for (const ch of moves) {
    if (sim.dead || sim.link >= 0) return;
    if (ch === '.') await run(sim, 9);
    else if (ch === 'w') await run(sim, 30);
    else if (ch in SCAN) {
      sim.press(SCAN[ch]);
      await run(sim, 1);
      sim.release(SCAN[ch]);
      for (let i = 0; i < 20 && sim.w.chr.cseq !== 0 && !sim.dead && sim.link < 0; i++) await run(sim, 1);
      await run(sim, 1 + lag);
    }
  }
}

/** Every board that a player tapping with this much lag can't finish, with why. */
export async function lagFailures(lag: number, only?: string): Promise<string[]> {
  const mb = buildMonsterBlocks();
  const cb = buildWattBlocks();
  const fails: string[] = [];
  for (const room of compileHouse(BOARDS, mb))
    for (const b of room.boards) {
      if (only && b.spec.file !== only) continue;
      const chr = buildWatt(cb, b.mons.id('boom'));
      const scene = { map: b.map, bbl: room.tiles.build(), mbl: mb.build(), mon: b.mons.build(), chr, cbl: cb.build(), links: [{ from: b.exit, to: b.exit }] };
      const sim = new Sim(scene, b.start, newCharInfo());
      await run(sim, 10);
      let why = '';
      const legs = b.spec.solution.replace(/\s+/g, '').split('$');
      for (const [i, leg] of legs.entries()) {
        if (i > 0) {
          const at = sim.snapshot();
          let found = -1;
          for (let d = 0; d < 150 && found < 0; d++) {
            sim.restore(at);
            await run(sim, d);
            await play(sim, leg, lag);
            await run(sim, 14);
            if (!sim.dead && sim.w.chr.cseq !== 1) found = d;
          }
          sim.restore(at);
          if (found < 0) {
            why = `no safe moment before stretch ${i}`;
            break;
          }
          await run(sim, found);
        }
        await play(sim, leg, lag);
        if (sim.dead) break;
      }
      await run(sim, 60);
      if (sim.link < 0) fails.push(`${b.spec.file} (${why || (sim.dead ? `zapped at ${sim.pos.bx - b.ox},${sim.pos.by - b.oy}` : 'stuck')})`);
    }
  return fails;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (let lag = 0; lag <= 9; lag++) console.log(`lag ${lag}: ${(await lagFailures(lag)).join(', ') || 'ok'}`);
}
