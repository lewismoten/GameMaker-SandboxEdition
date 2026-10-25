// Titles and descriptions of the site's pages added since site.ts's ROUTES was last written.
// site.ts is imported by vite.config.ts (through scripts/seoBuild.ts), and editing it restarts
// the dev server, so new pages wait here until it can be edited; route.ts reads both.
import { PRODUCT } from '../edition';
import { ROUTES } from './site';

export const PAGE_ROUTES = {
  ...ROUTES,
  library: {
    title: `Library · ${PRODUCT}`,
    description:
      'Everything to read and print in one place: each game’s manual, hint book, maps, newsletter, sticker sheet and cards, the Game-Maker box’s paper, TURBO BUTTON magazine and the Guide, by game or by type.',
  },
} as const;

export type PageRoute = keyof typeof PAGE_ROUTES;
