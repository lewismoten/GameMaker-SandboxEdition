// A leg in the headless simulator, and where the bot should head in a boss arena.
import { DRIFT } from '../src/ids';
import { buildPalette } from '../src/art/pal';
import { buildShip, shipBlocks } from '../src/characters/ship';
import { Sim } from './sim';
import type { CharInfo } from '../../../web/src/engine/world';
import { buildLeg, startOf, type Leg } from '../src/stages/stage';

export function simOf(l: Leg, seed = 1, ci?: CharInfo): Sim {
  const cb = shipBlocks(buildPalette('board'));
  const b = buildLeg(l);
  return new Sim(
    {
      map: b.map,
      bbl: b.bbl,
      mbl: b.mbl,
      mon: b.mon,
      chr: buildShip(cb, l.kind === 'boss' ? 0 : DRIFT),
      cbl: cb.build(undefined, true),
      start: startOf(l),
      links: l.grid.links,
      scroll: l.kind === 'boss' ? { up: 0, down: 0, left: 0, right: 0 } : { up: 0xff, down: 0, left: 0, right: 0 },
      names: l.kit.beasts.names,
    },
    ci,
    seed,
  );
}

/** In an arena: wait under the boss's weak points, then make for the way out once it is open. */
export function arenaGoal(s: Sim): { x: number; y: number } {
  const links = s.scene.links;
  const parts = s.live().filter((m) => /^head|^core|^part/.test(m.name));
  const lx = (links.reduce((n, l) => n + l.x, 0) / links.length) * 20;
  const ly = links[0].y * 20;
  return parts.length ? { x: lx - 10 + Math.sin(s.ticks / 9) * 30, y: ly + 5 * 20 } : { x: lx - 10, y: ly };
}
