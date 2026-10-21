// Plays every board's solution in the headless sim: Watt has to reach the outlet alive.
// Also checks that reboot (R) works and counts the most monsters alive at once.
import { newCharInfo } from '../../web/src/engine/world';
import { LASTMON } from '../../web/src/formats/monster';
import { Sim } from './sim';
import type { Board } from './board';
import type { BlockSet } from './sets';
import type { Character } from '../../web/src/formats/character';

const SCAN: Record<string, number> = { U: 72, D: 80, L: 75, R: 77, r: 19 };

/** A copy of a running sim, to try a move without making it. */
function cloneSim(sim: Sim): Sim {
  const copy = Object.create(Sim.prototype) as Sim;
  Object.assign(copy, sim);
  const { sound, rand, joystick, ...rest } = sim.w;
  Object.assign(copy, { w: { ...structuredClone(rest), sound, rand, joystick } });
  const priv = copy as unknown as { held: Set<number>; pending: number[]; onKey?: unknown };
  priv.held = new Set((sim as unknown as { held: Set<number> }).held);
  priv.pending = [...(sim as unknown as { pending: number[] }).pending];
  priv.onKey = undefined;
  return copy;
}

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
    b.start,
    newCharInfo(),
  );
  const keys: Played['keys'] = [];
  sim.onKey = (key) => keys.push({ tick: sim.ticks, key });
  let peak = 0;
  let dying = false;
  const count = () => (peak = Math.max(peak, sim.w.mm.filter((m) => m.monnum < LASTMON).length));
  const run = async (n: number) => {
    for (let i = 0; i < n && !sim.dead && sim.link < 0; i++) {
      if (process.env.DEBUG === '3') {
        const w = sim.w;
        const { picChkTouch, monPicNum } = await import('../../web/src/engine/monsters');
        const { chrFrame } = await import('../../web/src/engine/keys');
        w.mm.forEach((m, i) => {
          const mi = w.mi[i];
          if (m.monnum >= LASTMON || mi.scrPos.x === -100) return;
          const lx = Math.min(mi.scrPos.x, w.ci.scrx);
          const ly = Math.min(mi.scrPos.y, w.ci.scry);
          const pic = monPicNum(w, i);
          const f = chrFrame(w);
          if (
            pic < 100 &&
            f.pic2 < 50 &&
            picChkTouch(w.ci.scrx - lx, w.ci.scry - ly, w.cblk[f.pic2].pixels, mi.scrPos.x - lx, mi.scrPos.y - ly, w.mblk[pic].pixels)
          )
            console.log(sim.ticks, 'touch', b.mons.names[m.monnum], mi.scrPos, 'watt', w.ci.scrx, w.ci.scry, 'frame', f.pic2, 'hp', w.ci.hitpts);
        });
      }
      await sim.tick();
      count();
      if (process.env.DEBUG === '2') {
        const w = sim.w;
        const near = w.mm.flatMap((m, i) =>
          m.monnum < LASTMON && Math.abs(w.mi[i].scrPos.x - w.ci.scrx) < 24 && Math.abs(w.mi[i].scrPos.y - w.ci.scry) < 24
            ? [`${b.mons.names[m.monnum]}(${w.mi[i].scrPos.x},${w.mi[i].scrPos.y} o${w.mi[i].orient} p${w.mi[i].curPic})`]
            : [],
        );
        if (near.length)
          console.log(sim.ticks, 'watt', w.ci.scrx, w.ci.scry, 'seq', w.chr.cseq, 'hp', w.ci.hitpts, 'grav', w.ci.gravx, w.ci.gravy, near.join(' '));
      }
      if (process.env.DEBUG && sim.w.chr.cseq === 1 && !dying) {
        dying = true;
        const w = sim.w;
        console.log('dies at tick', sim.ticks, 'watt', w.chr.x, w.chr.y, 'scr', w.ci.scrx, w.ci.scry);
        w.mm.forEach((m, i) => m.monnum < LASTMON && console.log('  ', b.mons.names[m.monnum], w.mi[i].curx, w.mi[i].cury, w.mi[i].scrPos, w.mi[i].fromchar));
      }
    }
  };
  await run(10);
  let waitSafe = false;
  for (const ch of moves.replace(/\s+/g, '')) {
    if (sim.dead || sim.link >= 0) break;
    if (ch === '$') {
      waitSafe = true;
      continue;
    }
    if (waitSafe && ch in SCAN) {
      // like a careful player: wait for the first moment the move can be made safely (tried
      // on copies of the board, a few ticks ahead)
      waitSafe = false;
      for (let d = 0; d < 120; d++) {
        const trial = cloneSim(sim);
        for (let i = 0; i < d; i++) await trial.tick();
        trial.press(SCAN[ch]);
        await trial.tick();
        trial.release(SCAN[ch]);
        for (let i = 0; i < 14 && !trial.dead; i++) await trial.tick();
        if (!trial.dead && trial.w.chr.cseq !== 1) {
          await run(d);
          break;
        }
      }
    }
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
  await run(60);
  const p = sim.pos;
  const why = sim.dead ? `zapped at ${p.bx - b.ox},${p.by - b.oy}` : sim.link >= 0 ? 'reached the outlet' : `stopped at ${p.bx - b.ox},${p.by - b.oy}`;
  return { ok: sim.link >= 0 && !sim.dead, ticks: sim.ticks, peak, why, keys };
}
