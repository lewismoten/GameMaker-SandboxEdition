// The Fit choice is remembered per slot in the companion file, and the default stores nothing.
import { describe, expect, it } from 'vitest';
import { emptyCompanion, getSection, isEmptyCompanion, setSection } from '../../../project/companion';
import { setSlotFit, slotFit } from './speakerFit';

const fakeProject = () => {
  const companion = emptyCompanion();
  return {
    companion,
    extras: <T>(file: string, section: string, fallback: T) => getSection(companion, file, section, fallback),
    setExtras: (file: string, section: string, value: unknown) => setSection(companion, file, section, value),
  };
};

describe('speaker fit per slot', () => {
  it('is the whole sound until the author picks', () => {
    expect(slotFit(fakeProject(), 'GAME.SND', 3)).toBe('whole');
  });

  it('remembers each slot on its own sound set', () => {
    const p = fakeProject();
    setSlotFit(p, 'GAME.SND', 3, 'start');
    expect(slotFit(p, 'game.snd', 3)).toBe('start');
    expect(slotFit(p, 'GAME.SND', 4)).toBe('whole');
    expect(slotFit(p, 'OTHER.SND', 3)).toBe('whole');
  });

  it('keeps nothing once every slot is back to the default', () => {
    const p = fakeProject();
    setSlotFit(p, 'GAME.SND', 3, 'start');
    setSlotFit(p, 'GAME.SND', 3, 'whole');
    expect(isEmptyCompanion(p.companion)).toBe(true);
  });

  it('ignores a value it does not know', () => {
    const p = fakeProject();
    p.setExtras('GAME.SND', 'speakerFit', { 2: 'sideways' });
    expect(slotFit(p, 'GAME.SND', 2)).toBe('whole');
  });
});
