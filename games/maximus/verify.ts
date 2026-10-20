// Plays parts of the built game headlessly (the engine's own movement, touch and monster
// code via sim.ts) to check that they work: the training deck can be crossed, rovers can
// drive around their worlds, and nothing kills the courier the moment it lands.
import { SCAN } from './common';
import type { Built, SceneInfo } from './game';
import { Sim } from './sim';

const key = SCAN;

export function simFor(b: Built, info: SceneInfo, seed = 1): Sim {
  const sets = b.sets as Record<string, { blocks: import('../../web/src/formats/blocks').Block[] }>;
  const famFile = b.game.scenes[info.scene].files[3];
  const ms = Object.values(b.monsters).find((m) => `${m.name}.mon` === famFile);
  const chr = b.chars[info.chr];
  const links = b.game.scenes[info.scene].links.filter((l) => l.toScene !== 0xffff).map((l) => ({ from: l.from, to: l.to }));
  return new Sim(
    { map: info.map.toMap(), bbl: sets[info.bbl].blocks, mbl: ms?.mbl, mon: ms?.mon, chr: chr.chr, cbl: chr.cbl, links },
    info.arrive,
    undefined,
    seed,
  );
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
