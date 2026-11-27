// A gap beside one gate must be detected even when the other gates still protect the car.
import { expect, it } from 'vitest';
import { suburbSet } from '../src/blocks/suburb';
import { level1 } from '../src/levels/level1';
import { checkCarGate } from './carLane';

it.each([
  [8, 'gatePages'],
  [10, 'gateZap'],
  [11, 'gateKeys'],
] as const)('detects the gap at (%i,14)', (x, gate) => {
  const map = level1(suburbSet());
  checkCarGate(map, gate);
  map.set_(x, 14, 'grass');
  expect(() => checkCarGate(map, gate)).toThrow(gate);
});
