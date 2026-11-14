// verify-consumer.mjs refuses a --source it does not know, before it packs or installs anything.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = resolve(__dirname, '../../scripts/verify-consumer.mjs');
const run = (...a: string[]) => spawnSync('node', [script, ...a], { encoding: 'utf8', timeout: 5000 });

describe('verify-consumer --source', () => {
  it('exits 2 with a message when the value is missing or unknown', () => {
    for (const a of [['--source'], ['--source', 'bogus'], ['--source', '--keep']]) {
      const r = run(...a);
      expect(r.status, a.join(' ')).toBe(2);
      expect(r.stderr).toContain('--source must be tarball or registry');
    }
  });
});
