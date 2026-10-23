// The felt eggs under black light: with the tube on (blacklight.ts), some of the eggs found
// so far, standing in their frame on the shelf (eggs/eggDisplay.ts), show what plain light
// hides, in fluorescent ink: dots, stripes, a zigzag, little stars, and on one a tiny
// smiling face (eggs/eggUv.ts, shared with the close-up viewer). Only on eggs that are there;
// drawn over each egg, clipped to its shape.
import { UV_SVG, uvInk } from '../../eggs/eggUv';

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
      if (!ink) return;
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
      svg.innerHTML = `<defs><clipPath id="${id}"><ellipse cx="10" cy="15" rx="8.6" ry="11.2"/></clipPath></defs><g clip-path="url(#${id})">${UV_SVG[ink.pattern](ink.ink)}</g>`;
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
