// The shared limit component can be checked in Node without creating browser elements.
import { expect, it, vi } from 'vitest';
import { capacityNote } from './limitNote';

vi.mock('../core/ui', () => ({ h: (tag: string, attrs: unknown, text: string) => ({ tag, attrs, text }) }));

it.each([
  [128, 'instruments', 'a song'],
  [20, 'links', 'a scene'],
  [1, 'starting link', 'a start scene'],
] as const)('shows the %i-place limit only when full, and clears after removal', (max, things, where) => {
  expect(capacityNote(max - 1, max, things, where)).toBeNull();
  expect(capacityNote(max, max, things, where)).toEqual({
    tag: 'p',
    attrs: { class: 'hint limit-note', role: 'note' },
    text: `DOS Game-Maker holds ${max} ${things} in ${where}; this one is full.`,
  });
  expect(capacityNote(max + 1, max, things, where)).not.toBeNull();
  expect(capacityNote(max - 1, max, things, where)).toBeNull();
});
