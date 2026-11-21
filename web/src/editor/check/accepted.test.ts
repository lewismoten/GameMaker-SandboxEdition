// Accepted findings: the stable key a finding goes by, and leaving accepted ones out.
import { describe, expect, it } from 'vitest';
import type { Project } from '../core/project';
import { acceptedKeys, setAccepted, acceptedWhy, entriesWithoutReason, findingKey, reasonFor, splitAccepted, type AcceptedEntry } from './accepted';
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

describe('accepted entries with a reason', () => {
  it('reads strings and { finding, why } alike', () => {
    const list = ['a s1 x', { finding: 'b s2 y', why: 'on purpose' }, { finding: 'c s3 z', why: '  ' }];
    expect(acceptedKeys(list)).toEqual(['a s1 x', 'b s2 y', 'c s3 z']);
    expect(entriesWithoutReason(list)).toEqual(['a s1 x', 'c s3 z']);
    expect(acceptedWhy(list[1])).toBe('on purpose');
  });
  it('leaves out the findings of either shape', () => {
    const f = hold(2, 33);
    const k = findingKey(f);
    expect(splitAccepted([f], [{ finding: k, why: 'boss' }]).accepted).toEqual([f]);
    expect(splitAccepted([f], [k]).accepted).toEqual([f]);
  });
});

// Companion JSON can contain values outside AcceptedEntry's TypeScript shape.
it('skips entries with non-string reasons', () => {
  const malformed = { finding: 'k', why: 5 } as unknown as AcceptedEntry;
  expect(acceptedWhy(malformed)).toBe('');
  expect(reasonFor([malformed], 'k')).toBe('');
  expect(entriesWithoutReason([malformed])).toEqual([]);
  expect(acceptedKeys([malformed])).toEqual([]);
  expect(reasonFor([malformed, { finding: 'k', why: 'valid' }], 'k')).toBe('valid');
  expect(acceptedWhy({ finding: 'k', why: '  deliberate  ' })).toBe('deliberate');
});

it('skips null and malformed entries before reading their reason', () => {
  expect(entriesWithoutReason([null, undefined, {}, { finding: 5 }, 'k'] as unknown as AcceptedEntry[])).toEqual(['k']);
});

it('drops malformed entries on save and orders legacy and reasoned keys by code unit', () => {
  let list: unknown = [null, { finding: 'bad', why: 5 }, 'apple', { finding: 'Zed', why: 'boss' }];
  const project = {
    extras: () => list,
    setExtras: (_file: string, _section: string, value: unknown) => {
      list = value;
    },
  } as unknown as Project;
  setAccepted(project, 'Apple', true, '  maze  ');
  setAccepted(project, 'Zed');
  expect(list).toEqual([{ finding: 'Apple', why: 'maze' }, { finding: 'Zed', why: 'boss' }, 'apple']);
  setAccepted(project, 'Apple', true, ' ');
  setAccepted(project, 'Zed', false);
  expect(list).toEqual(['Apple', 'apple']);
});
