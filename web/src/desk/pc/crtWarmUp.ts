// The tube warming up at switch-on. crtOn.css fades the picture up from black and flickers the
// beam's first bright line across the middle; this tears the picture while the deflection finds
// its lock: an SVG filter (crt-jag) pushes each row of what the tube shows sideways by its own
// amount (noise that changes only from row to row, its G channel held at 0.5 so nothing moves up
// or down), strong and jumping about at first, settling to nothing.
import { mulberry32 } from '../../seededRandom';

const ID = 'crt-jag';
/** When the tear starts and ends, ms after the switch (the picture is still dark before it). */
const FROM_MS = 350;
const TO_MS = 1750;
/** The widest tear, in CSS pixels. */
const WIDEST = 36;

function filter(): SVGFEDisplacementMapElement {
  const old = document.getElementById(ID);
  if (old) return old.querySelector('feDisplacementMap')!;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <filter id="${ID}" x="-10%" width="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="turbulence" baseFrequency="0 0.12" numOctaves="2" seed="1" result="rows"/>
      <feColorMatrix in="rows" type="matrix" values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  document.body.append(svg);
  return svg.querySelector('feDisplacementMap')!;
}

/** Warms the tube up (the class crtOn.css animates, and the tear); returns a function that stops it. */
export function crtWarmUp(crt: HTMLElement): () => void {
  crt.classList.add('warming-up');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => crt.classList.remove('warming-up');
  const map = filter();
  const noise = map.parentElement!.querySelector('feTurbulence')!;
  const rnd = mulberry32(66);
  const start = performance.now();
  let frame = 0;
  let raf = requestAnimationFrame(function step(now) {
    const t = now - start;
    if (t >= TO_MS) return void map.setAttribute('scale', '0');
    let scale = 0;
    if (t >= FROM_MS) {
      const left = 1 - (t - FROM_MS) / (TO_MS - FROM_MS);
      scale = WIDEST * left * left;
      // now and then the lock slips (a wider tear) or catches for a moment (a narrower one)
      const r = rnd();
      scale *= r < 0.12 ? 2.2 : r < 0.25 ? 0.2 : 1;
    }
    map.setAttribute('scale', scale.toFixed(1));
    if (frame++ % 3 === 0) noise.setAttribute('seed', String(1 + Math.floor(rnd() * 999)));
    raf = requestAnimationFrame(step);
  });
  return () => {
    cancelAnimationFrame(raf);
    map.setAttribute('scale', '0');
    crt.classList.remove('warming-up');
  };
}
