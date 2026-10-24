// Hides the mouse pointer over the game once it has been still for a second, and shows it
// again the moment it moves, so it never sits on top of the playing. Only a mouse counts:
// touch and pen have no pointer to hide.

const CURSOR_IDLE_MS = 1000;

/** Starts hiding the pointer over `el` while it is idle; returns a function that stops. */
export function hideIdleCursor(el: HTMLElement, idleMs = CURSOR_IDLE_MS): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const show = () => {
    clearTimeout(timer);
    timer = undefined;
    el.classList.remove('gm-cursor-hidden');
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    show();
    timer = setTimeout(() => el.classList.add('gm-cursor-hidden'), idleMs);
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', onMove);
  el.addEventListener('pointerleave', show);
  return () => {
    show();
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerdown', onMove);
    el.removeEventListener('pointerleave', show);
  };
}
