// Titles and descriptions of the site's pages added since site.ts's ROUTES was last written.
// site.ts is imported by vite.config.ts (through scripts/seoBuild.ts), and editing it restarts
// the dev server, so new pages wait here until it can be edited; route.ts reads both.
import { PRODUCT } from '../edition';
import { ROUTES } from './site';

export const PAGE_ROUTES = {
  ...ROUTES,
  magazine: {
    title: `TURBO BUTTON magazine · ${PRODUCT}`,
    description:
      'TURBO BUTTON, the shareware gamer’s monthly: a 1990s-style magazine about Game-Maker and its games, with reviews, interviews, strategy, a BBS list, a game directory and ads, to read page by page or print.',
  },
} as const;

export type PageRoute = keyof typeof PAGE_ROUTES;
