// Shared roles and generator for the layout property tests.
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate, type GenKind } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';

export const set = (...pairs: [number, string[], number?][]): RoleMap =>
  Object.fromEntries(pairs.map(([n, roles, pair]) => [n, { roles, ...(pair ? { pair } : {}) }])) as RoleMap;
export const full = set(
  [1, ['wall']],
  [2, ['floor']],
  [10, ['locked-door'], 1],
  [11, ['key'], 1],
  [12, ['locked-door'], 2],
  [13, ['key'], 2],
  [20, ['treasure']],
  [21, ['life']],
  [5, ['tree']],
);
const whole = { x: 0, y: 0, w: 100, h: 100 };
export const run = (kind: GenKind, roles: RoleMap, seed: number, monsters?: number[]) => {
  const o = generate(roles, { kind, seed, rect: whole, monsters });
  if (!o.ok) throw new Error(o.message);
  return o.result;
};
