// Regression fixtures for the first gate lesson in the recorded demo.
import { expect, it } from 'vitest';
import { GATES_ONE } from '../src/levels';
import { DemoGate } from './demoGate';

const gate = GATES_ONE[0] * 20;
it.each([
  [false, true],
  [true, true],
  [false, false],
])('rejects waiting beside the gate (Right %s, open %s)', (right, open) => {
  const lesson = new DemoGate();
  for (let i = 0; i < 8; i++) lesson.tick(gate - 20, right, open);
  lesson.tick(gate + 1, true, true);
  expect(lesson.passed).toBe(false);
});

it('requires six consecutive blocked ticks followed by an open crossing', () => {
  const lesson = new DemoGate();
  lesson.tick(gate - 20, false, false);
  for (let i = 0; i < 5; i++) lesson.tick(gate - 20, true, false);
  lesson.tick(gate - 20, false, false);
  for (let i = 0; i < 5; i++) lesson.tick(gate - 20, true, false);
  lesson.tick(gate + 1, true, true);
  expect(lesson.passed).toBe(false);
  lesson.tick(gate - 20, false, false);
  for (let i = 0; i < 6; i++) lesson.tick(gate - 20, true, false);
  expect(lesson.passed).toBe(false);
  lesson.tick(gate + 1, true, true);
  expect(lesson.passed).toBe(true);
});
