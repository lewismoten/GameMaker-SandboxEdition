// Extra ways to make files beyond "new" and "from the library": converting a picture,
// building an animation, recording a sound... Tools register themselves here and the
// file picker offers them as buttons.
import type { FileKind, Project } from '../core/project';

interface Maker {
  label: string;
  /** Resolves with the new file's name, or undefined if cancelled. */
  run: (p: Project) => Promise<string | undefined>;
}

export const MAKERS: Partial<Record<FileKind, Maker[]>> = {};

export function registerMaker(kind: FileKind, maker: Maker): void {
  (MAKERS[kind] ??= []).push(maker);
}
