// The music editor's tabs and their arrow keys.
import { describe, expect, it } from 'vitest';
import { stepTab } from '../src/editor/editors/music/tabs';

describe('music editor tabs', () => {
  it('arrows wrap around, Home and End jump, other keys do nothing', () => {
    expect(stepTab('song', 'ArrowRight')).toBe('inst');
    expect(stepTab('set', 'ArrowRight')).toBe('song');
    expect(stepTab('song', 'ArrowLeft')).toBe('set');
    expect(stepTab('inst', 'Home')).toBe('song');
    expect(stepTab('inst', 'End')).toBe('set');
    expect(stepTab('inst', 'a')).toBeNull();
  });
});
