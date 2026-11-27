// Cell rows must be usable before a caller starts generating notches.
import { expect, it } from 'vitest';
import { cellRow } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';

it.each([0, -1, NaN, Infinity])('rejects invalid joint dimensions and target width (%s)', (value) => {
  expect(() => cellRow(96, 3, { target: value })).toThrow(RangeError);
  expect(() => cellRow(value, 3, {})).toThrow(RangeError);
  expect(() => cellRow(96, value, {})).toThrow(RangeError);
});

it.each([5, 6])('requires room for cells between the corner cubes on a %i mm edge', (length) => {
  expect(() => cellRow(length, 3, { cubeStart: true, cubeEnd: true })).toThrow(RangeError);
});

it('bounds the odd cell count before generating notches', () => {
  expect(cellRow(255, 3, { target: 1 }).m).toBe(255);
  expect(() => cellRow(256, 3, { target: 1 })).toThrow(RangeError);
  expect(() => cellRow(96, 3, { target: Number.MIN_VALUE })).toThrow(RangeError);
});
