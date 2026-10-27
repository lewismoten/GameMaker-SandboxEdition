// The magazine's drawn pictures as images: an <svg> with its markup, labeled for screen readers.
// art.ts and the ad art beside it (notcherArt.ts, soundCardArt.ts, blankDisk.ts, joeyDrawing.ts) share it.

/** An <svg> of `markup` in `viewBox`, an image named by `alt`, with the class `cls` if given. */
export function svgArt(viewBox: string, markup: string, alt: string, cls?: string): SVGSVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (cls) el.setAttribute('class', cls);
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', alt);
  el.innerHTML = markup;
  return el;
}
