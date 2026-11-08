import { describe, expect, it } from 'vitest';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { ALL, NONE, roleChoices, showsBlock } from './roleFilter';

const roles: RoleMap = { 0: { roles: ['wall'] }, 2: { roles: ['wall', 'wall-edge'] }, 3: { roles: ['floor'] } };

describe('role filter', () => {
  it('lists all, each role in use with its count, and no role set', () => {
    expect(roleChoices(roles, 5).map(([v, t]) => `${v}:${t}`)).toEqual([
      'all:All blocks',
      'floor:Floor (1)',
      'wall:Wall (2)',
      'wall-edge:Wall edge or corner (1)',
      'none:No role set (2)',
    ]);
  });
  it('has nothing to filter by when no roles are set', () => {
    expect(roleChoices({}, 5)).toEqual([[ALL, 'All blocks']]);
  });
  it('shows blocks by choice', () => {
    expect([0, 1, 2, 3, 4].filter((n) => showsBlock(roles, 'wall', n))).toEqual([0, 2]);
    expect([0, 1, 2, 3, 4].filter((n) => showsBlock(roles, NONE, n))).toEqual([1, 4]);
    expect([0, 1, 2].filter((n) => showsBlock(roles, ALL, n))).toEqual([0, 1, 2]);
  });
});
