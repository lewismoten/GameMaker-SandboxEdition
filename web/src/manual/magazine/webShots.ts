// The magazine's screenshots of today's web (types.ts ArtId 'web-…'): the Games catalog and the
// main editors at work on a copy of Snowbound, for the web edition feature's tour
// (sections/webEdition.ts). They are pictures of a real browser window, drawn smooth on a
// monitor-gray bevel (webShots.css). Each is public/magazine/web-<name>.webp, 1280 x 800, and
// webEdition.test.ts keeps each under 150 KB.
//
// To take them again: run the dev server on a spare port (`npx vite --port 5428 --strictPort` in
// web/), then with playwright-core (channel 'chrome') open a fresh browser context (no felt eggs
// found, so no secret box) at 1280 x 800, colorScheme 'dark'. Before each screenshot, hide the
// dev server's reload button (`button[title^="The dev server has newer code"]`) and the
// achievement notes (`.ach-toasts`) with a style tag and move the mouse to a corner.
// - games: `#/game/cd:snowbound`, wait about 5 s.
// - Then press "Edit a copy" there; the copy opens at `#/p/<project>/snowbnd.gam`. Open each file
//   at `#/p/<project>/<file>` and wait about 4 s:
//   - map: jamie.map (no tin heart or egg on it);
//   - blocks: snow.bbl, block 33 (the snowman) clicked;
//   - character: kid.chr, its "Sequences (moves)" tab;
//   - monster: jamie.mon, monster 3 (the dog) clicked;
//   - music: jamie.cmf;
//   - scene: intro.fli, its Scene maker tab (`#fli-tab-scene`), Generate… ▸ Cast, about 4 s in.
// Save each as PNG, then `cwebp -q 72 -m 6 web-<name>.png -o web/public/magazine/web-<name>.webp`
// (the map at -q 62), 55 to 135 KB each.
import './webShots.css';
import { h } from '../../editor/core/ui';
import type { WebShot } from './types';

/** A screenshot of today's web, for an `art` block. */
export const webShotImg = (shot: WebShot, alt: string): HTMLImageElement =>
  h('img', { src: `./magazine/web-${shot}.webp`, alt, width: 1280, height: 800, class: 'mag-web-shot' });
