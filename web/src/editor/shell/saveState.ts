// The wording and timing of the editor's save indicator (saveNote.ts), kept apart so it can be tested.

/** "3:42 PM" in the viewer's own clock style. */
export function savedTime(at: Date): string {
  return at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** The line shown for a finished autosave, or why it failed. */
export function savedText(failed: Error | undefined, at: Date): string {
  if (!failed) return `✓ Saved ${savedTime(at)} in this browser`;
  return `Not saved (${failed.message || 'the browser refused'}). Download a .zip to keep your work.`;
}

/**
 * Passes only the last message on to `say` once `ms` pass without a newer one, so a screen reader
 * hears "Saved" after a burst of edits, not once per keystroke.
 */
export function quietly(say: (text: string) => void, ms: number): { tell: (text: string) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    tell(text) {
      clearTimeout(timer);
      timer = setTimeout(() => say(text), ms);
    },
    cancel: () => clearTimeout(timer),
  };
}
