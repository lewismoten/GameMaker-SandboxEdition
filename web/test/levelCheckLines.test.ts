// The Level check's command line: a taste check's warning is advice, never a build failure.
import { describe, expect, it } from 'vitest';
import { splitLines } from '../../games/kit/levelCheckLines';
import type { Finding } from '../src/editor/check/findings';

const f = (check: Finding['check'], severity: Finding['severity'], title: string): Finding => ({ check, severity, title, where: { scene: 2 } });

describe('levelCheck lines', () => {
  it('keeps errors and fact warnings as hard lines and taste warnings as advice', () => {
    const { hard, advice } = splitLines([f('missing-file', 'error', 'A part is missing'), f('density', 'warning', 'Many foes'), f('maze', 'info', 'Note')]);
    expect(hard).toEqual(['error missing-file s2 A part is missing']);
    expect(advice).toEqual(['warning density s2 Many foes']);
  });
  it('treats a taste check that reports an error as a hard line', () => {
    expect(splitLines([f('density', 'error', 'Too many')]).hard).toHaveLength(1);
  });
});
