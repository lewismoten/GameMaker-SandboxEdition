// Titles and descriptions of the site's pages added since site.ts's ROUTES was last written.
// site.ts is imported by vite.config.ts (through scripts/seoBuild.ts), and editing it restarts
// the dev server, so new pages wait here until it can be edited; route.ts reads both.
import { PRODUCT } from '../edition';
import { ROUTES } from './site';

export const PAGE_ROUTES = {
  ...ROUTES,
  credits: {
    title: `Credits · ${PRODUCT}`,
    description: `Who and what made ${PRODUCT}: RSD and the Stone family, the CD games’ authors, the software and third-party pieces, the AI tools and the people, and who made what in The Bard of Bizarre’s games.`,
  },
} as const;

export type PageRoute = keyof typeof PAGE_ROUTES;
