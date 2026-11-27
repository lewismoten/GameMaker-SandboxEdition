// Check the manufacturing export gate without running KiCad or touching the tracked Gerbers.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it.each(['erc', 'drc'])('keeps both reports and stops before exporting when %s fails', (failed) => {
  const scratch = fileURLToPath(new URL('../../.tmp/', import.meta.url));
  mkdirSync(scratch, { recursive: true });
  const dir = mkdtempSync(join(scratch, 'phone-export-'));
  const phone = fileURLToPath(new URL('../../games/year2000/phone/', import.meta.url));
  try {
    mkdirSync(join(dir, 'tools'));
    for (const file of ['export.sh', 'sexp_check.py']) copyFileSync(join(phone, 'tools', file), join(dir, 'tools', file));
    symlinkSync(join(phone, 'kicad'), join(dir, 'kicad'), 'dir');
    const cli = join(dir, 'kicad-cli');
    writeFileSync(
      cli,
      `#!/bin/sh
echo "$2" >> calls
case "$2" in
  erc|drc) echo "$2" > "$6" ;;
esac
test "$2" != "$FAIL_CHECK"
`,
      { mode: 0o755 },
    );
    const result = spawnSync('sh', ['tools/export.sh'], { cwd: dir, env: { ...process.env, KICAD_CLI: cli, FAIL_CHECK: failed } });
    expect(readFileSync(join(dir, 'calls'), 'utf8')).toBe('erc\ndrc\n');
    expect(result.status).toBe(1);
    for (const check of ['erc', 'drc']) expect(readFileSync(join(dir, 'out', check + '.rpt'), 'utf8')).toBe(check + '\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
