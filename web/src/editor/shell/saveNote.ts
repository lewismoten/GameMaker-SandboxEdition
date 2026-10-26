// The editor's save note, under Download in the file list: changes autosave to this browser,
// and this says so ("Saving…", "Saved in this browser", or why it couldn't, with what to do).
// Ctrl+S / ⌘S saves at once and says so, instead of the browser saving the web page.
import { h, toast } from '../core/ui';
import type { Project } from '../core/project';

/** The note (kept across sidebar redraws) and a clean-up that stops listening. */
export function saveNote(project: Project): { el: HTMLElement; dispose: () => void } {
  const el = h('p', {
    class: 'save-note',
    role: 'status',
    title: 'Every change is kept in this browser as you go. Download a .zip now and then to keep it safe.',
  });
  const show = (text: string, failed = false) => {
    el.textContent = text;
    el.classList.toggle('failed', failed);
  };
  show('✓ Changes save in this browser');
  let shown = 0;
  const stop = project.onSaveState((state, error) => {
    window.clearTimeout(shown);
    if (state === 'saving') shown = window.setTimeout(() => show('Saving…'), 300);
    else if (state === 'saved') show('✓ Saved in this browser');
    else show(`Not saved (${error?.message || 'the browser refused'}). Download a .zip to keep your work.`, true);
  });
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 's') return;
    if (!el.isConnected || document.querySelector('dialog[open]')) return;
    e.preventDefault();
    project.saveNow().then(
      () => toast('Saved in this browser. Download keeps a copy on your computer.'),
      (err: unknown) => toast(`Not saved: ${(err as Error).message}. Download a .zip to keep your work.`, 'error'),
    );
  };
  document.addEventListener('keydown', onKey);
  return { el, dispose: () => (stop(), window.clearTimeout(shown), document.removeEventListener('keydown', onKey)) };
}
