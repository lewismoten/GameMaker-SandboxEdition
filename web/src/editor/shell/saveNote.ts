// The editor's save note, under Download in the file list: changes autosave to this browser,
// and this says so ("Saving…", "Saved in this browser", or why it couldn't, with what to do).
// Ctrl+S / ⌘S saves at once and says so, instead of the browser saving the web page.
import { h } from '../core/ui';
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
  let failure = '';
  let explicit = false;
  let latestState = '';
  let disposed = false;
  const say = (text: string) => {
    announce.cancel();
    if (!disposed) announcer.textContent = text;
  };
  let fade = 0;
  const flashIt = (text: string, failed: boolean, pending = false) => {
    window.clearTimeout(fade);
    flash.textContent = text;
    flash.classList.toggle('failed', failed);
    flash.classList.toggle('pending', pending);
    flash.classList.add('on');
    if (!failed && !pending)
      fade = window.setTimeout(() => (flash.classList.remove('on'), (fade = window.setTimeout(() => (flash.textContent = ''), 600))), 2200);
  };
  document.body.append(flash, announcer);
  const show = (text: string, failed = false) => {
    el.textContent = text;
    el.classList.toggle('failed', failed);
  };
  show('✓ Changes save in this browser');
  const stop = project.onSaveState((state, error, savedAt) => {
    latestState = state;
    if (state === 'dirty' || state === 'saving') {
      const text = state === 'dirty' ? 'Unsaved changes…' : 'Saving…';
      show(text);
      flashIt(text, false, true);
      announce.cancel();
    } else if (state === 'saved') {
      const now = savedAt ?? new Date();
      show(savedText(undefined, now));
      flashIt(`✓ Saved ${savedTime(now)}`, false);
      if (!explicit) {
        if (failure) say('Saved in this browser again after the save problem. Download a .zip to keep a copy.');
        else announce.tell(`Saved ${savedTime(now)}`);
      }
      failure = '';
    } else {
      show(savedText(error ?? new Error(''), new Date()), true);
      flashIt('Not saved. Download a .zip', true);
      const reason = error?.message || 'the browser refused';
      if (!explicit && reason !== failure) say(`Not saved: ${reason}. Download a .zip to keep your work.`);
      failure = reason;
    }
  });
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 's') return;
    if (!el.isConnected || document.querySelector('dialog[open]')) return;
    e.preventDefault();
    if (explicit) return;
    explicit = true;
    announce.cancel();
    void project
      .saveNow()
      .then(
        () => {
          if (latestState === 'saved') say('Saved in this browser. Download keeps a copy on your computer.');
        },
        (err: unknown) => {
          if (latestState === 'failed') say(`Not saved: ${(err as Error).message}. Download a .zip to keep your work.`);
        },
      )
      .finally(() => (explicit = false));
  };
  document.addEventListener('keydown', onKey);
  return {
    el,
    dispose: () => (
      (disposed = true),
      stop(),
      window.clearTimeout(fade),
      announce.cancel(),
      flash.remove(),
      announcer.remove(),
      document.removeEventListener('keydown', onKey)
    ),
  };
}
