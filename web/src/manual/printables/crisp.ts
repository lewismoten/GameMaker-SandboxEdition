// Screen shots in a manual page, drawn so every pixel of the shot is the same size on the
// real screen. A page is sized in fractions of the window, so a 640 x 400 text screen lands
// at some odd scale such as 0.66 or 1.32 device pixels per pixel; drawn with
// image-rendering: pixelated that doubles some rows and drops others, and the text turns to
// mush. Instead each shot is redrawn for the device pixels it covers:
//   - a scale just over a whole number shrinks the picture to that whole number (k x k
//     device pixels per pixel, exact);
//   - any other scale over 1 is drawn at the next whole scale and smoothly resampled to the
//     exact size ("sharp bilinear"), so pixels stay even and only their edges soften;
//   - under 1, a high quality smooth reduction (in halving steps), so strokes turn gray
//     instead of vanishing.
// Clicking (or Enter on) a shot shows it enlarged at a whole scale.

interface CrispPlan {
  /** Device pixels the drawn picture covers. */
  devW: number;
  devH: number;
  /** Whole-number scale to draw with nearest neighbor first (1 = as is). */
  whole: number;
  /** True when devW x devH is exactly `whole` x the picture (no resampling). */
  exact: boolean;
}

/**
 * How to draw a `w` x `h` picture that has `cssW` CSS pixels of room at `dpr` device pixels
 * per CSS pixel. A scale within `snap` above a whole number snaps down to it.
 */
export function crispPlan(w: number, h: number, cssW: number, dpr: number, snap = 0.15): CrispPlan {
  const room = Math.max(1, Math.round(cssW * dpr));
  const k = room / w;
  const floor = Math.floor(k);
  if (floor >= 1 && k - floor < snap) return { devW: w * floor, devH: h * floor, whole: floor, exact: true };
  const devW = room;
  const devH = Math.max(1, Math.round((room * h) / w));
  return { devW, devH, whole: Math.max(1, Math.ceil(k)), exact: false };
}

const cache = new Map<string, string>();

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** The picture drawn to plan, as a data URL. */
function redraw(img: HTMLImageElement, plan: CrispPlan): string {
  const { naturalWidth: w, naturalHeight: h } = img;
  // nearest neighbor up to the whole scale
  let [src, sctx] = canvas(w * plan.whole, h * plan.whole);
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(img, 0, 0, src.width, src.height);
  if (plan.exact) return src.toDataURL();
  // smooth down to the device size, halving at most each step
  while (src.width / 2 > plan.devW) {
    const [half, hctx] = canvas(Math.ceil(src.width / 2), Math.ceil(src.height / 2));
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = 'high';
    hctx.drawImage(src, 0, 0, half.width, half.height);
    src = half;
  }
  const [out, octx] = canvas(plan.devW, plan.devH);
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(src, 0, 0, plan.devW, plan.devH);
  return out.toDataURL();
}

function px(v: string): number {
  return parseFloat(v) || 0;
}

/** Redraws one shot for the room it has now. */
async function crispen(img: HTMLImageElement): Promise<void> {
  const original = img.dataset.crispSrc ?? img.src;
  img.dataset.crispSrc = original;
  if (img.src !== original) img.src = original;
  img.style.width = '';
  await img.decode().catch(() => undefined);
  if (!img.isConnected || !img.naturalWidth) return;
  const cs = getComputedStyle(img); // layout size: not changed by a page-turn transform
  const border = px(cs.borderLeftWidth) + px(cs.borderRightWidth) + px(cs.paddingLeft) + px(cs.paddingRight);
  const cssW = px(cs.width) - (cs.boxSizing === 'border-box' ? border : 0);
  if (!(cssW > 0)) return;
  const dpr = window.devicePixelRatio || 1;
  const plan = crispPlan(img.naturalWidth, img.naturalHeight, cssW, dpr);
  const key = `${plan.devW}x${plan.devH}:${original}`;
  let url = cache.get(key);
  if (!url) {
    url = plan.exact && plan.whole === 1 ? original : redraw(img, plan);
    if (cache.size > 80) cache.delete(cache.keys().next().value!);
    cache.set(key, url);
  }
  img.style.width = `${plan.devW / dpr + (cs.boxSizing === 'border-box' ? border : 0)}px`;
  img.style.imageRendering = plan.exact ? 'pixelated' : 'auto';
  img.classList.add('crisp');
  if (img.src !== url) img.src = url;
}

/** Enlarges a shot over the page, at the largest whole scale that fits. */
export function enlarge(img: HTMLImageElement): void {
  const src = img.dataset.crispSrc ?? img.src;
  const probe = new Image();
  probe.src = src;
  void probe.decode().then(() => {
    const dpr = window.devicePixelRatio || 1;
    const fitW = (window.innerWidth - 32) * dpr;
    const fitH = (window.innerHeight - 96) * dpr;
    const k = Math.max(1, Math.floor(Math.min(fitW / probe.naturalWidth, fitH / probe.naturalHeight)));
    const fits = probe.naturalWidth * k <= fitW;
    const big = document.createElement('img');
    big.src = src;
    big.alt = img.alt;
    big.style.width = `${(probe.naturalWidth * (fits ? k : fitW / probe.naturalWidth)) / dpr}px`;
    big.style.imageRendering = fits ? 'pixelated' : 'auto';
    const caption = img.closest('figure')?.querySelector('figcaption')?.textContent ?? img.alt;
    const close = document.createElement('button');
    close.textContent = 'Close';
    const box = document.createElement('div');
    box.className = 'gmb-zoom';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', caption || 'Screen shot');
    const cap = document.createElement('p');
    cap.textContent = caption;
    box.append(big, cap, close);
    const shut = (e?: Event) => {
      e?.stopPropagation();
      window.removeEventListener('keydown', onKey, true);
      box.remove();
      img.focus({ preventScroll: true });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopImmediatePropagation();
        shut();
      } else if (e.key !== 'Tab') e.stopImmediatePropagation();
    };
    box.addEventListener('click', shut);
    window.addEventListener('keydown', onKey, true);
    (img.closest('.gmb') ?? document.body).append(box);
    close.focus({ preventScroll: true });
  });
}

/** A shot crispShots set up (the viewer's keys open it with Enter or Space). */
export function isShot(t: EventTarget | null): t is HTMLImageElement {
  return t instanceof HTMLImageElement && !!t.dataset.crispSrc;
}

/** True while a shot is enlarged (it takes the keys). */
export function zoomOpen(): boolean {
  return !!document.querySelector('.gmb-zoom');
}

/** Makes every figure's picture under `root` crisp, and enlargeable (but not a swatch marked data-no-zoom). */
export function crispShots(root: ParentNode): void {
  for (const img of root.querySelectorAll<HTMLImageElement>('figure img')) {
    if (!img.dataset.crispSrc && !('noZoom' in img.dataset)) {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Enlarge: ${img.alt}`);
      img.title = 'Click to enlarge';
      img.addEventListener('click', (e) => {
        e.stopPropagation(); // not a page turn
        enlarge(img);
      });
    }
    void crispen(img);
  }
}
