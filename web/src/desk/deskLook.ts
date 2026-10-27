// Pointing out a prop on the desk (look=modem…, from the magazine's ads): it scrolls into view,
// takes focus and glows for a few seconds.
export function pointOut(desk: HTMLElement, prop: string, parts: { modem: HTMLElement; speaker: HTMLElement }): void {
  const el =
    prop === 'modem'
      ? parts.modem
      : prop === 'speakers'
        ? parts.speaker
        : prop === 'gamepad'
          ? desk.querySelector<HTMLElement>('.game-pad')
          : prop === 'mousepad'
            ? desk.querySelector<HTMLElement>('.mouse-pad')
            : undefined;
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (el.querySelector<HTMLElement>('button, [role="button"]') ?? el).focus({ preventScroll: true });
  el.classList.add('desk-look');
  setTimeout(() => el.classList.remove('desk-look'), 3000);
}
