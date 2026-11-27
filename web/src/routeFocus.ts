// Focus after a person's own navigation: when a link or button takes someone to another page of
// today's web, focus moves to the new page's h1 (or its main area), so a screen reader says where
// they are and the next Tab starts in the new page. Never on the first load, on a change made by
// code (the map's ?x=&y= updates, a file change inside one project), on Back or Forward, or while a
// dialog, a text box or a canvas has focus. The header never moves.
import { parseHash } from './urlState';

/** A different page, not the same page with other parts or another file of the same project. */
export function viewChanged(from: string, to: string): boolean {
  const a = parseHash(from).path;
  const b = parseHash(to).path;
  return a[0] !== b[0] || a[1] !== b[1];
}

let requestedFilenameHash: string | undefined;

/** An editor tour is restoring the file the visitor had open. */
export function requestFilenameFocus(hash: string): void {
  requestedFilenameHash = hash;
}

/** Claim the request before asynchronous renders can finish out of order. */
export function takeFilenameFocus(hash: string): boolean {
  const requested = requestedFilenameHash === hash;
  requestedFilenameHash = undefined;
  return requested;
}

let intent: { from: string; to: string } | undefined;

/** Native click activation covers pointer, keyboard and assistive technology. */
export function trackPersonInput(): void {
  const origins = new WeakMap<MouseEvent, string>();
  window.addEventListener(
    'click',
    (event) => {
      if (!event.isTrusted || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest('a[href], button')) origins.set(event, location.href);
    },
    true,
  );
  window.addEventListener('click', (event) => {
    const from = origins.get(event);
    if (!from || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    // Button handlers have run. A native link follows its href after dispatch.
    let to = location.href;
    if (link && !event.defaultPrevented && (!link.target || link.target === '_self') && !link.hasAttribute('download')) to = link.href;
    if (from !== to) intent = { from, to };
  });
}

export function takeNavigationFocus(event: HashChangeEvent): boolean {
  const requested = intent;
  intent = undefined;
  return requested?.from === event.oldURL && requested.to === event.newURL && viewChanged(new URL(event.oldURL).hash, new URL(event.newURL).hash);
}

/** Where a person is working that a page change must not pull focus from. */
function keepsFocus(active: Element | null): boolean {
  if (!active || active === document.body || !active.isConnected) return false;
  return (
    !!active.closest('dialog[open], [aria-modal="true"]') ||
    /^(input|textarea|select|canvas)$/i.test(active.tagName) ||
    (active as HTMLElement).isContentEditable
  );
}

/** After the new view is drawn: focus its h1, else its main area, else the content area, without scrolling. */
export function focusNewView(content: HTMLElement, navigation: boolean, filename = false): void {
  const title = filename ? content.querySelector<HTMLElement>('.file-head > h1.file-title') : null;
  if (!filename && !navigation) return;
  if (keepsFocus(document.activeElement)) return;
  const target = title ?? content.querySelector<HTMLElement>('h1') ?? content.querySelector<HTMLElement>('main, [role="main"]') ?? content;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.style.outline = 'none';
  target.addEventListener('blur', () => target.style.removeProperty('outline'), { once: true });
  target.focus({ preventScroll: true });
}
