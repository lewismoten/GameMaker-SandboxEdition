// Small line icons for the buttons over a game's picture on the home page. Drawn as SVG
// so they look the same in every browser (the ⌨ character is missing from many fonts and
// came out as a dash). They take the button's text color.
const PATHS = {
  keys: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  manual: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function icon(name: IconName): SVGSVGElement {
  const t = document.createElement('template');
  t.innerHTML = `<svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
  return t.content.firstElementChild as SVGSVGElement;
}
