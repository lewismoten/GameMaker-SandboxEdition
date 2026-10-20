// Even pixels at any size. A 320x200 canvas stretched by CSS to a size that is not a whole
// multiple shows some pixels a device pixel wider than others ("pixelated" can only
// duplicate whole pixels), which makes small text look uneven. This draws the picture
// into a second canvas of exactly the device size shown: blown up by a whole number with
// hard edges, then shrunk smoothly, so every pixel comes out the same size. The game's own
// canvas stays on top, invisible, to keep focus and pointer input.
import './exactScale.css';

/** The backing size for a box shown `w` x `h` device pixels: [width, height, x upscale, y upscale]. */
export function exactSize(w: number, h: number, srcW: number, srcH: number): [number, number, number, number] {
  const width = Math.max(1, Math.round(w));
  const height = Math.max(1, Math.round(h));
  // whole multiples show crisp as they are; otherwise blow up to the next whole multiple
  const kx = Math.max(1, Math.min(8, Math.ceil(width / srcW - 0.02)));
  const ky = Math.max(1, Math.min(8, Math.ceil(height / srcH - 0.02)));
  return [width, height, kx, ky];
}

/** Mirrors `source` into an exactly sized canvas placed under it. Returns a function that stops. */
export function exactScale(source: HTMLCanvasElement): () => void {
  const view = document.createElement('canvas');
  view.className = 'gm-exact';
  view.setAttribute('aria-hidden', 'true');
  source.before(view);
  source.classList.add('gm-exact-source');
  const ctx = view.getContext('2d', { alpha: false })!;
  const big = document.createElement('canvas');
  const bctx = big.getContext('2d', { alpha: false })!;
  let kx = 1;
  let ky = 1;

  const fit = () => {
    const r = source.getBoundingClientRect(); // as shown, after any scaling around it
    const dpr = devicePixelRatio || 1;
    // the view takes the same place and size as the source
    view.style.left = `${source.offsetLeft}px`;
    view.style.top = `${source.offsetTop}px`;
    view.style.width = `${source.offsetWidth}px`;
    view.style.height = `${source.offsetHeight}px`;
    const [w, h, x, y] = exactSize(r.width * dpr, r.height * dpr, source.width, source.height);
    [kx, ky] = [x, y];
    if (view.width !== w || view.height !== h) [view.width, view.height] = [w, h];
    const [bw, bh] = [source.width * kx, source.height * ky];
    if (big.width !== bw || big.height !== bh) [big.width, big.height] = [bw, bh];
  };

  let raf = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    if (!source.width || !view.width) return;
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(source, 0, 0, big.width, big.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(big, 0, 0, view.width, view.height);
  };

  const observer = new ResizeObserver(() => fit());
  observer.observe(source);
  const onResize = () => requestAnimationFrame(fit);
  addEventListener('resize', onResize);
  fit();
  draw();
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    removeEventListener('resize', onResize);
    view.remove();
    source.classList.remove('gm-exact-source');
  };
}
