// STUB (section agent S6): the store. The Sandbox BBS mugs and tumblers (desk/mug/: mugSizes.ts
// MUG_SIZES, mugArt.ts MUG_DESIGNS); each item links go:store (the mug viewer) or go:store/<size id>
// (the print page with that size).
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const STORE: MagSection = {
  id: 'store',
  title: 'The Sandbox Store',
  blurb: 'Mugs and tumblers with your favorite game on them',
  dept: 'THE STORE',
  pages: () => [stubPage('The Sandbox Store', ['Mugs and tumblers, each opening the mug viewer'])],
};
