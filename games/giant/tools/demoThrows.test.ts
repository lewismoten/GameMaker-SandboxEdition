// A missed star still counts toward the title demo's three throws.
import { expect, it } from 'vitest';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { demoRecording } from '../src/demo';
import { throwCountError } from './demoThrows';

it('accepts the recorded throws and rejects a fourth throw even if it misses', () => {
  const keys = parseRecording(demoRecording()).slice(0, -2);
  expect(throwCountError(keys)).toBeUndefined();
  // Fire once more from the ground before Kit moves left, keeping the movement on its recorded tick.
  const left = keys.findIndex((event) => event.key === 75);
  const move = keys[left];
  keys.splice(left, 1, { delta: 35, key: 28 }, { delta: 3, key: 156 }, { ...move, delta: move.delta - 38 });
  expect(throwCountError(keys)).toContain('not 4');
});
