// The play button on an Overview > Files card: one preview plays at a time, nothing starts by itself,
// and a preview stops when its card scrolls away. The engine and audio code load on the first press.
import { h } from '../core/ui';
import type { FileKind, Project } from '../core/project';

/** File kinds with a playable preview. */
export const PLAYABLE: ReadonlySet<FileKind> = new Set<FileKind>(['fli', 'lst', 'rec', 'snd', 'voc', 'cmf']);

let stopCurrent: (() => void) | undefined;

/** Stops whichever preview is playing (a grid being redrawn or closed calls this). */
export function stopThumbPlayback(): void {
  stopCurrent?.();
}

/** A labeled Play/Stop button for the card's preview box; it plays the file in place. */
export function playButton(box: HTMLElement, file: string, kind: FileKind, project: Project): HTMLButtonElement {
  const name = file.toUpperCase();
  const button = h('button', { type: 'button', class: 'asset-play', 'aria-pressed': 'false', 'aria-label': `Play ${name}`, title: `Play ${name}` }, '▶');
  let stop: (() => void) | undefined;
  let watch: IntersectionObserver | undefined;
  const end = () => {
    if (stopCurrent === end) stopCurrent = undefined;
    watch?.disconnect();
    watch = undefined;
    stop?.();
    stop = undefined;
    button.textContent = '▶';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Play ${name}`);
    button.title = `Play ${name}`;
  };
  button.addEventListener('click', () => {
    if (stop || watch) return end();
    stopCurrent?.();
    stopCurrent = end;
    watch = new IntersectionObserver((entries) => entries.some((e) => !e.isIntersecting) && end());
    watch.observe(box);
    button.textContent = '■';
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', `Stop ${name}`);
    button.title = `Stop ${name}`;
    void import('./thumbRunners')
      .then(({ runPreview }) => runPreview(kind, { box, file, project, done: end }))
      .then((s) => {
        if (stopCurrent === end && watch) stop = s;
        else s();
      })
      .catch(end);
  });
  return button;
}
