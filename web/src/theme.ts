// Light or dark for today's web editor. The choice is kept per browser ('gm-theme');
// dark is the default because the bright light theme is hard on the eyes for long
// sessions. 'auto' follows the system setting. index.html sets data-theme before the
// first paint (the same rule as here) so the page never flashes the wrong colors.
import { h, clear } from './editor/core/ui';

type Theme = 'dark' | 'light' | 'auto';
const KEY = 'gm-theme';
const ORDER: Theme[] = ['dark', 'light', 'auto'];
const LABEL: Record<Theme, [string, string]> = {
  dark: ['🌙', 'Dark'],
  light: ['☀️', 'Light'],
  auto: ['🖥️', 'System'],
};
/** Said on the document when the theme changes, so every Theme item shows it. */
const CHANGED = 'gm-theme-changed';

function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY) as Theme | null;
    return t && ORDER.includes(t) ? t : 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: still applies for this visit */
  }
}

/**
 * The Settings menu's Theme item (settingsMenu.ts): it cycles dark → light → auto and says
 * which is on ("Theme: Dark"); every copy (the ⚙ menu's and the ⋯ menu's) stays in step.
 */
export function themeItem(attrs: Record<string, string> = {}): HTMLButtonElement {
  const btn = h('button', { ...attrs, type: 'button', class: 'theme-item', title: 'Change the theme: dark, light, or as your system is set' });
  const show = () => {
    if (!btn.isConnected && btn.childNodes.length) return document.removeEventListener(CHANGED, show);
    const [icon, label] = LABEL[getTheme()];
    clear(btn, h('span', { 'aria-hidden': 'true' }, icon), ` Theme: ${label}`);
  };
  btn.addEventListener('click', () => {
    applyTheme(ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length]);
    document.dispatchEvent(new Event(CHANGED));
  });
  document.addEventListener(CHANGED, show);
  applyTheme(getTheme());
  show();
  return btn;
}
