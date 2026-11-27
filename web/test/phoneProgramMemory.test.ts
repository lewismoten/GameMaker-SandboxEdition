// Exercise both phone firmware simulators with Intel HEX input on standard input.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it.each(['phone', 'phone/deluxe'])('%s loads the upper program page and ignores the configuration word', (phone) => {
  const cwd = fileURLToPath(new URL(`../../games/year2000/${phone}/tools/`, import.meta.url));
  const words = execFileSync('python3', ['-B', '-c', 'from picsim import Pic; print(*Pic(0).prog)'], {
    cwd,
    input: ':020800003412B0\n:02400E00213F50\n:00000001FF\n',
    encoding: 'utf8',
  });
  const expected = Array<number>(2048).fill(0x3fff);
  expected[0x400] = 0x1234;
  expect(words.trim().split(' ').map(Number)).toEqual(expected);
});
