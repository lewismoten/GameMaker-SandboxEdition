// Undo and Redo for the editor notes (the companion: block names, groups, palette reservations...)
// that go with the Optimize dialog's file steps. One note snapshot per file step, taken at the same
// moment as the file snapshot, so hopping between a checkpoint and the head (or undoing a pack that
// saved reservations) brings both back together.
import { emptyCompanion, type Companion } from '../../project/companion';
import type { Project } from '../core/project';

const LIMIT = 50;

interface NotesUndo {
  /** Call with each file snapshot (fileUndo's before): keeps the notes as they are now. */
  mark(): void;
  step(dir: 'undo' | 'redo'): void;
}

export function notesUndo(project: Pick<Project, 'companion' | 'saveNow'>): NotesUndo {
  const past: Companion[] = [];
  const future: Companion[] = [];
  const now = () => structuredClone(project.companion ?? emptyCompanion());
  return {
    mark() {
      past.push(now());
      if (past.length > LIMIT) past.shift();
      future.length = 0;
    },
    step(dir) {
      const [from, to] = dir === 'undo' ? [past, future] : [future, past];
      const s = from.pop();
      if (!s) return;
      to.push(now());
      project.companion = s;
      void project.saveNow().catch(() => undefined);
    },
  };
}
