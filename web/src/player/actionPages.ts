// Which action buttons the touch strip shows at once. Six fit beside the thumb; a character with
// more keys (a game with a dozen tools) gets five of them and a More button that turns to the
// next five, so no key is out of reach. Pure: touch.ts draws what this returns.

/** The most buttons on the strip at once, a More button included. */
export const MAX_ACTIONS = 6;

/** The keys in pages. One page when they all fit; else pages of MAX_ACTIONS - 1, each followed by a More button. */
export function actionPages(scans: readonly number[], max = MAX_ACTIONS): number[][] {
  if (scans.length <= max) return [[...scans]];
  const per = max - 1;
  const pages: number[][] = [];
  for (let i = 0; i < scans.length; i += per) pages.push(scans.slice(i, i + per));
  return pages;
}
