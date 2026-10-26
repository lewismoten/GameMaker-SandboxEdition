// The bot's way through hill.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { charge } from './helpers';
import { HILL, TOP_ROW } from '../../src/levels/hill';

/** Monster `name`'s slots in the simulator. */
const slots = (s: Sim, name: string) => s.w.mm.flatMap((m, i) => (s.scene.names?.[m.monnum] === name ? [s.w.mi[i]] : []));

/** The ferry at the near dock, in time to board (at rest, or creeping off a pixel a tick). */
const docked = (s: Sim) => slots(s, 'ferryStern').some((mi) => mi.curx[0] === HILL.stern && (mi.curx[1] === 0 || (mi.curx[1] % 5 !== 0 && mi.curx[1] < 10)));

/** Cow `name` has just ambled out into the field (the first of her field pictures). */
const cowAway = (s: Sim, name: string) => slots(s, name).some((mi) => mi.curPic === (name === 'cow' ? 5 : 0));

export const route: Order[] = [
  { until: 'charged', maxTicks: 60, check: (s) => charge(s) >= 1 },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.y === 39 && m.x <= HILL.geese) },
  { trick: 'space', after: 16 },
  { walk: HILL.dock },
  { until: 'the ferry is in', maxTicks: 120, check: docked },
  { walk: HILL.stern + 2, grab: false },
  { until: 'across', maxTicks: 120, check: (s) => s.monsters('ferryStern').some((m) => m.x >= HILL.farBank - 2) },
  { walk: HILL.farBank + 1 },
  { walk: HILL.cow - 2 },
  { until: 'the cow ambles off', maxTicks: 120, check: (s) => cowAway(s, 'cow') },
  { walk: HILL.charger2 },
  { until: 'three charges', maxTicks: 90, check: (s) => charge(s) >= 3 },
  { walk: HILL.climb[2] + 2 },
  { walk: HILL.charger3 },
  { until: 'charged', maxTicks: 60, check: (s) => charge(s) >= 1 },
  { trick: 'space', after: 4 },
  { until: 'the bridge is down', maxTicks: 60, check: (s) => s.monsters('gullyDeck0').length > 0 },
  { walk: HILL.geese2 - 3 },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.y === TOP_ROW && m.x <= HILL.geese2) },
  { trick: 'space', after: 16 },
  { walk: HILL.charger4 },
  { until: 'two charges', maxTicks: 90, check: (s) => charge(s) >= 2 },
  { until: 'the cow ambles off', maxTicks: 120, check: (s) => cowAway(s, 'cow2') },
  { walk: HILL.exit },
];
