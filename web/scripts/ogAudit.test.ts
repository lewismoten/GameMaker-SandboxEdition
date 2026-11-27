// Check the preview audit's exit status on a build without cards.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('reports a finding when the og directory contains no preview pictures', () => {
  const dist = mkdtempSync(join(tmpdir(), 'gm-og-audit-'));
  try {
    mkdirSync(join(dist, 'og'));
    const result = spawnSync(process.execPath, [join(__dirname, 'ogAudit.mjs'), dist], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('No preview pictures found in og/');
    expect(result.stdout).not.toContain('NaN');
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});
