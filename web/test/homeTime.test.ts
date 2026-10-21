// Tests: how My games says when a game was last edited (editor/shell/homeTime.ts).
import { describe, expect, it } from 'vitest';
import { editedWhen } from '../src/editor/shell/homeTime';

const now = new Date(2026, 9, 21, 9, 30).getTime(); // a Wednesday

describe('editedWhen', () => {
  it('says today and yesterday by the calendar, not by 24 hours', () => {
    expect(editedWhen(new Date(2026, 9, 21, 0, 5).getTime(), now, 'en-US')).toBe('Edited today');
    expect(editedWhen(new Date(2026, 9, 20, 23, 59).getTime(), now, 'en-US')).toBe('Edited yesterday');
  });
  it('names the weekday within a week, then the date', () => {
    expect(editedWhen(new Date(2026, 9, 17).getTime(), now, 'en-US')).toBe('Edited Saturday');
    expect(editedWhen(new Date(2026, 8, 3).getTime(), now, 'en-US')).toBe('Edited Sep 3');
    expect(editedWhen(new Date(2025, 8, 3).getTime(), now, 'en-US')).toBe('Edited Sep 3, 2025');
  });
  it('treats a clock set back as today', () => {
    expect(editedWhen(now + 3_600_000, now, 'en-US')).toBe('Edited today');
  });
});
