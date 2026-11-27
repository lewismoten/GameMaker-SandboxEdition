// Every EXP record must be complete, including command payloads that the reader skips.
import { expect, it } from 'vitest';
import { readExp } from '@lewismoten/gamemaker-sandbox-tools/embroidery/exp';

it.each([
  [1, 2],
  [0x80, 1, 0, 0],
  [0x80, 4, 1, 2],
  [0x80, 0x80, 7, 0],
])('rejects partial EXP records starting with %i', (...record) => {
  for (let length = 1; length < record.length; length++) {
    expect(() => readExp(Uint8Array.from([1, 2, ...record.slice(0, length)]))).toThrow(/truncated EXP/i);
  }
});
