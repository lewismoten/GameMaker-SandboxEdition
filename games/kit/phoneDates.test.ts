// Check the actual board export on either host using dated plot and drill fixtures.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const phone = join(root, 'games/year2000/phone');
it.each(['', 'deluxe'])('normalizes %s fabrication dates before creating the ZIP', (variant) => {
  const scratch = join(root, '.tmp');
  mkdirSync(scratch, { recursive: true });
  const dir = mkdtempSync(join(scratch, 'dates-'));
  try {
    const base = join(dir, variant);
    cpSync(join(phone, 'tools'), join(dir, 'tools'), { recursive: true });
    cpSync(join(phone, variant, 'tools'), join(base, 'tools'), { recursive: true });
    mkdirSync(join(base, 'kicad'));
    for (const ext of ['pcb', 'sch']) cpSync(join(phone, variant, 'kicad', 'phone.kicad_' + ext), join(base, 'kicad', 'phone.kicad_' + ext));
    const cli = join(dir, 'cli');
    writeFileSync(
      cli,
      `#!/bin/sh
case "$3" in
  pdf) touch "$5";;
  gerbers) cp "$PLOTS"/* "$5"
    echo '%TF.CreationDate,2025-10-17T12:34:56+02:00*%' > "$5/phone-F_Cu.gtl";;
  drill) echo '; DRILL file {KiCad 9} date 2025-10-17 12:34:56-0500' > "$5/phone.drl";;
esac
`,
      { mode: 0o755 },
    );
    const result = spawnSync('sh', ['tools/export.sh'], {
      cwd: base,
      encoding: 'utf8',
      env: { ...process.env, KICAD_CLI: cli, PLOTS: join(phone, variant, 'gerbers') },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(base, 'gerbers/phone-F_Cu.gtl'), 'utf8')).toBe('%TF.CreationDate,2026-01-01T00:00:00-05:00*%\n');
    expect(readFileSync(join(base, 'gerbers/phone.drl'), 'utf8')).toBe('; DRILL file {KiCad 9} date 2026-01-01 00:00:00-0500\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
