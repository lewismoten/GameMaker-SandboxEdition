// Fail closed on incomplete Vitest JSON; exceptions match test identity and message hashes.
import { createHash } from 'node:crypto';
import { relative } from 'node:path';

export function fingerprint(messages) {
  // Stack paths and line numbers change between worktrees; assertion messages do not.
  return createHash('sha256')
    .update(
      JSON.stringify(
        messages.map((s) =>
          s
            .replace(/\u001b\[[0-9;]*m/g, '')
            .split(/\n\s*(?:at |❯)/)[0]
            .trim(),
        ),
      ),
    )
    .digest('hex');
}

export function validateAllowlist(data, now = new Date()) {
  if (data.version !== 1 || !Array.isArray(data.exceptions)) throw new Error('Invalid exception file');
  const seen = new Set();
  for (const entry of data.exceptions) {
    const key = `${entry.file}\0${entry.test}`;
    if (
      ['file', 'test', 'owner', 'issue', 'firstSeenRevision', 'fingerprint', 'expires'].some((field) => typeof entry[field] !== 'string') ||
      !entry.file ||
      !entry.test ||
      !entry.owner ||
      !entry.issue ||
      !/^[a-f0-9]{40}$/.test(entry.firstSeenRevision) ||
      !/^[a-f0-9]{64}$/.test(entry.fingerprint) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.expires) ||
      !Number.isFinite(Date.parse(entry.expires)) ||
      new Date(`${entry.expires}T00:00:00Z`) <= now ||
      seen.has(key)
    )
      throw new Error(`Invalid, duplicate, or expired exception: ${entry.file} > ${entry.test}`);
    seen.add(key);
  }
  return data.exceptions;
}

export function assessTests(report, exitCode, exceptions, webRoot, completion) {
  if (
    ![0, 1].includes(exitCode) ||
    !Array.isArray(report.testResults) ||
    !report.testResults.length ||
    !(report.numTotalTests > 0) ||
    (report.numRuntimeErrorTestSuites ?? 0) !== 0 ||
    report.wasInterrupted === true ||
    report.snapshot?.failure === true ||
    !completion ||
    !['passed', 'failed'].includes(completion.reason) ||
    !Array.isArray(completion.unhandledErrors) ||
    completion.unhandledErrors.length
  )
    throw new Error('Vitest did not complete normally');
  const failures = [];
  const identities = new Set();
  let count = 0;
  for (const suite of report.testResults) {
    if (
      !Array.isArray(suite.assertionResults) ||
      !suite.assertionResults.length ||
      suite.message ||
      (suite.status === 'failed' && !suite.assertionResults.some((t) => t.status === 'failed'))
    ) {
      throw new Error(`Vitest suite did not complete: ${suite.name}`);
    }
    for (const test of suite.assertionResults) {
      count++;
      if (test.status !== 'failed') continue;
      if (!Array.isArray(test.failureMessages) || !test.failureMessages.length) throw new Error('Missing failure message');
      const failure = { file: relative(webRoot, suite.name).replaceAll('\\', '/'), test: test.fullName, fingerprint: fingerprint(test.failureMessages) };
      const identity = `${failure.file}\0${failure.test}`;
      if (identities.has(identity)) throw new Error(`Duplicate failing test identity: ${failure.file} > ${failure.test}`);
      identities.add(identity);
      failures.push({
        ...failure,
        allowed: exceptions.some((e) => e.file === failure.file && e.test === failure.test && e.fingerprint === failure.fingerprint),
      });
    }
  }
  if (
    count !== report.numTotalTests ||
    failures.length !== report.numFailedTests ||
    (completion.reason === 'passed') !== (exitCode === 0) ||
    (exitCode === 0) !== (failures.length === 0) ||
    report.success !== (exitCode === 0)
  ) {
    throw new Error('Inconsistent Vitest result or process exit');
  }
  return { ok: failures.every((f) => f.allowed), failures };
}
