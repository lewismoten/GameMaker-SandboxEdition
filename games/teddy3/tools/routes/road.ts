// The bot's way through road.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import { charge } from './helpers';
import type { Sim } from '../../../kit/sceneSim';
import { ROAD } from '../../src/levels/road';

/**
 * The ferry at the near dock, in time to board: its stern in the dock's first cell, at rest or
 * creeping off (a pixel a tick, in its first half block; coming home it moves 5 at a time).
 */
const docked = (s: Sim) =>
  s.w.mm.some((m, i) => {
    const sub = s.w.mi[i].curx[1];
    return s.scene.names?.[m.monnum] === 'ferryStern' && s.w.mi[i].curx[0] === ROAD.stern && (sub === 0 || (sub % 5 !== 0 && sub < 10));
  });

export const route: Order[] = [
  { walk: ROAD.geese - 3, grab: false },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= ROAD.geese) },
  { trick: 'space', after: 16 },
  { walk: ROAD.lift - 3 },
  { trick: 'space', after: 4 },
  { until: 'the bridge is down', maxTicks: 60, check: (s) => s.monsters('liftDeck0').length > 0 },
  { walk: ROAD.geese2 - 3 },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= ROAD.geese2) },
  { trick: 'space', after: 16 },
  { walk: ROAD.dock },
  { until: 'the ferry is in', maxTicks: 120, check: (s) => docked(s) },
  { walk: ROAD.stern + 2, grab: false },
  { until: 'across', maxTicks: 120, check: (s) => s.monsters('ferryStern').some((m) => m.x >= ROAD.farBank - 2) },
  { walk: ROAD.farBank + 1 },
  { walk: ROAD.charger1 },
  { until: 'charged', maxTicks: 60, check: (s) => charge(s) >= 1 },
  { walk: ROAD.charger2 },
  { until: 'two charges', maxTicks: 80, check: (s) => charge(s) >= 2 },
  { trick: 'space', after: 4 },
  { until: 'the timed bridge is down', maxTicks: 60, check: (s) => s.monsters('timedDeck0').length > 0 },
  { walk: ROAD.geese3 - 3 },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.y === 37 && m.x <= ROAD.geese3) },
  { trick: 'space', after: 16 },
  { walk: ROAD.exit },
];
