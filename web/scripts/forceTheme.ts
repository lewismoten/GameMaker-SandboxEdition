// Headless checks: make the site really render its light (or dark) theme. The theme is a stored
// setting (localStorage `gm-theme`, default dark), so Playwright's `colorScheme` alone changes nothing.
// Call forceTheme on a browser context before newPage(), and assertTheme after a page has loaded.

/** The part of a Playwright BrowserContext this needs. */
interface ThemeContext {
  addInitScript: (script: (theme: string) => void, arg: string) => Promise<void>;
}

/** The part of a Playwright Page this needs. */
interface ThemePage {
  evaluate: <T>(fn: () => T) => Promise<T>;
}

export type SiteTheme = 'light' | 'dark' | 'auto';

/** Every page the context opens starts with the given stored theme. */
export async function forceTheme(ctx: ThemeContext, theme: SiteTheme): Promise<void> {
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem('gm-theme', t);
    } catch {
      /* storage blocked: the site's default (dark) applies */
    }
  }, theme);
}

/** The page's `data-theme`, or undefined on pages that don't theme themselves (dos.html, the player). */
export async function pageTheme(page: ThemePage): Promise<string | undefined> {
  return page.evaluate(() => document.documentElement.dataset.theme);
}
