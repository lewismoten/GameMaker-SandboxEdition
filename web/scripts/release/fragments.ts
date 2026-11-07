// Target-specific release fragments, sorted by filename and combined with legacy Unreleased notes.
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { extractSection } from '../../../scripts/release/changelog.mjs';

const sections = ['Added', 'Changed', 'Fixed', 'Removed', 'Security'];

export function readFragments(root: string, target: string): { path: string; text: string }[] {
  const dir = join(root, 'changes/unreleased', target);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md'))
    .sort()
    .map((n) => {
      const path = join(dir, n);
      const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').trim();
      if (!/^### (Added|Changed|Fixed|Removed|Security)\n\n- [^\n]+$/.test(text))
        throw new Error(`${path}: expected one ### category, a blank line and one bullet.`);
      return { path, text };
    });
}

/** Preserve legacy summaries and bullets; append fragments in category and filename order. */
export function pendingNotes(text: string, fragments: { text: string }[]): string {
  const body = extractSection(text, 'Unreleased');
  if (body === null) throw new Error('Missing ## [Unreleased] heading.');
  let out = body;
  for (const section of sections) {
    const bullets = fragments.filter((f) => f.text.startsWith(`### ${section}\n`)).map((f) => f.text.split('\n\n')[1]);
    if (!bullets.length) continue;
    const heading = `### ${section}`;
    const at = out.split('\n').findIndex((line) => line === heading);
    if (at < 0) out = [out, `${heading}\n\n${bullets.join('\n')}`].filter(Boolean).join('\n\n');
    else {
      const lines = out.split('\n');
      const next = lines.findIndex((line, i) => i > at && line.startsWith('### '));
      const end = next < 0 ? lines.length : next;
      let insert = end;
      while (insert > at + 1 && !lines[insert - 1].trim()) insert--;
      lines.splice(insert, 0, ...bullets);
      out = lines.join('\n').trim();
    }
  }
  return out;
}

export function withPendingNotes(text: string, fragments: { text: string }[]): string {
  const body = pendingNotes(text, fragments);
  if (!fragments.length) return text;
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^## \[Unreleased\][ \t]*$/.test(line));
  let end = start + 1;
  while (end < lines.length && !/^## \[|^\[[^\]]+\]: /.test(lines[end])) end++;
  lines.splice(start + 1, end - start - 1, '', body, '');
  return lines.join('\n');
}

/** Called only after the changelog and manifest have been written successfully. */
export function consumeFragments(fragments: { path: string }[]): void {
  for (const f of fragments) unlinkSync(f.path);
}
