// Tests: which games from ../games count as Sandbox Software's own (project/files.ts isSandboxGame).
import { describe, expect, it } from 'vitest';
import { isSandboxGame } from '../src/project/files';

describe('isSandboxGame', () => {
  it('is our own games, under Sandbox Software (or no company named)', () => {
    expect(isSandboxGame({ original: {}, company: 'Sandbox Software' })).toBe(true);
    expect(isSandboxGame({ original: {} })).toBe(true);
  });
  it('leaves out games from ../games under another publisher, and the CD shareware', () => {
    expect(isSandboxGame({ original: {}, company: 'The Bard of Bizarre' })).toBe(false);
    expect(isSandboxGame({ company: 'A-J Games' })).toBe(false);
  });
});
