// Pixel-exact DOS screenshots: copy indices and the live DAC before asynchronous PNG compression.
import type { IndexedPicture } from '@lewismoten/gamemaker-sandbox-tools/image/png';
import type { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { VISIBLE_W, VISIBLE_H } from '@lewismoten/gamemaker-sandbox-engine/engine/render';

export function snapshotPicture(screen: Pick<Screen, 'pixels' | 'palette' | 'dosCropped'>): IndexedPicture {
  const width = screen.dosCropped ? VISIBLE_W : 320;
  const height = screen.dosCropped ? VISIBLE_H : 200;
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) pixels.set(screen.pixels.subarray(y * 320, y * 320 + width), y * width);
  return { width, height, pixels, palette: screen.palette.slice() };
}

export function snapshotName(gameId: string, screen: Pick<Screen, 'dosCropped' | 'sceneNumber'>, now = new Date()): string {
  const id = gameId.replace(/^(game|project|bundle):/, '').replace(/[^a-z0-9_-]/gi, '-') || 'game';
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${id}-${screen.dosCropped ? `scene-${screen.sceneNumber}` : 'screen'}-${date}-${time}.png`;
}

/** Mount only on full-window play pages; pointer activation leaves game focus alone. */
export function snapshotButton(corner: HTMLElement, screen: Screen, gameId: string, canvas: HTMLCanvasElement): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gm-snapshot';
  button.title = 'Save screenshot (F12)';
  button.setAttribute('aria-label', 'Save screenshot');
  button.setAttribute('aria-keyshortcuts', 'F12');
  // the failure is said in words, not only in the tooltip
  const note = document.createElement('span');
  note.className = 'gm-snapshot-note';
  note.setAttribute('role', 'status');
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  button.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h4l2-3h6l2 3h4v15H3z"/><circle cx="12" cy="13" r="4"/></svg>';
  button.addEventListener('pointerdown', (e) => e.preventDefault());
  for (const type of ['keydown', 'keyup']) button.addEventListener(type, (e) => e.stopPropagation());
  // PLAYGAME consumes Tab as a game key. F12 reaches the camera without taking a game key.
  const shortcut = (e: KeyboardEvent) => {
    if (e.code !== 'F12') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'keydown' && !e.repeat) {
      button.focus({ preventScroll: true });
      button.click();
    }
  };
  for (const type of ['keydown', 'keyup'] as const) {
    canvas.addEventListener(type, shortcut);
    button.addEventListener(type, shortcut);
  }
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      canvas.focus({ preventScroll: true });
    }
  });
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = snapshotName(gameId, screen);
    const picture = snapshotPicture(screen);
    void import('@lewismoten/gamemaker-sandbox-tools/image/png')
      .then(({ encodePng }) => encodePng(picture))
      .then((bytes) => {
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' }));
        const link = Object.assign(document.createElement('a'), { href: url, download: name });
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      })
      .catch((error: unknown) => {
        console.error('Screenshot could not be saved', error);
        button.title = 'Screenshot could not be saved. Try again.';
        note.textContent = 'Screenshot could not be saved. Try again.';
        clearTimeout(noteTimer);
        noteTimer = setTimeout(() => (note.textContent = ''), 6000);
      });
  });
  corner.append(button, note);
}
