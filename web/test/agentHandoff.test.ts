// Keep the public handoff advice accurate for both ways a replacement agent can resume.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('explains how to hand off edits in the same worktree and through a fresh clone', () => {
  const guide = readFileSync(new URL('../../docs/agents/lessons-learned.md', import.meta.url), 'utf8');
  const section = guide.split('## 2.')[1].split('## 3.')[0].replace(/\s+/g, ' ');
  expect(section).toMatch(/same worktree[^.]*uncommitted edits/i);
  expect(section).toMatch(/fresh clone[^.]*commit[^.]*push/i);
});
