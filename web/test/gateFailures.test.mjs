// Exact allowances cannot hide new assertions, missing reports, expiry, or runtime errors.
import { describe, expect, it } from 'vitest';
import { assessTests, fingerprint, validateAllowlist } from '../../scripts/gate-failures.mjs';
import GateCompletionReporter from '../../scripts/gate-vitest-reporter.mjs';
import { testReport } from './repoWorkflowFixtures.mjs';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const completion = { reason: 'failed', unhandledErrors: [] };
const exception = {
  file: 'example.test.ts',
  test: 'example works',
  owner: 'maintainer',
  issue: 'local:layout-return-scenes',
  firstSeenRevision: 'a'.repeat(40),
  fingerprint: fingerprint(['AssertionError: expected true']),
  expires: '2026-11-13',
};

describe('gate failure policy', () => {
  it('allows only the exact test and assertion fingerprint', () => {
    const report = testReport('/web', true);
    expect(assessTests(report, 1, [exception], '/web', completion).ok).toBe(true);
    for (const field of ['file', 'test', 'fingerprint'])
      expect(assessTests(report, 1, [{ ...exception, [field]: 'different' }], '/web', completion).ok).toBe(false);
    expect(fingerprint(['AssertionError: expected true\n    at /other/worktree/a:2'])).toBe(exception.fingerprint);
    expect(fingerprint(['AssertionError: expected false'])).not.toBe(exception.fingerprint);
  });

  it('requires owner, issue, revision, unique test identity and a future expiry', () => {
    const now = new Date('2026-11-06T12:00:00Z');
    expect(validateAllowlist({ version: 1, exceptions: [exception] }, now)).toEqual([exception]);
    for (const patch of [{ owner: '' }, { issue: '' }, { firstSeenRevision: 'unknown' }, { expires: '2026-11-06' }, { expires: 'nonsense' }]) {
      expect(() => validateAllowlist({ version: 1, exceptions: [{ ...exception, ...patch }] }, now)).toThrow();
    }
    expect(() => validateAllowlist({ version: 1, exceptions: [exception, exception] }, now)).toThrow();
  });

  it('blocks crashes, partial results, collection errors, interruption and unhandled errors', () => {
    for (const [report, code, end] of [
      [{}, 1, completion],
      [testReport('/web', true), 137, completion],
      [{ ...testReport('/web', true), numFailedTests: 2 }, 1, completion],
      [testReport('/web', true), 0, completion],
      [testReport('/web', true), 1, undefined],
      [testReport('/web', true), 1, { reason: 'interrupted', unhandledErrors: [] }],
      [testReport('/web', true), 1, { reason: 'failed', unhandledErrors: [{ message: 'crash' }] }],
    ])
      expect(() => assessTests(report, code, [exception], '/web', end)).toThrow();
    const collection = testReport('/web', true);
    collection.testResults[0].message = 'import failed';
    expect(() => assessTests(collection, 1, [exception], '/web', completion)).toThrow();
    const duplicate = testReport('/web', true);
    duplicate.numTotalTests = 2;
    duplicate.numFailedTests = 2;
    duplicate.testResults[0].assertionResults.push(duplicate.testResults[0].assertionResults[0]);
    expect(() => assessTests(duplicate, 1, [exception], '/web', completion)).toThrow(/Duplicate/);
  });

  it('writes completion evidence independently of JSON assertion results', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-reporter-'));
    try {
      const reporter = new GateCompletionReporter();
      const file = join(dir, 'vitest.json');
      reporter.onInit({ config: { outputFile: file } });
      reporter.onTestRunEnd([], [{ name: 'Error', message: 'unhandled' }], 'failed');
      expect(JSON.parse(readFileSync(`${file}.completion.json`, 'utf8'))).toEqual({
        reason: 'failed',
        unhandledErrors: [{ name: 'Error', message: 'unhandled' }],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
