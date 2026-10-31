// Tab inside the mug's dialogs wraps round their own controls instead of going on into the
// desk behind them.

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]';

/** On a Tab key in `overlay`, wraps focus at its first and last control; true when it did. */
export function wrapTab(overlay: HTMLElement, e: KeyboardEvent): boolean {
  if (e.key !== 'Tab') return false;
  const all = [...overlay.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
  const first = all[0];
  const last = all[all.length - 1];
  if (!first || !last) return false;
  const at = document.activeElement;
  if (!overlay.contains(at)) (e.preventDefault(), (e.shiftKey ? last : first).focus());
  else if (e.shiftKey && at === first) (e.preventDefault(), last.focus());
  else if (!e.shiftKey && at === last) (e.preventDefault(), first.focus());
  return true;
}
