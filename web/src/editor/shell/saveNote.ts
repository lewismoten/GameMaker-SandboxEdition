// The editor's save note, under Download in the file list: changes autosave to this browser,
// and this says so ("Saving…", "Saved in this browser", or why it couldn't, with what to do).
// Ctrl+S / ⌘S saves at once and says so, instead of the browser saving the web page.
import { h, toast } from '../core/ui';
import type { Project } from '../core/project';
import { quietly, savedText, savedTime } from './saveState';
import './saveFlash.css';

/** The note (kept across sidebar redraws) and a clean-up that stops listening. */
export function saveNote(project: Project): { el: HTMLElement; dispose: () => void } {
  const el = h('p', {
    class: 'save-note',
    title: 'Every change is kept in this browser as you go. Download a .zip now and then to keep it safe.',
  });
  // Below 1200px the file list (and this note with it) folds away, so a small pill says it too:
  // "✓ Saved" fades after a moment; a failure stays until the next save (saveFlash.css).
  const flash = h('p', { class: 'save-flash', 'aria-hidden': 'true' });
  // One polite, visually hidden announcer, quiet until edits pause, so keystrokes don't chatter.
  const announcer = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const announce = quietly((t) => (announcer.textContent = t), 1500);
  let fade = 0;
  const flashIt = (text: string, failed: boolean) => {
    window.clearTimeout(fade);
    flash.textContent = text;
    flash.classList.toggle('failed', failed);
    flash.classList.add('on');
    if (!failed) fade = window.setTimeout(() => (flash.classList.remove('on'), (fade = window.setTimeout(() => (flash.textContent = ''), 600))), 2200);
  };
  document.body.append(flash, announcer);
  const show = (text: string, failed = false) => {
    el.textContent = text;
    el.classList.toggle('failed', failed);
  };
  show('✓ Changes save in this browser');
  let shown = 0;
  const stop = project.onSaveState((state, error) => {
    window.clearTimeout(shown);
    if (state === 'saving') shown = window.setTimeout(() => show('Saving…'), 300);
    else if (state === 'saved') {
      const now = new Date();
      show(savedText(undefined, now));
      flashIt(`✓ Saved ${savedTime(now)}`, false);
      announce.tell(`Saved ${savedTime(now)}`);
    } else {
      show(savedText(error ?? new Error(''), new Date()), true);
      flashIt('Not saved. Download a .zip', true);
      announce.tell(`Not saved: ${error?.message || 'the browser refused'}`);
    }
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
  return {
    el,
    dispose: () => (
      stop(),
      window.clearTimeout(shown),
      window.clearTimeout(fade),
      announce.cancel(),
      flash.remove(),
      announcer.remove(),
      document.removeEventListener('keydown', onKey)
    ),
  };
}
