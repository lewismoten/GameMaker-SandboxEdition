// Ctrl/Cmd+Z, Shift+Z and Y anywhere on the editor page (the file list, the shell), for editors whose
// own key handler only sees keys while focus is inside them. A focused text field keeps its own undo.
export function windowUndoKeys(host: HTMLElement, undo: () => void, redo: () => void): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.altKey || !host.isConnected) return;
    const k = e.key.toLowerCase();
    if (k !== 'z' && k !== 'y') return;
    const t = e.target as HTMLElement | null;
    if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return;
    if (t?.isContentEditable || t?.closest('dialog') || host.contains(t)) return; // inside the editor its own handler runs
    e.preventDefault();
    if (k === 'z' && !e.shiftKey) undo();
    else redo();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
