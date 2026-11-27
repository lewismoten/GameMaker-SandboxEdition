// Keep the contributor guide's scene total in step with the recorded walkthrough.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents the number of distinct scenes in the walkthrough', () => {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
  const recording = JSON.parse(read('../walkthrough.json')) as { segments: { scene: number }[] };
  const count = new Set(recording.segments.map((segment) => segment.scene)).size;
  expect(read('./README.md')).toMatch(new RegExp(`\\b${count} scenes\\b`));
});
