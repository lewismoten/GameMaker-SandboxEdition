// A leg in the headless simulator, and where the bot should head in a boss arena.
import { DIAG_DRIFT, DRIFT } from '../src/ids';
import { buildPalette } from '../src/art/pal';
import { buildDiagShip, buildShip, shipBlocks } from '../src/characters/ship';
import { Sim } from './sim';
import type { CharInfo } from '../../../web/src/engine/world';
import { buildLeg, startOf, type Leg } from '../src/stages/stage';
import { SPLICES, SPLICE_LENGTH } from '../src/stages/cable';
import { COILS, KINK, PITCH, coilOfLap } from '../src/stages/cableTrack';

export function simOf(l: Leg, seed = 1, ci?: CharInfo): Sim {
  const cb = shipBlocks(buildPalette('board'));
  const b = buildLeg(l);
  return new Sim(
    {
      map: b.map,
      bbl: b.bbl,
      mbl: b.mbl,
      mon: b.mon,
      chr: l.kind === 'diag' ? buildDiagShip(cb, DIAG_DRIFT) : buildShip(cb, l.kind === 'boss' ? 0 : DRIFT),
      cbl: cb.build(undefined, true),
      start: startOf(l),
      links: l.grid.links,
      scroll: { up: l.kind === 'boss' ? 0 : 0xff, down: 0, left: 0, right: l.kind === 'diag' ? 0xff : 0 },
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

/** How long the bot may take on a leg: the ribbon cable is five laps of the map. */
export const maxTicksOf = (l: Leg): number => (l.kind === 'boss' ? 2400 : l.kind === 'diag' ? 4000 : 1600);

/**
 * The walkthrough's pilot on the ribbon cable: keep to the middle of the cable at cruising
 * speed (the goal is where the drift alone would take it, so it only speeds up or brakes to
 * dodge), and at the last tape splice cross to the next coil down on purpose, sliding along
 * the cable's lower edge until the tape opens; the earlier splice it rides past, so the
 * walkthrough shows a lap and a kink as well as a shortcut. Returns a goal for fly().
 */
export function cableGoal(s: Sim): { x: number; y: number } {
  const lap = 100 * 20;
  const cx = (s.pos.x + 10) % lap;
  const cy = (s.pos.y + 10) % lap;
  const flat = Math.floor(cx / 20) >= KINK;
  const T = (((flat ? cy / 20 + KINK : (cx + cy) / 20) % (COILS * PITCH)) + COILS * PITCH) % (COILS * PITCH);
  const coil = Math.floor(T / PITCH);
  let across = 13.5 - (T - coil * PITCH);
  const bx = Math.floor(cx / 20);
  for (const [l, x0] of SPLICES.slice(-1)) if (coil === coilOfLap(l) && bx >= x0 - 8 && bx < x0 + SPLICE_LENGTH - 6) across += PITCH;
  // ahead along the cable, and across it by `across` (t grows right and down)
  const ahead = DIAG_DRIFT * 10;
  return flat ? { x: s.pos.x + ahead, y: s.pos.y + across * 20 } : { x: s.pos.x + ahead + across * 10, y: s.pos.y - ahead + across * 10 };
}
