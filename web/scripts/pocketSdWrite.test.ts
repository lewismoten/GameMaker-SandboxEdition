// Exercise the USB reply reader with the writer's fake serial port.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('enforces the board reply deadline and retains the last five log lines', () => {
  const writer = fileURLToPath(new URL('./pocketSdWrite.py', import.meta.url));
  expect(execFileSync('python3', [writer, '--self-check'], { encoding: 'utf8' }).trim()).toBe('self-check ok');
});
