// Accepted findings: the stable key a finding goes by, and leaving accepted ones out.
import { describe, expect, it } from 'vitest';
import { findingKey, splitAccepted } from './accepted';
import type { Finding } from './findings';

const hold = (scene: number, x: number): Finding => ({
  check: 'hurt-lock',
  severity: 'warning',
  title: `Monster 9 holds the hero while it hurts: once it touches him, no key gets him away (first at (${x}, 10))`,
  where: { scene },
});

describe('accepted findings', () => {
  it('keys a finding by its check, scene and title, without where it was first seen', () => {
    expect(findingKey(hold(2, 33))).toBe('hurt-lock s2 Monster 9 holds the hero while it hurts');
    expect(findingKey(hold(2, 40))).toBe(findingKey(hold(2, 33)));
    expect(findingKey(hold(3, 33))).not.toBe(findingKey(hold(2, 33)));
    expect(findingKey({ check: 'hurt-lock', title: 'Monster 38 pushes the hero inside a wall beside it, first at (42, 11)', where: { scene: 7 } })).toBe(
      'hurt-lock s7 Monster 38 pushes the hero inside a wall beside it',
    );
    expect(findingKey({ check: 'ending', title: 'No won screen', where: {} })).toBe('ending s- No won screen');
  });

  it('keeps a place that is the finding itself, and measures before a colon', () => {
    expect(findingKey({ check: 'stuck', title: 'The hero can get stuck at (12, 4): no way up', where: { scene: 1 } })).toBe(
      'stuck s1 The hero can get stuck at (12, 4)',
    );
    expect(findingKey({ check: 'contrast', title: 'Monster 3 is hard to see against the scenery (contrast 1.2 : 1)', where: { scene: 1 } })).toBe(
      'contrast s1 Monster 3 is hard to see against the scenery (contrast 1.2 : 1)',
    );
  });

  it('splits findings into open and accepted', () => {
    const other: Finding = { ...hold(2, 33), title: 'Monster 4 holds the hero while it hurts: … (first at (1, 1))' };
    const r = splitAccepted([hold(2, 33), other, hold(5, 33)], ['hurt-lock s2 Monster 9 holds the hero while it hurts']);
    expect(r.accepted).toEqual([hold(2, 33)]);
    expect(r.open).toEqual([other, hold(5, 33)]);
  });
});
