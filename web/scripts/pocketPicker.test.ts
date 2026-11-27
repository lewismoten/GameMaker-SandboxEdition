// Walkthrough keys that belong to the Pocket host's simulated inventory picker.
import { expect, it } from 'vitest';
import { decodePicker } from './pocketPicker';

function replay(keys: number[]) {
  const { slot, consumed } = decodePicker(
    keys.map((key) => ({ key })),
    0,
  );
  return { slot, gameplay: keys.filter((_, i) => !consumed.includes(i)) };
}

it('cancels on Escape and leaves a later gameplay Enter intact', () => {
  expect(replay([32, 1, 28, 156, 160, 129])).toEqual({ slot: -1, gameplay: [32, 28, 156, 160] });
});

it('stops at the right edge and keeps unrelated input and releases', () => {
  expect(replay([32, 77, 77, 77, 77, 77, 160, 30, 28, 158, 205, 156])).toEqual({ slot: 4, gameplay: [32, 160, 30, 158] });
});

it('bounds both rows and columns and lets the cursor move back', () => {
  expect(replay([32, 75, 72, 80, 80, 77, 77, 75, 28])).toEqual({ slot: 6, gameplay: [32] });
  expect(replay([32, 80, 72, 28, 28, 156])).toEqual({ slot: 0, gameplay: [32, 28, 156] });
});

it('preserves input if the segment ends without a picker decision', () => {
  expect(replay([32, 77, 205, 160])).toEqual({ slot: -1, gameplay: [32, 77, 205, 160] });
});
