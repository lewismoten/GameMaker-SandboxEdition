// Gallery hints share the copy budget declared by Color Doors.
import { expect, it } from 'vitest';
import { VIEWS } from '../../games/color-doors/src/views';

it.each(VIEWS)('keeps the $name card hint within 30 characters', ({ line }) => {
  expect(line.length).toBeLessThanOrEqual(30);
});
