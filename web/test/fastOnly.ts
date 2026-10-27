// With GM_FAST_TESTS set (CI), skips each test listed in slowTests.json: one over 50 ms here,
// which runs only locally (scripts/slowTests.ts makes the list; vitest.config.ts loads this).
import { beforeEach } from 'vitest';
import type { RunnerTaskBase as TaskBase } from 'vitest';
import slow from './slowTests.json';

const SLOW = new Set(Object.entries(slow.tests).flatMap(([file, names]) => names.map((n) => `${file} > ${n}`)));

/** A test's name after its describe blocks' (not the file's), as vitest's JSON report writes it. */
function fullName(task: TaskBase): string {
  const names: string[] = [];
  for (let t: TaskBase | undefined = task; t && !('filepath' in t); t = t.suite) names.unshift(t.name);
  return names.join(' ');
}

beforeEach((ctx) => {
  const file = ctx.task.file.filepath.split('/web/').pop()!;
  if (SLOW.has(`${file} > ${fullName(ctx.task)}`)) ctx.skip();
});
