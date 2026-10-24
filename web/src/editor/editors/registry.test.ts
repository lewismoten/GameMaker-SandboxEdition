// Every kind of file with an editor finds it through loadEditor (each editor is loaded on demand).
import { describe, expect, it } from 'vitest';
import { KIND_LABELS, type FileKind } from '../core/project';
import { fileInfo, loadEditor } from './registry';

describe('loadEditor', () => {
  for (const kind of Object.keys(KIND_LABELS) as FileKind[]) {
    it(`${kind}: ${kind === 'other' ? 'falls back to the file info' : 'loads its editor'}`, async () => {
      const editor = await loadEditor(kind);
      if (kind === 'other') expect(editor).toBe(fileInfo);
      else expect(editor).not.toBe(fileInfo);
    });
  }
});
