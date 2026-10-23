// Which editor opens which kind of file.
import type { Project, FileKind } from '../core/project';
import { h, clear } from '../core/ui';

/** Renders an editor into host. May return a cleanup function. */
export type EditorFn = (host: HTMLElement, project: Project, file: string) => void | (() => void);

export const editors: Partial<Record<FileKind, EditorFn>> = {};

export function registerEditor(kinds: FileKind[], fn: EditorFn): void {
  for (const k of kinds) editors[k] = fn;
}

/** Fallback: file size and a hex peek. */
export const fileInfo: EditorFn = (host, project, file) => {
  const bytes = project.files.get(file) ?? new Uint8Array();
  const hex = [...bytes.subarray(0, 256)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  clear(
    host,
    h('p', { class: 'hint' }, `${bytes.length.toLocaleString()} bytes. This kind of file has no editor; it is kept and exported as is.`),
    h('pre', { class: 'panel', style: 'white-space:pre-wrap;font-size:12px' }, hex),
  );
};
