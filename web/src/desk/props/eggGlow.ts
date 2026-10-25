// The felt eggs under black light: with the tube on (blacklight.ts), the eggs found so far,
// standing in their frame on the shelf (eggs/eggDisplay.ts), sink to a dim violet, and some
// show what plain light hides, in fluorescent ink that glows bright: dots, stripes, a zigzag,
// little stars, and on one a tiny smiling face (eggs/eggUv.ts, shared with the close-up
// viewer). Only on eggs that are there; drawn over each egg, clipped to its shape.
import { UV_SVG, hot, uvInk } from '../../eggs/eggUv';

const NS = 'http://www.w3.org/2000/svg';

export function eggGlow(desk: HTMLElement): { update(): void; dispose(): void } {
  let layer: HTMLElement | undefined;
  let watching: MutationObserver | undefined;
  // the egg frame comes onto the wall a moment after the desk (and only once an egg is found)
  const scene = desk.querySelector('.desk-scene');
  const arriving = new MutationObserver(() => {
    if (!watching && desk.querySelector('.egg-perch')) update();
  });
  if (scene) arriving.observe(scene, { childList: true });
  const clear = () => {
    layer?.remove();
    layer = undefined;
  };
  const update = () => {
    clear();
    const perch = desk.querySelector<HTMLElement>('.egg-perch');
    if (!perch) return;
    if (!watching) {
      // eggs found while the light is on glow too
      watching = new MutationObserver(() => desk.classList.contains('bl-uv') && requestAnimationFrame(update));
      watching.observe(perch, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
    if (perch.hidden || !desk.classList.contains('bl-uv')) return;
    const eggs = [...perch.querySelectorAll<HTMLElement>('.egg-mini')];
    if (!eggs.length) return;
    const p = perch.getBoundingClientRect();
    const k = p.width / perch.offsetWidth || 1; // the room's scale
    layer = document.createElement('span');
    layer.className = 'egg-uv';
    layer.setAttribute('aria-hidden', 'true');
    eggs.forEach((egg, i) => {
      const ink = uvInk(i);
      const r = egg.getBoundingClientRect();
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 20 27');
      Object.assign(svg.style, {
        left: `${(r.left - p.left) / k - perch.clientLeft}px`,
        top: `${(r.top - p.top) / k - perch.clientTop}px`,
        width: `${r.width / k}px`,
        height: `${r.height / k}px`,
      });
      const id = `egg-uv-${i}`;
      // every egg's felt sinks to a dim violet; on the inked ones the ink glows over it, a wide
      // halo under a white-hot core
      const dim = `<ellipse cx="10" cy="15" rx="8.6" ry="11.2" fill="#1c0838" opacity="0.55"/>`;
      const art = ink && UV_SVG[ink.pattern];
      svg.innerHTML = !ink
        ? dim
        : `<defs><clipPath id="${id}"><ellipse cx="10" cy="15" rx="8.6" ry="11.2"/></clipPath>` +
          `<filter id="${id}-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1"/><feMerge><feMergeNode/><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
          `<g clip-path="url(#${id})">${dim}<g filter="url(#${id}-g)">${art!(ink.ink, 1.5)}</g>${art!(hot(ink.ink), 0.7)}</g>`;
      layer!.append(svg);
    });
    perch.append(layer);
  };
  return {
    update,
    dispose: () => {
      clear();
      watching?.disconnect();
      arriving.disconnect();
    },
  };
}
