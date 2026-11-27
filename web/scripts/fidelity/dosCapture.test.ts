// Exercise the capture command without opening DOSBox or sending input to the desktop.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it.each([
  ['missing', 3],
  ['', 3],
  ['video', 0],
] as const)('checks the current AVI (%j) when an old capture exists', (capture, status) => {
  const scratch = resolve('../.tmp');
  mkdirSync(scratch, { recursive: true });
  const dir = mkdtempSync(resolve(scratch, 'capture-'));
  try {
    mkdirSync(resolve(dir, 'cap'));
    writeFileSync(resolve(dir, 'cap/old.avi'), 'old');
    writeFileSync(resolve(dir, 'keyseq'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const envFile = resolve(dir, 'mock.bash');
    writeFileSync(
      envFile,
      `
function /Applications/dosbox.app/Contents/MacOS/DOSBox { :; }
ioreg() { :; }
cp() { :; }
sleep() { :; }
pgrep() { return 1; }
osascript() {
  if [[ $2 != *frontmost* && $CAPTURE != missing ]]; then
    printf '%s' "$CAPTURE" > "$(sed -n 's/^captures=//p' "$OUT/dosbox.conf")/level.avi"
  fi
}
`,
    );
    const result = spawnSync('bash', ['scripts/fidelity/dosCapture.sh', 'gameware', 'fixture', '/dev/null', dir, '0', '0'], {
      env: { ...process.env, BASH_ENV: envFile, CAPTURE: capture },
    });
    expect(result.status, capture).toBe(status);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
