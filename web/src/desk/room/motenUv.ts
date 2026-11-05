// The snow-shoveling poster (MOTEN Snow-to-Software Operations) under the black light: the
// first time the tube comes on, its picture goes through posterUv.ts and the glowing print is
// laid over it (props.css shows it half by day, fully at night), so its bright lettering and
// inks glow and its paper turns lavender, as the game posters' do.
import { uvPoster } from './posterUv';

const SRC = './desk/moten-snow-to-software.jpg';

export function motenUv(desk: HTMLElement): () => void {
  const poster = desk.querySelector<HTMLElement>('.desk-scene > .poster');
  if (!poster) return () => {};
  let made = false;
  const make = () => {
    if (made || !desk.classList.contains('bl-uv')) return;
    made = true;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')?.drawImage(img, 0, 0);
      poster.append(Object.assign(document.createElement('img'), { className: 'poster-uv', src: uvPoster(c).toDataURL('image/jpeg', 0.85), alt: '' }));
    };
    // The picture the poster already shows (the AVIF or WebP it hangs as, 256 or 512 px across),
    // once it has loaded: the full-size JPEG is 96 KB more, for a poster 230 px across on the desk.
    const shown = poster.querySelector('img');
    const start = () => (img.src = shown?.currentSrc || SRC);
    if (shown && !shown.complete) {
      shown.addEventListener('load', start, { once: true });
      shown.addEventListener('error', start, { once: true });
    } else start();
  };
  const watch = new MutationObserver(make);
  watch.observe(desk, { attributes: true, attributeFilter: ['class'] });
  make();
  return () => watch.disconnect();
}
