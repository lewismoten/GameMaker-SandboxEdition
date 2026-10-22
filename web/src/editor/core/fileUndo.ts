// Undo and Redo for editors whose changes rewrite whole files (a picture, a backdrop, the
// .gam): call before(names) just before changing those files; Undo puts their bytes back.
// Changes less than `merge` ms apart are one step (a drag, typing), so one Undo takes back
// the lot. Files are stored by reference: the bytes in a project are replaced, never changed.
import { h } from './ui';
import type { GameFiles } from '../../project/files';

type Snapshot = Map<string, Uint8Array | undefined>;

export interface FileHistory {
  /** Call just before changing these files. */
  before(...names: string[]): void;
  undo(): boolean;
  redo(): boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface FileUndo extends FileHistory {
  readonly undoBtn: HTMLButtonElement;
  readonly redoBtn: HTMLButtonElement;
  /** Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z) anywhere but a text box; returns the cleanup. */
  listenKeys(): () => void;
}

/** The steps alone (no buttons); `changed` hears after every step and every before(). */
export function fileHistory(files: GameFiles, restored: () => void, opts: { merge?: number; limit?: number; changed?: () => void } = {}): FileHistory {
  const merge = opts.merge ?? 500;
  const limit = opts.limit ?? 50;
  const past: Snapshot[] = [];
  const future: Snapshot[] = [];
  let last = 0;
  const snap = (names: Iterable<string>): Snapshot => new Map([...names].map((n) => [n, files.get(n)]));
  const sync = () => opts.changed?.();
  const put = (s: Snapshot) => {
    for (const [n, b] of s) {
      if (b) files.set(n, b);
      else if (files.has(n)) files.delete(n);
    }
  };
  const step = (from: Snapshot[], to: Snapshot[]): boolean => {
    const s = from.pop();
    if (!s) return false;
    to.push(snap(s.keys()));
    last = 0;
    put(s);
    sync();
    restored();
    return true;
  };
  return {
    before(...names) {
      const now = Date.now();
      const top = past[past.length - 1];
      if (top && now - last <= merge) {
        // the same step: files it had not touched yet join it as they are now
        for (const n of names) if (!top.has(n)) top.set(n, files.get(n));
      } else {
        past.push(snap(names));
        if (past.length > limit) past.shift();
      }
      last = now;
      future.length = 0;
      sync();
    },
    undo: () => step(past, future),
    redo: () => step(future, past),
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
  };
}

/** fileHistory with Undo and Redo buttons, kept enabled only when there is a step to take. */
export function fileUndo(files: GameFiles, restored: () => void, opts: { merge?: number; limit?: number } = {}): FileUndo {
  const sync = () => {
    undoBtn.disabled = !steps.canUndo;
    redoBtn.disabled = !steps.canRedo;
  };
  const steps = fileHistory(files, restored, { ...opts, changed: sync });
  const undoBtn = h('button', { type: 'button', class: 'undo-btn', title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => steps.undo() }, '↶ Undo');
  const redoBtn = h('button', { type: 'button', class: 'redo-btn', title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => steps.redo() }, '↷ Redo');
  return {
    before: (...names) => steps.before(...names),
    undo: () => steps.undo(),
    redo: () => steps.redo(),
    get canUndo() {
      return steps.canUndo;
    },
    get canRedo() {
      return steps.canRedo;
    },
    undoBtn,
    redoBtn,
    listenKeys() {
      const onKey = (e: KeyboardEvent) => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey || e.defaultPrevented) return;
        const t = e.target as HTMLElement | null;
        if (t && (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable)) return;
        const k = e.key.toLowerCase();
        if (k !== 'z' && k !== 'y') return;
        e.preventDefault();
        if (k === 'z' && !e.shiftKey) steps.undo();
        else steps.redo();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    },
  };
}
