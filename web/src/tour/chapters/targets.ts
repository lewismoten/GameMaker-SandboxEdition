// Shared tour targets for controls that move into a menu on narrow screens.
import type { Target } from '../steps';

/** A header link, or the ⋯ menu that holds it on a narrow window. */
export const headerLink = (label: string, href: string): Target => ({ label, css: [`.topbar-nav a[href="${href}"]`, '.topbar-more > summary'] });

/** An item of the ⚙ Settings menu, or of the ⋯ menu on a narrow window, opened to show it. */
export const setting = (text: string): Target => ({
  label: `${text} in the Settings menu`,
  css: ['#settings-menu > *', '.topbar-more .topbar-menu > *'],
  text,
  reveal: ['.topbar-settings .topbar-gear', '.topbar-more > summary'],
});

export const assistantMenuItem = '.file-more-menu button[title="Assistant"]';

/** The toolbar star on a wide screen, or the Assistant item in the file actions menu on a phone. */
export const assistantButton: Target = {
  label: 'the Assistant button',
  css: ['.assistant-btn', assistantMenuItem],
  reveal: '.file-more > summary',
};
