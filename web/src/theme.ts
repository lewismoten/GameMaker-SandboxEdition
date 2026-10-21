// Light or dark for today's web editor. The choice is kept per browser ('gm-theme');
// dark is the default because the bright light theme is hard on the eyes for long
// sessions. 'auto' follows the system setting. index.html sets data-theme before the
// first paint (the same rule as here) so the page never flashes the wrong colors.
import { h } from './editor/core/ui';

export type Theme = 'dark' | 'light' | 'auto';
const KEY = 'gm-theme';
const ORDER: Theme[] = ['dark', 'light', 'auto'];
const LABEL: Record<Theme, [string, string]> = {
  dark: ['🌙', 'Dark theme'],
  light: ['☀️', 'Light theme'],
  auto: ['🖥️', 'Theme follows your system'],
};

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY) as Theme | null;
    return t && ORDER.includes(t) ? t : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: still applies for this visit */
  }
}

/** A header button that cycles dark → light → auto. */
export function themeButton(): HTMLButtonElement {
  const btn = h('button', { class: 'theme-toggle' }) as HTMLButtonElement;
  const show = (t: Theme) => {
    const [icon, label] = LABEL[t];
    btn.textContent = icon;
    btn.title = `${label} (click to change)`;
    btn.setAttribute('aria-label', `${label}. Change theme`);
  };
  btn.addEventListener('click', () => {
    const next = ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length];
    applyTheme(next);
    show(next);
  });
  applyTheme(getTheme());
  show(getTheme());
  return btn;
}
