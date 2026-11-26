// Exercise the sender's transfer order and serial replies without board hardware.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('sends assets and configurations before the game list', () => {
  const sender = fileURLToPath(new URL('./pocketSdWrite.py', import.meta.url));
  expect(execFileSync('python3', [sender, '--self-check'], { encoding: 'utf8' }).trim()).toBe('self-check ok');
});
