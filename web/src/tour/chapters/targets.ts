// Targets more than one chapter points at: the header's links and the ⚙ Settings menu's items,
// each with the narrow window's ⋯ menu standing in for it.
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
