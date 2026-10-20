// The bulge of a curved CRT tube: an SVG barrel-distortion filter, applied with CSS
// `filter: url(#crt-warp)`. Away from the center, each output pixel samples the picture a
// little further out, which squeezes the picture toward the middle the way a tube's glass
// does: the edges bow and the corners round off into the dark.

const ID = 'crt-warp';
const SIZE = 512;
/** How far the corners reach, as a fraction of the half-width. */
const BULGE = 0.035;
/** feDisplacementMap's scale, as a fraction of the width (displacements are ±scale/2). */
const SCALE = 0.1;

/** The map for a box of the given height/width; offsets are encoded relative to the width. */
function displacementMap(aspect: number): string {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const u = (x / (SIZE - 1)) * 2 - 1;
      const v = (y / (SIZE - 1)) * 2 - 1;
      const r2 = u * u + v * v;
      const dx = (u * BULGE * r2) / 2;
      const dy = ((v * BULGE * r2) / 2) * aspect;
      const o = (y * SIZE + x) * 4;
      img.data[o] = Math.round(255 * (0.5 + dx / SCALE));
      img.data[o + 1] = Math.round(255 * (0.5 + dy / SCALE));
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/**
 * Adds the filter for `tube` (an element of a fixed aspect ratio) and keeps it sized to it.
 * Returns a function that removes it.
 */
export function installCrtWarp(tube: HTMLElement, aspect = 3 / 4): () => void {
  document.getElementById(ID)?.closest('svg')?.remove();
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <filter id="${ID}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage href="${displacementMap(aspect)}" x="0" y="0" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" result="warped"/>
      <!-- the displacement samples the nearest pixel, which leaves jagged steps along the
           bowed lines; a slight blur smooths them, as the soft spot of a tube's beam did -->
      <feGaussianBlur in="warped" stdDeviation="0.45"/>
    </filter>`;
  document.body.append(svg);
  const filter = svg.querySelector('filter')!;
  const image = svg.querySelector('feImage')!;
  const displace = svg.querySelector('feDisplacementMap')!;
  const fit = () => {
    const w = tube.offsetWidth;
    const h = tube.offsetHeight;
    for (const el of [filter, image]) {
      el.setAttribute('x', '0');
      el.setAttribute('y', '0');
      el.setAttribute('width', String(w));
      el.setAttribute('height', String(h));
    }
    displace.setAttribute('scale', String(SCALE * w));
  };
  const observer = new ResizeObserver(fit);
  observer.observe(tube);
  fit();
  return () => {
    observer.disconnect();
    svg.remove();
  };
}
