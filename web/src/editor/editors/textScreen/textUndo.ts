// Undo and Redo for the text screen editor, on core/fileUndo. A burst of typing is one step,
// a burst of deleting is another, and a paste, a cut, a new line or a tool (Wrap long lines)
// is a step of its own. A pause of a second also ends a step.
import type { fileHistory } from '../../core/fileUndo';

type EditKind = 'type' | 'delete' | 'other';

/** What an input event's inputType means for grouping. */
export function editKind(inputType: string): EditKind {
  if (inputType === 'insertText' || inputType === 'insertCompositionText') return 'type';
  if (inputType.startsWith('delete') && inputType !== 'deleteByCut') return 'delete';
  return 'other';
}

type Steps = Pick<ReturnType<typeof fileHistory>, 'before' | 'split' | 'undo' | 'redo'>;

/** Groups text edits into steps of `hist` (a fileHistory or fileUndo) and answers the undo keys. */
export function textGrouping(hist: Steps, file: string) {
  let prev: EditKind | undefined;
  return {
    /** Call just before the file takes the new text. */
    edit(kind: EditKind) {
      if (kind === 'other' || kind !== prev) hist.split();
      prev = kind === 'other' ? undefined : kind;
      hist.before(file);
    },
    /** After Undo or Redo: the next edit starts a step. */
    reset() {
      prev = undefined;
    },
    /** Ctrl/Cmd+Z, Shift+Z and Y in the text box (the browser's own undo would fight these steps). */
    keyHandler(e: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'key' | 'preventDefault'>) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k !== 'z' && k !== 'y') return;
      e.preventDefault();
      if (k === 'z' && !e.shiftKey) hist.undo();
      else hist.redo();
    },
  };
}

/** The steps for a text screen: typing pauses of a second end a step. */
export const TEXT_MERGE_MS = 1000;
