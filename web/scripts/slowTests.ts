// Lists the tests that take over 50 ms here (test/slowTests.json), which CI then skips: GitHub
// runs only the quick tests, and the slow ones (games' disks, whole-game plays, big renders) are
// for local runs. Run from web/ after adding or speeding up tests:
//   npx vite-node scripts/slowTests.ts
// It runs the whole suite once with vitest's JSON reporter. A file whose every test is slow is
// left out whole (vitest.config.ts); the other slow tests are skipped one by one (test/fastOnly.ts).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

/** A test slower than this (ms) runs only locally. */
const LIMIT = 50;

interface Result {
  name: string;
  assertionResults: { ancestorTitles: string[]; title: string; duration?: number | null }[];
}

const web = join(__dirname, '..');
const out = join(mkdtempSync(join(tmpdir(), 'slow-tests-')), 'vitest.json');
try {
  execFileSync('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${out}`], { cwd: web, stdio: 'ignore' });
} catch {
  // a failing test still writes the report; its times count the same
}
const files: string[] = [];
const tests: Record<string, string[]> = {};
for (const f of (JSON.parse(readFileSync(out, 'utf8')) as { testResults: Result[] }).testResults) {
  const file = relative(web, f.name).split('\\').join('/');
  const slow = f.assertionResults.filter((a) => (a.duration ?? 0) > LIMIT).map((a) => [...a.ancestorTitles, a.title].join(' '));
  if (!slow.length) continue;
  if (slow.length === f.assertionResults.length) files.push(file);
  else tests[file] = slow;
}
files.sort();
const sorted = Object.fromEntries(Object.entries(tests).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(web, 'test/slowTests.json'), `${JSON.stringify({ limitMs: LIMIT, files, tests: sorted }, null, 2)}\n`);
console.log(`${files.length} files and ${Object.values(tests).flat().length} more tests over ${LIMIT} ms`);
