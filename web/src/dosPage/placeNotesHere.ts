// Keep the achievement row above the DOS screen, aligned to its width.
export function placeNotesHere(stage: HTMLElement, crt: HTMLElement): (host: HTMLElement) => void {
  const offset = 4;
  let watched = false;
  return (host) => {
    const fit = () => {
      if (!host.childElementCount) {
        stage.style.paddingTop = '';
        return;
      }
      stage.style.paddingTop = `${host.getBoundingClientRect().height + offset}px`;
      const screen = crt.getBoundingClientRect();
      host.style.top = `${stage.getBoundingClientRect().top + offset}px`;
      host.style.left = `${Math.max(8, screen.left)}px`;
      host.style.right = 'auto';
      host.style.width = `${Math.min(screen.width, innerWidth - 16)}px`;
    };
    fit();
    if (watched) return;
    watched = true;
    new MutationObserver(fit).observe(host, { childList: true });
    const sizes = new ResizeObserver(fit);
    sizes.observe(host);
    sizes.observe(crt);
  };
}
