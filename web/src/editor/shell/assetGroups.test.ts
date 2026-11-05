import { describe, expect, it } from 'vitest';
import { FILE_ORDER } from './fileKinds';
import { ASSET_GROUPS, groupedKinds } from './assetGroups';

describe('Overview groups', () => {
  it('name every kind exactly once', () => {
    const all = ASSET_GROUPS.flatMap((g) => g.kinds);
    expect([...all].sort()).toEqual([...FILE_ORDER].sort());
    expect(groupedKinds()).toBe(ASSET_GROUPS);
  });
});
