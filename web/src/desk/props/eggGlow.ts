// The felt eggs under black light: with the tube on (blacklight.ts), some of the eggs found
// so far, standing in their frame on the shelf (eggs/eggDisplay.ts), show what plain light
// hides, in fluorescent ink: dots, stripes, a zigzag, little stars, and on one a tiny
// smiling face. Only on eggs that are there; drawn over each egg, clipped to its shape.
const NS = 'http://www.w3.org/2000/svg';
const INKS = ['#ff2fd6', '#39ff6a', '#ff8a1a', '#3ac8ff'];
// each pattern on a 20 x 27 egg
const PATTERNS = [
  (c: string) => [4, 9, 14].map((y, i) => [3, 8, 13, 18].map((x) => `<circle cx="${x + (i % 2) * 2.5}" cy="${y + 4}" r="1.2" fill="${c}"/>`).join('')).join(''),
  (c: string) => `<path d="M0 9 H20 M0 14 H20 M0 19 H20" stroke="${c}" stroke-width="1.4"/>`,
  (c: string) => `<path d="M0 13 l3 -3 3 3 3 -3 3 3 3 -3 3 3 3 -3" fill="none" stroke="${c}" stroke-width="1.3"/>`,
  (c: string) =>
    [
      [6, 9],
      [14, 13],
      [7, 19],
    ]
      .map(([x, y]) => `<path d="M${x} ${y - 2.5} l0.8 1.7 1.8 0.2 -1.4 1.2 0.4 1.8 -1.6 -0.9 -1.6 0.9 0.4 -1.8 -1.4 -1.2 1.8 -0.2 z" fill="${c}"/>`)
      .join(''),
  (c: string) =>
    `<circle cx="7.5" cy="12" r="1.1" fill="${c}"/><circle cx="12.5" cy="12" r="1.1" fill="${c}"/><path d="M6.5 16 q3.5 3.5 7 0" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
];

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
      if (i % 3 === 2) return; // some, not all
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
      const pattern = i === 4 ? PATTERNS[4] : PATTERNS[i % 4];
      svg.innerHTML = `<defs><clipPath id="${id}"><ellipse cx="10" cy="15" rx="8.6" ry="11.2"/></clipPath></defs><g clip-path="url(#${id})">${pattern(INKS[i % INKS.length])}</g>`;
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
